'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Check, CheckCircle2, Crop, Eye, ImagePlus, Loader2, Monitor, PencilLine, Pin,
  Search, Smartphone, Star, Trash2, TriangleAlert, Upload, X,
} from 'lucide-react'
import { apiDelete, apiGet, apiGetAuth, apiPatch, apiPost, apiUploadImage } from '../lib/api'
import { subtitleFontCss, SUBTITLE_PRESETS, BODY_FONT_OPTIONS, bodyFontCss } from '../lib/articleStyles'
import RichTextEditor from '../components/RichTextEditor'
import PhotoEditor from '../components/PhotoEditor'

const SAVE_DEBOUNCE_MS = 800

const STATUS_STAMP = {
  draft:     { label: 'Draft',     hint: 'Hidden from the website',  cls: 'bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-300' },
  published: { label: 'Published', hint: 'Live on the website',      cls: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300' },
  archived:  { label: 'Archived',  hint: 'Hidden from the website',  cls: 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300' },
}

const BTN = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-base font-semibold transition-colors disabled:opacity-50 whitespace-nowrap'
const BTN_QUIET = `${BTN} border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700`
const BTN_PUBLISH = `${BTN} bg-emerald-600 text-white hover:bg-emerald-700`
const SMALL_BTN = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-2.5 py-2 text-sm font-semibold text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700'
const INPUT_CLS = 'w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-500 px-3 py-2.5 text-base'
const LABEL_CLS = 'mb-1 block text-sm font-semibold text-stone-700 dark:text-stone-300'

function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try { const parsed = JSON.parse(tags); if (Array.isArray(parsed)) return parsed } catch { /* not JSON, fall through */ }
  return String(tags).split(',').map(t => t.trim()).filter(Boolean)
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Uploaded articles arrive as plain text. The editor works on formatted
// text, so turn blank-line-separated paragraphs (and the few markdown marks
// the upload tool produces) into paragraphs and headings before editing.
// Without this, every paragraph break would be lost on first save.
function plainTextToHtml(text, images) {
  const byId = Object.fromEntries((images || []).map(img => [String(img.id), img]))
  const inline = s => escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => {
      const marker = block.match(/^\[\[image:(\d+)\]\]$/)
      if (marker) {
        const img = byId[marker[1]]
        return img ? `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt_text || '')}" data-image-id="${img.id}">` : ''
      }
      const heading = block.match(/^(#{1,6})\s+(.*)$/)
      if (heading && !block.includes('\n')) return `<${heading[1].length <= 2 ? 'h2' : 'h3'}>${inline(heading[2])}</${heading[1].length <= 2 ? 'h2' : 'h3'}>`
      if (block.startsWith('> ')) return `<blockquote><p>${inline(block.replace(/^> ?/gm, '')).replace(/\n/g, '<br>')}</p></blockquote>`
      return `<p>${inline(block).replace(/\n/g, '<br>')}</p>`
    })
    .join('')
}

function Panel({ title, children, action }) {
  return (
    <section className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-stone-200 dark:border-stone-700">
        <h2 className="admin-title text-lg font-semibold text-stone-900 dark:text-stone-100">{title}</h2>
        {action}
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className={LABEL_CLS}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-sm text-stone-600 dark:text-stone-400">{hint}</span>}
    </label>
  )
}

export default function AdminArticleEditor() {
  const { id } = useParams()
  const router = useRouter()

  const [article, setArticle] = useState(null)
  const [articleImages, setArticleImages] = useState([])
  const [destinations, setDestinations] = useState([])
  const [mode, setMode] = useState('write')            // 'write' | 'preview'
  const [previewDevice, setPreviewDevice] = useState('computer')
  const [previewVersion, setPreviewVersion] = useState(0)
  const [fields, setFields] = useState({
    title: '', subtitle: '', body: '', category: '', tags: '',
    author_name: '', status: 'draft', destination_id: '', cover_image: '',
    read_time: 1, article_type: 'story', subtitle_style: 'serif-italic', body_font: 'serif',
  })
  const [isFeatured, setIsFeatured] = useState(false)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingImage, setEditingImage] = useState(null)
  const [unsplashQuery, setUnsplashQuery] = useState('')
  const [unsplashResults, setUnsplashResults] = useState(null)
  const [unsplashLoading, setUnsplashLoading] = useState(false)
  const [unsplashDownloading, setUnsplashDownloading] = useState(null)

  const debounceRef = useRef(null)
  const captionDebounceRef = useRef({})
  const fieldsRef = useRef(fields)
  const dirtyRef = useRef(false)
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)
  const photosRef = useRef(null)

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

  useEffect(() => {
    const captionTimers = captionDebounceRef.current
    return () => {
      clearTimeout(debounceRef.current)
      Object.values(captionTimers).forEach(clearTimeout)
    }
  }, [])

  const reloadImages = useCallback(async () => {
    const imgs = await apiGetAuth(`images?entity_type=article&entity_id=${id}`).catch(() => [])
    const list = Array.isArray(imgs) ? imgs : []
    setArticleImages(list)
    return list
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const [data, imgs] = await Promise.all([
          apiGetAuth(`articles/${id}`),
          apiGetAuth(`images?entity_type=article&entity_id=${id}`).catch(() => []),
        ])
        if (cancelled) return
        const images = Array.isArray(imgs) ? imgs : []
        const rawBody = data.body || ''
        const loaded = {
          title: data.title || '',
          subtitle: data.subtitle || '',
          body: rawBody && !rawBody.trimStart().startsWith('<') ? plainTextToHtml(rawBody, images) : rawBody,
          category: data.category || '',
          tags: parseTags(data.tags).join(', '),
          author_name: data.author_name || '',
          status: data.status || 'draft',
          destination_id: data.destination_id ?? '',
          cover_image: data.cover_image ?? '',
          read_time: Number(data.read_time) || 1,
          article_type: data.article_type || 'story',
          subtitle_style: data.subtitle_style || 'serif-italic',
          body_font: data.body_font || 'serif',
        }
        setArticle(data)
        setArticleImages(images)
        setFields(loaded)
        fieldsRef.current = loaded
        setIsFeatured(!!data.is_featured)
      } catch (err) {
        if (!cancelled) setError(err.message || 'This article could not be opened.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    apiGet('destinations').then(d => setDestinations(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  // Saves whatever is waiting, straight away. Resolves true when the
  // server has everything.
  const saveNow = useCallback(async () => {
    clearTimeout(debounceRef.current)
    if (!dirtyRef.current) return true
    dirtyRef.current = false
    setSaveStatus('saving')
    try {
      await apiPatch(`articles/${id}`, fieldsRef.current)
      if (!dirtyRef.current) setSaveStatus('saved')
      return true
    } catch (err) {
      dirtyRef.current = true
      setSaveStatus('error')
      setError(`Your changes could not be saved. ${err.message || ''} Check your internet connection; the page will try again when you next type.`)
      return false
    }
  }, [id])

  const updateFields = useCallback((changes) => {
    const next = { ...fieldsRef.current, ...changes }
    if ('body' in changes) {
      const words = next.body.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length
      next.read_time = Math.max(1, Math.ceil(words / 200))
    }
    setFields(next)
    fieldsRef.current = next
    dirtyRef.current = true
    setSaveStatus('saving')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(saveNow, SAVE_DEBOUNCE_MS)
  }, [saveNow])

  const updateField = (key, value) => updateFields({ [key]: value })

  const changeStatus = async (status) => {
    const title = fieldsRef.current.title.trim()
    if (status === 'published') {
      if (!title) { setError('Give the article a title before publishing it.'); return }
      if (!window.confirm(`Publish “${title}”?\n\nIt will appear on the website straight away.`)) return
    }
    const previous = fieldsRef.current.status
    setError('')
    setNotice(null)
    updateFields({ status })
    if (await saveNow()) {
      setNotice({ status })
      setPreviewVersion(v => v + 1)
    } else {
      updateFields({ status: previous })
    }
  }

  const showPreview = async () => {
    setMode('preview')
    await saveNow()
    setPreviewVersion(v => v + 1)
  }

  const goBack = async () => {
    await saveNow()
    router.push('/admin')
  }

  // ── Photos ────────────────────────────────────────────────────────────────

  const handleInsertImage = (img) => {
    editorRef.current?.insertImage({ src: img.url, alt: img.alt_text || '', 'data-image-id': String(img.id) })
  }

  const handleFiles = async (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setUploading(true)
    setError('')
    try {
      await Promise.all(arr.map(f => apiUploadImage(f, 'article', id)))
      const list = await reloadImages()
      // A first photo becomes the cover, so the article is never left without one
      if (!fieldsRef.current.cover_image && list.length) updateFields({ cover_image: list[0].url })
    } catch (err) {
      setError(`The photo could not be added. ${err.message || ''} Photos must be JPG, PNG or WEBP and under 10 MB.`)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (img) => {
    if (!window.confirm('Delete this photo for good?\n\nIt will also be taken out of the article text.')) return
    try {
      await apiDelete(`images/${img.id}`)
      setArticleImages(prev => prev.filter(i => i.id !== img.id))
      const changes = {}
      if (fieldsRef.current.cover_image === img.url) changes.cover_image = ''
      const doc = new DOMParser().parseFromString(fieldsRef.current.body, 'text/html')
      const inText = doc.body.querySelectorAll(`img[data-image-id="${img.id}"]`)
      if (inText.length) {
        inText.forEach(el => el.remove())
        changes.body = doc.body.innerHTML
      }
      if (Object.keys(changes).length) updateFields(changes)
    } catch (err) {
      setError(`The photo could not be deleted. ${err.message || ''}`)
    }
  }

  const handleCaptionChange = useCallback((imgId, caption) => {
    setArticleImages(prev => prev.map(i => i.id === imgId ? { ...i, caption } : i))
    clearTimeout(captionDebounceRef.current[imgId])
    captionDebounceRef.current[imgId] = setTimeout(() => {
      apiPatch(`images/${imgId}`, { caption }).catch(() => {})
    }, 600)
  }, [])

  // Upload the edited copy and use it everywhere the original was used.
  const handlePhotoEdited = async (blob) => {
    const original = editingImage
    const file = new File([blob], 'edited.jpg', { type: 'image/jpeg' })
    const created = await apiUploadImage(file, 'article', id, 'gallery', original.alt_text || '')
    if (original.caption) await apiPatch(`images/${created.id}`, { caption: original.caption }).catch(() => {})
    await reloadImages()

    const changes = {}
    if (fieldsRef.current.cover_image === original.url) changes.cover_image = created.url
    const doc = new DOMParser().parseFromString(fieldsRef.current.body, 'text/html')
    const inText = doc.body.querySelectorAll(`img[data-image-id="${original.id}"]`)
    if (inText.length) {
      inText.forEach(el => { el.setAttribute('src', created.url); el.setAttribute('data-image-id', String(created.id)) })
      changes.body = doc.body.innerHTML
    }
    if (Object.keys(changes).length) updateFields(changes)
    setEditingImage(null)
  }

  const searchUnsplash = async (q) => {
    if (!q.trim()) return
    setUnsplashLoading(true)
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
    setUnsplashDownloading(photo.id)
    try {
      await apiPost('unsplash/download', {
        id: photo.id,
        regular_url: photo.regular_url,
        photographer_name: photo.photographer_name,
        photographer_url: photo.photographer_url,
        article_id: id,
      })
      await reloadImages()
    } catch (err) {
      setError(`That photo could not be added. ${err.message || ''}`)
    } finally {
      setUnsplashDownloading(null)
    }
  }

  const handleFeatureToggle = async () => {
    const newVal = !isFeatured
    setIsFeatured(newVal)
    try {
      await apiPost(`articles/${id}/feature`, { featured: newVal })
    } catch (err) {
      setIsFeatured(!newVal)
      setError(`Could not change the homepage pin. ${err.message || ''}`)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const stamp = STATUS_STAMP[fields.status] ?? STATUS_STAMP.draft
  const subtitlePreset = SUBTITLE_PRESETS.find(p => p.value === fields.subtitle_style) ?? SUBTITLE_PRESETS[0]

  if (loading) {
    return (
      <div className="admin-ui h-screen flex items-center justify-center gap-3 bg-stone-100 dark:bg-stone-950 text-lg text-stone-600 dark:text-stone-400">
        <Loader2 className="animate-spin" size={24} /> Opening the article…
      </div>
    )
  }

  if (!article) {
    return (
      <div className="admin-ui h-screen flex flex-col items-center justify-center gap-4 px-6 bg-stone-100 dark:bg-stone-950 text-center">
        <p className="text-lg text-stone-800 dark:text-stone-200">{error || 'This article could not be found.'}</p>
        <button onClick={() => router.push('/admin')} className={BTN_QUIET}><ArrowLeft size={18} /> Back to all articles</button>
      </div>
    )
  }

  return (
    <div className="admin-ui h-screen flex flex-col bg-stone-100 dark:bg-stone-950">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex flex-wrap items-center gap-x-4 gap-y-2 px-3 md:px-5 py-2.5 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
        <button onClick={goBack} className={BTN_QUIET}>
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">All articles</span>
        </button>

        <div className="flex items-center gap-3 min-w-0 mr-auto">
          <span className={`flex-shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${stamp.cls}`} title={stamp.hint}>{stamp.label}</span>
          <span aria-live="polite" className="text-sm">
            {saveStatus === 'saving' && <span className="inline-flex items-center gap-1.5 text-stone-600 dark:text-stone-400"><Loader2 size={15} className="animate-spin" /> Saving…</span>}
            {saveStatus === 'saved' && <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400"><CheckCircle2 size={15} /> All changes saved</span>}
            {saveStatus === 'error' && <span className="inline-flex items-center gap-1.5 font-semibold text-red-700 dark:text-red-400"><TriangleAlert size={15} /> Not saved</span>}
          </span>
        </div>

        <div role="tablist" aria-label="Write or preview" className="flex rounded-lg border border-stone-300 dark:border-stone-600 overflow-hidden">
          <button
            role="tab"
            aria-selected={mode === 'write'}
            onClick={() => setMode('write')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-base font-semibold ${mode === 'write' ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'}`}
          >
            <PencilLine size={18} /> Write
          </button>
          <button
            role="tab"
            aria-selected={mode === 'preview'}
            onClick={showPreview}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-base font-semibold ${mode === 'preview' ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'}`}
          >
            <Eye size={18} /> Preview
          </button>
        </div>

        <div className="flex items-center gap-2">
          {fields.status === 'draft' && (
            <button onClick={() => changeStatus('published')} className={BTN_PUBLISH}><Check size={18} /> Publish</button>
          )}
          {fields.status === 'published' && (
            <>
              <a href={`/article/${article.slug}`} target="_blank" rel="noreferrer" className={BTN_QUIET}>View on website</a>
              <button onClick={() => changeStatus('draft')} className={BTN_QUIET}>Unpublish</button>
            </>
          )}
          {fields.status === 'archived' && (
            <button onClick={() => changeStatus('draft')} className={BTN_QUIET}>Move back to Drafts</button>
          )}
        </div>
      </header>

      {(error || notice) && (
        <div className="flex-shrink-0 px-3 md:px-5 pt-3 space-y-2">
          {error && (
            <div role="alert" className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800 px-4 py-3 text-base text-red-800 dark:text-red-300 flex items-start justify-between gap-3">
              <span>{error}</span>
              <button onClick={() => setError('')} aria-label="Dismiss" className="flex-shrink-0 p-1"><X size={18} /></button>
            </div>
          )}
          {notice && (
            <div role="status" className="rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-stone-800 dark:text-stone-200">
              <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
              <p className="flex-1 min-w-48">
                {notice.status === 'published' && <><strong className="font-semibold">Published.</strong> This article is now live on the website.</>}
                {notice.status === 'draft' && <><strong className="font-semibold">Moved to Drafts.</strong> This article is hidden from the website.</>}
              </p>
              {notice.status === 'published' && (
                <a href={`/article/${article.slug}`} target="_blank" rel="noreferrer" className="font-semibold underline">View on website</a>
              )}
              <button onClick={() => setNotice(null)} aria-label="Dismiss" className="p-1 text-stone-500"><X size={18} /></button>
            </div>
          )}
        </div>
      )}

      {/* ── Preview ─────────────────────────────────────────────────────── */}
      {mode === 'preview' && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-shrink-0 flex flex-wrap items-center gap-3 px-3 md:px-5 py-3">
            <p className="text-base text-stone-700 dark:text-stone-300 mr-auto">
              {fields.status === 'published'
                ? 'This is the article as readers see it on the website.'
                : 'This is how the article will look on the website once you publish it.'}
            </p>
            <div role="group" aria-label="Screen size" className="flex rounded-lg border border-stone-300 dark:border-stone-600 overflow-hidden">
              {[{ key: 'computer', label: 'Computer', Icon: Monitor }, { key: 'phone', label: 'Phone', Icon: Smartphone }].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  aria-pressed={previewDevice === key}
                  onClick={() => setPreviewDevice(key)}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-base font-semibold ${previewDevice === key ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200'}`}
                >
                  <Icon size={18} /> {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-0 px-3 md:px-5 pb-4 flex justify-center">
            {saveStatus === 'saving' ? (
              <div className="flex items-center gap-3 text-lg text-stone-600 dark:text-stone-400"><Loader2 size={22} className="animate-spin" /> Getting the preview ready…</div>
            ) : (
              <iframe
                key={previewVersion}
                title="Article preview"
                src={`/admin/articles/${id}/preview?embed=1`}
                className={`h-full bg-white rounded-xl border border-stone-300 dark:border-stone-600 shadow-sm ${previewDevice === 'phone' ? 'w-[390px] max-w-full' : 'w-full'}`}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Write ───────────────────────────────────────────────────────── */}
      <div className={`flex-1 min-h-0 flex-col lg:flex-row overflow-y-auto lg:overflow-hidden ${mode === 'write' ? 'flex' : 'hidden'}`}>

        {/* The article itself */}
        <div className="lg:flex-1 lg:min-w-0 lg:overflow-y-auto">
          <div className="max-w-3xl mx-auto px-3 md:px-6 py-5 space-y-4">
            <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 md:p-5 space-y-4">
              <Field label="Title">
                <input
                  value={fields.title}
                  onChange={e => updateField('title', e.target.value)}
                  placeholder="The headline of your article"
                  className={`${INPUT_CLS} admin-title text-2xl font-semibold`}
                />
              </Field>
              <Field label="Subtitle" hint="One or two lines shown under the headline.">
                <input
                  value={fields.subtitle}
                  onChange={e => updateField('subtitle', e.target.value)}
                  style={subtitleFontCss(fields.subtitle_style) ? { fontFamily: subtitleFontCss(fields.subtitle_style) } : undefined}
                  className={`${INPUT_CLS} text-lg`}
                />
              </Field>
            </div>

            <RichTextEditor
              ref={editorRef}
              content={fields.body}
              onChange={html => updateField('body', html)}
              onInsertImageRequest={() => photosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              onEditImageRequest={imageId => {
                const img = articleImages.find(i => String(i.id) === String(imageId))
                if (img) setEditingImage(img)
              }}
              readTime={fields.read_time}
              bodyFont={bodyFontCss(fields.body_font)}
            />
          </div>
        </div>

        {/* Photos, look and details */}
        <aside className="lg:w-[26rem] lg:flex-shrink-0 lg:overflow-y-auto lg:border-l border-stone-200 dark:border-stone-700 px-3 md:px-6 lg:px-4 py-5 space-y-4">

          <div ref={photosRef}>
            <Panel
              title={articleImages.length === 1 ? 'Photos (1)' : `Photos (${articleImages.length})`}
              action={
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className={SMALL_BTN}>
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploading ? 'Adding…' : 'Add photos'}
                </button>
              }
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
              />

              {articleImages.length === 0 ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files) }}
                  className={`w-full rounded-lg border-2 border-dashed px-4 py-8 text-center text-base ${isDragOver ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'border-stone-300 dark:border-stone-600'} text-stone-700 dark:text-stone-300`}
                >
                  <ImagePlus size={28} className="mx-auto mb-2 text-stone-500" />
                  <span className="font-semibold">This article has no photos yet.</span><br />
                  Press here to choose photos from your computer, or drag them in.
                </button>
              ) : (
                <ul
                  className="space-y-4"
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files) }}
                >
                  {articleImages.map(img => {
                    const inText = fields.body.includes(`data-image-id="${img.id}"`)
                    const isCover = fields.cover_image === img.url
                    return (
                      <li key={img.id} className={`rounded-lg border-2 p-2 ${isCover ? 'border-amber-500' : 'border-stone-200 dark:border-stone-700'}`}>
                        <div className="relative">
                          <img src={img.url} alt={img.alt_text || ''} loading="lazy" className="w-full aspect-[16/10] object-cover rounded-md bg-stone-100 dark:bg-stone-800" />
                          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                            {isCover && <span className="inline-flex items-center gap-1 rounded bg-amber-500 px-2 py-0.5 text-sm font-semibold text-stone-950"><Star size={13} className="fill-stone-950" /> Cover photo</span>}
                            {inText && <span className="rounded bg-stone-950/80 px-2 py-0.5 text-sm font-semibold text-white">In the text</span>}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button type="button" aria-pressed={isCover} onClick={() => updateField('cover_image', isCover ? '' : img.url)} className={SMALL_BTN}>
                            <Star size={16} /> {isCover ? 'Remove as cover' : 'Use as cover'}
                          </button>
                          <button type="button" onClick={() => handleInsertImage(img)} className={SMALL_BTN}>
                            <ImagePlus size={16} /> Add to text
                          </button>
                          <button type="button" onClick={() => setEditingImage(img)} className={SMALL_BTN}>
                            <Crop size={16} /> Crop or turn
                          </button>
                          <button type="button" onClick={() => handleDeleteImage(img)} className={`${SMALL_BTN} !text-red-700 dark:!text-red-400`}>
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                        <input
                          type="text"
                          value={img.caption || ''}
                          onChange={e => handleCaptionChange(img.id, e.target.value)}
                          aria-label="Caption for this photo"
                          placeholder="Caption (shown under the photo)"
                          className={`${INPUT_CLS} mt-2 !py-2 !text-sm`}
                        />
                      </li>
                    )
                  })}
                </ul>
              )}

              {articleImages.length > 0 && (
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  “Add to text” places the photo where your cursor is in the article. The cover photo is the large picture at the top.
                </p>
              )}

              <details className="rounded-lg border border-stone-200 dark:border-stone-700">
                <summary className="cursor-pointer px-3 py-2.5 text-base font-semibold text-stone-800 dark:text-stone-200">Find a free photo online</summary>
                <div className="px-3 pb-3 space-y-3">
                  <form onSubmit={e => { e.preventDefault(); searchUnsplash(unsplashQuery) }} className="flex gap-2">
                    <input
                      type="search"
                      value={unsplashQuery}
                      onChange={e => setUnsplashQuery(e.target.value)}
                      aria-label="Search free photos"
                      placeholder="For example: Kandy temple"
                      className={INPUT_CLS}
                    />
                    <button type="submit" className={SMALL_BTN}><Search size={16} /> Search</button>
                  </form>
                  {unsplashLoading && <div className="flex justify-center py-4"><Loader2 size={22} className="animate-spin text-stone-500" /></div>}
                  {!unsplashLoading && unsplashResults?.length === 0 && (
                    <p className="text-sm text-stone-600 dark:text-stone-400">No photos found. Try different words.</p>
                  )}
                  {!unsplashLoading && unsplashResults?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {unsplashResults.map(photo => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => downloadUnsplashPhoto(photo)}
                          disabled={unsplashDownloading !== null}
                          className="relative rounded-lg overflow-hidden aspect-[4/3] bg-stone-100 dark:bg-stone-800 text-left"
                        >
                          <img src={photo.thumb_url} alt={`Photo by ${photo.photographer_name}`} className="w-full h-full object-cover" loading="lazy" />
                          <span className="absolute inset-x-0 bottom-0 bg-stone-950/75 px-2 py-1 text-sm font-semibold text-white">
                            {unsplashDownloading === photo.id ? 'Adding…' : 'Add this photo'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            </Panel>
          </div>

          <Panel title="Fonts">
            <Field label="Font for the article text">
              <select value={fields.body_font} onChange={e => updateField('body_font', e.target.value)} style={{ fontFamily: bodyFontCss(fields.body_font) }} className={INPUT_CLS}>
                {BODY_FONT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ fontFamily: o.css }}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Style for the subtitle">
              <select value={fields.subtitle_style} onChange={e => updateField('subtitle_style', e.target.value)} style={subtitlePreset.css ? { fontFamily: subtitlePreset.css } : undefined} className={INPUT_CLS}>
                {SUBTITLE_PRESETS.map(p => <option key={p.value} value={p.value} style={p.css ? { fontFamily: p.css } : undefined}>{p.label}</option>)}
              </select>
            </Field>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              To change only a few words, select them in the article and use the bar above the text.
            </p>
          </Panel>

          <Panel title="Details">
            <Field label="Author">
              <input value={fields.author_name} onChange={e => updateField('author_name', e.target.value)} className={INPUT_CLS} />
            </Field>
            <Field label="Destination" hint="The place this article is about.">
              <select value={fields.destination_id ?? ''} onChange={e => updateField('destination_id', e.target.value || null)} className={INPUT_CLS}>
                <option value="">No destination</option>
                {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <input value={fields.category} onChange={e => updateField('category', e.target.value)} placeholder="For example: Culture" className={INPUT_CLS} />
            </Field>
            <Field label="Tags" hint="Separate tags with commas.">
              <input value={fields.tags} onChange={e => updateField('tags', e.target.value)} placeholder="kandy, history, festival" className={INPUT_CLS} />
            </Field>
            <div>
              <span className={LABEL_CLS}>Type</span>
              <div className="flex rounded-lg overflow-hidden border border-stone-300 dark:border-stone-600">
                {['story', 'event'].map(type => (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={fields.article_type === type}
                    onClick={() => updateField('article_type', type)}
                    className={`flex-1 py-2.5 text-base font-semibold ${fields.article_type === type ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'}`}
                  >
                    {type === 'story' ? 'Story' : 'Event'}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              aria-pressed={isFeatured}
              onClick={handleFeatureToggle}
              className={`w-full flex items-start gap-3 rounded-lg border-2 px-3 py-3 text-left ${isFeatured ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'border-stone-300 dark:border-stone-600'}`}
            >
              <Pin size={20} className={`mt-0.5 flex-shrink-0 ${isFeatured ? 'text-amber-600' : 'text-stone-500'}`} />
              <span>
                <span className="block text-base font-semibold text-stone-900 dark:text-stone-100">{isFeatured ? 'Pinned to the top of the homepage' : 'Pin to the top of the homepage'}</span>
                <span className="block text-sm text-stone-600 dark:text-stone-400">{isFeatured ? 'Press to remove the pin.' : 'Only one article can be pinned at a time.'}</span>
              </span>
            </button>
          </Panel>
        </aside>
      </div>

      {editingImage && (
        <PhotoEditor
          image={editingImage}
          onCancel={() => setEditingImage(null)}
          onSave={handlePhotoEdited}
        />
      )}
    </div>
  )
}
