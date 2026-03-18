import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Eye, Archive, Trash2, Search, LogOut, User, Upload, Loader2, RefreshCw, RotateCcw, Globe, EyeOff, MapPin, Settings, Info, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiGetAuth, apiPatch, apiDelete } from '../lib/api'

function toTimestamp(value) {
  const ms = new Date(value || 0).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, signOut, isSuperAdmin } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [articlesData, stagingData] = await Promise.all([
        apiGetAuth('articles'),
        apiGetAuth('staging?review_status=pending'),
      ])

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
        status: 'draft',
        author: staged.author_name || 'Editorial Team',
        publishedDate: null,
        createdAt: staged.created_at || null,
        views: 0,
        isFeatured: false,
      }))

      const combined = [...stagingRows, ...articleRows].sort(
        (a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt)
      )
      setRows(combined)
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  const handleSetStatus = async (article, newStatus) => {
    try {
      await apiPatch(`articles/${article.recordId}`, { status: newStatus })
      await loadDashboardData()
      setActiveTab(newStatus === 'archived' ? 'archived' : newStatus === 'published' ? 'published' : 'draft')
    } catch (err) {
      setError(err.message || 'Failed to update status')
    }
  }

  const handleDelete = async (article) => {
    if (!window.confirm(`Delete "${article.title}"? This cannot be undone.`)) return
    try {
      await apiDelete(`articles/${article.recordId}`)
      await loadDashboardData()
    } catch (err) {
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
    return rows.filter((article) => {
      const matchesSearch =
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
  }, [rows, searchQuery, activeTab])

  const openRecord = (article) => {
    if (article.source === 'staging') {
      navigate('/admin/staging')
      return
    }
    if (article.source === 'article' && article.recordId) {
      navigate(`/admin/articles/${article.recordId}`)
      return
    }
    navigate('/admin/articles')
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-stone-950 text-stone-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-stone-400 text-sm mt-1">Travel Times Sri Lanka</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-stone-800 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-[#00E676] flex items-center justify-center">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="User avatar"
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <User size={18} className="text-stone-950" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {user?.user_metadata?.full_name || user?.email || 'Admin User'}
                  </p>
                  <p className="text-xs text-stone-400">Administrator</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors text-sm"
              >
                ← Back to Site
              </button>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                title="Sign out"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg font-medium transition-colors text-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Refresh
            </button>
            <button
              onClick={() => navigate('/admin/destinations')}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium transition-all text-sm"
            >
              <MapPin size={16} />
              Destinations
            </button>
            <button
              onClick={() => navigate('/admin/about')}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium transition-all text-sm"
            >
              <Info size={16} />
              About
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium transition-all text-sm"
            >
              <Settings size={16} />
              Settings
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => navigate('/admin/users')}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium transition-all text-sm"
              >
                <Users size={16} />
                Users
              </button>
            )}
            <button
              onClick={() => navigate('/admin/ingest')}
              className="flex items-center gap-2 px-4 py-2 bg-stone-950 text-white rounded-lg font-medium transition-all shadow-sm whitespace-nowrap hover:bg-stone-800 text-sm"
            >
              <Upload size={16} />
              Ingest
            </button>
            <button
              onClick={() => navigate('/admin/staging')}
              className="flex items-center gap-2 px-4 py-2 bg-stone-700 text-white rounded-lg font-medium transition-all shadow-sm whitespace-nowrap hover:bg-stone-600 text-sm"
            >
              <Eye size={16} />
              Review Queue
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden mb-0">
          <div className="flex border-b border-stone-200 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-stone-950 text-stone-950'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.key
                    ? 'bg-stone-950 text-white'
                    : 'bg-stone-100 text-stone-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-100 border-b border-stone-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Article</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Category</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Author</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Published</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Views</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-stone-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {article.isFeatured && (
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFD600' }} title="Featured" />
                        )}
                        <div>
                          <div className="font-medium text-stone-950 flex items-center gap-2">
                            <span>{article.title}</span>
                            {article.source === 'staging' && (
                              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase text-yellow-800">
                                Staging
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-stone-500">/{article.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm font-medium">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          article.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : article.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-700">{article.author}</td>
                    <td className="px-6 py-4 text-stone-600 text-sm">
                      {article.publishedDate ? new Date(article.publishedDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-stone-600">{article.views.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openRecord(article)}
                          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                          title={article.source === 'staging' ? 'Open review' : 'Preview'}
                        >
                          <Eye size={18} className="text-stone-600" />
                        </button>
                        <button
                          onClick={() => navigate(
                            article.source === 'staging'
                              ? '/admin/staging'
                              : `/admin/articles/${article.recordId}`
                          )}
                          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                          title={article.source === 'staging' ? 'Review' : 'Edit'}
                        >
                          <Edit size={18} className="text-stone-600" />
                        </button>
                        {/* Status action button — context-aware */}
                        {article.source !== 'staging' && (() => {
                          if (article.status === 'archived') return (
                            <>
                              <button
                                onClick={() => handleSetStatus(article, 'draft')}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Restore as draft"
                              >
                                <RotateCcw size={18} className="text-blue-500" />
                              </button>
                              <button
                                onClick={() => handleSetStatus(article, 'published')}
                                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                title="Republish"
                              >
                                <Globe size={18} className="text-green-500" />
                              </button>
                            </>
                          )
                          if (article.status === 'published') return (
                            <>
                              <button
                                onClick={() => handleSetStatus(article, 'draft')}
                                className="p-2 hover:bg-yellow-50 rounded-lg transition-colors"
                                title="Unpublish to draft"
                              >
                                <EyeOff size={18} className="text-yellow-500" />
                              </button>
                              <button
                                onClick={() => handleSetStatus(article, 'archived')}
                                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                                title="Archive"
                              >
                                <Archive size={18} className="text-stone-600" />
                              </button>
                            </>
                          )
                          // draft
                          return (
                            <>
                              <button
                                onClick={() => handleSetStatus(article, 'published')}
                                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                title="Publish"
                              >
                                <Globe size={18} className="text-green-500" />
                              </button>
                              <button
                                onClick={() => handleSetStatus(article, 'archived')}
                                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                                title="Archive"
                              >
                                <Archive size={18} className="text-stone-600" />
                              </button>
                            </>
                          )
                        })()}
                        <button
                          onClick={() => handleDelete(article)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                          disabled={article.source === 'staging'}
                        >
                          <Trash2 size={18} className={article.source === 'staging' ? 'text-stone-300' : 'text-red-600'} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filteredArticles.length === 0 && (
            <div className="text-center py-12 text-stone-500 text-sm">
              No articles found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
