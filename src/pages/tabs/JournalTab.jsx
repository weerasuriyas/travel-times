import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { getAllEvents } from '../../data/destinations';
import EventDateBadge from '../../components/ui/EventDateBadge';

const JournalTab = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');

  const eventsWithArticles = useMemo(() => {
    return getAllEvents().filter(event => event.article);
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(eventsWithArticles.map(e => e.article.category));
    return ['All', ...Array.from(cats)];
  }, [eventsWithArticles]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'All') return eventsWithArticles;
    return eventsWithArticles.filter(e => e.article.category === activeFilter);
  }, [eventsWithArticles, activeFilter]);

  return (
    <div>
      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
              activeFilter === cat
                ? 'bg-black text-white shadow-lg scale-105'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:scale-105 active:scale-95'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event, i) => (
            <div
              key={`${event.slug}-${i}`}
              onClick={() => navigate(`/event/${event.slug}`)}
              className="group cursor-pointer bg-white rounded-[32px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-stone-100"
            >
              {/* Hero Image */}
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={event.image}
                  loading="lazy"
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                  alt={event.article.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3">
                  <EventDateBadge event={event} />
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 flex items-center gap-1">
                    <MapPin size={10} />
                    {event.destination.name}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF3D00] bg-[#FF3D00]/10 px-2 py-0.5 rounded-full">
                    {event.article.category}
                  </span>
                  {event.article.readTime && (
                    <span className="text-[9px] font-bold text-stone-400 flex items-center gap-1">
                      <Clock size={10} />
                      {event.article.readTime} min read
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight italic leading-tight mb-2">
                  {event.article.title}
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                  {event.article.subtitle || event.description}
                </p>
                <div className="mt-4 flex items-center text-[10px] font-black uppercase tracking-widest text-[#00E676] group-hover:underline">
                  <span>Read Story</span>
                  <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="inline-block bg-stone-100 rounded-[32px] px-12 py-10">
            <p className="text-2xl font-black uppercase tracking-tight italic text-stone-300 mb-2">No stories yet</p>
            <p className="text-sm text-stone-400">Check back soon for new stories in this category.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalTab;
