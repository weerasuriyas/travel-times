import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, ArrowUpRight, ChevronRight, Share2, Eye, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SectionHeader } from '../components/UI';

// Custom Map Controller
const MapViewController = ({ selectedHotel, accommodations }) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedHotel !== null) {
      const hotel = accommodations[selectedHotel];
      map.flyTo(hotel.coordinates, 16, {
        duration: 2,
        easeLinearity: 0.25
      });
    }
  }, [selectedHotel, map, accommodations]);

  return null;
};

// Icons configuration
const defaultIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/markers/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/markers/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const templeIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/markers/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const accommodations = [
  {
    name: "The Kandy House",
    type: "Boutique Manor",
    price: "$250 - $400",
    rating: 4.8,
    description: "An ancestral manor house converted into a designer boutique hotel. Features lush gardens and an infinity pool overlooking the paddy fields.",
    image: "https://lh3.googleusercontent.com/p/AF1QipN3vM-YQy-t7C-lC2fG4d8n7j9kH6xX5ZqWz3eR=s1360-w1360-h1020",
    tags: ["Heritage", "Luxury", "Secluded"],
    coordinates: [7.3128, 80.6552]
  },
  {
    name: "Earl's Regency",
    type: "Luxury Resort",
    price: "$150 - $300",
    rating: 4.6,
    description: "A 5-star hotel located along the Mahaweli River, offering premium amenities and easy access to Kandy's main attractions.",
    image: "https://lh3.googleusercontent.com/p/AF1QipO9n_qX5ZqWz3eR-lC2fG4d8n7j9kH6xX5ZqW=s1360-w1360-h1020",
    tags: ["Riverside", "Spa", "Family"],
    coordinates: [7.2885, 80.6625]
  },
  {
    name: "Helga's Folly",
    type: "Art Hotel",
    price: "$120 - $200",
    rating: 4.4,
    description: "A whimsical, anti-hotel filled with art, murals, and history. A favorite of artists and writers seeking inspiration.",
    image: "https://lh3.googleusercontent.com/p/AF1QipM-xX5ZqWz3eR-lC2fG4d8n7j9kH6xX5ZqW=s1360-w1360-h1020",
    tags: ["Artistic", "Historic", "Bohemian"],
    coordinates: [7.2936, 80.6481]
  }
];

const peraheraRoute = [
  [7.2936, 80.6413], // Temple of the Tooth
  [7.2928, 80.6405], // Queen's Hotel Junction
  [7.2915, 80.6410], // Lake Round
  [7.2905, 80.6425], // Maligawa Square
  [7.2936, 80.6413]  // Return to Temple
];

