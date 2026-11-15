import { Suspense } from 'react'
import ProtectedRoute from '../../../../../src/components/ProtectedRoute'
import AdminArticlePreview from '../../../../../src/views/AdminArticlePreview'

export default function Page() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <AdminArticlePreview />
      </Suspense>
    </ProtectedRoute>
  )
}
