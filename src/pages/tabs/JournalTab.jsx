import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import { apiGet } from '../../lib/api';

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const JournalTab = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    apiGet('articles?status=published')
      .then(data => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(articles.map(a => a.category).filter(Boolean)))];

  const filtered = activeFilter === 'All'
    ? articles
    : articles.filter(a => a.category === activeFilter);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                activeFilter === cat
                  ? 'bg-black text-white shadow-lg scale-105'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:scale-105'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(article => (
            <div
              key={article.id}
              onClick={() => navigate(`/article/${article.slug}`)}
              className="group cursor-pointer bg-white rounded-[32px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-stone-100"
            >
              <div className="aspect-[4/3] overflow-hidden relative bg-stone-100">
                {article.cover_image
                  ? <img src={article.cover_image} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt={article.title} />
                  : <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-950" />
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  {article.category && (
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF3D00] bg-[#FF3D00]/10 px-2 py-0.5 rounded-full">
                      {article.category}
                    </span>
                  )}
                  {article.read_time && (
                    <span className="text-[9px] font-bold text-stone-400 flex items-center gap-1">
                      <Clock size={10} />{article.read_time} min
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight italic leading-tight mb-2">
                  {article.title}
                </h4>
                {article.subtitle && (
                  <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">{article.subtitle}</p>
                )}
                <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-stone-400">{formatDate(article.published_at)}</span>
                  <span className="text-[#00E676] group-hover:underline flex items-center gap-1">
                    Read <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="inline-block bg-stone-100 rounded-[32px] px-12 py-10">
            <p className="text-2xl font-black uppercase tracking-tight italic text-stone-300 mb-2">No stories yet</p>
            <p className="text-sm text-stone-400">Published articles will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalTab;
