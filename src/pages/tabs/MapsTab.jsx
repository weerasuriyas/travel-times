import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Calendar } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { getAllDestinations, isHappeningNow, isHappeningSoon, getEventsForDestination } from '../../data/destinations';
import EventDateBadge from '../../components/ui/EventDateBadge';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const hasValidMapsKey = GOOGLE_MAPS_API_KEY && !GOOGLE_MAPS_API_KEY.startsWith('YOUR_');

const MapsTab = () => {
  const navigate = useNavigate();
  const [selectedDest, setSelectedDest] = useState(null);

  const destinations = useMemo(() => getAllDestinations(), []);

  const getTimelyEventCount = (dest) => {
    const events = getEventsForDestination(dest.slug);
    return events.filter(e => isHappeningNow(e) || isHappeningSoon(e)).length;
  };

  if (!hasValidMapsKey) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic mb-2">Explore Sri Lanka</h2>
          <p className="text-stone-500 text-sm">Discover destinations across the island</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => {
            const timelyCount = getTimelyEventCount(dest);
            return (
              <div
                key={dest.slug}
                onClick={() => navigate(`/destination/${dest.slug}`)}
                className="group cursor-pointer bg-white rounded-[32px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-stone-100"
              >
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img src={dest.heroImage} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={dest.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <h4 className="text-2xl font-black uppercase tracking-tight italic text-white">{dest.name}</h4>
                    <p className="text-xs text-white/80">{dest.region}</p>
                  </div>
                  {timelyCount > 0 && (
                    <div className="absolute top-3 right-3 bg-[#00E676] text-stone-950 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full flex items-center gap-1">
                      <Calendar size={10} />
                      <span>{timelyCount} upcoming</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-sm text-stone-600 italic mb-3">{dest.tagline}</p>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-[#00E676] group-hover:underline">
                    <span>Explore</span>
                    <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic mb-2">Explore Sri Lanka</h2>
        <p className="text-stone-500 text-sm">Click a marker to discover what's happening at each destination</p>
      </div>
      <div className="rounded-[32px] overflow-hidden shadow-2xl border-4 border-white" style={{ height: '600px' }}>
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            defaultCenter={{ lat: 7.8731, lng: 80.7718 }}
            defaultZoom={7}
            mapId="8e5e3d8a9c4a2b1c"
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={true}
            className="w-full h-full"
          >
            {destinations.map((dest) => {
              const timelyCount = getTimelyEventCount(dest);
              const isTimely = timelyCount > 0;
              return (
                <AdvancedMarker
                  key={dest.slug}
                  position={{ lat: dest.coordinates[0], lng: dest.coordinates[1] }}
                  onClick={() => setSelectedDest(dest.slug === selectedDest ? null : dest.slug)}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full border-3 border-white shadow-xl flex items-center justify-center transition-all ${selectedDest === dest.slug ? 'scale-125' : 'hover:scale-110'}`}
                      style={{ backgroundColor: isTimely ? '#00E676' : '#78716c' }}
                    >
                      <MapPin className="text-white" size={16} strokeWidth={3} />
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {selectedDest && (() => {
              const dest = destinations.find(d => d.slug === selectedDest);
              if (!dest) return null;
              const timelyCount = getTimelyEventCount(dest);
              return (
                <InfoWindow
                  position={{ lat: dest.coordinates[0], lng: dest.coordinates[1] }}
                  onCloseClick={() => setSelectedDest(null)}
                  pixelOffset={[0, -40]}
                >
                  <div className="p-3 min-w-[200px]">
                    <h3 className="text-lg font-black uppercase tracking-tight mb-1">{dest.name}</h3>
                    <p className="text-xs text-stone-500 italic mb-2">{dest.tagline}</p>
                    <div className="flex items-center gap-2 mb-3 text-xs">
                      <MapPin size={12} className="text-[#00E676]" />
                      <span className="text-stone-600">{dest.region}</span>
                      {timelyCount > 0 && (
                        <span className="text-[#00E676] font-bold">{timelyCount} upcoming</span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/destination/${dest.slug}`)}
                      className="w-full bg-[#00E676] hover:bg-[#00C853] text-stone-950 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Explore
                    </button>
                  </div>
                </InfoWindow>
              );
            })()}
          </Map>
        </APIProvider>
      </div>
      <div className="mt-4 flex justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-stone-400">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#00E676]"></span> Events Soon</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-stone-400"></span> Destination</div>
      </div>
    </div>
  );
};

export default MapsTab;
