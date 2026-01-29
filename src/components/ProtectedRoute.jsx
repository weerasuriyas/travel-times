import { useAuth } from '../contexts/AuthContext'
import { useEffect } from 'react'

export default function ProtectedRoute({ children, setCurrentPage }) {
  const { user, isAdmin, loading } = useAuth()

  useEffect(() => {
    // If not loading and user is not authenticated or not an admin, redirect to login
    if (!loading && (!user || !isAdmin)) {
      setCurrentPage('admin-login')
    }
  }, [user, isAdmin, loading, setCurrentPage])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-stone-300 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600 font-medium">Verifying access...</p>
        </div>
      </div>
    )
  }

  // If user is not authenticated or not an admin, don't render anything
  // (useEffect will handle the redirect)
  if (!user || !isAdmin) {
    return null
  }

  // User is authenticated and is an admin, render the protected content
  return children
}
