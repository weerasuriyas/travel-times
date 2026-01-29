import React from 'react';
import { MapPin, Calendar, Thermometer, Mountain, ArrowRight } from 'lucide-react';
import { SharedHeader } from '../components/UI';
import { getAllDestinations } from '../data/destinations';

const DestinationsPage = ({ setCurrentPage, isScrolled }) => {
  const destinations = getAllDestinations();

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <SharedHeader
        setCurrentPage={setCurrentPage}
        isScrolled={isScrolled}
        showTabs={false}
      />

      <main className="max-w-[1800px] mx-auto px-4 md:px-6 pt-56 md:pt-52 pb-32">
        {/* Hero Section */}
        <div className="mb-20 text-center">
          <div className="inline-block mb-6">
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-[#00E676] bg-[#00E676]/10 px-4 py-2 rounded-full">
              Explore Sri Lanka
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter italic mb-6 leading-[0.9]">
            Destinations
          </h1>
          <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
            From misty mountains to pristine beaches, discover the diverse landscapes and rich culture of the pearl of the Indian Ocean.
          </p>
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {destinations.map((destination, idx) => (
            <div
              key={destination.slug}
              onClick={() => setCurrentPage('destination', destination.slug)}
              className="group cursor-pointer animate-in fade-in slide-in-from-bottom-8 duration-1000 hover-lift"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-stone-100 hover:shadow-2xl transition-all duration-500">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={destination.heroImage}
                    alt={destination.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* Featured Badge */}
                  {destination.events.some(e => e.featured) && (
                    <div className="absolute top-4 right-4 bg-[#FFD600] text-stone-950 px-3 py-1.5 rounded-full">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em]">Featured</p>
                    </div>
                  )}

                  {/* Bottom Info */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={14} className="text-white" />
                      <span className="text-xs font-bold text-white">{destination.region}</span>
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tight italic text-white mb-1">
                      {destination.name}
                    </h3>
                    <p className="text-sm text-white/90 font-medium">{destination.tagline}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-sm text-stone-600 leading-relaxed mb-6 line-clamp-2">
                    {destination.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-stone-50 rounded-xl p-3 text-center">
                      <Mountain size={16} className="text-[#00E676] mx-auto mb-1" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Elevation</p>
                      <p className="text-xs font-bold text-stone-700">{destination.stats.elevation}</p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3 text-center">
                      <Thermometer size={16} className="text-[#FF3D00] mx-auto mb-1" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Avg Temp</p>
                      <p className="text-xs font-bold text-stone-700">{destination.stats.temperature}</p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3 text-center">
                      <Calendar size={16} className="text-[#FFD600] mx-auto mb-1" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Best Time</p>
                      <p className="text-xs font-bold text-stone-700 leading-tight">{destination.stats.bestTime}</p>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="mb-6">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-stone-400 mb-3">Highlights</p>
                    <div className="flex flex-wrap gap-2">
                      {destination.highlights.slice(0, 3).map((highlight, i) => (
                        <span
                          key={i}
                          className="text-xs px-3 py-1.5 bg-stone-100 text-stone-700 rounded-full font-semibold"
                        >
                          {highlight}
                        </span>
                      ))}
                      {destination.highlights.length > 3 && (
                        <span className="text-xs px-3 py-1.5 text-stone-500 font-semibold">
                          +{destination.highlights.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-stone-500">
                        {destination.events.length} event{destination.events.length !== 1 ? 's' : ''} · {destination.thingsToDo.length} activities
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[#00E676] group-hover:translate-x-1 transition-transform">
                      <span className="text-sm font-black uppercase tracking-widest">Explore</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default DestinationsPage;
