import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SharedHeader } from '../components/UI'
import { useScrolled } from '../hooks/useScrolled'
import { apiGet } from '../lib/api'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function PublicArticlesPage() {
  const navigate = useNavigate()
  const isScrolled = useScrolled(50)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet('articles?status=published')
      .then(data => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [])

  const [hero, ...rest] = articles

  return (
    <div className="min-h-screen bg-[#FDFDFB] dark:bg-stone-950">
      <SharedHeader isScrolled={isScrolled} showTabs={false} />

      <main className="max-w-[1800px] mx-auto px-4 md:px-6 pt-56 md:pt-52 pb-32">
        {/* Page header */}
        <div className="mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00E676]">Field Notes</span>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.9] mt-3 dark:text-white">Stories</h1>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && articles.length === 0 && (
          <div className="text-center py-32 text-stone-400 text-sm uppercase tracking-widest">No stories published yet</div>
        )}

        {!loading && hero && (
          <>
            {/* Hero article */}
            <div
              onClick={() => navigate(`/article/${hero.slug}`)}
              className="group cursor-pointer mb-16 grid md:grid-cols-2 gap-8 items-center"
            >
              <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-stone-100">
                {hero.cover_image
                  ? <img src={hero.cover_image} alt={hero.title} loading="eager" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  : <div className="w-full h-full bg-stone-200 flex items-center justify-center"><span className="text-stone-400 text-xs uppercase tracking-widest">No image</span></div>
                }
              </div>
              <div>
                {hero.category && <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#00E676] mb-3">{hero.category}</p>}
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-tight mb-4 group-hover:text-stone-600 transition-colors">
                  {hero.title}
                </h2>
                {hero.subtitle && <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed mb-4 font-serif italic">{hero.subtitle}</p>}
                <div className="flex items-center gap-3 text-xs text-stone-400 uppercase tracking-widest">
                  {hero.author_name && <span>{hero.author_name}</span>}
                  {hero.published_at && <><span>·</span><span>{formatDate(hero.published_at)}</span></>}
                  {hero.read_time && <><span>·</span><span>{hero.read_time} min read</span></>}
                </div>
              </div>
            </div>

            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rest.map(article => (
                  <div
                    key={article.id}
                    onClick={() => navigate(`/article/${article.slug}`)}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-stone-100 mb-4">
                      {article.cover_image
                        ? <img src={article.cover_image} alt={article.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        : <div className="w-full h-full bg-stone-200" />
                      }
                    </div>
                    {article.category && <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00E676] mb-2">{article.category}</p>}
                    <h3 className="text-xl font-black uppercase tracking-tight italic leading-tight mb-2 group-hover:text-stone-500 transition-colors">{article.title}</h3>
                    {article.subtitle && <p className="text-sm text-stone-500 font-serif italic mb-3 line-clamp-2">{article.subtitle}</p>}
                    <div className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest">
                      {article.author_name && <span>{article.author_name}</span>}
                      {article.published_at && <><span>·</span><span>{formatDate(article.published_at)}</span></>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
