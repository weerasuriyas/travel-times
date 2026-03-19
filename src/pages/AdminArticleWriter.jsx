// src/pages/AdminArticleWriter.jsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, CloudUpload, Loader2, Search, Star, Trash2, X } from 'lucide-react'
import { apiDelete, apiGet, apiGetAuth, apiPatch, apiPost, apiUploadImage } from '../lib/api'
import AdminPageHeader from '../components/AdminPageHeader'
import RichTextEditor from '../components/RichTextEditor'
import { subtitleClasses } from '../lib/articleStyles'

const SAVE_DEBOUNCE_MS = 800

const SUBTITLE_PRESETS = [
  { value: 'serif-italic', label: 'Serif Italic' },
  { value: 'bold-serif',   label: 'Bold Serif'   },
  { value: 'sans-light',   label: 'Sans Light'   },
  { value: 'condensed',    label: 'Condensed'    },
]

function SubtitleStylePicker({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {SUBTITLE_PRESETS.map(p => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
            value === p.value
              ? 'border-[#00E676] bg-[#00E676]/10 text-stone-900 ring-1 ring-[#00E676]'
              : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300'
          } ${subtitleClasses(p.value, 'picker')}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try { const parsed = JSON.parse(tags); if (Array.isArray(parsed)) return parsed } catch {}
  return String(tags).split(',').map(t => t.trim()).filter(Boolean)
}

const inputCls = 'w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#00E676]/40 focus:border-[#00E676] transition-colors'

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

export default function AdminArticleWriter() {
  const [articleId, setArticleId] = useState(null)
  const [fields, setFields] = useState({
    title: '', subtitle: '', body: '', category: '', tags: '',
    author_name: '', status: 'draft', destination_id: '', cover_image: '',
    read_time: 1, article_type: 'story', subtitle_style: 'serif-italic',
  })
  const [isFeatured, setIsFeatured] = useState(false)
  const [saveStatus, setSaveStatus] = useState('creating')
  const [error, setError] = useState('')
  const [articleImages, setArticleImages] = useState([])
  const [destinations, setDestinations] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoTab, setPhotoTab] = useState('uploaded')
  const [unsplashQuery, setUnsplashQuery] = useState('')
  const [unsplashResults, setUnsplashResults] = useState([])
  const [unsplashLoading, setUnsplashLoading] = useState(false)
  const [unsplashDownloading, setUnsplashDownloading] = useState(null)

  const editorRef = useRef(null)
  const debounceRef = useRef(null)
  const captionDebounceRef = useRef({})
  const fieldsRef = useRef(fields)
  const fileInputRef = useRef(null)
  const photosRef = useRef(null)

  // Auto-create blank draft on mount
  useEffect(() => {
    apiPost('articles', { title: 'Untitled', status: 'draft' })
      .then(data => {
        setArticleId(data.id)
        setSaveStatus('saved')
      })
      .catch(err => {
        setError(err.message || 'Failed to create article')
        setSaveStatus('error')
      })
  }, [])

  useEffect(() => {
    apiGet('destinations').then(d => setDestinations(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current)
      Object.values(captionDebounceRef.current).forEach(clearTimeout)
    }
  }, [])

  const updateField = (key, value) => {
    const next = { ...fieldsRef.current, [key]: value }
    if (key === 'body') {
      const words = value.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length
      next.read_time = Math.max(1, Math.ceil(words / 200))
    }
    setFields(next)
    fieldsRef.current = next
    if (!articleId) return
    setSaveStatus('saving')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        await apiPatch(`articles/${articleId}`, fieldsRef.current)
        setSaveStatus('saved')
      } catch (err) {
        setSaveStatus('error')
        setError(err.message || 'Save failed')
      }
    }, SAVE_DEBOUNCE_MS)
  }

  const handleInsertImage = (img) => {
    editorRef.current?.commands.setImage({
      src: img.url,
      alt: img.alt_text || '',
      'data-image-id': String(img.id),
    })
  }

  const handleFiles = async (files) => {
    if (!articleId) return
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setUploading(true)
    setError('')
    try {
      await Promise.all(arr.map(f => apiUploadImage(f, 'article', articleId)))
      const imgs = await apiGetAuth(`images?entity_type=article&entity_id=${articleId}`).catch(() => [])
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

  const handleCaptionChange = useCallback((imgId, caption) => {
    setArticleImages(prev => prev.map(i => i.id === imgId ? { ...i, caption } : i))
    clearTimeout(captionDebounceRef.current[imgId])
    captionDebounceRef.current[imgId] = setTimeout(() => {
      apiPatch(`images/${imgId}`, { caption }).catch(() => {})
    }, 600)
  }, [])

  const handleFeatureToggle = async () => {
    if (!articleId) return
    const newVal = !isFeatured
    setIsFeatured(newVal)
    try {
      await apiPost(`articles/${articleId}/feature`, { featured: newVal })
    } catch (err) {
      setIsFeatured(!newVal)
      setError(err.message || 'Failed to update featured status')
    }
  }

  const searchUnsplash = async (q) => {
    if (!q.trim()) return
    setUnsplashLoading(true)
    setUnsplashResults([])
    try {
      const results = await apiGetAuth(`unsplash/search?q=${encodeURIComponent(q)}`)
      setUnsplashResults(Array.isArray(results) ? results : [])
    } catch {
      setUnsplashResults([])
    } finally {
      setUnsplashLoading(false)
    }
  }

  const downloadUnsplashPhoto = async (photo) => {
    if (!articleId) return
    setUnsplashDownloading(photo.id)
    try {
      await apiPost('unsplash/download', {
        id: photo.id,
        regular_url: photo.regular_url,
        photographer_name: photo.photographer_name,
        photographer_url: photo.photographer_url,
        article_id: articleId,
      })
      const imgs = await apiGetAuth(`images?entity_type=article&entity_id=${articleId}`).catch(() => [])
      setArticleImages(Array.isArray(imgs) ? imgs : [])
      setPhotoTab('uploaded')
    } catch (err) {
      setError(err.message || 'Download failed')
    } finally {
      setUnsplashDownloading(null)
    }
  }

  const saveIndicator = saveStatus === 'creating'
    ? <span className="flex items-center gap-1.5 text-xs text-stone-400"><Loader2 size={11} className="animate-spin" /> Creating…</span>
    : saveStatus === 'saving'
    ? <span className="flex items-center gap-1.5 text-xs text-stone-500"><Loader2 size={11} className="animate-spin" /> Saving…</span>
    : saveStatus === 'saved'
    ? <span className="flex items-center gap-1.5 text-xs text-[#00E676]/80"><CheckCircle2 size={11} /> Saved</span>
    : <span className="flex items-center gap-1.5 text-xs text-red-400"><X size={11} /> Error</span>

  return (
    <div className="min-h-full">
      <AdminPageHeader title="Write Article" action={saveIndicator} />

      <div className="max-w-3xl mx-auto px-8 py-6 flex flex-col gap-6">
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            <X size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!articleId && !error && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-stone-400" size={28} />
          </div>
        )}

        {articleId && (
          <>
            {/* Article Info */}
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
                    className={inputCls + ' text-base font-semibold'}
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
                <SubtitleStylePicker
                  value={fields.subtitle_style}
                  onChange={v => updateField('subtitle_style', v)}
                />

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

            {/* Body */}
            <section className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-50">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Story Body</p>
              </div>
              <div className="p-5">
                <RichTextEditor
                  ref={editorRef}
                  content={fields.body}
                  onChange={html => updateField('body', html)}
                  onInsertImageRequest={() => photosRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  readTime={fields.read_time}
                />
              </div>
            </section>

            {/* Photos */}
            <section ref={photosRef} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-50 flex items-center justify-between">
                <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-0.5">
                  {['uploaded', 'unsplash'].map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setPhotoTab(tab)}
                      className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wide transition-colors ${
                        photoTab === tab ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      {tab === 'uploaded' ? `Uploaded${articleImages.length ? ` (${articleImages.length})` : ''}` : 'Unsplash'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 flex flex-col gap-4">
                {/* Unsplash tab */}
                {photoTab === 'unsplash' && (
                  <div className="flex flex-col gap-3">
                    <form onSubmit={e => { e.preventDefault(); searchUnsplash(unsplashQuery) }} className="flex gap-2">
                      <div className="relative flex-1">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          type="text"
                          value={unsplashQuery}
                          onChange={e => setUnsplashQuery(e.target.value)}
                          placeholder="Search Unsplash… e.g. Kandy temple"
                          className="w-full pl-8 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00E676]/40 focus:border-[#00E676]"
                        />
                      </div>
                      <button type="submit" className="px-4 py-2 bg-stone-950 text-white text-xs font-bold rounded-xl hover:bg-stone-700 transition-colors">
                        Search
                      </button>
                    </form>

                    {unsplashLoading && (
                      <div className="flex justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-stone-400" />
                      </div>
                    )}

                    {!unsplashLoading && unsplashResults.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {unsplashResults.map(photo => (
                          <div
                            key={photo.id}
                            className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-stone-100 cursor-pointer"
                            onClick={() => downloadUnsplashPhoto(photo)}
                          >
                            <img src={photo.thumb_url} alt={photo.photographer_name} className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              {unsplashDownloading === photo.id
                                ? <Loader2 size={20} className="animate-spin text-white" />
                                : <span className="text-white text-[10px] font-bold">+ Add to article</span>
                              }
                            </div>
                            <a
                              href={`${photo.photographer_url}?utm_source=travel_times&utm_medium=referral`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="absolute bottom-1 left-1 text-[9px] text-white/60 hover:text-white/90 truncate max-w-[90%]"
                            >
                              {photo.photographer_name}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {!unsplashLoading && unsplashResults.length === 0 && unsplashQuery && (
                      <p className="text-xs text-stone-400 text-center py-6">No results. Try a different search.</p>
                    )}
                    {!unsplashLoading && unsplashResults.length === 0 && !unsplashQuery && (
                      <p className="text-xs text-stone-400 text-center py-6">Search for photos to add to this article.</p>
                    )}
                  </div>
                )}

                {/* Uploaded photo grid */}
                {photoTab === 'uploaded' && articleImages.length > 0 && (
                  <div>
                    <p className="text-[10px] text-stone-400 mb-3">Click a photo to insert it into the editor</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {articleImages.map(img => {
                        const isCover = fields.cover_image === img.url
                        return (
                          <div key={img.id} className="flex flex-col gap-1.5">
                            <div
                              className={`group relative rounded-xl overflow-hidden aspect-[4/3] border-2 transition-all ${
                                isCover
                                  ? 'border-[#FFD600] shadow-lg shadow-[#FFD600]/20'
                                  : 'border-stone-100 hover:border-stone-300'
                              }`}
                            >
                              <img src={img.url} alt={img.alt_text || ''} className="w-full h-full object-cover" loading="lazy" />
                              {isCover && (
                                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-[#FFD600] rounded-full px-2 py-0.5">
                                  <Star size={8} className="text-stone-900 fill-stone-900" />
                                  <span className="text-[8px] font-black text-stone-900 tracking-wide">COVER</span>
                                </div>
                              )}
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
                                  onClick={() => handleInsertImage(img)}
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
                            <input
                              type="text"
                              value={img.caption || ''}
                              onChange={e => handleCaptionChange(img.id, e.target.value)}
                              placeholder="Add a caption…"
                              className="w-full text-[11px] bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-600 placeholder-stone-300 focus:outline-none focus:ring-1 focus:ring-[#00E676]/50 focus:border-[#00E676]"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Drop zone */}
                {photoTab === 'uploaded' && (
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                    onDragEnter={e => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files) }}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-10 transition-all cursor-pointer select-none ${
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
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
