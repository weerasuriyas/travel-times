import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Eye, Archive, Trash2, Search, Filter, LogOut, User, Upload } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Mock article data for prototype
  const mockArticles = [
    {
      id: 1,
      title: 'THE FIRE OF KANDY.',
      slug: 'kandy-perahera',
      category: 'Culture',
      status: 'published',
      author: 'Sanath Weerasuriya',
      publishedDate: '2026-01-15',
      views: 2547,
      isFeatured: true
    },
    {
      id: 2,
      title: 'Ella to Kandy: The Slowest Express',
      slug: 'ella-train',
      category: 'Travel',
      status: 'draft',
      author: 'Sanath Weerasuriya',
      publishedDate: null,
      views: 0,
      isFeatured: false
    },
    {
      id: 3,
      title: "Dambatenne: Lipton's Lost Trail",
      slug: 'dambatenne-tea',
      category: 'Culture',
      status: 'published',
      author: 'Sanath Weerasuriya',
      publishedDate: '2026-01-10',
      views: 1832,
      isFeatured: false
    }
  ]

  const filteredArticles = mockArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || article.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: mockArticles.length,
    published: mockArticles.filter(a => a.status === 'published').length,
    draft: mockArticles.filter(a => a.status === 'draft').length,
    archived: mockArticles.filter(a => a.status === 'archived').length
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Admin Header */}
      <div className="bg-stone-950 text-stone-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-stone-400 text-sm mt-1">Travel Times Sri Lanka</p>
            </div>
            <div className="flex items-center gap-4">
              {/* User info */}
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

              {/* Back to site button */}
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors text-sm"
              >
                ← Back to Site
              </button>

              {/* Logout button */}
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <div className="text-stone-500 text-sm font-medium mb-2">Total Articles</div>
            <div className="text-3xl font-bold text-stone-950">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <div className="text-stone-500 text-sm font-medium mb-2">Published</div>
            <div className="text-3xl font-bold" style={{ color: '#00E676' }}>{stats.published}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <div className="text-stone-500 text-sm font-medium mb-2">Drafts</div>
            <div className="text-3xl font-bold" style={{ color: '#FFD600' }}>{stats.draft}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <div className="text-stone-500 text-sm font-medium mb-2">Archived</div>
            <div className="text-3xl font-bold text-stone-400">{stats.archived}</div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/ingest')}
                className="flex items-center gap-2 px-6 py-2 bg-stone-950 text-white rounded-lg font-medium transition-all shadow-sm whitespace-nowrap hover:bg-stone-800"
              >
                <Upload size={20} />
                Ingest Folder
              </button>
              <button
                onClick={() => navigate('/admin/editor')}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all shadow-sm whitespace-nowrap"
                style={{ backgroundColor: '#00E676', color: '#1a1a1a' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#00C853'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#00E676'}
              >
                <Plus size={20} />
                New Article
              </button>
            </div>
          </div>
        </div>

        {/* Articles Table */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
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
                          <div className="font-medium text-stone-950">{article.title}</div>
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
                          onClick={() => navigate('/event/' + article.slug)}
                          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye size={18} className="text-stone-600" />
                        </button>
                        <button
                          onClick={() => navigate('/admin/editor')}
                          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} className="text-stone-600" />
                        </button>
                        <button
                          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Archive"
                        >
                          <Archive size={18} className="text-stone-600" />
                        </button>
                        <button
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12 text-stone-500">
            No articles found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}
