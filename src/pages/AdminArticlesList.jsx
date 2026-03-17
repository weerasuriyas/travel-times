import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Loader2, LogOut, RefreshCw, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiGet } from '../lib/api'

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

export default function AdminArticlesList() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiGet('articles')
      setArticles(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load articles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') } catch (err) { console.error(err) }
  }

  const filtered = useMemo(() => articles.filter(a => {
    const matchesSearch = !search ||
      (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.slug || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    return matchesSearch && matchesStatus
  }), [articles, search, statusFilter])

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-stone-950 text-stone-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Articles</h1>
            <p className="text-stone-400 text-sm mt-1">Published &amp; draft articles</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-sm">
              <ArrowLeft size={16} /> Dashboard
            </button>
            <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input
              type="text"
              placeholder="Search articles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg text-sm">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-stone-400" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-500">No articles found.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-100 border-b border-stone-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Title</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Category</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Author</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Published</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-stone-700">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filtered.map(article => (
                  <tr key={article.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-950">{article.title || 'Untitled'}</div>
                      <div className="text-xs text-stone-500">/{article.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-stone-100 text-stone-700 rounded-full text-xs font-medium">
                        {article.category || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${article.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {article.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-700">{article.author_name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-stone-600">{formatDate(article.published_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/articles/${article.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-950 text-white rounded-lg text-xs font-semibold hover:bg-stone-700 transition-colors"
                      >
                        <Edit size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
