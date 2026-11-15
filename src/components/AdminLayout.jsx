'use client'

import { Suspense, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import AdminSidebar from './AdminSidebar'
import { AdminInboxProvider, useAdminInbox } from '../contexts/AdminInboxContext'

function MobileBar({ onOpen }) {
  const { counts } = useAdminInbox()
  return (
    <div className="md:hidden flex items-center gap-3 px-3 py-2.5 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex-shrink-0">
      <button
        onClick={onOpen}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 font-semibold"
      >
        <Menu size={20} />
        Menu
      </button>
      <span className="font-sans font-black text-sm uppercase tracking-tight italic dark:text-white">Travel Times.</span>
      {counts.review > 0 && (
        <span className="ml-auto rounded-full bg-amber-500 text-stone-950 text-sm font-semibold px-2.5 py-0.5">
          {counts.review} to review
        </span>
      )}
    </div>
  )
}

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close the menu drawer after choosing something on a phone
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  return (
    <AdminInboxProvider>
      <div className="admin-ui flex h-screen overflow-hidden bg-stone-100 dark:bg-stone-950">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar: drawer on mobile, fixed column on desktop */}
        <div className={`fixed md:static inset-y-0 left-0 z-30 transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Suspense fallback={<div className="w-64 h-full bg-stone-950" />}>
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </Suspense>
        </div>

        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          <MobileBar onOpen={() => setSidebarOpen(true)} />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </AdminInboxProvider>
  )
}
