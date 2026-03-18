import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiGetAuth, apiPatch } from '../lib/api'
import ArticlePreview from '../components/ArticlePreview'

const SAVE_DEBOUNCE_MS = 800

function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try { const parsed = JSON.parse(tags); if (Array.isArray(parsed)) return parsed } catch {}
  return String(tags).split(',').map(t => t.trim()).filter(Boolean)
}

export default function AdminArticleEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [article, setArticle] = useState(null)
  const [articleImages, setArticleImages] = useState([])
  const [fields, setFields] = useState({
    title: '', subtitle: '', body: '', category: '', tags: '', author_name: '', status: 'draft',
  })
  const [saveStatus, setSaveStatus] = useState('saved')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const debounceRef = useRef(null)
  // Always holds the latest fields so the debounced save doesn't use stale closure values
  const fieldsRef = useRef(fields)
  const bodyRef = useRef(null)
  // Captures cursor position on textarea blur, before the insert button click fires
  const cursorPosRef = useRef(null)

  // beforeunload guard — also fires during active save to catch mid-save navigation
  useEffect(() => {
    const handler = (e) => {
      if (saveStatus === 'saving' || saveStatus === 'error') { e.preventDefault(); e.returnValue = 'You have unsaved changes' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [saveStatus])

  // Clear debounce timer on unmount to prevent state updates after navigation
  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  const loadArticle = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [data, imgs] = await Promise.all([
        apiGetAuth(`articles/${id}`),
        apiGetAuth(`images?entity_type=article&entity_id=${id}`).catch(() => []),
      ])
      if (data?.error) { setError(data.error); return }
      setArticle(data)
      setArticleImages(Array.isArray(imgs) ? imgs : [])
      const loaded = {
        title: data.title || '',
        subtitle: data.subtitle || '',
        body: data.body || '',
        category: data.category || '',
        tags: parseTags(data.tags).join(', '),
        author_name: data.author_name || '',
        status: data.status || 'draft',
      }
      setFields(loaded)
      fieldsRef.current = loaded
    } catch (err) {
      setError(err.message || 'Failed to load article')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadArticle() }, [loadArticle])

  // Derived preview article — merges fields back for live preview
  const previewArticle = article ? {
    ...article,
    ...fields,
    tags: fields.tags,
    images: articleImages,
  } : null

  const updateField = (key, value) => {
    const next = { ...fieldsRef.current, [key]: value }
    setFields(next)
    fieldsRef.current = next
    setSaveStatus('saving')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        // Use fieldsRef.current so the save always sends the latest state,
        // not a stale closure value from when the timer was created
        await apiPatch(`articles/${id}`, fieldsRef.current)
        setSaveStatus('saved')
      } catch (err) {
        setSaveStatus('error')
        setError(err.message || 'Save failed')
      }
    }, SAVE_DEBOUNCE_MS)
  }

  const insertImageAtCursor = (imageId) => {
    const marker = `[[image:${imageId}]]`
    const pos = cursorPosRef.current
    const body = fieldsRef.current.body
    const start = pos?.start ?? body.length
    const end = pos?.end ?? body.length
    const newBody = body.slice(0, start) + marker + body.slice(end)
    updateField('body', newBody)
    // Restore focus and cursor position after marker
    cursorPosRef.current = { start: start + marker.length, end: start + marker.length }
    requestAnimationFrame(() => {
      if (bodyRef.current) {
        bodyRef.current.focus()
        bodyRef.current.selectionStart = start + marker.length
        bodyRef.current.selectionEnd = start + marker.length
      }
    })
  }

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') } catch (err) { console.error(err) }
  }

  const saveIndicator = saveStatus === 'saving'
    ? <span className="text-xs text-stone-400 animate-pulse">Saving…</span>
    : saveStatus === 'error'
    ? <span className="text-xs text-red-400">Error</span>
    : <span className="text-xs text-green-500">Saved</span>

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <div className="bg-stone-950 text-stone-50 shadow-lg flex-shrink-0">
        <div className="max-w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/articles')} className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-sm">
              <ArrowLeft size={16} /> Articles
            </button>
            <div>
              <h1 className="text-lg font-bold leading-tight">{fields.title || 'Untitled Article'}</h1>
              <div className="flex items-center gap-2 mt-0.5">{saveIndicator}</div>
            </div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-stone-400" size={32} />
        </div>
      ) : error && !article ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Editor pane */}
          <div className="w-full md:w-1/2 flex flex-col overflow-y-auto border-r border-stone-200 bg-white p-6 gap-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Title</label>
              <input value={fields.title} onChange={e => updateField('title', e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Subtitle</label>
              <input value={fields.subtitle} onChange={e => updateField('subtitle', e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Category</label>
                <input value={fields.category} onChange={e => updateField('category', e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Author</label>
                <input value={fields.author_name} onChange={e => updateField('author_name', e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Tags (comma-separated)</label>
              <input value={fields.tags} onChange={e => updateField('tags', e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Status</label>
              <select value={fields.status} onChange={e => updateField('status', e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Body</label>
              <textarea
                ref={bodyRef}
                value={fields.body}
                onChange={e => updateField('body', e.target.value)}
                onBlur={e => { cursorPosRef.current = { start: e.target.selectionStart, end: e.target.selectionEnd } }}
                className="flex-1 min-h-[400px] w-full border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            {/* Photo insert strip */}
            {articleImages.length > 0 && (
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-500 mb-2">
                  Photos — click to insert at cursor
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {articleImages.map(img => {
                    const placed = fields.body.includes(`[[image:${img.id}]]`)
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => insertImageAtCursor(img.id)}
                        className={`relative rounded-lg overflow-hidden aspect-[4/3] group border-2 transition-colors ${placed ? 'border-green-400' : 'border-stone-200 hover:border-stone-400'}`}
                      >
                        <img src={img.url} alt={img.alt_text || ''} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Insert</span>
                        </div>
                        {placed && (
                          <div className="absolute top-1 right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center text-white text-[9px] font-bold">✓</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Preview pane */}
          <div className="w-full md:w-1/2 overflow-hidden">
            <ArticlePreview article={previewArticle} />
          </div>
        </div>
      )}
    </div>
  )
}
