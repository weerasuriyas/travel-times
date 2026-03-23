import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Edit, Eye, Archive, Trash2, Search, Loader2, RefreshCw,
  RotateCcw, Globe, EyeOff, PenLine, ChevronDown, ImageIcon, X,
} from 'lucide-react'
import { apiGetAuth, apiPatch, apiDelete } from '../lib/api'
import AdminPageHeader from '../components/AdminPageHeader'

function toTimestamp(value) {
  const ms = new Date(value || 0).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(!sameYear && { year: 'numeric' }) })
}

function countWords(html) {
  if (!html) return 0
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length
}

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'staging',   label: 'Staging' },
  { key: 'draft',     label: 'Drafts' },
  { key: 'published', label: 'Published' },
  { key: 'archived',  label: 'Archived' },
]

const SORT_OPTIONS = [
  { key: 'newest',    label: 'Newest first' },
  { key: 'oldest',    label: 'Oldest first' },
  { key: 'title',     label: 'A → Z' },
  { key: 'wordcount', label: 'Word count' },
]

function matchesTab(article, activeTab) {
  if (activeTab === 'all') return true
  if (activeTab === 'staging')   return article.source === 'staging'
  if (activeTab === 'draft')     return article.source === 'article' && article.status === 'draft'
  if (activeTab === 'published') return article.source === 'article' && article.status === 'published'
  if (activeTab === 'archived')  return article.source === 'article' && article.status === 'archived'
  return true
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab]           = useState('all')
  const [searchQuery, setSearchQuery]       = useState('')
  const [sortKey, setSortKey]               = useState('newest')
  const [filterHasCover, setFilterHasCover] = useState(false)
  const [filterDest, setFilterDest]         = useState('all')
  const [rows, setRows]                     = useState([])
  const [destinations, setDestinations]     = useState([])
  const [loading, setLoading]               = useState(false)
  const [initialLoad, setInitialLoad]       = useState(true)
  const [error, setError]                   = useState('')
  const [showFilters, setShowFilters]       = useState(false)

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    setError('')

    const [articlesResult, stagingResult, destResult] = await Promise.allSettled([
      apiGetAuth('articles'),
      apiGetAuth('staging?review_status=pending'),
      apiGetAuth('destinations'),
    ])

    // If everything failed, bail out
    if ([articlesResult, stagingResult, destResult].every(r => r.status === 'rejected')) {
      setError('Failed to load data. Check your connection and try again.')
      setLoading(false)
      setInitialLoad(false)
      return
    }

    // Partial-failure messages
    const errs = []
    if (articlesResult.status === 'rejected') errs.push('Articles')
    if (stagingResult.status  === 'rejected') errs.push('Staging')
    if (errs.length) setError(`${errs.join(' and ')} failed to load — showing partial data.`)

    const articlesData = articlesResult.status === 'fulfilled' && Array.isArray(articlesResult.value) ? articlesResult.value : []
    const stagingData  = stagingResult.status  === 'fulfilled' && Array.isArray(stagingResult.value)  ? stagingResult.value  : []
    const destData     = destResult.status     === 'fulfilled' && Array.isArray(destResult.value)     ? destResult.value     : []

    setDestinations(destData.map(d => ({ id: d.id, name: d.name })))

    const articleRows = articlesData.map(a => ({
      id:            `article-${a.id}`,
      source:        'article',
      recordId:      a.id,
      title:         a.title       || 'Untitled',
      slug:          a.slug        || '',
      category:      a.category    || '',
      status:        a.status      || 'draft',
      author:        a.author_name || 'Editorial Team',
      publishedDate: a.published_at || null,
      createdAt:     a.created_at   || null,
      views:         Number(a.views || 0),
      coverImage:    a.cover_image  || null,
      destinationId: a.destination_id ? Number(a.destination_id) : null,
      wordCount:     countWords(a.body),
    }))

    const stagingRows = stagingData.map(s => ({
      id:            `staging-${s.id}`,
      source:        'staging',
      recordId:      s.id,
      title:         s.title       || 'Untitled',
      slug:          s.slug        || '',
      category:      s.category    || '',
      status:        'staging',
      author:        s.author_name || 'Editorial Team',
      publishedDate: null,
      createdAt:     s.created_at  || null,
      views:         0,
      coverImage:    null,
      destinationId: null,
      wordCount:     countWords(s.body),
    }))

    setRows([...stagingRows, ...articleRows])
    setLoading(false)
    setInitialLoad(false)
  }, [])

  useEffect(() => { loadDashboardData() }, [loadDashboardData])

  const handleSetStatus = async (article, newStatus) => {
    const prevRows = rows
    setRows(prev => prev.map(r => r.id === article.id ? { ...r, status: newStatus } : r))
    setActiveTab(newStatus === 'archived' ? 'archived' : newStatus === 'published' ? 'published' : 'draft')
    try {
      await apiPatch(`articles/${article.recordId}`, { status: newStatus })
    } catch (err) {
      setRows(prevRows)
      setError(err.message || 'Failed to update status')
    }
  }

  const handleDelete = async (article) => {
    if (!window.confirm(`Delete "${article.title}"? This cannot be undone.`)) return
    const prevRows = rows
    setRows(prev => prev.filter(r => r.id !== article.id))
    try {
      await apiDelete(`articles/${article.recordId}`)
    } catch (err) {
      setRows(prevRows)
      setError(err.message || 'Failed to delete article')
    }
  }

  // Build destination name lookup
  const destMap = useMemo(() => {
    const m = {}
    destinations.forEach(d => { m[d.id] = d.name })
    return m
  }, [destinations])

  // Tab counts always from unfiltered rows
  const tabCounts = useMemo(() => ({
    all:       rows.length,
    staging:   rows.filter(r => r.source === 'staging').length,
    draft:     rows.filter(r => r.source === 'article' && r.status === 'draft').length,
    published: rows.filter(r => r.source === 'article' && r.status === 'published').length,
    archived:  rows.filter(r => r.source === 'article' && r.status === 'archived').length,
  }), [rows])

  const activeFilterCount = (filterHasCover ? 1 : 0) + (filterDest !== 'all' ? 1 : 0)

  const filteredRows = useMemo(() => {
    const search = searchQuery.trim().toLowerCase()

    const result = rows.filter(article => {
      if (!matchesTab(article, activeTab)) return false
      if (search && !article.title.toLowerCase().includes(search) && !article.slug.toLowerCase().includes(search)) return false
      if (filterHasCover && !article.coverImage) return false
      if (filterDest !== 'all' && article.destinationId !== Number(filterDest)) return false
      return true
    })

    if (sortKey === 'newest') {
      result.sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
    } else if (sortKey === 'oldest') {
      result.sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt))
    } else if (sortKey === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortKey === 'wordcount') {
      result.sort((a, b) => b.wordCount - a.wordCount)
    }

    return result
  }, [rows, activeTab, searchQuery, filterHasCover, filterDest, sortKey])

  const openRecord = (article) => {
    if (article.source === 'staging') { navigate('/admin/staging'); return }
    if (article.recordId) { navigate(`/admin/articles/${article.recordId}`); return }
    navigate('/admin')
  }

  return (
    <div>
      <AdminPageHeader
        title="Articles"
        action={
          <button
            onClick={() => navigate('/admin/write')}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-950 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
          >
            <PenLine size={15} />
            <span className="hidden sm:inline">Write Article</span>
            <span className="sm:hidden">Write</span>
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-start justify-between gap-2">
            <span>{error}</span>
            <button onClick={() => setError('')} className="flex-shrink-0 mt-0.5"><X size={14} /></button>
          </div>
        )}

        {/* Search + controls */}
        <div className="flex flex-col gap-2 mb-4">
          {/* Row 1: search + filter toggle + refresh */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                placeholder="Search articles…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex-shrink-0 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                  : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:border-stone-400'
              }`}
            >
              <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={loadDashboardData}
              disabled={loading}
              title="Refresh"
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex-shrink-0 text-stone-700 dark:text-stone-200"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Row 2: Sort (always visible) + expanded filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
              className="flex-shrink-0 text-sm px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>

            {showFilters && (
              <>
                {/* Has cover image */}
                <button
                  onClick={() => setFilterHasCover(f => !f)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    filterHasCover
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                      : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-400'
                  }`}
                >
                  <ImageIcon size={14} />
                  Has cover
                </button>

                {/* Destination */}
                {destinations.length > 0 && (
                  <select
                    value={filterDest}
                    onChange={e => setFilterDest(e.target.value)}
                    className="text-sm px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All destinations</option>
                    {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}

                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setFilterHasCover(false); setFilterDest('all') }}
                    className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 underline"
                  >
                    Clear filters
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tabs + list card */}
        <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
          {/* Tab strip */}
          <div className="flex border-b border-stone-200 dark:border-stone-700 overflow-x-auto scrollbar-none">
            {TABS.map(tab => {
              const count = tabCounts[tab.key]
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                    isActive
                      ? 'border-stone-950 dark:border-stone-100 text-stone-950 dark:text-stone-100'
                      : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-stone-950 dark:bg-stone-100 text-white dark:text-stone-900'
                      : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* List */}
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {initialLoad && loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-4 py-4 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-2/5" />
                    <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded w-16" />
                  </div>
                  <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded w-1/2" />
                </div>
              ))
            ) : filteredRows.length === 0 ? (
              <div className="text-center py-12 text-stone-500 dark:text-stone-400 text-sm">
                {searchQuery || activeFilterCount > 0 ? 'No articles match your filters.' : 'No articles found.'}
              </div>
            ) : (
              filteredRows.map(article => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  destName={article.destinationId ? destMap[article.destinationId] : null}
                  onOpen={() => openRecord(article)}
                  onEdit={() => navigate(article.source === 'staging' ? '/admin/staging' : `/admin/articles/${article.recordId}`)}
                  onSetStatus={handleSetStatus}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>

          {/* Loading overlay while refreshing (not initial) */}
          {!initialLoad && loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-stone-400 border-t border-stone-100 dark:border-stone-800">
              <Loader2 size={14} className="animate-spin" />
              Refreshing…
            </div>
          )}
        </div>

        {filteredRows.length > 0 && (
          <p className="mt-3 text-xs text-stone-400 dark:text-stone-500 text-right">
            {filteredRows.length} article{filteredRows.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

function ArticleRow({ article, destName, onOpen, onEdit, onSetStatus, onDelete }) {
  const { source, status, title, slug, category, views, createdAt, publishedDate, coverImage, wordCount } = article

  const isStaging = source === 'staging'

  return (
    <div className="px-4 py-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
      {/* Title + badges */}
      <div className="flex items-start gap-2 min-w-0 mb-1.5">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
          <span className="font-medium text-stone-900 dark:text-stone-100 leading-snug">{title}</span>
          {isStaging && (
            <span className="flex-shrink-0 rounded-full bg-yellow-100 dark:bg-yellow-900/40 px-2 py-0.5 text-[10px] font-bold uppercase text-yellow-700 dark:text-yellow-400">
              Staging
            </span>
          )}
          <StatusBadge status={status} />
          {coverImage && (
            <span className="flex-shrink-0 text-stone-300 dark:text-stone-600" title="Has cover image">
              <ImageIcon size={12} />
            </span>
          )}
        </div>

        {/* Action buttons — always visible, compact */}
        <div className="flex items-center gap-0.5 flex-shrink-0 -mr-1">
          <button onClick={onOpen} className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md transition-colors" title="Preview">
            <Eye size={14} className="text-stone-500" />
          </button>
          <button onClick={onEdit} className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md transition-colors" title={isStaging ? 'Review' : 'Edit'}>
            <Edit size={14} className="text-stone-500" />
          </button>
          {!isStaging && <StatusActions article={article} onSetStatus={onSetStatus} />}
          <button
            onClick={() => onDelete(article)}
            disabled={isStaging}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors disabled:pointer-events-none"
            title="Delete"
          >
            <Trash2 size={14} className={isStaging ? 'text-stone-200 dark:text-stone-700' : 'text-red-400'} />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-400 dark:text-stone-500">
        {slug && <span>/{slug}</span>}
        {category && <><span>·</span><span>{category}</span></>}
        {destName && <><span>·</span><span className="text-stone-500 dark:text-stone-400">{destName}</span></>}
        {views > 0 && <><span>·</span><span>{views.toLocaleString()} views</span></>}
        {wordCount > 0 && <><span>·</span><span>{wordCount.toLocaleString()} words</span></>}
        {createdAt && <><span>·</span><span>{fmtDate(createdAt)}</span></>}
        {publishedDate && <><span>·</span><span className="text-emerald-600 dark:text-emerald-500">Published {fmtDate(publishedDate)}</span></>}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    draft:     'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-400',
    staging:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    archived:  'bg-stone-100  text-stone-500  dark:bg-stone-700     dark:text-stone-400',
  }
  const labels = {
    published: 'Published',
    draft:     'Draft',
    staging:   'Pending review',
    archived:  'Archived',
  }
  return (
    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${styles[status] ?? styles.archived}`}>
      {labels[status] ?? status}
    </span>
  )
}

function StatusActions({ article, onSetStatus }) {
  const { status } = article
  if (status === 'archived') return (
    <>
      <button onClick={() => onSetStatus(article, 'draft')} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors" title="Restore as draft">
        <RotateCcw size={14} className="text-blue-500" />
      </button>
      <button onClick={() => onSetStatus(article, 'published')} className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors" title="Republish">
        <Globe size={14} className="text-emerald-600" />
      </button>
    </>
  )
  if (status === 'published') return (
    <>
      <button onClick={() => onSetStatus(article, 'draft')} className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-md transition-colors" title="Unpublish to draft">
        <EyeOff size={14} className="text-amber-500" />
      </button>
      <button onClick={() => onSetStatus(article, 'archived')} className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md transition-colors" title="Archive">
        <Archive size={14} className="text-stone-400" />
      </button>
    </>
  )
  // draft
  return (
    <>
      <button onClick={() => onSetStatus(article, 'published')} className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors" title="Publish">
        <Globe size={14} className="text-emerald-600" />
      </button>
      <button onClick={() => onSetStatus(article, 'archived')} className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md transition-colors" title="Archive">
        <Archive size={14} className="text-stone-400" />
      </button>
    </>
  )
}
