import { Suspense } from 'react'
import AdminDashboard from '../../../src/views/AdminDashboard'

export default function AdminHomePage() {
  return (
    <Suspense fallback={null}>
      <AdminDashboard />
    </Suspense>
  )
}
