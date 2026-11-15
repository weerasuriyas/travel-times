'use client'

import dynamic from 'next/dynamic'

const DestinationDetailPage = dynamic(() => import('../../../../src/views/DestinationDetailPage'), { ssr: false })

export default function Page() {
  return <DestinationDetailPage />
}
