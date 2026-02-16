import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, ChevronDown, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export const UserProfile = () => {
  const navigate = useNavigate()
  const { user, isAdmin, signInWithGoogle, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    console.log('UserProfile: Sign out button clicked')
    try {
      console.log('UserProfile: Calling signOut...')
      await signOut()
      console.log('UserProfile: signOut completed')
      setIsOpen(false)
    } catch (error) {
      console.error('UserProfile: Sign out error:', error)
      alert('Failed to sign out: ' + error.message)
    }
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
      setIsOpen(false)
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  const handleAdminClick = () => {
    navigate('/admin/login')
    setIsOpen(false)
  }

  // Get display name from email (part before @)
  const displayName = user?.email?.split('@')[0] || 'Account'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ml-2 flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-black transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
      >
        <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full ${user ? 'bg-[#00E676]' : 'bg-stone-300'} flex items-center justify-center`}>
          <User size={14} className="text-white" />
        </div>
        <span className="hidden md:inline text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] max-w-[120px] truncate">
          {user ? displayName : 'Sign In'}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          {user ? (
            <>
              {/* Logged In User */}
              <div className="p-4 border-b border-stone-100 bg-stone-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#00E676] flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-stone-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                {/* Google Badge */}
                <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-stone-200">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <span className="text-xs text-stone-600 font-medium">Signed in with Google</span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                {/* Admin Dashboard Link (only for admins) */}
                {isAdmin && (
                  <button
                    onClick={handleAdminClick}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#00E676]/10 text-stone-700 hover:text-[#00E676] transition-all duration-200 group mb-1"
                  >
                    <Shield size={16} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold">Admin Dashboard</span>
                  </button>
                )}

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-stone-700 hover:text-red-600 transition-all duration-200 group"
                >
                  <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold">Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Not Logged In */}
              <div className="p-4">
                <p className="text-sm text-stone-600 mb-4 text-center">
                  Sign in to access your account
                </p>
                <button
                  onClick={handleSignIn}
                  className="w-full bg-white hover:bg-stone-50 text-stone-950 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 border-2 border-stone-200 hover:border-stone-300 shadow-sm"
                >
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
                  <span className="text-sm">Continue with Google</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
