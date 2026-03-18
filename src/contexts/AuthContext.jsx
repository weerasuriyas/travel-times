import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const ADMIN_CACHE_KEY = 'tt_admin_v2'

const ADMIN_CACHE_TTL = 60 * 60 * 1000 // 60 minutes

function getCachedAdmin(userId) {
  try {
    const raw = localStorage.getItem(ADMIN_CACHE_KEY)
    if (!raw) return null
    const { id, value, ts } = JSON.parse(raw)
    if (id !== userId) return null
    if (Date.now() - ts > ADMIN_CACHE_TTL) return null
    return value
  } catch { return null }
}

function setCachedAdmin(userId, value) {
  try {
    localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({ id: userId, value, ts: Date.now() }))
  } catch { /* ignore */ }
}

async function checkIsAdmin(userId) {
  try {
    const { data, error } = await Promise.race([
      supabase.from('admin_users').select('is_super_admin').eq('user_id', userId).eq('is_active', true).single(),
      new Promise(resolve => setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), 5000))
    ])
    const result = {
      isAdmin: !error && !!data,
      isSuperAdmin: !error && !!data?.is_super_admin,
    }
    setCachedAdmin(userId, result)
    return result
  } catch {
    return { isAdmin: false, isSuperAdmin: false }
  }
}

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const cached = getCachedAdmin(session.user.id)
          if (cached !== null) { setIsAdmin(cached.isAdmin); setIsSuperAdmin(cached.isSuperAdmin) }
          checkIsAdmin(session.user.id).then(r => { if (mounted) { setIsAdmin(r.isAdmin); setIsSuperAdmin(r.isSuperAdmin) } })
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setIsAdmin(false)
          setIsSuperAdmin(false)
        } else if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
          setUser(session.user)
        }

        if (mounted) setLoading(false)
      }
    )

    if (!code) {
      checkUser()
    }

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }

    async function checkUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          const cached = getCachedAdmin(session.user.id)
          if (cached !== null) { setIsAdmin(cached.isAdmin); setIsSuperAdmin(cached.isSuperAdmin) }
          checkIsAdmin(session.user.id).then(r => { setIsAdmin(r.isAdmin); setIsSuperAdmin(r.isSuperAdmin) })
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Session check error:', err)
      } finally {
        setLoading(false)
      }
    }
  }, [])

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/#admin-login` }
    })
    if (error) throw error
    return { data, error: null }
  }

  async function signOut() {
    setUser(null)
    setIsAdmin(false)
    setIsSuperAdmin(false)
    localStorage.clear()
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ])
    } catch { /* non-fatal */ }
    window.location.href = '/'
  }

  const value = useMemo(() => ({
    user, isAdmin, isSuperAdmin, loading, signInWithGoogle, signOut
  }), [user, isAdmin, isSuperAdmin, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
