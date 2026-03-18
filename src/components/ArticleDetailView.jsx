import { useMemo } from 'react'
import { Layers, Flame, Compass } from 'lucide-react'
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

const PLATE_THEMES = [
  { bg: 'bg-white', border: 'border-stone-100', Icon: Layers, iconClass: 'text-[#00E676]', labelClass: 'text-stone-500', altClass: 'text-stone-400' },
  { bg: 'bg-gradient-to-br from-amber-50 to-white', border: 'border-amber-100', Icon: Flame, iconClass: 'text-[#FFD600]', labelClass: 'text-stone-500', altClass: 'text-stone-400' },
  { bg: 'bg-gradient-to-br from-stone-950 via-stone-900 to-black', border: 'border-stone-800', Icon: Compass, iconClass: 'text-[#00E676]', labelClass: 'text-stone-400', altClass: 'text-stone-500' },
]

const PLATE_LABELS = ['On Location', 'Field Notes', 'The Frame']

function ImagePlate({ image, index }) {
  const theme = PLATE_THEMES[index % PLATE_THEMES.length]
  const { Icon } = theme
  return (
    <div className={`${theme.bg} border ${theme.border} rounded-3xl p-3 shadow-2xl my-10 mx-auto max-w-3xl`}>
      <img
        src={image.url}
        alt={image.alt_text || ''}
        loading="lazy"
        className="w-full aspect-[16/10] object-cover rounded-2xl"
      />
      {image.caption && (
        <p className={`px-4 pt-3 pb-1 text-sm font-serif italic leading-snug ${theme.labelClass}`}>
          {image.caption}
        </p>
      )}
      <div className={`px-4 py-3 flex items-center gap-2 ${theme.labelClass}`}>
        <Icon size={14} className={theme.iconClass} />
        <span className="text-[9px] font-black uppercase tracking-[0.25em]">{PLATE_LABELS[index % PLATE_LABELS.length]}</span>
        {image.alt_text && !image.caption && (
          <span className={`text-[9px] ml-auto ${theme.altClass}`}>{image.alt_text}</span>
        )}
      </div>
    </div>
  )
}

function PullQuote({ text }) {
  return (
    <blockquote className="relative max-w-3xl mx-auto my-10 pl-8 border-l-4 border-[#00E676] bg-white shadow-lg rounded-r-2xl p-6 md:p-8">
      <span className="absolute top-2 right-6 text-8xl text-stone-100 font-serif leading-none select-none">"</span>
      <p className="text-xl md:text-2xl font-serif italic leading-relaxed text-stone-800 relative z-10">{text}</p>
    </blockquote>
  )
}

function BodyParagraph({ text, isFirst }) {
  if (!text.trim()) return null
  if (isFirst) {
    const first = text[0]
    const rest = text.slice(1)
    return (
      <p className="relative pl-6 text-base md:text-lg leading-[1.9] font-serif mb-8 text-stone-800 max-w-3xl mx-auto">
        <span className="absolute left-0 top-0 w-1 h-24 bg-gradient-to-b from-[#FF3D00] via-[#FFD600] to-[#00E676] rounded-full" />
        <span className="float-left text-7xl font-black leading-[0.8] mr-2 mt-1 text-stone-950">{first}</span>
        {rest}
      </p>
    )
  }
  return (
    <p className="text-base md:text-lg leading-[1.9] font-serif mb-8 text-stone-800 max-w-3xl mx-auto">{text}</p>
  )
}

export default function ArticleDetailView({ article }) {
  const tags = useMemo(() => parseTags(article?.tags), [article?.tags])
  const segments = useMemo(() => parseBodySegments(article?.body, article?.images), [article?.body, article?.images])

  if (!article) return null

  // Track paragraph count for drop cap (only first paragraph of first text segment)
  let firstParagraphDone = false
  let imageCount = 0

  return (
    <article className="bg-[#FDFDFB] min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative w-full aspect-[4/3] md:aspect-[21/9] overflow-hidden md:mx-6 md:w-[calc(100%-3rem)] md:rounded-[48px]">
        {article.cover_image
          ? <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" fetchPriority="high" />
          : <div className="w-full h-full bg-gradient-to-br from-stone-900 to-stone-950" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />

        {/* Category badge */}
        {article.category && (
          <div className="absolute top-6 left-6">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-950 bg-[#00E676] px-3 py-1.5 rounded-full">
              {article.category}
            </span>
          </div>
        )}
        {article.read_time && (
          <div className="absolute top-6 right-6">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white border border-white/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
              {article.read_time} min read
            </span>
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-14">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter italic leading-[0.9] text-white drop-shadow-2xl mb-4">
            {article.title || 'Untitled'}
          </h1>
          {article.subtitle && (
            <p className={subtitleClasses(article.subtitle_style, 'hero')}>
              {article.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Metadata bar ──────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-4">
          {article.author_name && (
            <div className="flex items-center gap-3 bg-white border border-stone-200 px-5 py-3 rounded-2xl shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00E676] to-[#00C853] flex items-center justify-center">
                <span className="text-[10px] font-black text-stone-950">
                  {article.author_name.charAt(0)}
                </span>
              </div>
              <span className="text-xs font-bold text-stone-700">{article.author_name}</span>
            </div>
          )}
          {article.published_at && (
            <div className="flex items-center gap-2 bg-white border border-stone-200 px-5 py-3 rounded-2xl shadow-sm text-xs text-stone-600">
              {formatDate(article.published_at)}
            </div>
          )}
          {tags.length > 0 && tags.slice(0, 3).map(tag => (
            <div key={tag} className="flex items-center bg-stone-100 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">
              #{tag}
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="px-6 pb-24">
        {segments.length === 0 && (
          <p className="text-stone-400 italic text-center py-16">No content yet.</p>
        )}
        {segments.map((seg, segIdx) => {
          if (seg.type === 'image') {
            const plate = <ImagePlate key={segIdx} image={seg.image} index={imageCount} />
            imageCount++
            return plate
          }

          // Text segment — split into paragraphs
          const paragraphs = seg.content.split(/\n\n+/).filter(p => p.trim())
          if (paragraphs.length === 0) {
            const lines = seg.content.split('\n').filter(l => l.trim())
            if (lines.length === 0) return null
            // Treat whole segment as one paragraph
            const isPullQuote = seg.content.trim().startsWith('"') && seg.content.trim().endsWith('"')
            if (isPullQuote) return <PullQuote key={segIdx} text={seg.content.trim()} />
            const isFirst = !firstParagraphDone
            firstParagraphDone = true
            return <BodyParagraph key={segIdx} text={seg.content} isFirst={isFirst} />
          }

          return paragraphs.map((para, paraIdx) => {
            const trimmed = para.trim()
            const isPullQuote = trimmed.startsWith('"') && trimmed.endsWith('"')
            if (isPullQuote) return <PullQuote key={`${segIdx}-${paraIdx}`} text={trimmed} />
            const isFirst = !firstParagraphDone
            if (!firstParagraphDone) firstParagraphDone = true
            return <BodyParagraph key={`${segIdx}-${paraIdx}`} text={trimmed} isFirst={isFirst} />
          })
        })}
      </div>
    </article>
  )
}
