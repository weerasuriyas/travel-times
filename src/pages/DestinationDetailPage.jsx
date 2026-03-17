import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, ArrowRight, ArrowLeft, Star, DollarSign, Compass, Navigation2, Maximize2, Minimize2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { SharedHeader } from '../components/UI';
import { useScrolled } from '../hooks/useScrolled';
import EventDateBadge from '../components/ui/EventDateBadge';
import { getDestinationBySlug, isHappeningNow, isHappeningSoon, isInSeason, getEventsForDestination } from '../data/destinations';

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="
    display:flex; flex-direction:column; align-items:center;
  ">
    <div style="
      width:48px; height:48px; background:#00E676;
      border:4px solid white; border-radius:50%;
      box-shadow:0 8px 24px rgba(0,0,0,0.3);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  </div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -52],
});

// Opens the popup on mount
function AutoOpenMarker({ position, children }) {
  const markerRef = useRef(null);
  useEffect(() => {
    if (markerRef.current) markerRef.current.openPopup();
  }, []);
  return (
    <Marker ref={markerRef} position={position} icon={markerIcon}>
      {children}
    </Marker>
  );
}

const DestinationDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isScrolled = useScrolled(50);
  const destination = getDestinationBySlug(slug);
  const [mapExpanded, setMapExpanded] = useState(false);

  if (!destination) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFB]">
        <div className="text-center px-6">
          <h2 className="text-4xl font-black uppercase mb-4">Destination Not Found</h2>
          <p className="text-stone-600 mb-6">The destination you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/destinations')}
            className="px-6 py-3 bg-[#00E676] hover:bg-[#00C853] text-stone-950 rounded-full font-black uppercase tracking-widest text-sm transition-all"
          >
            Back to Destinations
          </button>
        </div>
      </div>
    );
  }

  const sortedEvents = getEventsForDestination(slug);
  const timelyCount = sortedEvents.filter(e => isHappeningNow(e) || isHappeningSoon(e) || isInSeason(e)).length;
  const coords = [destination.coordinates[0], destination.coordinates[1]];

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <SharedHeader isScrolled={isScrolled} showTabs={false} />

      <main className="pt-56 md:pt-52 pb-32">
        {/* Hero Section */}
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 mb-16">
          <button
            onClick={() => navigate('/destinations')}
            className="flex items-center gap-2 text-stone-600 hover:text-[#00E676] transition-colors mb-8 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">All Destinations</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-[48px] shadow-2xl overflow-hidden bg-white">
            {/* Map Section */}
            <div className="relative h-[400px] lg:h-[600px] group">
              <MapContainer
                center={coords}
                zoom={10}
                style={{ width: '100%', height: '100%' }}
                zoomControl={true}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  subdomains="abcd"
                  maxZoom={19}
                />
                <AutoOpenMarker position={coords}>
                  <Popup>
                    <div style={{ padding: '8px', minWidth: '200px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', color: '#1c1917' }}>
                        {destination.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#57534e' }}>{destination.region}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                        <div>
                          <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#a8a29e', marginBottom: '2px' }}>Elevation</p>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: '#44403c' }}>{destination.stats.elevation}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#a8a29e', marginBottom: '2px' }}>Best Time</p>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: '#44403c' }}>{destination.stats.bestTime}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(`https://www.google.com/maps/dir//${coords[0]},${coords[1]}`, '_blank')}
                        style={{
                          width: '100%', background: '#00E676', color: '#1c1917',
                          border: 'none', borderRadius: '999px', padding: '8px 12px',
                          fontSize: '10px', fontWeight: 900, textTransform: 'uppercase',
                          letterSpacing: '0.1em', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                        </svg>
                        Get Directions
                      </button>
                    </div>
                  </Popup>
                </AutoOpenMarker>
              </MapContainer>

              {/* Location badge */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg z-[1000] border border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#00E676] rounded-full animate-pulse"></div>
                  <span className="text-xs font-black uppercase tracking-widest text-stone-700">
                    Location in Sri Lanka
                  </span>
                </div>
              </div>

              {/* Controls overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg z-[1000] border border-stone-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-bold text-stone-600">OpenStreetMap</span>
                  </div>
                  <button
                    onClick={() => setMapExpanded(!mapExpanded)}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    {mapExpanded ? <Minimize2 size={16} className="text-stone-600" /> : <Maximize2 size={16} className="text-stone-600" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="relative p-8 lg:p-12 xl:p-16 flex flex-col justify-center overflow-hidden">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${destination.heroImage})` }}></div>
              <div className="absolute inset-0 bg-gradient-to-br from-stone-950/95 via-stone-900/90 to-black/95"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E676]/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFD600]/10 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full flex items-center gap-2">
                    <MapPin size={14} />
                    <span className="text-xs font-bold">{destination.region}</span>
                  </div>
                  <div className="bg-[#00E676] text-stone-950 px-4 py-2 rounded-full">
                    <span className="text-xs font-black uppercase tracking-[0.2em]">{destination.stats.bestTime}</span>
                  </div>
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tighter italic text-white mb-6 leading-[0.9]">
                  {destination.name}
                </h1>
                <p className="text-xl lg:text-2xl font-serif italic text-white/95 mb-6">{destination.tagline}</p>
                <p className="text-base lg:text-lg text-white/80 leading-relaxed mb-8">{destination.description}</p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Elevation</p>
                    <p className="text-sm font-bold text-white">{destination.stats.elevation}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Temperature</p>
                    <p className="text-sm font-bold text-white">{destination.stats.temperature}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Best Time</p>
                    <p className="text-sm font-bold text-white">{destination.stats.bestTime}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="max-w-7xl mx-auto px-6 mb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {destination.highlights.map((highlight, idx) => (
              <div key={idx} className="bg-white border border-stone-200 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all">
                <Star size={20} className="text-[#FFD600] mx-auto mb-2" />
                <p className="text-sm font-bold text-stone-700">{highlight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        {sortedEvents.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 mb-32">
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-1 bg-[#FF3D00] rounded-full"></div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500">Events & Experiences</h2>
              </div>
              <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight italic">What's Happening</h3>
              {timelyCount > 0 && (
                <p className="text-sm text-[#00E676] font-bold mt-2">{timelyCount} event{timelyCount !== 1 ? 's' : ''} happening soon</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {sortedEvents.map((event, idx) => {
                const isTimely = isHappeningNow(event) || isHappeningSoon(event);
                return (
                  <div
                    key={idx}
                    onClick={() => event.slug && navigate('/event/' + event.slug)}
                    className={`group ${event.slug ? 'cursor-pointer' : ''} bg-white rounded-[32px] overflow-hidden shadow-xl border transition-all duration-500 hover-lift ${
                      isTimely ? 'border-[#00E676] ring-2 ring-[#00E676]/30 shadow-[#00E676]/10' : 'border-stone-100 hover:shadow-2xl'
                    }`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img src={event.image} alt={event.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                      <div className="absolute top-4 left-4"><EventDateBadge event={event} /></div>
                      {event.featured && (
                        <div className="absolute top-4 right-4 bg-[#FFD600] text-stone-950 px-3 py-1.5 rounded-full flex items-center gap-2">
                          <Star size={12} className="fill-stone-950" />
                          <p className="text-[9px] font-black uppercase tracking-[0.2em]">Featured</p>
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="px-2 py-1 bg-[#00E676] rounded-full">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-950">{event.type}</span>
                          </div>
                        </div>
                        <h4 className="text-2xl font-black uppercase tracking-tight italic text-white">{event.name}</h4>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-stone-600 leading-relaxed mb-6">{event.description}</p>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-[#00E676]" />
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">When</p>
                            <p className="text-xs font-bold text-stone-700">{event.month}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-[#FF3D00]" />
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Duration</p>
                            <p className="text-xs font-bold text-stone-700">{event.duration}</p>
                          </div>
                        </div>
                      </div>
                      {event.slug && (
                        <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                          <span className="text-sm text-stone-500">Read full article</span>
                          <div className="flex items-center gap-2 text-[#00E676] group-hover:translate-x-1 transition-transform">
                            <span className="text-sm font-black uppercase tracking-widest">Read More</span>
                            <ArrowRight size={16} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Things to Do */}
        {(destination.generalThingsToDo || destination.thingsToDo || []).length > 0 && (
          <section className="max-w-7xl mx-auto px-6 mb-32">
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-1 bg-[#00E676] rounded-full"></div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500">Activities & Attractions</h2>
              </div>
              <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight italic">Things To Do</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(destination.generalThingsToDo || destination.thingsToDo || []).map((activity, idx) => (
                <div key={idx} className="group bg-white rounded-[24px] overflow-hidden shadow-lg border border-stone-100 hover:shadow-xl transition-all duration-500 hover-lift">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={activity.image} alt={activity.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-700">{activity.category}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="text-lg font-black uppercase tracking-tight mb-2">{activity.name}</h4>
                    <p className="text-sm text-stone-600 leading-relaxed mb-4 line-clamp-2">{activity.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-stone-400" />
                        <span className="text-xs text-stone-600">{activity.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-[#00E676]" />
                        <span className="text-xs font-bold text-stone-700">{activity.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-stone-950 via-stone-900 to-black p-12 md:p-16 shadow-2xl text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E676]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFD600]/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <Compass size={48} className="text-[#00E676] mx-auto mb-6" />
              <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic text-white mb-4">Ready to Explore?</h3>
              <p className="text-stone-400 mb-8 max-w-xl mx-auto">
                Discover more destinations across Sri Lanka and plan your perfect journey through the island.
              </p>
              <button
                onClick={() => navigate('/destinations')}
                className="px-8 py-4 bg-[#00E676] hover:bg-[#00C853] text-stone-950 rounded-full font-black uppercase tracking-widest text-sm transition-all hover:scale-105 shadow-xl inline-flex items-center gap-3"
              >
                <span>Browse All Destinations</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DestinationDetailPage;
