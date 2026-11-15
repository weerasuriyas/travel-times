'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Inbox, PencilLine, Globe, Archive } from 'lucide-react'
import { apiGetAuth } from '../lib/api'

// The four places an article can be. Every admin screen uses these same
// words, colours and icons so a status always looks the same.
export const FOLDERS = [
  {
    key: 'review',
    label: 'To review',
    stamp: 'Waiting for review',
    hint: 'New articles waiting for you to approve',
    icon: Inbox,
    bar: 'bg-amber-500',
    text: 'text-amber-800 dark:text-amber-300',
    soft: 'bg-amber-50 dark:bg-amber-950/40',
    ring: 'border-amber-500',
    pill: 'bg-amber-500 text-stone-950',
  },
  {
    key: 'drafts',
    label: 'Drafts',
    stamp: 'Draft',
    hint: 'Not finished yet, hidden from the website',
    icon: PencilLine,
    bar: 'bg-sky-600',
    text: 'text-sky-800 dark:text-sky-300',
    soft: 'bg-sky-50 dark:bg-sky-950/40',
    ring: 'border-sky-600',
    pill: 'bg-sky-600 text-white',
  },
  {
    key: 'published',
    label: 'Published',
    stamp: 'Published',
    hint: 'Live on the website for everyone to read',
    icon: Globe,
    bar: 'bg-emerald-600',
    text: 'text-emerald-800 dark:text-emerald-300',
    soft: 'bg-emerald-50 dark:bg-emerald-950/40',
    ring: 'border-emerald-600',
    pill: 'bg-emerald-600 text-white',
  },
  {
    key: 'archived',
    label: 'Archived',
    stamp: 'Archived',
    hint: 'Put away, hidden from the website',
    icon: Archive,
    bar: 'bg-stone-400',
    text: 'text-stone-600 dark:text-stone-400',
    soft: 'bg-stone-100 dark:bg-stone-800/60',
    ring: 'border-stone-500',
    pill: 'bg-stone-500 text-white',
  },
]

export const FOLDER_BY_KEY = Object.fromEntries(FOLDERS.map(f => [f.key, f]))

const STATUS_TO_FOLDER = { draft: 'drafts', published: 'published', archived: 'archived' }

export function folderOf(row) {
  if (row.source === 'staging') return 'review'
  return STATUS_TO_FOLDER[row.status] || 'drafts'
}

// Where to land when no folder is chosen: the first one that needs attention.
export function defaultFolder(counts) {
  if (counts.review > 0) return 'review'
  if (counts.drafts > 0) return 'drafts'
  return 'published'
}

function countWords(html) {
  if (!html) return 0
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length
}

const AdminInboxContext = createContext(null)

export function useAdminInbox() {
  const ctx = useContext(AdminInboxContext)
  if (!ctx) throw new Error('useAdminInbox must be used within AdminInboxProvider')
  return ctx
}

export function AdminInboxProvider({ children }) {
  const pathname = usePathname()
  const [rows, setRows] = useState([])
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const requestRef = useRef(0)

  const reload = useCallback(async () => {
    const request = ++requestRef.current
    setLoading(true)
    setError('')

    // The timestamp skips the server's 30s cache so changes show up right away
    const t = Date.now()
    const [articlesResult, stagingResult, destResult] = await Promise.allSettled([
      apiGetAuth(`articles?_=${t}`),
      apiGetAuth(`staging?review_status=pending&_=${t}`),
      apiGetAuth(`destinations?_=${t}`),
    ])
    if (request !== requestRef.current) return

    const failed = []
    if (articlesResult.status === 'rejected') failed.push('your articles')
    if (stagingResult.status === 'rejected') failed.push('the articles waiting for review')
    if (failed.length === 2) setError('Could not load your articles. Check your internet connection, then press Refresh.')
    else if (failed.length) setError(`Could not load ${failed[0]}. Press Refresh to try again.`)

    const list = r => (r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : null)
    const articlesData = list(articlesResult)
    const stagingData = list(stagingResult)
    const destData = list(destResult)

    if (destData) setDestinations(destData.map(d => ({ id: d.id, name: d.name })))

    setRows(prev => {
      // Keep what we already had for any half that failed to load
      const articleRows = articlesData
        ? articlesData.map(a => ({
            id: `article-${a.id}`,
            source: 'article',
            recordId: a.id,
            title: a.title || 'Untitled',
            slug: a.slug || '',
            status: a.status || 'draft',
            author: a.author_name || '',
            publishedDate: a.published_at || null,
            createdAt: a.created_at || null,
            coverImage: a.cover_image || null,
            destinationId: a.destination_id ? Number(a.destination_id) : null,
            wordCount: countWords(a.body),
            imageCount: null,
          }))
        : prev.filter(r => r.source === 'article')

      const stagingRows = stagingData
        ? stagingData.map(s => ({
            id: `staging-${s.folder}`,
            source: 'staging',
            recordId: s.folder,
            title: s.title || 'Untitled',
            slug: s.slug || '',
            status: 'staging',
            author: s.author_name || '',
            publishedDate: null,
            createdAt: s.submitted_at || null,
            coverImage: null,
            destinationId: null,
            wordCount: Number(s.word_count || 0),
            imageCount: Number(s.image_count || 0),
          }))
        : prev.filter(r => r.source === 'staging')

      return [...stagingRows, ...articleRows]
    })

    setLoading(false)
    setLoaded(true)
  }, [])

  // Refresh whenever the admin moves to another screen, so the counts in
  // the sidebar never go stale after publishing or uploading.
  useEffect(() => { reload() }, [reload, pathname])

  const counts = useMemo(() => {
    const c = { review: 0, drafts: 0, published: 0, archived: 0 }
    rows.forEach(r => { c[folderOf(r)]++ })
    return c
  }, [rows])

  const value = useMemo(() => ({
    rows, setRows, destinations, counts, loading, loaded, error, setError, reload,
  }), [rows, destinations, counts, loading, loaded, error, reload])

  return <AdminInboxContext.Provider value={value}>{children}</AdminInboxContext.Provider>
}
