import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import EventDetailPage from './pages/EventDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'

const DestinationsPage = lazy(() => import('./pages/DestinationsPage'))
const DestinationDetailPage = lazy(() => import('./pages/DestinationDetailPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminArticleEditor = lazy(() => import('./pages/AdminArticleEditor'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminIngestion = lazy(() => import('./pages/AdminIngestion'))
const AdminStagingQueue = lazy(() => import('./pages/AdminStagingQueue'))

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-sm font-medium text-stone-600">Loading...</p>
    </div>
  </div>
)

const AppContent = () => (
  <div className="min-h-screen bg-[#FDFDFB] text-[#1a1a1a] font-sans selection:bg-[#00E676] selection:text-white">
    <ScrollToTop />
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes with footer */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/destination/:slug" element={<DestinationDetailPage />} />
          <Route path="/event/:slug" element={<EventDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin routes - no footer */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/editor" element={
          <ProtectedRoute>
            <AdminArticleEditor />
          </ProtectedRoute>
        } />
        <Route path="/admin/ingest" element={
          <ProtectedRoute>
            <AdminIngestion />
          </ProtectedRoute>
        } />
        <Route path="/admin/staging" element={
          <ProtectedRoute>
            <AdminStagingQueue />
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  </div>
)

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
)

export default App
