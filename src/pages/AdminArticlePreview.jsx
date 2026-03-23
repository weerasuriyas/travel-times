import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Archive, Globe, EyeOff, RotateCcw } from 'lucide-react'
import { apiGetAuth, apiPatch } from '../lib/api'
import ArticleDetailView from '../components/ArticleDetailView'

const STATUS_BADGE = {
  published: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  draft:     'bg-amber-100  text-amber-700  border-amber-200',
  archived:  'bg-stone-100  text-stone-500  border-stone-200',
}

export default function AdminArticlePreview() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [article, setArticle] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    apiGetAuth(`articles/${id}`)
      .then(data => {
        if (!data || data.error) { setError('Article not found'); return }
        setArticle(data)
      })
      .catch(err => setError(err.message || 'Failed to load article'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSetStatus = async (newStatus) => {
    if (!article) return
    setStatusLoading(true)
    try {
      await apiPatch(`articles/${id}`, { status: newStatus })
      setArticle(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      setError(err.message || 'Failed to update status')
    } finally {
      setStatusLoading(false)
    }
  }

  const status = article?.status || 'draft'

  return (
    <div className="min-h-screen bg-[#FDFDFB] dark:bg-stone-950">
      {/* Admin bar */}
      <div className="sticky top-0 z-50 bg-stone-950 dark:bg-stone-900 border-b border-stone-800 px-4 py-2.5 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={13} />
          Back to Articles
        </button>

        <div className="flex items-center gap-2">
          {article && (
            <>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_BADGE[status] ?? STATUS_BADGE.archived}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>

              {/* Status actions */}
              {!statusLoading && status === 'archived' && (
                <>
                  <button
                    onClick={() => handleSetStatus('draft')}
                    title="Restore as draft"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-blue-400 hover:bg-stone-800 transition-colors"
                  >
                    <RotateCcw size={12} /> Restore
                  </button>
                  <button
                    onClick={() => handleSetStatus('published')}
                    title="Republish"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-emerald-400 hover:bg-stone-800 transition-colors"
                  >
                    <Globe size={12} /> Publish
                  </button>
                </>
              )}
              {!statusLoading && status === 'published' && (
                <>
                  <button
                    onClick={() => handleSetStatus('draft')}
                    title="Unpublish to draft"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-amber-400 hover:bg-stone-800 transition-colors"
                  >
                    <EyeOff size={12} /> Unpublish
                  </button>
                  <button
                    onClick={() => handleSetStatus('archived')}
                    title="Archive"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-stone-400 hover:bg-stone-800 transition-colors"
                  >
                    <Archive size={12} /> Archive
                  </button>
                </>
              )}
              {!statusLoading && status === 'draft' && (
                <>
                  <button
                    onClick={() => handleSetStatus('published')}
                    title="Publish"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-emerald-400 hover:bg-stone-800 transition-colors"
                  >
                    <Globe size={12} /> Publish
                  </button>
                  <button
                    onClick={() => handleSetStatus('archived')}
                    title="Archive"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-stone-400 hover:bg-stone-800 transition-colors"
                  >
                    <Archive size={12} /> Archive
                  </button>
                </>
              )}
            </>
          )}

          <button
            onClick={() => navigate(`/admin/articles/${id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-stone-900 rounded-md text-xs font-medium hover:bg-stone-100 transition-colors"
          >
            <Edit size={12} />
            Edit
          </button>
        </div>
      </div>

      {/* Non-published notice */}
      {article && status !== 'published' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-center text-xs text-amber-700 dark:text-amber-400 font-medium">
          Admin preview — this article is not publicly visible
        </div>
      )}

      {/* Content */}
      <main className="pt-16 pb-32">
        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && error && (
          <div className="text-center py-32 text-stone-500 dark:text-stone-400 text-sm">{error}</div>
        )}
        {!loading && article && (
          <ArticleDetailView article={{ ...article, images: Array.isArray(article.images) ? article.images : [] }} />
        )}
      </main>
    </div>
  )
}