const ArticlePage = ({ setCurrentPage, peraheraImg }) => {
  const [selectedHotel, setSelectedHotel] = useState(null);

  return (
    <div className="animate-in slide-in-from-right duration-700">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-xl border-b border-stone-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <button onClick={() => setCurrentPage('home')} className="flex items-center space-x-2 text-stone-500 hover:text-black transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] uppercase font-black tracking-widest">Back to Journal</span>
        </button>
        <div className="flex space-x-4">
          <button className="p-2 hover:bg-stone-100 rounded-full transition-colors"><Share2 size={18} /></button>
          <button className="p-2 hover:bg-stone-100 rounded-full transition-colors"><Eye size={18} /></button>
        </div>
      </nav>

      <main className="pt-24 pb-32">
        {/* Article Header */}
        <header className="max-w-4xl mx-auto px-6 mb-16 text-center">
          <div className="flex justify-center space-x-4 mb-8">
            <span className="bg-[#00E676] text-white text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-sm">Culture</span>
            <span className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 border border-stone-200 rounded-sm">8 Min Read</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] italic mb-10 text-stone-900">
            THE FIRE <br />OF KANDY.
          </h1>
          <p className="text-xl md:text-2xl font-serif italic text-stone-500 max-w-2xl mx-auto leading-relaxed">
            "We walked through the smoke of a thousand copra torches, following the rhythm of the drums into the heart of the ancient kingdom."
          </p>
        </header>

        {/* Hero Image */}
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 mb-20">
          <div className="aspect-[21/9] rounded-[48px] overflow-hidden shadow-2xl relative group">
            <img src={peraheraImg} className="w-full h-full object-cover" alt="Kandy Perahera" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-10 left-10 text-white/80 text-[10px] uppercase tracking-widest font-black">
              Photograph by S. Weerasuriya • Kandy, 2025
            </div>
          </div>
        </div>

        {/* Article Content */}
        <article className="max-w-3xl mx-auto px-6 font-serif text-lg leading-[1.8] text-stone-800 space-y-8 mb-24">
          <div className="flex items-center space-x-4 text-[11px] font-sans font-black uppercase tracking-[0.2em] text-stone-400 border-b border-stone-100 pb-8 mb-8">
            <span className="flex items-center"><Calendar size={14} className="mr-2" /> July 14, 2026</span>
            <span>•</span>
            <span className="flex items-center"><Clock size={14} className="mr-2" /> 4:00 PM</span>
          </div>

          <p className="first-letter:text-7xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:leading-none">
            The air in Kandy is different. It holds the weight of centuries, a thick, humid embrace that smells of jasmine, burning copra, and rain on hot asphalt.
          </p>
          <p>
            Every year, when the moon is full in Esala, the city transforms. It is no longer just a bustling hill capital; it becomes a stage for the gods. The Kandy Esala Perahera is not merely a procession; it is a living, breathing artery of Sri Lankan culture, pumping rhythm and fire through the streets.
          </p>
          <blockquote className="border-l-4 border-[#00E676] pl-6 py-2 my-10 text-2xl italic text-stone-900 font-bold bg-stone-50 rounded-r-xl">
            "To witness the Perahera is to see the soul of the island revealed in fire and sound."
          </blockquote>
          <p>
            We arrived in the late afternoon, securing our spots on the balcony of the Queen's Hotel. Below us, the streets were already a sea of people. Vendors sold spiced chickpeas and lotus flowers. The anticipation was electric, a physical vibration in the air.
          </p>
          <p>
            Then, the first crack of the whip. The sound cut through the humid air like a gunshot, signaling the arrival of the whip crackers, clearing the path for the sanctity that was to follow.
          </p>
        </article>

        <div className="max-w-[1800px] mx-auto px-4 md:px-6 mb-32">
          <SectionHeader title="Where to Stay" subtitle="Curated Accommodations" color="#00E676" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[800px] lg:h-[600px]">
            {/* Map Column */}
            <div className="lg:col-span-5 h-[300px] lg:h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative z-0">
              <MapContainer center={[7.2906, 80.6337]} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <MapViewController selectedHotel={selectedHotel} accommodations={accommodations} />

                {/* Hotel Markers */}
                {accommodations.map((hotel, idx) => (
                  <Marker
                    key={idx}
                    position={hotel.coordinates}
                    icon={selectedHotel === idx ? selectedIcon : defaultIcon}
                    eventHandlers={{
                      click: () => setSelectedHotel(idx),
                    }}
                  >
                    <Popup className="font-sans">
                      <div className="text-center">
                        <h3 className="font-black uppercase">{hotel.name}</h3>
                        <p className="text-xs text-stone-500">{hotel.type}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Perahera Route */}
                <Polyline 
                  positions={peraheraRoute} 
                  color="#FF3D00" 
                  dashArray="10, 10" 
                  weight={4}
                  className="perahera-route"
                >
                  <Popup>Esala Perahera Procession Route</Popup>
                </Polyline>

                {/* Temple of the Tooth Marker */}
                <Marker position={[7.2936, 80.6413]} icon={templeIcon}>
                  <Popup>Sri Dalada Maligawa (Temple of the Tooth)</Popup>
                </Marker>
              </MapContainer>
              
              {/* Map Legend/Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-xl text-[10px] font-black uppercase tracking-widest z-[1000] flex justify-between shadow-lg">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-[#00E676]"></span>
                  <span>Selected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-stone-400"></span>
                  <span>Hotel</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF3D00]"></span>
                  <span>Route</span>
                </div>
              </div>
            </div>

            {/* Hotel Listing Column */}
            <div className="lg:col-span-7 space-y-8 hotel-scroll-container overflow-y-auto pr-2">
              {accommodations.map((hotel, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setSelectedHotel(idx)}
                  onClick={() => setSelectedHotel(idx)}
                  className={`group cursor-pointer transition-all duration-500 ${selectedHotel === idx
                    ? 'scale-100 opacity-100'
                    : 'scale-95 opacity-60 hover:opacity-80'
                    }`}
                >
                  <div className={`relative bg-white rounded-3xl overflow-hidden shadow-xl border-2 transition-all duration-500 hover:shadow-2xl card-shine ${selectedHotel === idx
                    ? 'border-[#00E676] shadow-2xl'
                    : 'border-stone-200 hover:border-[#00E676]'
                    }`}
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={hotel.image}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={hotel.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                      <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm text-black text-xs font-black px-4 py-2 rounded-full flex items-center shadow-lg">
                        <span className="mr-2">💰</span> {hotel.price}
                      </div>

                      {selectedHotel === idx && (
                        <div className="absolute top-6 left-6 bg-[#00E676] text-white text-xs font-black px-4 py-2 rounded-full flex items-center shadow-lg animate-in fade-in duration-300">
                          <MapPin size={14} className="mr-2" /> On Map
                        </div>
                      )}
                    </div>

                    <div className="p-8">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00E676] mb-2">{hotel.type}</p>
                          <h4 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-tight mb-3">{hotel.name}</h4>
                        </div>
                        <button className="w-12 h-12 bg-stone-950 rounded-full flex items-center justify-center text-white hover:bg-[#00E676] transition-all hover:scale-110 shadow-lg">
                          <ArrowUpRight size={20} />
                        </button>
                      </div>

                      <p className="font-serif text-stone-600 text-lg leading-relaxed mb-6">
                        {hotel.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {hotel.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="text-[10px] font-bold uppercase tracking-wide bg-stone-100 text-stone-700 px-4 py-2 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-stone-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-stone-500 text-sm">
                          <MapPin size={16} className="text-[#00E676]" />
                          <span>Kandy, Sri Lanka</span>
                        </div>
                        <button className="flex items-center space-x-2 text-[#00E676] text-sm font-black uppercase tracking-wider hover:gap-3 transition-all">
                          <span>View Details</span>
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-20 text-center">
            <div className="inline-flex flex-col items-center gap-6">
              <p className="text-stone-600 font-serif italic text-lg max-w-xl">
                Can't decide? Our travel experts can help you find the perfect accommodation for your Kandy experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-stone-950 text-white px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest hover:bg-[#00E676] hover:scale-105 transition-all shadow-xl flex items-center justify-center space-x-3">
                  <span>View All Hotels</span>
                  <ArrowUpRight size={18} />
                </button>
                <button className="bg-white border-2 border-stone-950 text-stone-950 px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest hover:bg-stone-950 hover:text-white hover:scale-105 transition-all shadow-lg flex items-center justify-center space-x-3">
                  <span>Contact Expert</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArticlePage;
