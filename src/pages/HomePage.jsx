import React, { memo, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, MapPin, ChevronRight } from 'lucide-react';
import { SharedHeader, SectionHeader } from '../components/UI';
import { useScrolled } from '../hooks/useScrolled';
import { apiGet } from '../lib/api';
import JournalTab from './tabs/JournalTab';
import MapsTab from './tabs/MapsTab';
import PlanYourTripTab from './tabs/PlanYourTripTab';

const REGION_COLORS = {
  'Western':       'from-sky-900 to-slate-950',
  'Central':       'from-emerald-900 to-stone-950',
  'Southern':      'from-blue-900 to-stone-950',
  'Uva':           'from-amber-900 to-stone-950',
  'North Central': 'from-orange-900 to-stone-950',
  'Eastern':       'from-teal-900 to-stone-950',
  'Northern':      'from-violet-900 to-stone-950',
}

function regionGradient(region) {
  return REGION_COLORS[region] ?? 'from-stone-900 to-stone-950'
}

const HomePage = memo(() => {
  const navigate = useNavigate();
  const isScrolled = useScrolled(50);
  const [activeTab, setActiveTab] = useState('feature');
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [heroArticle, setHeroArticle] = useState(null);
  const [destinations, setDestinations] = useState([]);

  // Fetch latest published article for hero
  useEffect(() => {
    apiGet('articles?status=published')
      .then(data => { if (Array.isArray(data) && data.length) setHeroArticle(data[0]) })
      .catch(() => {})
  }, [])

  // Fetch destinations from DB
  useEffect(() => {
    apiGet('destinations')
      .then(data => setDestinations(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Parallax scroll effect
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = Math.max(0, window.scrollY);
          if (scrollY < 1) { setParallaxOffset(0); ticking = false; return; }
          const isDesktop = window.innerWidth >= 768;
          const headerHeight = isDesktop ? 211 : 131;
          const mainPadding = isDesktop ? 192 : 128;
          const parallaxStart = headerHeight + mainPadding;
          setParallaxOffset(scrollY <= parallaxStart ? 0 : (scrollY - parallaxStart) * 0.5);
          ticking = false;
        });
        ticking = true;
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="animate-in fade-in duration-700">
      <SharedHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isScrolled={isScrolled}
        showTabs={true}
      />

      <main className="max-w-[1800px] mx-auto px-4 md:px-6 pb-24 pt-56 md:pt-52">
        {activeTab === 'feature' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">

            {/* ─── Hero ─────────────────────────────────────────────── */}
            {heroArticle ? (
              <section
                onClick={() => navigate('/article/' + heroArticle.slug)}
                className="relative aspect-[16/9] md:aspect-[21/9] bg-stone-950 overflow-hidden rounded-[40px] mb-16 group cursor-pointer shadow-2xl"
              >
                {heroArticle.cover_image
                  ? <img
                      src={heroArticle.cover_image}
                      className="w-full h-full object-cover"
                      style={{ transform: `translateY(${parallaxOffset}px) scale(1.1)` }}
                      alt={heroArticle.title}
                      fetchPriority="high"
                      loading="eager"
                    />
                  : <div className="w-full h-full bg-gradient-to-br from-stone-900 to-stone-950" />
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {heroArticle.category && (
                  <div className="absolute top-6 left-6 md:top-10 md:left-12">
                    <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] text-stone-950 bg-[#00E676] px-3 py-1.5 rounded-full">
                      {heroArticle.category}
                    </span>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 p-6 md:p-12 lg:p-20 text-white max-w-5xl">
                  <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tighter italic leading-[0.85] mb-4">
                    {heroArticle.title}
                  </h2>
                  {heroArticle.subtitle && (
                    <p className="text-base md:text-xl font-serif italic text-white/70 max-w-2xl leading-relaxed">
                      {heroArticle.subtitle}
                    </p>
                  )}
                </div>

                <button className="absolute bottom-6 right-6 md:bottom-12 md:right-12 lg:bottom-20 lg:right-20 w-14 h-14 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center hover:bg-[#00E676] hover:scale-110 transition-all group shadow-2xl">
                  <ArrowUpRight className="w-6 h-6 md:w-9 md:h-9 text-black group-hover:rotate-45 transition-transform" />
                </button>
              </section>
            ) : (
              <section className="relative aspect-[16/9] md:aspect-[21/9] bg-gradient-to-br from-stone-900 to-stone-950 overflow-hidden rounded-[40px] mb-16 shadow-2xl flex items-end">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E676]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FFD600]/10 rounded-full blur-3xl" />
                <div className="relative z-10 p-6 md:p-12 lg:p-20">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#00E676] mb-4">Sri Lanka Travel Times</p>
                  <h2 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter italic leading-[0.85] text-white">
                    Stories<br />From The<br />Island
                  </h2>
                </div>
              </section>
            )}

            {/* ─── Destinations ─────────────────────────────────────── */}
            {destinations.length > 0 && (
              <section className="mb-24">
                <SectionHeader title="Destinations" subtitle="Explore Sri Lanka" color="#FF3D00" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {destinations.slice(0, 6).map(dest => (
                    <div
                      key={dest.slug}
                      onClick={() => navigate('/destination/' + dest.slug)}
                      className="group cursor-pointer hover-lift"
                    >
                      <div className="aspect-[4/5] overflow-hidden rounded-[32px] mb-5 shadow-xl relative">
                        {dest.hero_image
                          ? <img src={dest.hero_image} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt={dest.name} />
                          : <div className={`w-full h-full bg-gradient-to-br ${regionGradient(dest.region)}`} />
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          {dest.region && (
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 flex items-center gap-1 mb-1">
                              <MapPin size={9} />{dest.region}
                            </span>
                          )}
                          <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic text-white leading-none">
                            {dest.name}
                          </h3>
                          {dest.tagline && <p className="text-xs text-white/60 mt-1">{dest.tagline}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-12 text-center">
                  <button
                    onClick={() => navigate('/destinations')}
                    className="bg-black text-white px-8 py-4 rounded-full text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-[#00E676] hover:text-stone-950 hover:scale-105 transition-all shadow-xl"
                  >
                    View All Destinations
                  </button>
                </div>
              </section>
            )}

            {/* ─── Newsletter CTA ────────────────────────────────────── */}
            <section className="mb-24">
              <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-stone-950 via-stone-900 to-black p-12 md:p-20 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E676] opacity-10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FFD600] opacity-10 rounded-full blur-3xl" />
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                  <div className="inline-block mb-6">
                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-[#00E676] bg-[#00E676]/10 px-4 py-2 rounded-full">
                      Stay Connected
                    </span>
                  </div>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter italic text-white mb-6 leading-[0.9]">
                    Never Miss<br />An Adventure
                  </h2>
                  <p className="text-lg md:text-xl text-stone-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Get exclusive stories, travel tips, and destination guides delivered to your inbox.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="flex-1 px-6 py-4 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder:text-stone-500 focus:outline-none focus:border-[#00E676] transition-all text-sm"
                    />
                    <button className="px-8 py-4 bg-[#00E676] hover:bg-[#00C853] text-stone-950 rounded-full font-black uppercase tracking-widest text-xs md:text-sm transition-all hover:scale-105 shadow-xl whitespace-nowrap">
                      Subscribe Now
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <JournalTab />
          </div>
        )}
        {activeTab === 'attractions' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <MapsTab />
          </div>
        )}
        {activeTab === 'todo' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PlanYourTripTab />
          </div>
        )}
      </main>
    </div>
  );
});

HomePage.displayName = 'HomePage';
export default HomePage;
