import { useMemo } from 'react'

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

export default function ArticlePreview({ article }) {
  const tags = useMemo(() => parseTags(article?.tags), [article?.tags])

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
          <p className="text-lg text-stone-600 leading-relaxed mb-6 font-serif italic">
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

        {/* Body */}
        <div className="text-base leading-relaxed text-stone-800 whitespace-pre-wrap font-serif">
          {article.body || <span className="text-stone-300 italic">Article body will appear here…</span>}
        </div>
      </div>
    </div>
  )
}
