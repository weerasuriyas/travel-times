import { Suspense } from 'react'
import AdminStagingQueue from '../../../../src/views/AdminStagingQueue'

export default function AdminReviewPage() {
  return (
    <Suspense fallback={null}>
      <AdminStagingQueue />
    </Suspense>
  )
}
