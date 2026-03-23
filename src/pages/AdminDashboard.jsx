import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Eye, Archive, Trash2, Search, Loader2, RefreshCw, RotateCcw, Globe, EyeOff, PenLine, ArrowUpDown } from 'lucide-react'
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

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'title',  label: 'A → Z' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [sortKey, setSortKey] = useState('newest')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      // Use allSettled so a staging failure doesn't block article display
      const [articlesResult, stagingResult] = await Promise.allSettled([
        apiGetAuth('articles'),
        apiGetAuth('staging?review_status=pending'),
      ])

      const articlesData = articlesResult.status === 'fulfilled' ? articlesResult.value : []
      const stagingData  = stagingResult.status  === 'fulfilled' ? stagingResult.value  : []

      if (articlesResult.status === 'rejected' && stagingResult.status === 'rejected') {
        setError('Failed to load data. Check your connection and try again.')
        setLoading(false)
        setInitialLoad(false)
        return
      }
      if (articlesResult.status === 'rejected') {
        setError('Articles failed to load — showing staging only.')
      } else if (stagingResult.status === 'rejected') {
        setError('Staging queue failed to load — showing articles only.')
      }

      const articleRows = (Array.isArray(articlesData) ? articlesData : []).map((article) => ({
        id: `article-${article.id}`,
        source: 'article',
        recordId: article.id,
        title: article.title || 'Untitled',
        slug: article.slug || '',
        category: article.category || 'Uncategorized',
        status: article.status || 'draft',
        author: article.author_name || 'Editorial Team',
        publishedDate: article.published_at || null,
        createdAt: article.created_at || null,
        views: Number(article.views || 0),
        isFeatured: false,
      }))

      const stagingRows = (Array.isArray(stagingData) ? stagingData : []).map((staged) => ({
        id: `staging-${staged.id}`,
        source: 'staging',
        recordId: staged.id,
        title: staged.title || 'Untitled',
        slug: staged.slug || '',
        category: staged.category || 'Uncategorized',
        status: 'staging',
        author: staged.author_name || 'Editorial Team',
        publishedDate: null,
        createdAt: staged.created_at || null,
        views: 0,
        isFeatured: false,
      }))

      setRows([...stagingRows, ...articleRows])
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleSetStatus = async (article, newStatus) => {
    const prevRows = rows
    setRows(prev => prev.map(r =>
      r.id === article.id ? { ...r, status: newStatus } : r
    ))
    const nextTab = newStatus === 'archived' ? 'archived' : newStatus === 'published' ? 'published' : 'draft'
    setActiveTab(nextTab)
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

  const tabs = useMemo(() => [
    { key: 'all',       label: 'All',       count: rows.length },
    { key: 'staging',   label: 'Staging',   count: rows.filter(r => r.source === 'staging').length },
    { key: 'draft',     label: 'Drafts',    count: rows.filter(r => r.source === 'article' && r.status === 'draft').length },
    { key: 'published', label: 'Published', count: rows.filter(r => r.source === 'article' && r.status === 'published').length },
    { key: 'archived',  label: 'Archived',  count: rows.filter(r => r.source === 'article' && r.status === 'archived').length },
  ], [rows])

  const filteredArticles = useMemo(() => {
    const search = searchQuery.toLowerCase()
    const filtered = rows.filter((article) => {
      const matchesSearch =
        !search ||
        article.title.toLowerCase().includes(search) ||
        article.slug.toLowerCase().includes(search)
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'staging'   && article.source === 'staging') ||
        (activeTab === 'draft'     && article.source === 'article' && article.status === 'draft') ||
        (activeTab === 'published' && article.source === 'article' && article.status === 'published') ||
        (activeTab === 'archived'  && article.source === 'article' && article.status === 'archived')
      return matchesSearch && matchesTab
    })

    if (sortKey === 'newest') {
      filtered.sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
    } else if (sortKey === 'oldest') {
      filtered.sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt))
    } else if (sortKey === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title))
    }

    return filtered
  }, [rows, searchQuery, activeTab, sortKey])

  const openRecord = (article) => {
    if (article.source === 'staging') {
      navigate('/admin/staging')
      return
    }
    if (article.source === 'article' && article.recordId) {
      navigate(`/admin/articles/${article.recordId}`)
      return
    }
    navigate('/admin')
  }

  return (
    <div>
      <AdminPageHeader
        title="Articles"
        action={
          <button
            onClick={() => navigate('/admin/write')}
            className="flex items-center gap-2 px-4 py-2 bg-stone-950 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            <PenLine size={16} />
            Write Article
          </button>
        }
      />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between mb-6">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 px-2 py-1.5">
              <ArrowUpDown size={14} className="text-stone-400 flex-shrink-0" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="text-sm bg-transparent text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 rounded-lg font-medium transition-colors text-sm disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden mb-0">
          <div className="flex border-b border-stone-200 dark:border-stone-700 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-stone-950 dark:border-stone-100 text-stone-950 dark:text-stone-100'
                    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-600'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.key
                    ? 'bg-stone-950 dark:bg-stone-100 text-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {initialLoad && loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-4 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-1/3" />
                    <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded w-12" />
                  </div>
                  <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded w-1/2" />
                </div>
              ))
            ) : (
              filteredArticles.map((article) => (
                <div key={article.id} className="px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-stone-900 dark:text-stone-100 truncate">{article.title}</span>
                      {article.source === 'staging' && (
                        <span className="flex-shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase text-yellow-700">Staging</span>
                      )}
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        article.status === 'published' ? 'bg-emerald-100 text-emerald-700'
                        : article.status === 'draft'   ? 'bg-amber-100 text-amber-700'
                        : article.status === 'staging' ? 'bg-yellow-100 text-yellow-700'
                        :                                'bg-stone-100 text-stone-500'
                      }`}>
                        {article.status === 'staging' ? 'Pending review' : article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Meta + actions row */}
                  <div className="mt-1.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500 min-w-0">
                      <span className="truncate">/{article.slug}</span>
                      {article.category && article.category !== 'Uncategorized' && (
                        <>
                          <span>·</span>
                          <span className="flex-shrink-0">{article.category}</span>
                        </>
                      )}
                      {article.views > 0 && (
                        <>
                          <span>·</span>
                          <span className="flex-shrink-0">{article.views.toLocaleString()} views</span>
                        </>
                      )}
                      {article.createdAt && (
                        <>
                          <span>·</span>
                          <span className="flex-shrink-0">Added {fmtDate(article.createdAt)}</span>
                        </>
                      )}
                      {article.publishedDate && (
                        <>
                          <span>·</span>
                          <span className="flex-shrink-0 text-emerald-600">Published {fmtDate(article.publishedDate)}</span>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => openRecord(article)}
                        className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md transition-colors"
                        title={article.source === 'staging' ? 'Open review' : 'Preview'}
                      >
                        <Eye size={15} className="text-stone-500" />
                      </button>
                      <button
                        onClick={() => navigate(
                          article.source === 'staging'
                            ? '/admin/staging'
                            : `/admin/articles/${article.recordId}`
                        )}
                        className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md transition-colors"
                        title={article.source === 'staging' ? 'Review' : 'Edit'}
                      >
                        <Edit size={15} className="text-stone-500" />
                      </button>
                      {article.source !== 'staging' && (() => {
                        if (article.status === 'archived') return (
                          <>
                            <button onClick={() => handleSetStatus(article, 'draft')} className="p-1.5 hover:bg-blue-50 rounded-md transition-colors" title="Restore as draft">
                              <RotateCcw size={15} className="text-blue-500" />
                            </button>
                            <button onClick={() => handleSetStatus(article, 'published')} className="p-1.5 hover:bg-emerald-50 rounded-md transition-colors" title="Republish">
                              <Globe size={15} className="text-emerald-600" />
                            </button>
                          </>
                        )
                        if (article.status === 'published') return (
                          <>
                            <button onClick={() => handleSetStatus(article, 'draft')} className="p-1.5 hover:bg-amber-50 rounded-md transition-colors" title="Unpublish to draft">
                              <EyeOff size={15} className="text-amber-500" />
                            </button>
                            <button onClick={() => handleSetStatus(article, 'archived')} className="p-1.5 hover:bg-stone-200 rounded-md transition-colors" title="Archive">
                              <Archive size={15} className="text-stone-400" />
                            </button>
                          </>
                        )
                        return (
                          <>
                            <button onClick={() => handleSetStatus(article, 'published')} className="p-1.5 hover:bg-emerald-50 rounded-md transition-colors" title="Publish">
                              <Globe size={15} className="text-emerald-600" />
                            </button>
                            <button onClick={() => handleSetStatus(article, 'archived')} className="p-1.5 hover:bg-stone-200 rounded-md transition-colors" title="Archive">
                              <Archive size={15} className="text-stone-400" />
                            </button>
                          </>
                        )
                      })()}
                      <button
                        onClick={() => handleDelete(article)}
                        className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                        disabled={article.source === 'staging'}
                      >
                        <Trash2 size={15} className={article.source === 'staging' ? 'text-stone-200 dark:text-stone-700' : 'text-red-400'} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {!initialLoad && !loading && filteredArticles.length === 0 && (
            <div className="text-center py-12 text-stone-500 dark:text-stone-400 text-sm">
              {searchQuery ? `No articles match "${searchQuery}"` : 'No articles found.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
