import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Calendar } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getAllDestinations, isHappeningNow, isHappeningSoon, getEventsForDestination } from '../../data/destinations';
import EventDateBadge from '../../components/ui/EventDateBadge';

function createMarkerIcon(isTimely, isSelected) {
  const color = isTimely ? '#00E676' : '#78716c';
  const scale = isSelected ? 1.25 : 1;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${32 * scale}px; height:${32 * scale}px;
      background:${color}; border:3px solid white;
      border-radius:50%; box-shadow:0 4px 12px rgba(0,0,0,0.3);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; transition:transform 0.2s;
    ">
      <svg width="${16 * scale}" height="${16 * scale}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    </div>`,
    iconSize: [32 * scale, 32 * scale],
    iconAnchor: [16 * scale, 16 * scale],
  });
}

const MapsTab = () => {
  const navigate = useNavigate();
  const [selectedDest, setSelectedDest] = useState(null);
  const destinations = useMemo(() => getAllDestinations(), []);

  const getTimelyEventCount = (dest) => {
    const events = getEventsForDestination(dest.slug);
    return events.filter(e => isHappeningNow(e) || isHappeningSoon(e)).length;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic mb-2">Explore Sri Lanka</h2>
        <p className="text-stone-500 text-sm">Click a marker to discover what's happening at each destination</p>
      </div>

      <div className="rounded-[32px] overflow-hidden shadow-2xl border-4 border-white" style={{ height: '600px' }}>
        <MapContainer
          center={[7.8731, 80.7718]}
          zoom={7}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />

          {destinations.map((dest) => {
            const timelyCount = getTimelyEventCount(dest);
            const isTimely = timelyCount > 0;
            const isSelected = selectedDest === dest.slug;
            return (
              <Marker
                key={dest.slug}
                position={[dest.coordinates[0], dest.coordinates[1]]}
                icon={createMarkerIcon(isTimely, isSelected)}
                eventHandlers={{ click: () => setSelectedDest(isSelected ? null : dest.slug) }}
              >
                <Popup>
                  <div style={{ minWidth: '180px', padding: '4px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>
                      {dest.name}
                    </h3>
                    <p style={{ fontSize: '11px', color: '#78716c', fontStyle: 'italic', marginBottom: '8px' }}>
                      {dest.tagline}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '11px' }}>
                      <span style={{ color: '#78716c' }}>{dest.region}</span>
                      {timelyCount > 0 && (
                        <span style={{ color: '#00C853', fontWeight: 700 }}>{timelyCount} upcoming</span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/destination/${dest.slug}`)}
                      style={{
                        width: '100%', background: '#00E676', color: '#1c1917',
                        border: 'none', borderRadius: '999px', padding: '8px',
                        fontSize: '10px', fontWeight: 900, textTransform: 'uppercase',
                        letterSpacing: '0.1em', cursor: 'pointer',
                      }}
                    >
                      Explore
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="mt-4 flex justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-stone-400">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#00E676]"></span> Events Soon</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-stone-400"></span> Destination</div>
      </div>
    </div>
  );
};

export default MapsTab;
