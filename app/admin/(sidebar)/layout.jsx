import ProtectedRoute from '../../../src/components/ProtectedRoute'
import AdminLayout from '../../../src/components/AdminLayout'

export default function SidebarLayout({ children }) {
  return (
    <ProtectedRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  )
}
