'use client'

import dynamic from 'next/dynamic'

const AdminDestinationEditor = dynamic(() => import('../../../../../src/views/AdminDestinationEditor'), { ssr: false })

export default function Page() {
  return <AdminDestinationEditor />
}
