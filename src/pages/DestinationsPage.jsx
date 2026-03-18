import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { SharedHeader } from '../components/UI';
import { useScrolled } from '../hooks/useScrolled';
import { apiGet } from '../lib/api';

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

const DestinationsPage = () => {
  const navigate = useNavigate();
  const isScrolled = useScrolled(50);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('destinations')
      .then(d => setDestinations(Array.isArray(d) ? d : []))
      .catch(() => setDestinations([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <SharedHeader isScrolled={isScrolled} showTabs={false} />

      <main className="max-w-[1800px] mx-auto px-4 md:px-6 pt-56 md:pt-52 pb-32">
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

        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && destinations.length === 0 && (
          <p className="text-center text-stone-400 py-24 text-sm uppercase tracking-widest">No destinations yet</p>
        )}

        {!loading && destinations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {destinations.map((destination, idx) => (
              <div
                key={destination.slug}
                onClick={() => navigate('/destination/' + destination.slug)}
                className="group cursor-pointer animate-in fade-in slide-in-from-bottom-8 duration-700 hover-lift"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-stone-100 hover:shadow-2xl transition-all duration-500">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {destination.hero_image
                      ? <img src={destination.hero_image} alt={destination.name} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
                      : (
                        <div className={`w-full h-full bg-gradient-to-br ${regionGradient(destination.region)} flex items-end p-6`}>
                          <span className="text-5xl font-black uppercase italic text-white/20 leading-none select-none">
                            {destination.name}
                          </span>
                        </div>
                      )
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      {destination.region && (
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 flex items-center gap-1 mb-1">
                          <MapPin size={9} />{destination.region}
                        </span>
                      )}
                      <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic text-white leading-none">
                        {destination.name}
                      </h3>
                      {destination.tagline && (
                        <p className="text-xs text-white/60 mt-1 font-medium">{destination.tagline}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DestinationsPage;
