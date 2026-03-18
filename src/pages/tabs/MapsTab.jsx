import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { apiGet } from '../../lib/api';

function createMarkerIcon(isSelected) {
  const color = '#00E676';
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
  const [destinations, setDestinations] = useState([]);
  const [selectedDest, setSelectedDest] = useState(null);

  useEffect(() => {
    apiGet('destinations').then(d => setDestinations(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const mapped = destinations.filter(d => d.lat && d.lng);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic mb-2">Explore Sri Lanka</h2>
        <p className="text-stone-500 text-sm">Click a marker to discover each destination</p>
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
          {mapped.map(dest => (
            <Marker
              key={dest.slug}
              position={[dest.lat, dest.lng]}
              icon={createMarkerIcon(selectedDest === dest.slug)}
              eventHandlers={{ click: () => setSelectedDest(selectedDest === dest.slug ? null : dest.slug) }}
            >
              <Popup>
                <div style={{ minWidth: '180px', padding: '4px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>
                    {dest.name}
                  </h3>
                  {dest.tagline && (
                    <p style={{ fontSize: '11px', color: '#78716c', fontStyle: 'italic', marginBottom: '8px' }}>
                      {dest.tagline}
                    </p>
                  )}
                  <p style={{ fontSize: '11px', color: '#78716c', marginBottom: '10px' }}>{dest.region}</p>
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
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapsTab;
