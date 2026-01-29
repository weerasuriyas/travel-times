import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Shield, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

export default function AdminLogin({ setCurrentPage }) {
  const { signInWithGoogle, signOut, loading, user, isAdmin } = useAuth()
  const [error, setError] = useState(null)
  const [signingIn, setSigningIn] = useState(false)

  // Debug: Log auth state
  useEffect(() => {
    console.log('AdminLogin - Auth State:', { user, isAdmin, loading })
  }, [user, isAdmin, loading])

  // Auto-redirect to admin dashboard when authenticated as admin
  useEffect(() => {
    if (!loading && user && isAdmin) {
      console.log('User authenticated as admin, redirecting to dashboard...')
      setCurrentPage('admin')
    }
  }, [loading, user, isAdmin, setCurrentPage])

  // Redirect non-admin users back to home page
  useEffect(() => {
    if (!loading && user && !isAdmin) {
      console.log('User authenticated as non-admin, redirecting to home...')
      setCurrentPage('home')
    }
  }, [loading, user, isAdmin, setCurrentPage])

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true)
      setError(null)
      const { error } = await signInWithGoogle()

      if (error) {
        setError(error.message)
      } else {
        // Redirect to admin dashboard after successful login
        setCurrentPage('admin')
      }
    } catch (err) {
      setError('Failed to sign in. Please try again.')
      console.error('Sign in error:', err)
    } finally {
      setSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setError(null)
    } catch (err) {
      setError('Failed to sign out. Please try again.')
      console.error('Sign out error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center px-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-[#00E676] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-1/4 w-96 h-96 bg-[#FFD600] opacity-10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to site link */}
        <button
          onClick={() => setCurrentPage('home')}
          className="absolute -top-16 left-0 text-stone-400 hover:text-white transition-colors text-sm"
        >
          ← Back to site
        </button>

        {/* Login card */}
        <div className="bg-stone-900/50 backdrop-blur-xl border border-stone-800 rounded-2xl shadow-2xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00E676]/10 rounded-full mb-4">
              <Shield className="text-[#00E676]" size={32} />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Admin Access</h1>
            <p className="text-stone-400">Travel Times Sri Lanka</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-red-200">{error}</div>
            </div>
          )}

          {/* Sign in info */}
          <div className="mb-6 p-4 bg-stone-800/50 rounded-lg border border-stone-700">
            <p className="text-stone-300 text-sm text-center">
              Only authorized administrators can access this area. Sign in with your approved Google account.
            </p>
          </div>

          {/* Show "Go to Dashboard" if already logged in as admin */}
          {user && isAdmin && (
            <button
              onClick={() => setCurrentPage('admin')}
              className="w-full bg-[#00E676] hover:bg-[#00C853] text-stone-950 font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg mb-4"
            >
              <CheckCircle size={20} />
              <span>Go to Admin Dashboard</span>
            </button>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn || loading || (user && isAdmin)}
            className="w-full bg-white hover:bg-stone-100 text-stone-950 font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-950 rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Sign Out Button (shown for non-admin users who are signed in) */}
          {user && !isAdmin && !loading && (
            <button
              onClick={handleSignOut}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg border border-red-700 relative z-10 cursor-pointer"
            >
              <XCircle size={20} />
              <span>Sign Out</span>
            </button>
          )}

          {/* Debug: Show auth state */}
          <div className="mt-6 pt-6 border-t border-stone-800">
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-400">Authentication:</span>
                <div className="flex items-center gap-2">
                  {loading ? (
                    <span className="text-yellow-400">Checking...</span>
                  ) : user ? (
                    <>
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-green-400">Signed In</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-stone-500" />
                      <span className="text-stone-500">Not Signed In</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-400">Admin Status:</span>
                <div className="flex items-center gap-2">
                  {loading ? (
                    <span className="text-yellow-400">Checking...</span>
                  ) : isAdmin ? (
                    <>
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-green-400">Admin Access</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-red-500" />
                      <span className="text-red-400">No Admin Access</span>
                    </>
                  )}
                </div>
              </div>

              {user && (
                <div className="pt-3 border-t border-stone-700">
                  <p className="text-stone-400 text-xs mb-1">Email:</p>
                  <p className="text-stone-300 text-sm">{user.email}</p>
                  <p className="text-stone-400 text-xs mt-2 mb-1">User ID:</p>
                  <p className="text-stone-500 text-xs font-mono break-all">{user.id}</p>
                </div>
              )}
            </div>

            <p className="text-stone-500 text-xs text-center">
              This is a protected area. Your access will be verified against the admin database.
              <br />
              If you need access, contact the site administrator.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-stone-500 text-xs text-center mt-6">
          Travel Times Archive © 2026 • Secure Admin Portal
        </p>
      </div>
    </div>
  )
}
