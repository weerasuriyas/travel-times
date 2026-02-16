import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// Function to check if user is admin by querying admin_users table
async function checkIsAdmin(userId) {
  console.log('Checking if user is admin:', userId)

  try {
    // Create a timeout that resolves (not rejects) with a timeout result
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => {
        console.warn('Admin check timed out after 5 seconds')
        resolve({ data: null, error: { message: 'Query timeout' } })
      }, 5000)
    )

    const queryPromise = supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    const { data, error } = await Promise.race([queryPromise, timeoutPromise])

    console.log('Admin check result:', { data, error })

    if (error) {
      console.error('Admin check error:', error.message)
      return false
    }

    return !!data
  } catch (err) {
    console.error('Admin check exception:', err)
    return false
  }
}

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('AuthProvider: Initializing...')
    console.log('Current URL:', window.location.href)

    // Check if we have an OAuth code in the URL
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    if (code) {
      console.log('OAuth code detected in URL, waiting for Supabase to exchange it...')
    }

    let mounted = true

    // Listen for auth changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.email)

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in successfully!')
          setUser(session.user)
          const adminStatus = await checkIsAdmin(session.user.id)
          if (mounted) {
            setIsAdmin(adminStatus)
            console.log('User set:', { email: session.user.email, isAdmin: adminStatus })
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setIsAdmin(false)
          console.log('User signed out')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed')
          if (session?.user) {
            setUser(session.user)
          }
        } else if (event === 'USER_UPDATED') {
          console.log('User updated')
          if (session?.user) {
            setUser(session.user)
          }
        }

        if (mounted) {
          setLoading(false)
        }
      }
    )

    // Check for existing session on mount
    // Don't check immediately if we have an OAuth code - let Supabase handle the exchange
    // and wait for the SIGNED_IN event
    if (!code) {
      checkUser()
    } else {
      // If we have an OAuth code, Supabase will automatically exchange it
      // and trigger the onAuthStateChange SIGNED_IN event
      console.log('Waiting for OAuth code exchange...')
    }

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  async function checkUser() {
    try {
      console.log('Checking for existing session...')
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        console.log('Found existing session:', session.user.email)
        setUser(session.user)
        const adminStatus = await checkIsAdmin(session.user.id)
        setIsAdmin(adminStatus)
        console.log('Session loaded:', { email: session.user.email, isAdmin: adminStatus })
      } else {
        console.log('No existing session found')
      }
    } catch (error) {
      // Ignore AbortError - this happens when the request is cancelled
      if (error.name === 'AbortError') {
        console.log('Session check was cancelled (this is normal during navigation)')
      } else {
        console.error('Error checking user:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  async function signInWithGoogle() {
    try {
      console.log('Initiating Google OAuth...')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/#admin-login`
        }
      })

      if (error) {
        console.error('OAuth error:', error)
        throw error
      }

      console.log('OAuth initiated successfully:', data)
      return { data, error: null }
    } catch (error) {
      console.error('Error signing in:', error)
      return { data: null, error }
    }
  }

  async function signOut() {
    try {
      console.log('Signing out...')

      // Clear state immediately
      setUser(null)
      setIsAdmin(false)

      // Clear localStorage to ensure session is completely removed
      localStorage.clear()

      console.log('Local session cleared')

      // Try to sign out from Supabase with a timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Signout timeout')), 2000)
      )

      try {
        await Promise.race([
          supabase.auth.signOut(),
          timeoutPromise
        ])
        console.log('Supabase signout successful')
      } catch (signoutError) {
        console.warn('Supabase signout failed or timed out (continuing anyway):', signoutError.message)
      }

      console.log('Sign out complete, redirecting to home...')

      // Redirect to home page and reload
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
      // Still redirect even if there's an error
      window.location.href = '/'
    }
  }

  const value = useMemo(() => ({
    user,
    isAdmin,
    loading,
    signInWithGoogle,
    signOut
  }), [user, isAdmin, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
