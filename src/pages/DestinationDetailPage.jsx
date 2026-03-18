import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { MapPin, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { SharedHeader } from '../components/UI';
import { useScrolled } from '../hooks/useScrolled';

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:48px; height:48px; background:#00E676;
    border:4px solid white; border-radius:50%;
    box-shadow:0 8px 24px rgba(0,0,0,0.3);
    display:flex; align-items:center; justify-content:center;
  ">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -52],
});

function AutoOpenMarker({ position, children }) {
  const markerRef = useRef(null);
  useEffect(() => { if (markerRef.current) markerRef.current.openPopup() }, []);
  return <Marker ref={markerRef} position={position} icon={markerIcon}>{children}</Marker>;
}

const DestinationDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isScrolled = useScrolled(50);
  const [destination, setDestination] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    apiGet(`destinations/${slug}`)
      .then(dest => {
        if (!dest || dest.error) { setNotFound(true); return }
        setDestination(dest)
        return apiGet(`articles?status=published&destination_id=${dest.id}`).catch(() => [])
      })
      .then(arts => { if (arts) setArticles(Array.isArray(arts) ? arts : []) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFB]">
      <div className="w-10 h-10 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound || !destination) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFB]">
      <div className="text-center px-6">
        <h2 className="text-4xl font-black uppercase mb-4">Destination Not Found</h2>
        <button onClick={() => navigate('/destinations')} className="px-6 py-3 bg-[#00E676] text-stone-950 rounded-full font-black uppercase tracking-widest text-sm">
          Back to Destinations
        </button>
      </div>
    </div>
  )

  const hasMap = destination.lat && destination.lng
  const coords = hasMap ? [destination.lat, destination.lng] : null

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <SharedHeader isScrolled={isScrolled} showTabs={false} />

      <main className="pt-56 md:pt-52 pb-32">
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 mb-16">
          <button
            onClick={() => navigate('/destinations')}
            className="flex items-center gap-2 text-stone-600 hover:text-[#00E676] transition-colors mb-8 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">All Destinations</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-[48px] shadow-2xl overflow-hidden bg-white">
            {/* Map */}
            {hasMap && (
              <div className="relative h-[400px] lg:h-[560px]">
                <MapContainer
                  center={coords}
                  zoom={10}
                  style={{ width: '100%', height: '100%' }}
                  zoomControl
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                    subdomains="abcd"
                    maxZoom={19}
                  />
                  <AutoOpenMarker position={coords}>
                    <Popup>
                      <div style={{ padding: '8px', minWidth: '180px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
                          {destination.name}
                        </h3>
                        {destination.region && (
                          <p style={{ fontSize: '12px', color: '#78716c', marginBottom: '10px' }}>{destination.region}</p>
                        )}
                        <button
                          onClick={() => window.open(`https://www.google.com/maps/dir//${coords[0]},${coords[1]}`, '_blank')}
                          style={{
                            width: '100%', background: '#00E676', color: '#1c1917',
                            border: 'none', borderRadius: '999px', padding: '8px',
                            fontSize: '10px', fontWeight: 900, textTransform: 'uppercase',
                            letterSpacing: '0.1em', cursor: 'pointer',
                          }}
                        >
                          Get Directions
                        </button>
                      </div>
                    </Popup>
                  </AutoOpenMarker>
                </MapContainer>
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg z-[1000] border border-stone-100 flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#00E676] rounded-full animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-stone-700">Location in Sri Lanka</span>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="relative p-8 lg:p-12 xl:p-16 flex flex-col justify-center overflow-hidden bg-stone-950">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E676]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFD600]/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                {destination.region && (
                  <div className="flex items-center gap-2 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full flex items-center gap-2">
                      <MapPin size={13} />
                      <span className="text-xs font-bold">{destination.region}</span>
                    </div>
                  </div>
                )}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tighter italic text-white mb-4 leading-[0.9]">
                  {destination.name}
                </h1>
                {destination.tagline && (
                  <p className="text-xl lg:text-2xl font-serif italic text-white/90 mb-4">{destination.tagline}</p>
                )}
                {destination.description && (
                  <p className="text-base text-white/70 leading-relaxed">{destination.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stories */}
        {articles.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 mb-32">
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-1 bg-[#FFD600] rounded-full" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500">Field Notes</h2>
              </div>
              <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight italic">Stories</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map(article => (
                <div
                  key={article.id}
                  onClick={() => navigate(`/article/${article.slug}`)}
                  className="group cursor-pointer"
                >
                  <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-stone-100 mb-4">
                    {article.cover_image
                      ? <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      : <div className="w-full h-full bg-stone-200" />
                    }
                  </div>
                  {article.category && <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00E676] mb-2">{article.category}</p>}
                  <h4 className="text-xl font-black uppercase tracking-tight italic leading-tight mb-2 group-hover:text-stone-500 transition-colors">{article.title}</h4>
                  {article.subtitle && <p className="text-sm text-stone-500 font-serif italic line-clamp-2">{article.subtitle}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-stone-950 via-stone-900 to-black p-12 md:p-16 shadow-2xl text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E676]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFD600]/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <Compass size={48} className="text-[#00E676] mx-auto mb-6" />
              <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic text-white mb-4">Ready to Explore?</h3>
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
