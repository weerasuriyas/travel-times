import ProtectedRoute from '../../../../src/components/ProtectedRoute'
import AdminArticleEditor from '../../../../src/views/AdminArticleEditor'

export default function Page() {
  return (
    <ProtectedRoute>
      <AdminArticleEditor />
    </ProtectedRoute>
  )
}
