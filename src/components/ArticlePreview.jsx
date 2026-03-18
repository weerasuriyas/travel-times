import { useMemo } from 'react'
import { subtitleClasses } from '../lib/articleStyles'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try { const parsed = JSON.parse(tags); if (Array.isArray(parsed)) return parsed } catch {}
  return String(tags).split(',').map(t => t.trim()).filter(Boolean)
}

// Split body text into alternating text/image segments based on [[image:ID]] markers
function parseBodySegments(body, images) {
  if (!body) return []
  if (!images?.length) return [{ type: 'text', content: body }]
  const imageMap = Object.fromEntries(images.map(img => [String(img.id), img]))
  const segments = []
  const regex = /\[\[image:(\d+)\]\]/g
  let lastIndex = 0
  let match
  while ((match = regex.exec(body)) !== null) {
    if (match.index > lastIndex) segments.push({ type: 'text', content: body.slice(lastIndex, match.index) })
    const img = imageMap[match[1]]
    segments.push(img ? { type: 'image', image: img } : { type: 'text', content: match[0] })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < body.length) segments.push({ type: 'text', content: body.slice(lastIndex) })
  return segments
}

export default function ArticlePreview({ article }) {
  const tags = useMemo(() => parseTags(article?.tags), [article?.tags])
  const bodySegments = useMemo(() => parseBodySegments(article?.body, article?.images), [article?.body, article?.images])
  const galleryImages = useMemo(() => {
    if (!article?.images?.length) return []
    const placedIds = new Set()
    const regex = /\[\[image:(\d+)\]\]/g
    let m
    while ((m = regex.exec(article.body || ''))) placedIds.add(m[1])
    return article.images.filter(img => !placedIds.has(String(img.id)))
  }, [article?.images, article?.body])

  if (!article) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400 text-sm">
        No article loaded
      </div>
    )
  }

  return (
    <div className="bg-white h-full overflow-y-auto">
      {/* Hero image */}
      {article.cover_image && (
        <div className="w-full aspect-[16/7] overflow-hidden bg-stone-200">
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Category + tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {article.category && (
            <span className="text-xs font-black uppercase tracking-widest text-[#00E676]">
              {article.category}
            </span>
          )}
          {tags.map(tag => (
            <span key={tag} className="text-xs text-stone-400 uppercase tracking-wider">#{tag}</span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic leading-tight mb-4 text-stone-950">
          {article.title || <span className="text-stone-300">Untitled</span>}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p className={`mb-6 text-stone-600 ${subtitleClasses(article.subtitle_style, 'default')}`}>
            {article.subtitle}
          </p>
        )}

        {/* Meta line */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 uppercase tracking-widest border-t border-b border-stone-200 py-3 mb-8">
          {article.author_name && <span>{article.author_name}</span>}
          {article.published_at && <span>{formatDate(article.published_at)}</span>}
          {article.read_time && <span>{article.read_time} min read</span>}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            article.status === 'published'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {article.status || 'draft'}
          </span>
        </div>

        {/* Body with inline images */}
        <div className="text-base leading-relaxed text-stone-800 font-serif">
          {bodySegments.length === 0
            ? <span className="text-stone-300 italic whitespace-pre-wrap">Article body will appear here…</span>
            : bodySegments.map((seg, i) =>
                seg.type === 'text'
                  ? <span key={i} className="whitespace-pre-wrap">{seg.content}</span>
                  : <img key={i} src={seg.image.url} alt={seg.image.alt_text || ''} className="w-full rounded-lg my-6 block" />
              )
          }
        </div>

        {/* Gallery — only images not placed inline */}
        {galleryImages.length > 0 && (
          <div className="mt-10">
            <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4">Photos</p>
            <div className="grid grid-cols-2 gap-3">
              {galleryImages.map((img, i) => (
                <div key={img.id ?? i} className="rounded-lg overflow-hidden bg-stone-100 aspect-[4/3]">
                  <img src={img.url} alt={img.alt_text || ''} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
