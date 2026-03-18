import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, CloudUpload, Loader2, LogOut, Star, Trash2, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiDelete, apiGet, apiGetAuth, apiPatch, apiPost, apiUploadImage } from '../lib/api'
import ArticlePreview from '../components/ArticlePreview'

const SAVE_DEBOUNCE_MS = 800

function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try { const parsed = JSON.parse(tags); if (Array.isArray(parsed)) return parsed } catch {}
  return String(tags).split(',').map(t => t.trim()).filter(Boolean)
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2">
        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">{label}</label>
        {hint && <span className="text-[10px] text-stone-400 normal-case">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const inputCls = "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#00E676]/40 focus:border-[#00E676] transition-colors"

export default function AdminArticleEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [article, setArticle] = useState(null)
  const [articleImages, setArticleImages] = useState([])
  const [destinations, setDestinations] = useState([])
  const [fields, setFields] = useState({
    title: '', subtitle: '', body: '', category: '', tags: '',
    author_name: '', status: 'draft', destination_id: '', cover_image: '',
    read_time: 1, article_type: 'story',
  })
  const [isFeatured, setIsFeatured] = useState(false)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const debounceRef = useRef(null)
  const fieldsRef = useRef(fields)
  const bodyRef = useRef(null)
  const cursorPosRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (saveStatus === 'saving' || saveStatus === 'error') {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes'
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [saveStatus])

  useEffect(() => { return () => clearTimeout(debounceRef.current) }, [])

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
        destination_id: data.destination_id ?? '',
        cover_image: data.cover_image ?? '',
        read_time: Number(data.read_time) || 1,
        article_type: data.article_type || 'story',
      }
      setFields(loaded)
      fieldsRef.current = loaded
      setIsFeatured(!!data.is_featured)
    } catch (err) {
      setError(err.message || 'Failed to load article')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadArticle() }, [loadArticle])

  useEffect(() => {
    apiGet('destinations').then(d => setDestinations(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const previewArticle = article ? { ...article, ...fields, tags: fields.tags, images: articleImages } : null

  const updateField = (key, value) => {
    const next = { ...fieldsRef.current, [key]: value }
    if (key === 'body') {
      const words = value.trim().split(/\s+/).filter(Boolean).length
      next.read_time = Math.max(1, Math.ceil(words / 200))
    }
    setFields(next)
    fieldsRef.current = next
    setSaveStatus('saving')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
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
    updateField('body', body.slice(0, start) + marker + body.slice(end))
    cursorPosRef.current = { start: start + marker.length, end: start + marker.length }
    requestAnimationFrame(() => {
      if (bodyRef.current) {
        bodyRef.current.focus()
        bodyRef.current.selectionStart = start + marker.length
        bodyRef.current.selectionEnd = start + marker.length
      }
    })
  }

  const handleFiles = async (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setUploading(true)
    setError('')
    try {
      await Promise.all(arr.map(f => apiUploadImage(f, 'article', id)))
      const imgs = await apiGetAuth(`images?entity_type=article&entity_id=${id}`).catch(() => [])
      setArticleImages(Array.isArray(imgs) ? imgs : [])
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (img) => {
    try {
      await apiDelete(`images/${img.id}`)
      setArticleImages(prev => prev.filter(i => i.id !== img.id))
      if (fieldsRef.current.cover_image === img.url) updateField('cover_image', '')
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') } catch (err) { console.error(err) }
  }

  const handleFeatureToggle = async () => {
    const newVal = !isFeatured
    setIsFeatured(newVal)  // optimistic
    try {
      await apiPost(`articles/${id}/feature`, { featured: newVal })
    } catch (err) {
      setIsFeatured(!newVal)  // revert on failure
      setError(err.message || 'Failed to update featured status')
    }
  }

  const statusBadgeCls = {
    published: 'bg-[#00E676]/10 text-[#00C853] border-[#00E676]/30',
    archived:  'bg-stone-800 text-stone-500 border-stone-700',
    draft:     'bg-amber-400/10 text-amber-400 border-amber-400/30',
  }[fields.status] ?? 'bg-stone-800 text-stone-400 border-stone-700'

  return (
    <div className="h-screen flex flex-col bg-[#111111]">

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 h-13 px-5 flex items-center justify-between border-b border-white/[0.07] bg-[#111111]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/admin/articles')}
            className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-300 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={14} />
            <span>Articles</span>
          </button>
          <span className="text-stone-700 text-xs">/</span>
          <span className="text-sm text-stone-200 font-medium truncate max-w-[260px]">
            {fields.title || 'Untitled'}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeCls}`}>
            {fields.status}
          </span>
        </div>

        <div className="flex items-center gap-5 flex-shrink-0">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-stone-500">
              <Loader2 size={11} className="animate-spin" /> Saving…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-[#00E676]/70">
              <CheckCircle2 size={11} /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-xs text-red-400">
              <X size={11} /> Save error
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="text-stone-600 hover:text-red-400 transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#00E676]" size={28} />
        </div>
      ) : error && !article ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* ── Editor pane ─────────────────────────────────────────── */}
          <div className="w-full md:w-1/2 overflow-y-auto bg-[#F5F5F3]">

            <div className="p-5 flex flex-col gap-4 max-w-2xl mx-auto pb-16">

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  <X size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* ── Article info ─────────────────────────────────────── */}
              <section className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-50">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Article Info</p>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <Field label="Title">
                    <input
                      value={fields.title}
                      onChange={e => updateField('title', e.target.value)}
                      placeholder="Give this story a title…"
                      className={inputCls + " text-base font-semibold"}
                    />
                  </Field>

                  <Field label="Subtitle">
                    <input
                      value={fields.subtitle}
                      onChange={e => updateField('subtitle', e.target.value)}
                      placeholder="A short teaser or opening deck…"
                      className={inputCls}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Category">
                      <input
                        value={fields.category}
                        onChange={e => updateField('category', e.target.value)}
                        placeholder="Travel, Culture…"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Author">
                      <input
                        value={fields.author_name}
                        onChange={e => updateField('author_name', e.target.value)}
                        placeholder="Editorial Team"
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <Field label="Tags" hint="comma separated">
                    <input
                      value={fields.tags}
                      onChange={e => updateField('tags', e.target.value)}
                      placeholder="kandy, history, festival"
                      className={inputCls}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Status">
                      <select
                        value={fields.status}
                        onChange={e => updateField('status', e.target.value)}
                        className={inputCls}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </Field>
                    <Field label="Destination">
                      <select
                        value={fields.destination_id}
                        onChange={e => updateField('destination_id', e.target.value || null)}
                        className={inputCls}
                      >
                        <option value="">— None —</option>
                        {destinations.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Story / Event toggle */}
                  <Field label="Content Type">
                    <div className="flex rounded-xl overflow-hidden border border-stone-200">
                      {['story', 'event'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateField('article_type', type)}
                          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                            fields.article_type === type
                              ? 'bg-stone-950 text-white'
                              : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                          }`}
                        >
                          {type === 'story' ? '📖 Story' : '🎉 Event'}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {/* is_featured toggle */}
                  <button
                    type="button"
                    onClick={handleFeatureToggle}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      isFeatured
                        ? 'border-[#FFD600] bg-[#FFD600]/10 text-stone-900'
                        : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300'
                    }`}
                  >
                    <span className="text-lg">{isFeatured ? '📌' : '📍'}</span>
                    <div className="text-left">
                      <p>{isFeatured ? 'Pinned to homepage hero' : 'Pin to homepage hero'}</p>
                      {isFeatured && <p className="text-xs font-normal text-stone-500 mt-0.5">This article appears first on the homepage</p>}
                    </div>
                  </button>
                </div>
              </section>

              {/* ── Body ─────────────────────────────────────────────── */}
              <section className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-50 flex items-center justify-between flex-shrink-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Story Body</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-stone-400">~{fields.read_time} min read</span>
                    <p className="text-[10px] text-stone-400">
                      Start a line with <code className="bg-stone-100 px-1 rounded">"quote"</code> for pull quotes
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <textarea
                    ref={bodyRef}
                    value={fields.body}
                    onChange={e => updateField('body', e.target.value)}
                    onBlur={e => { cursorPosRef.current = { start: e.target.selectionStart, end: e.target.selectionEnd } }}
                    placeholder="Write your story here…&#10;&#10;Double-line break creates a new paragraph."
                    className="min-h-[400px] w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3.5 text-sm font-mono leading-[1.8] text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#00E676]/40 focus:border-[#00E676] resize-y transition-colors"
                  />
                </div>
              </section>

              {/* ── Photos ───────────────────────────────────────────── */}
              <section className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-50 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Photos</p>
                  {articleImages.length > 0 && (
                    <span className="text-[10px] text-stone-400">
                      {articleImages.length} photo{articleImages.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-4">

                  {/* Photo grid */}
                  {articleImages.length > 0 && (
                    <div>
                      <p className="text-[10px] text-stone-400 mb-3">
                        Hover a photo to set as cover, insert into body, or delete
                      </p>
                      <div className="grid grid-cols-2 gap-2.5">
                        {articleImages.map(img => {
                          const placed = fields.body.includes(`[[image:${img.id}]]`)
                          const isCover = fields.cover_image === img.url
                          return (
                            <div
                              key={img.id}
                              className={`group relative rounded-xl overflow-hidden aspect-[4/3] border-2 transition-all ${
                                isCover
                                  ? 'border-[#FFD600] shadow-lg shadow-[#FFD600]/20'
                                  : placed
                                  ? 'border-[#00E676] shadow-md shadow-[#00E676]/15'
                                  : 'border-stone-100 hover:border-stone-300'
                              }`}
                            >
                              <img src={img.url} alt={img.alt_text || ''} className="w-full h-full object-cover" loading="lazy" />

                              {/* Badges */}
                              {isCover && (
                                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-[#FFD600] rounded-full px-2 py-0.5">
                                  <Star size={8} className="text-stone-900 fill-stone-900" />
                                  <span className="text-[8px] font-black text-stone-900 tracking-wide">COVER</span>
                                </div>
                              )}
                              {placed && !isCover && (
                                <div className="absolute top-1.5 left-1.5 bg-[#00E676] rounded-full px-2 py-0.5">
                                  <span className="text-[8px] font-black text-stone-900 tracking-wide">IN BODY</span>
                                </div>
                              )}

                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2.5">
                                <button
                                  type="button"
                                  onClick={() => updateField('cover_image', isCover ? '' : img.url)}
                                  className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                                    isCover
                                      ? 'bg-[#FFD600] text-stone-900'
                                      : 'bg-white/10 text-white hover:bg-[#FFD600] hover:text-stone-900 border border-white/20'
                                  }`}
                                >
                                  {isCover ? '★ Cover set' : '★ Set as cover'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertImageAtCursor(img.id)}
                                  className="w-full py-1.5 rounded-lg text-[10px] font-bold bg-white/10 text-white hover:bg-white hover:text-stone-900 border border-white/20 transition-colors"
                                >
                                  + Insert in body
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage(img)}
                                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center transition-colors border border-white/20"
                                  title="Delete photo"
                                >
                                  <Trash2 size={10} className="text-white" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                    onDragEnter={e => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-10 transition-all cursor-pointer select-none ${
                      isDragOver
                        ? 'border-[#00E676] bg-[#00E676]/5'
                        : uploading
                        ? 'border-stone-200 bg-stone-50 cursor-default'
                        : 'border-stone-200 hover:border-[#00E676]/50 bg-stone-50 hover:bg-[#00E676]/[0.03]'
                    }`}
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={26} className="animate-spin text-[#00E676]" />
                        <p className="text-sm font-semibold text-stone-500">Uploading…</p>
                      </>
                    ) : (
                      <>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDragOver ? 'bg-[#00E676]/20' : 'bg-stone-100'}`}>
                          <CloudUpload size={22} className={isDragOver ? 'text-[#00E676]' : 'text-stone-400'} />
                        </div>
                        <div className="text-center">
                          <p className={`text-sm font-semibold ${isDragOver ? 'text-[#00E676]' : 'text-stone-600'}`}>
                            {isDragOver ? 'Release to upload' : 'Drag & drop photos here'}
                          </p>
                          <p className="text-xs text-stone-400 mt-1">or click to browse · JPG, PNG, WEBP · up to 10 MB each</p>
                        </div>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
                    />
                  </div>

                </div>
              </section>

            </div>

          </div>

          {/* ── Preview pane ─────────────────────────────────────────── */}
          <div className="w-full md:w-1/2 border-l border-white/[0.07] overflow-hidden">
            <div className="h-full overflow-y-auto">
              <ArticlePreview article={previewArticle} />
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
