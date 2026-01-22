import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, ArrowUpRight, ChevronRight, Share2, Eye, Calendar, Clock, ArrowLeft, Layers, Flame, Compass, Info, Star } from 'lucide-react';
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
                {/* Hero Section with Overlay */}
                <div className="max-w-[1800px] mx-auto px-4 md:px-6 mb-16 md:mb-20">
                    <div className="aspect-[3/4] md:aspect-[21/9] rounded-[24px] md:rounded-[48px] overflow-hidden shadow-2xl relative group">
                        <img src={peraheraImg} className="w-full h-full object-cover" alt="Kandy Perahera" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                        
                        {/* Overlay Content */}
                        <div className="absolute inset-0 flex flex-col justify-end items-center text-center p-8 md:p-20 pb-16 md:pb-24">
                            <div className="flex justify-center space-x-4 mb-6 md:mb-8 animate-in slide-in-from-bottom duration-700 fade-in">
                                <span className="bg-[#00E676] text-white text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-sm">Culture</span>
                                <span className="text-white/80 text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 border border-white/20 rounded-sm">8 Min Read</span>
                            </div>
                            
                            <h1 className="text-5xl md:text-9xl font-black uppercase tracking-tighter leading-[0.9] md:leading-[0.8] italic mb-6 md:mb-10 text-white drop-shadow-2xl animate-in slide-in-from-bottom duration-1000 fade-in delay-100">
                                THE FIRE <br />OF KANDY.
                            </h1>
                            
                            <p className="text-lg md:text-3xl font-serif italic text-white/90 max-w-4xl mx-auto leading-relaxed drop-shadow-lg animate-in slide-in-from-bottom duration-1000 fade-in delay-200">
                                "We walked through the smoke of a thousand copra torches, following the rhythm of the drums into the heart of the ancient kingdom."
                            </p>

                            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white/40 text-[8px] md:text-[10px] uppercase tracking-widest font-black hidden md:block">
                                Photograph by S. Weerasuriya • Kandy, 2025
                            </div>
                        </div>
                    </div>
                </div>

                {/* Author Metadata */}
                <div className="max-w-4xl mx-auto px-6 mb-20">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-stone-900">
                        <div className="bg-white border border-stone-200 px-6 md:px-8 py-3 md:py-4 rounded-2xl flex flex-col items-center min-w-[140px] md:min-w-[180px] shadow-sm">
                            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1">Author</p>
                            <p className="text-xs md:text-sm font-black uppercase tracking-widest">Sanath Weerasuriya</p>
                        </div>

                        <div className="bg-white border border-stone-200 px-6 md:px-8 py-3 md:py-4 rounded-2xl flex flex-col items-center min-w-[140px] md:min-w-[180px] shadow-sm">
                            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1">Location</p>
                            <p className="text-xs md:text-sm font-black uppercase tracking-widest flex items-center">
                                <MapPin size={12} className="mr-2 text-[#00E676]" /> Kandy, Sri Lanka
                            </p>
                        </div>

                        <div className="bg-white border border-stone-200 px-6 md:px-8 py-3 md:py-4 rounded-2xl flex flex-col items-center min-w-[140px] md:min-w-[180px] shadow-sm">
                            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1">Read Time</p>
                            <p className="text-xs md:text-sm font-black uppercase tracking-widest flex items-center">
                                <Clock size={12} className="mr-2 text-[#FF3D00]" /> 8 Min Read
                            </p>
                        </div>
                    </div>
                </div>

                {/* Article Content */}
                {/* Visual Plates Section */}
                <section className="px-6 max-w-7xl mx-auto mb-20 relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                        <div className="bg-white p-4 rounded-[32px] md:rounded-[40px] shadow-xl md:shadow-2xl border border-stone-100 lg:col-span-1">
                            <img src="https://placehold.co/600x800?text=Detail+1" loading="lazy" className="w-full aspect-[3/4] object-cover rounded-[24px] md:rounded-[32px]" alt="Procession Detail 1" />
                            <div className="mt-4 px-4 md:px-6 flex justify-between items-center pb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 italic">Plate 01: Emblems</p>
                                <Layers size={14} className="text-stone-300" />
                            </div>
                        </div>

                        <div className="bg-[#FFD600] p-4 rounded-[32px] md:rounded-[40px] shadow-xl md:shadow-2xl lg:col-span-1 flex flex-col">
                            <img src="https://placehold.co/600x800?text=Detail+2" loading="lazy" className="w-full aspect-[3/4] object-cover rounded-[24px] md:rounded-[32px]" alt="Procession Detail 2" />
                            <div className="mt-4 px-4 md:px-6 flex justify-between items-center pb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-950 italic">Plate 02: Rituals</p>
                                <Flame size={14} className="text-stone-950" />
                            </div>
                        </div>

                        <div className="bg-stone-950 p-4 rounded-[32px] md:rounded-[40px] shadow-xl md:shadow-2xl lg:col-span-1 flex flex-col">
                            <img src="https://placehold.co/600x800?text=Detail+3" loading="lazy" className="w-full aspect-[3/4] object-cover rounded-[24px] md:rounded-[32px]" alt="Procession Detail 3" />
                            <div className="mt-4 px-4 md:px-6 flex justify-between items-center text-white pb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">Plate 03: The Guard</p>
                                <Compass size={14} className="text-[#00E676]" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Article Content */}
                <article className="max-w-4xl mx-auto px-6 pb-20">
                    <div className="font-serif text-lg md:text-3xl leading-[1.8] text-stone-800 space-y-8 md:space-y-12">
                        <p className="first-letter:text-5xl md:first-letter:text-9xl first-letter:font-black first-letter:float-left first-letter:mr-3 md:first-letter:mr-6 first-letter:leading-none first-letter:text-[#FF3D00]">
                            The historic ‘Esala Perahera’ in Kandy, one of the oldest and grandest Cultural festivals in Sri Lanka, perhaps, in the world started on Friday, 29 July with the cap planting (‘cap situveema’). This will continue for 15 days with four Devala Peraheras, Kumbal Perahera and colourful Randoli followed by ‘day perahera’ on Friday, 12th August.
                        </p>

                        <p>
                            This year’s ‘Esala Perehara’ is the first grand pageant after two years with no restrictions due to Covid Pandemic but blessed with heavy showers and bad weather. Despite the warning of re-emerging of Covid threat massive crowds turned up for the Kumbal Perhaera on Tuesday and Wednesday.
                        </p>

                        <div className="bg-white border-l-4 md:border-l-8 border-[#00E676] p-8 md:p-12 my-12 md:my-20 shadow-xl md:shadow-2xl rounded-r-[24px] md:rounded-r-[40px] not-italic">
                            <p className="font-sans text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-[#00E676] mb-4 md:mb-6 flex items-center">
                                <Info size={16} className="mr-3" /> Global Draw
                            </p>
                            <p className="font-serif text-xl md:text-4xl text-black leading-snug italic">
                                "‘Esala Perahera’, for centuries, has drawn religious devotees from around the world and more recently tourists, to Kandy’s narrow hill-streets."
                            </p>
                        </div>

                        <p>
                            Heralded by thousands of Kandyan drummers, a host of majestic elephants, adorned in elaborately embroidered cloaks, are led by the brilliantly caparisoned Maligawa Tusker. Decorated from trunk to toe, he carries a huge canopy that shelters, a replica of the cask containing the Sacred Tooth Relic of the Lord Buddha.
                        </p>

                        <div className="my-16 md:my-24 bg-stone-50 rounded-[40px] md:rounded-[60px] p-8 md:p-16 border border-stone-100 shadow-inner">
                            <div className="flex items-center space-x-4 mb-8 md:mb-10">
                                <Star size={18} className="text-[#FFD600] fill-[#FFD600]" />
                                <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.4em] text-stone-400">The Top Attraction</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
                                <div className="space-y-6 md:space-y-8">
                                    <div className="bg-[#FFD600] inline-block px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest text-black">Lead Tusker</div>
                                    <h4 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">SINHA RAJA</h4>
                                    <p className="font-serif italic text-lg md:text-xl text-stone-600 leading-relaxed text-left">
                                        Carrying the golden Karanduwa, Sinha Raja is the top attraction of the Perahera this year.
                                    </p>
                                </div>

                                <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-stone-100 shadow-xl space-y-6">
                                    <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] text-stone-400">The Guard</p>
                                    <p className="font-serif text-lg md:text-2xl text-stone-800 leading-tight">
                                        "Flanked by <span className="text-black font-bold underline decoration-[#FFD600] decoration-4">Myan Raja</span> and <span className="text-black font-bold underline decoration-[#FFD600] decoration-4">Buruma Raja</span> on either side."
                                    </p>
                                    <div className="pt-6 border-t border-stone-50 flex items-center text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-[#00E676]">
                                        <Compass size={16} className="mr-3" /> Sacred Formations
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p>
                            The aged old tradition were never changed for the past 1500 years since 305 AD during the reign of King Kirthisiri Meghawanna (305-331 AD). After the Kandyan Kingdom fell to the British in 1815, the custody of the Relic was handed over to the Maha Sanga. In the absence of the king, a chief lay custodian ‘Diyawadana Nilame’ was appointed to handle routine administrative matters concerning the relic and its care.
                        </p>
                    </div>
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
