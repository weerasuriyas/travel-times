'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Loader2, RefreshCw, PenLine, X, ChevronDown, CheckCircle2, Undo2 } from 'lucide-react'
import { apiPatch, apiDelete } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { FOLDERS, FOLDER_BY_KEY, defaultFolder, folderOf, useAdminInbox } from '../contexts/AdminInboxContext'

const PAGE_SIZE = 40

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'title',  label: 'Title, A to Z' },
]

// What each change is called, on the button and in the confirmation after it
const STATUS_WORDS = {
  published: { done: 'Published', note: 'It is now live on the website.' },
  draft:     { done: 'Moved to Drafts', note: 'It is hidden from the website.' },
  archived:  { done: 'Archived', note: 'It is hidden from the website.' },
}

const EMPTY_TEXT = {
  review:    { title: 'Nothing is waiting for review', body: 'When new articles are uploaded they will appear here for you to approve.' },
  drafts:    { title: 'No drafts', body: 'Articles you are still working on will appear here.' },
  published: { title: 'Nothing is published yet', body: 'Once you publish an article it will appear here and on the website.' },
  archived:  { title: 'Nothing is archived', body: 'Articles you put away will appear here. You can bring them back at any time.' },
}

function toTimestamp(value) {
  const ms = new Date(value || 0).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

function fmtDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function plural(n, one, many) {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`
}

function summaryLine(counts) {
  if (counts.review > 0) {
    return `${plural(counts.review, 'article is', 'articles are')} waiting for your review.`
  }
  if (counts.drafts > 0) {
    return `Nothing is waiting for review. You have ${plural(counts.drafts, 'draft', 'drafts')} to finish.`
  }
  return 'You are all caught up. Nothing is waiting for review.'
}

const BTN = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-base font-semibold transition-colors disabled:opacity-50 whitespace-nowrap'
const BTN_PRIMARY = `${BTN} bg-stone-900 text-white hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white`
const BTN_QUIET = `${BTN} border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700`
const BTN_PUBLISH = `${BTN} bg-emerald-600 text-white hover:bg-emerald-700`

export default function AdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { rows, setRows, destinations, counts, loading, loaded, error, setError, reload } = useAdminInbox()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState('newest')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [notice, setNotice] = useState(null)

  const requested = searchParams.get('show')
  const activeKey = FOLDER_BY_KEY[requested] ? requested : defaultFolder(counts)
  const folder = FOLDER_BY_KEY[activeKey]

  // Start each folder from the top of its list
  useEffect(() => { setVisible(PAGE_SIZE); setSearchQuery('') }, [activeKey])

  const firstName = (user?.user_metadata?.full_name || '').trim().split(/\s+/)[0]

  const destMap = useMemo(() => {
    const m = {}
    destinations.forEach(d => { m[d.id] = d.name })
    return m
  }, [destinations])

  const filteredRows = useMemo(() => {
    const search = searchQuery.trim().toLowerCase()
    const result = rows.filter(r => {
      if (folderOf(r) !== activeKey) return false
      if (search && !r.title.toLowerCase().includes(search) && !r.author.toLowerCase().includes(search)) return false
      return true
    })
    if (sortKey === 'newest') result.sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
    else if (sortKey === 'oldest') result.sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt))
    else result.sort((a, b) => a.title.localeCompare(b.title))
    return result
  }, [rows, activeKey, searchQuery, sortKey])

  const shownRows = filteredRows.slice(0, visible)
  const remaining = filteredRows.length - shownRows.length

  const showFolder = (key) => router.replace(`/admin?show=${key}`, { scroll: false })

  const setStatus = async (article, newStatus, { announce = true } = {}) => {
    const previous = article.status
    setRows(prev => prev.map(r => r.id === article.id ? { ...r, status: newStatus } : r))
    setNotice(null)
    try {
      await apiPatch(`articles/${article.recordId}`, { status: newStatus })
      if (announce) setNotice({ article: { ...article, status: newStatus }, previous, ...STATUS_WORDS[newStatus] })
    } catch (err) {
      setRows(prev => prev.map(r => r.id === article.id ? { ...r, status: previous } : r))
      setError(`Could not change “${article.title}”. ${err.message || 'Please try again.'}`)
    }
  }

  const publish = (article) => {
    if (!window.confirm(`Publish “${article.title}”?\n\nIt will appear on the website straight away.`)) return
    setStatus(article, 'published')
  }

  const remove = async (article) => {
    if (!window.confirm(`Delete “${article.title}” for good?\n\nThis cannot be undone. If you only want to hide it, choose Archive instead.`)) return
    const before = rows
    setRows(prev => prev.filter(r => r.id !== article.id))
    setNotice(null)
    try {
      await apiDelete(`articles/${article.recordId}`)
    } catch (err) {
      setRows(before)
      setError(`Could not delete “${article.title}”. ${err.message || 'Please try again.'}`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="admin-title text-3xl md:text-4xl font-semibold text-stone-900 dark:text-stone-100">
            {greeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-2 text-lg text-stone-700 dark:text-stone-300 min-h-7">
            {loaded ? summaryLine(counts) : 'Loading your articles…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reload} disabled={loading} className={BTN_QUIET}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            Refresh
          </button>
          <Link href="/admin/write" className={BTN_PRIMARY}>
            <PenLine size={18} />
            Write a new article
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800 px-4 py-3 text-base text-red-800 dark:text-red-300 flex items-start justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError('')} aria-label="Dismiss" className="flex-shrink-0 p-1"><X size={18} /></button>
        </div>
      )}

      {/* Folders */}
      <div role="tablist" aria-label="Article folders" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {FOLDERS.map(f => {
          const Icon = f.icon
          const isActive = f.key === activeKey
          return (
            <button
              key={f.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => showFolder(f.key)}
              className={`relative text-left rounded-xl border-2 pl-5 pr-4 py-4 overflow-hidden transition-colors ${
                isActive
                  ? `${f.ring} ${f.soft}`
                  : 'border-transparent bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-600'
              }`}
            >
              <span className={`absolute left-0 inset-y-0 w-1.5 ${f.bar}`} />
              <span className={`flex items-center gap-2 text-base font-semibold ${f.text}`}>
                <Icon size={18} />
                {f.label}
              </span>
              <span className="block mt-1 text-4xl font-semibold tabular-nums text-stone-900 dark:text-stone-100">
                {loaded ? counts[f.key].toLocaleString() : '–'}
              </span>
              <span className="block mt-1 text-sm leading-snug text-stone-600 dark:text-stone-400">{f.hint}</span>
            </button>
          )
        })}
      </div>

      {/* Confirmation after a change, with a way back */}
      {notice && (
        <div role="status" className="mb-4 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <p className="flex-1 min-w-48 text-base text-stone-800 dark:text-stone-200">
            <strong className="font-semibold">{notice.done}:</strong> “{notice.article.title}”. {notice.note}
          </p>
          <button
            onClick={() => setStatus(notice.article, notice.previous, { announce: false })}
            className={BTN_QUIET}
          >
            <Undo2 size={18} />
            Undo
          </button>
          <button onClick={() => setNotice(null)} aria-label="Dismiss" className="p-1 text-stone-500"><X size={18} /></button>
        </div>
      )}

      {/* The list for the chosen folder */}
      <section aria-label={folder.label} className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
        <div className="flex flex-wrap items-center gap-3 px-4 md:px-5 py-4 border-b border-stone-200 dark:border-stone-700">
          <h2 className="admin-title text-xl font-semibold text-stone-900 dark:text-stone-100 mr-auto">
            {folder.label}
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
            <input
              type="search"
              aria-label={`Search ${folder.label}`}
              placeholder="Search by title or author"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setVisible(PAGE_SIZE) }}
              className="w-full pl-10 pr-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg text-base bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-500"
            />
          </div>
          <select
            aria-label="Sort order"
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="text-base px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
          >
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>

        {!loaded ? (
          <div className="flex items-center justify-center gap-3 py-16 text-lg text-stone-600 dark:text-stone-400">
            <Loader2 size={22} className="animate-spin" />
            Loading…
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center px-6 py-16">
            {searchQuery ? (
              <>
                <p className="admin-title text-xl font-semibold text-stone-900 dark:text-stone-100">No matches for “{searchQuery}”</p>
                <p className="mt-2 text-base text-stone-600 dark:text-stone-400">Check the spelling, or look in another folder above.</p>
                <button onClick={() => setSearchQuery('')} className={`${BTN_QUIET} mt-4`}>Clear search</button>
              </>
            ) : (
              <>
                <p className="admin-title text-xl font-semibold text-stone-900 dark:text-stone-100">{EMPTY_TEXT[activeKey].title}</p>
                <p className="mt-2 text-base text-stone-600 dark:text-stone-400">{EMPTY_TEXT[activeKey].body}</p>
              </>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-stone-200 dark:divide-stone-800">
            {shownRows.map(article => (
              <ArticleRow
                key={article.id}
                article={article}
                destName={article.destinationId ? destMap[article.destinationId] : null}
                onPublish={publish}
                onSetStatus={setStatus}
                onDelete={remove}
              />
            ))}
          </ul>
        )}

        {loaded && filteredRows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-5 py-4 border-t border-stone-200 dark:border-stone-700 text-base text-stone-600 dark:text-stone-400">
            <span>Showing {shownRows.length.toLocaleString()} of {filteredRows.length.toLocaleString()}</span>
            {remaining > 0 && (
              <button onClick={() => setVisible(v => v + PAGE_SIZE)} className={BTN_QUIET}>
                Show {Math.min(PAGE_SIZE, remaining)} more
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function ArticleRow({ article, destName, onPublish, onSetStatus, onDelete }) {
  const key = folderOf(article)
  const folder = FOLDER_BY_KEY[key]
  const Icon = folder.icon
  const { title, author, createdAt, publishedDate, wordCount, imageCount, recordId, slug } = article

  const editHref = `/admin/articles/${recordId}`
  const previewHref = `/admin/articles/${recordId}/preview`
  const mainHref = key === 'review' ? `/admin/staging?item=${encodeURIComponent(recordId)}` : editHref

  const facts = []
  if (key === 'published' && publishedDate) facts.push(`Published ${fmtDate(publishedDate)}`)
  else if (createdAt) facts.push(`${key === 'review' ? 'Received' : 'Created'} ${fmtDate(createdAt)}`)
  if (author) facts.push(`By ${author}`)
  if (destName) facts.push(destName)
  if (wordCount > 0) facts.push(`${wordCount.toLocaleString()} words`)
  if (imageCount > 0) facts.push(imageCount === 1 ? '1 photo' : `${imageCount} photos`)

  return (
    <li className="relative flex flex-wrap items-center gap-x-4 gap-y-3 pl-6 pr-4 md:pr-5 py-4">
      <span className={`absolute left-0 inset-y-0 w-1.5 ${folder.bar}`} />

      <div className="flex-1 min-w-60">
        <Link href={mainHref} className="admin-title text-lg font-semibold leading-snug text-stone-900 dark:text-stone-100 hover:underline">
          {title}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
          <span className={`inline-flex items-center gap-1.5 font-semibold ${folder.text}`}>
            <Icon size={15} />
            {folder.stamp}
          </span>
          {facts.map(f => <span key={f}>{f}</span>)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {key === 'review' && (
          <Link href={mainHref} className={BTN_PRIMARY}>Review</Link>
        )}

        {key === 'drafts' && (
          <>
            <Link href={editHref} className={BTN_QUIET}>Edit</Link>
            <button onClick={() => onPublish(article)} className={BTN_PUBLISH}>Publish</button>
            <MoreMenu label={title}>
              <MenuLink href={previewHref}>Preview</MenuLink>
              <MenuButton onClick={() => onSetStatus(article, 'archived')}>Archive</MenuButton>
              <MenuButton danger onClick={() => onDelete(article)}>Delete for good</MenuButton>
            </MoreMenu>
          </>
        )}

        {key === 'published' && (
          <>
            <a href={`/article/${slug}`} target="_blank" rel="noreferrer" className={BTN_QUIET}>View on website</a>
            <Link href={editHref} className={BTN_QUIET}>Edit</Link>
            <MoreMenu label={title}>
              <MenuButton onClick={() => onSetStatus(article, 'draft')}>Unpublish (move to Drafts)</MenuButton>
              <MenuButton onClick={() => onSetStatus(article, 'archived')}>Archive</MenuButton>
              <MenuButton danger onClick={() => onDelete(article)}>Delete for good</MenuButton>
            </MoreMenu>
          </>
        )}

        {key === 'archived' && (
          <>
            <button onClick={() => onSetStatus(article, 'draft')} className={BTN_QUIET}>Move back to Drafts</button>
            <MoreMenu label={title}>
              <MenuLink href={previewHref}>Preview</MenuLink>
              <MenuButton danger onClick={() => onDelete(article)}>Delete for good</MenuButton>
            </MoreMenu>
          </>
        )}
      </div>
    </li>
  )
}

function MoreMenu({ label, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={`More options for ${label}`}
        className={BTN_QUIET}
      >
        More
        <ChevronDown size={16} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="absolute right-0 top-full mt-1 z-10 w-64 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 shadow-lg py-1"
        >
          {children}
        </div>
      )}
    </div>
  )
}

const MENU_ITEM = 'block w-full text-left px-4 py-2.5 text-base hover:bg-stone-100 dark:hover:bg-stone-700'

function MenuButton({ onClick, danger, children }) {
  return (
    <button
      onClick={onClick}
      className={`${MENU_ITEM} ${danger ? 'text-red-700 dark:text-red-400' : 'text-stone-800 dark:text-stone-100'}`}
    >
      {children}
    </button>
  )
}

function MenuLink({ href, children }) {
  return <Link href={href} className={`${MENU_ITEM} text-stone-800 dark:text-stone-100`}>{children}</Link>
}
