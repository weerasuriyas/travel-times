<<<<<<< Updated upstream
=======
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, ArrowUpRight, ChevronRight, Share2, Eye, Calendar, Clock, ArrowLeft, Layers, Flame, Compass, Info, Star, Building, Utensils } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SectionHeader, SharedHeader } from '../components/UI';
import { getArticleBySlug } from '../data/articles';
import plateEmblems from '../assets/images/plate_emblems.jpg';
import plateRituals from '../assets/images/plate_rituals.jpg';
import plateGuard from '../assets/images/plate_guard.jpg';

// Custom Map Controller
const MapViewController = ({ selectedHotel, hotels }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedHotel !== null) {
            const hotel = hotels[selectedHotel];
            map.flyTo(hotel.coordinates, 16, {
                duration: 2,
                easeLinearity: 0.25
            });
        }
    }, [selectedHotel, map, hotels]);

    return null;
};

// Custom SVG marker icons (inline to avoid external dependencies)
const createMarkerIcon = (color, isSelected = false) => {
    const size = isSelected ? 36 : 28;
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${size}" height="${size * 1.5}">
            <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
                </filter>
            </defs>
            <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" 
                  fill="${color}" 
                  filter="url(#shadow)"
                  stroke="white" 
                  stroke-width="2"/>
            <circle cx="12" cy="12" r="5" fill="white"/>
        </svg>
    `;

    return L.divIcon({
        html: svg,
        className: 'custom-marker-icon',
        iconSize: [size, size * 1.5],
        iconAnchor: [size / 2, size * 1.5],
        popupAnchor: [0, -size * 1.2]
    });
};

const defaultIcon = createMarkerIcon('#78716c'); // stone-500
const selectedIcon = createMarkerIcon('#00E676', true); // green
const templeIcon = createMarkerIcon('#FFB300'); // gold/amber

const accommodations = [
    {
        name: "Queen's Hotel",
        type: "Heritage Listed",
        price: "$80 - $150",
        rating: 4.2,
        description: "A colonial gem located right in the heart of the city, adjacent to the Temple of the Tooth. Features high ceilings, wooden floors, and a historic ballroom.",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800",
        tags: ["Historic", "Central", "Colonial"],
        coordinates: [7.2928, 80.6405]
    },
    {
        name: "The Grand Kandian",
        type: "Modern Luxury",
        price: "$150 - $250",
        rating: 4.5,
        description: "Perched on the hilltops, this palace-like hotel offers panoramic views of the entire Kandy valley. Known for its lavish interiors and rooftop pool.",
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800",
        tags: ["Luxury", "Views", "Pool"],
        coordinates: [7.3000, 80.6300]
    },
    {
        name: "Suisse Hotel",
        type: "Colonial Lakeview",
        price: "$62 - $120",
        rating: 8.2,
        description: "Housed in a restored 17th-century colonial building that was once the residence of a Chief Minister. Offers lush gardens and direct lake views.",
        image: "https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=800",
        tags: ["Heritage", "Lake View", "Gardens"],
        coordinates: [7.2888, 80.6432]
    },
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

const ArticlePage = ({ slug = 'kandy-perahera', setCurrentPage, activeTab, setActiveTab, isScrolled, peraheraImg }) => {
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);

    // Load article data based on slug
    const articleData = getArticleBySlug(slug);

    // If article doesn't exist, show error
    if (!articleData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFDFB]">
                <div className="text-center px-6">
                    <h2 className="text-4xl font-black uppercase mb-4">Article Not Found</h2>
                    <p className="text-stone-600 mb-8">The article you're looking for doesn't exist.</p>
                    <button
                        onClick={() => setCurrentPage('home')}
                        className="px-6 py-3 bg-black text-white font-bold uppercase tracking-widest text-xs rounded-full hover:bg-[#00E676] transition-all"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Use article accommodations or fallback to hardcoded ones
    const articleAccommodations = articleData.accommodations || accommodations;

    // Scroll tracking
    const [scrollY, setScrollY] = useState(0);
    const [currentSection, setCurrentSection] = useState('hero');

    // Section refs for scroll tracking
    const heroRef = useRef(null);
    const platesRef = useRef(null);
    const storyRef = useRef(null);
    const tuskerRef = useRef(null);
    const stayRef = useRef(null);
    const eatRef = useRef(null);

    // Track scroll position
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);

            // Update current section based on scroll position
            const sections = [
                { id: 'hero', ref: heroRef },
                { id: 'plates', ref: platesRef },
                { id: 'story', ref: storyRef },
                { id: 'tusker', ref: tuskerRef },
                { id: 'stay', ref: stayRef },
                { id: 'eat', ref: eatRef }
            ];

            for (let i = sections.length - 1; i >= 0; i--) {
                const section = sections[i];
                if (section.ref.current) {
                    const rect = section.ref.current.getBoundingClientRect();
                    if (rect.top <= 200) {
                        setCurrentSection(section.id);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll to section function
    const scrollToSection = (sectionId) => {
        const refs = {
            hero: heroRef,
            plates: platesRef,
            story: storyRef,
            tusker: tuskerRef,
            stay: stayRef
        };

        const ref = refs[sectionId];
        if (ref?.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };



    return (
        <div className="animate-in slide-in-from-right duration-700">
            <SharedHeader 
                setCurrentPage={setCurrentPage}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isScrolled={isScrolled}
                showTabs={false}
            />

            <main className="pt-32 md:pt-48 pb-32">
                {/* Hero Section with Overlay */}
                <div ref={heroRef} id="section-hero" className="max-w-[1800px] mx-auto px-4 md:px-6 mb-16 md:mb-20">
                    <div className="aspect-[4/3] sm:aspect-[16/10] md:aspect-[21/9] rounded-[24px] md:rounded-[48px] shadow-2xl relative group">
                        <img
                            src={peraheraImg}
                            className="absolute inset-0 w-full h-full object-cover object-[center_70%] rounded-[24px] md:rounded-[48px]"
                            alt="Kandy Perahera"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 rounded-[24px] md:rounded-[48px]"></div>

                        {/* Overlay Content */}
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 py-8 md:p-20">
                            <div className="flex flex-wrap justify-center gap-2 md:space-x-4 mb-6 md:mb-8 animate-in slide-in-from-bottom duration-700 fade-in">
                                <span className="bg-[#00E676] text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full shadow-lg">{articleData.category}</span>
                                <span className="text-white/90 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] px-4 py-2 border-2 border-white/30 rounded-full backdrop-blur-sm bg-white/10">{articleData.readTime} Min Read</span>
                            </div>

                            <h1 className="hero-title font-black uppercase tracking-tighter italic mb-6 md:mb-10 text-white drop-shadow-2xl animate-in slide-in-from-bottom duration-1000 fade-in delay-100 px-2">
                                {articleData.title}
                            </h1>

                            <div className="relative max-w-3xl mx-auto">
                                <div className="absolute -left-4 top-0 text-white/20 text-6xl md:text-8xl font-serif leading-none">"</div>
                                <p className="relative text-base md:text-xl font-serif italic text-white/95 leading-relaxed drop-shadow-lg animate-in slide-in-from-bottom duration-1000 fade-in delay-200 px-4 md:px-12">
                                    {articleData.subtitle}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Author Metadata - Redesigned */}
                <div className="max-w-4xl mx-auto px-6 mb-24">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-stone-900">
                        <div className="group bg-white border border-stone-200 hover:border-[#00E676]/30 px-6 py-3 rounded-2xl flex items-center gap-3 min-w-[200px] shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#00E676] to-[#00C853] rounded-full flex items-center justify-center text-white font-bold text-xs">
                                {articleData.author.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="text-left">
                                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">Author</p>
                                <p className="text-xs font-bold text-stone-700">{articleData.author.name}</p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-stone-200 hidden md:block"></div>

                        <div className="group bg-white border border-stone-200 hover:border-[#00E676]/30 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="w-6 h-6 bg-[#00E676]/10 rounded-full flex items-center justify-center">
                                <MapPin size={12} className="text-[#00E676]" />
                            </div>
                            <div className="text-left">
                                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">Location</p>
                                <p className="text-xs font-bold text-stone-700">{articleData.location.name}</p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-stone-200 hidden md:block"></div>

                        <div className="group bg-white border border-stone-200 hover:border-[#FF3D00]/30 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="w-6 h-6 bg-[#FF3D00]/10 rounded-full flex items-center justify-center">
                                <Clock size={12} className="text-[#FF3D00]" />
                            </div>
                            <div className="text-left">
                                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">Read Time</p>
                                <p className="text-xs font-bold text-stone-700">{articleData.readTime} Minutes</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Article Content - Redesigned with better typography */}
                <article ref={storyRef} id="section-story" className="max-w-3xl mx-auto px-6 pb-20">
                    {/* Intro paragraph with decorative element */}
                    <div className="relative mb-16">
                        <div className="absolute -left-3 top-0 w-1 h-24 bg-gradient-to-b from-[#FF3D00] via-[#FFD600] to-[#00E676] rounded-full"></div>
                        <p className="font-serif text-base md:text-lg leading-[1.9] text-stone-700 pl-8 first-letter:text-7xl first-letter:font-black first-letter:float-left first-letter:mr-4 first-letter:mt-1 first-letter:leading-[0.8] first-letter:text-[#FF3D00] first-letter:drop-shadow-lg">
                            The historic 'Esala Perahera' in Kandy, one of the oldest and grandest Cultural festivals in Sri Lanka, perhaps, in the world started on Friday, 29 July with the cap planting ('cap situveema'). This will continue for 15 days with four Devala Peraheras, Kumbal Perahera and colourful Randoli followed by 'day perahera' on Friday, 12th August.
                        </p>
                    </div>

                    {/* Plate 1 - Emblems */}
                    <div ref={platesRef} id="section-plates" className="my-16 group">
                        <div className="bg-white p-3 rounded-3xl shadow-2xl border border-stone-100 hover:shadow-3xl hover:-translate-y-2 transition-all duration-500">
                            <div className="relative overflow-hidden rounded-2xl">
                                <img
                                    src={plateEmblems}
                                    loading="lazy"
                                    className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-700"
                                    alt="Procession Emblems"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                            <div className="mt-4 px-4 flex justify-between items-center pb-2">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-stone-400 mb-1">Visual Narrative</p>
                                    <p className="text-xs font-bold tracking-wide text-stone-700">Emblems of the Perahera</p>
                                </div>
                                <Layers size={16} className="text-stone-300 group-hover:text-[#00E676] transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 font-serif text-base md:text-lg leading-[1.85] text-stone-700">
                        <p className="text-stone-600 hover:text-stone-800 transition-colors duration-300">
                            This year's 'Esala Perehara' is the first grand pageant after two years with no restrictions due to Covid Pandemic but blessed with heavy showers and bad weather. Despite the warning of re-emerging of Covid threat massive crowds turned up for the Kumbal Perhaera on Tuesday and Wednesday.
                        </p>

                        {/* Pull Quote - Redesigned */}
                        <div className="relative my-16 group">
                            <div className="absolute -inset-4 bg-gradient-to-r from-[#00E676]/10 via-[#00E676]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                            <div className="relative bg-white border-l-4 border-[#00E676] p-8 md:p-10 shadow-lg hover:shadow-2xl rounded-r-2xl transition-all duration-300">
                                <div className="absolute top-6 right-6 text-[#00E676]/10 text-8xl font-serif leading-none">"</div>
                                <p className="font-sans text-[10px] font-black uppercase tracking-[0.3em] text-[#00E676] mb-4 flex items-center">
                                    <Info size={14} className="mr-2" /> Global Draw
                                </p>
                                <p className="font-serif text-lg md:text-2xl text-stone-900 leading-relaxed italic relative z-10">
                                    "'Esala Perahera', for centuries, has drawn religious devotees from around the world and more recently tourists, to Kandy's narrow hill-streets."
                                </p>
                            </div>
                        </div>

                        {/* Plate 2 - Rituals */}
                        <div className="my-16 group">
                            <div className="bg-gradient-to-br from-[#FFD600] to-[#FFC400] p-3 rounded-3xl shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-500">
                                <div className="relative overflow-hidden rounded-2xl">
                                    <img
                                        src={plateRituals}
                                        loading="lazy"
                                        className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-700"
                                        alt="Procession Rituals"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-amber-900/40 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                </div>
                                <div className="mt-4 px-4 flex justify-between items-center pb-2">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-stone-900/60 mb-1">Sacred Fire</p>
                                        <p className="text-xs font-bold tracking-wide text-stone-950">The Sacred Rituals</p>
                                    </div>
                                    <Flame size={16} className="text-stone-950 group-hover:text-red-600 transition-colors" />
                                </div>
                            </div>
                        </div>

                        <p className="text-stone-600 hover:text-stone-800 transition-colors duration-300">
                            Heralded by thousands of Kandyan drummers, a host of majestic elephants, adorned in elaborately embroidered cloaks, are led by the brilliantly caparisoned Maligawa Tusker. Decorated from trunk to toe, he carries a huge canopy that shelters, a replica of the cask containing the Sacred Tooth Relic of the Lord Buddha.
                        </p>

                        {/* Plate 3 - The Guard */}
                        <div className="my-16 group">
                            <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 p-3 rounded-3xl shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[#00E676]/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="relative overflow-hidden rounded-2xl">
                                    <img
                                        src={plateGuard}
                                        loading="lazy"
                                        className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-700"
                                        alt="The Guard"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#00E676]/40 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                </div>
                                <div className="mt-4 px-4 flex justify-between items-center text-white pb-2 relative z-10">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/40 mb-1">Guardian</p>
                                        <p className="text-xs font-bold tracking-wide text-white/90">The Guard of Honor</p>
                                    </div>
                                    <Compass size={16} className="text-[#00E676] group-hover:rotate-180 transition-transform duration-700" />
                                </div>
                            </div>
                        </div>

                        {/* Featured Tusker Section - Redesigned */}
                        <div ref={tuskerRef} id="section-tusker" className="my-20 -mx-6 md:mx-0">
                            <div className="relative bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-50 rounded-none md:rounded-[48px] p-6 md:p-16 border-y md:border border-stone-200/60 shadow-2xl overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD600]/10 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00E676]/10 rounded-full blur-3xl"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center space-x-3 mb-10">
                                        <div className="flex space-x-1">
                                            <Star size={16} className="text-[#FFD600] fill-[#FFD600] animate-pulse" />
                                            <Star size={16} className="text-[#FFD600] fill-[#FFD600] animate-pulse delay-75" />
                                            <Star size={16} className="text-[#FFD600] fill-[#FFD600] animate-pulse delay-150" />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-500">The Top Attraction</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-center">
                                        <div className="md:col-span-3 space-y-6">
                                            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#FFD600] to-[#FFC400] px-6 py-2.5 rounded-full shadow-lg">
                                                <div className="w-2 h-2 bg-stone-950 rounded-full animate-pulse"></div>
                                                <span className="text-[11px] font-black uppercase tracking-widest text-stone-950">Lead Tusker</span>
                                            </div>

                                            <h4 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-stone-900 via-stone-700 to-stone-900">
                                                SINHA<br/>RAJA
                                            </h4>

                                            <p className="font-serif text-base md:text-lg text-stone-600 leading-relaxed max-w-lg">
                                                Carrying the golden Karanduwa, Sinha Raja is the top attraction of the Perahera this year.
                                            </p>
                                        </div>

                                        <div className="md:col-span-2 bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-3xl border border-stone-200 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 mb-4 flex items-center">
                                                <Compass size={12} className="mr-2" /> The Guard
                                            </p>
                                            <p className="font-serif text-base md:text-lg text-stone-800 leading-relaxed mb-6">
                                                "Flanked by <span className="relative inline-block text-stone-950 font-bold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-2 after:bg-[#FFD600]/30 after:-z-10">Myan Raja</span> and <span className="relative inline-block text-stone-950 font-bold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-2 after:bg-[#FFD600]/30 after:-z-10">Buruma Raja</span> on either side."
                                            </p>
                                            <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00E676]">Sacred Formation</span>
                                                <ArrowUpRight size={16} className="text-stone-400 group-hover:text-[#00E676] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-stone-600 hover:text-stone-800 transition-colors duration-300">
                            The aged old tradition were never changed for the past 1500 years since 305 AD during the reign of King Kirthisiri Meghawanna (305-331 AD). After the Kandyan Kingdom fell to the British in 1815, the custody of the Relic was handed over to the Maha Sanga. In the absence of the king, a chief lay custodian 'Diyawadana Nilame' was appointed to handle routine administrative matters concerning the relic and its care.
                        </p>
                    </div>
                </article>

                {/* Things to Do Section */}
                <section className="max-w-[1800px] mx-auto px-4 md:px-6 mb-32">
                    <SectionHeader title="Things to Do" subtitle="Experience Kandy" color="#FFD600" />

                    <p className="text-lg md:text-xl text-stone-600 max-w-3xl mb-16 leading-relaxed">
                        Beyond the Perahera, Kandy offers a wealth of cultural, spiritual, and natural experiences that reveal the heart of Sri Lanka's hill country.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Temple of the Tooth",
                                category: "Sacred Site",
                                description: "Home to Sri Lanka's most sacred Buddhist relic, this UNESCO World Heritage Site is a must-visit for understanding the island's spiritual heritage.",
                                image: "https://images.unsplash.com/photo-1695748394754-9a8f807f9568?auto=format&fit=crop&q=80",
                                duration: "2-3 hours",
                                price: "Free (donations welcome)",
                                tags: ["Religious", "Heritage", "Must-See"]
                            },
                            {
                                title: "Kandy Lake",
                                category: "Nature",
                                description: "A serene man-made lake in the heart of the city. Perfect for morning or evening walks with stunning views of the surrounding hills.",
                                image: "https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=800",
                                duration: "1 hour",
                                price: "Free",
                                tags: ["Walking", "Scenic", "Relaxing"]
                            },
                            {
                                title: "Royal Botanical Gardens",
                                category: "Gardens",
                                description: "Asia's finest tropical gardens featuring over 4,000 species of plants, including a stunning orchid collection and giant Javan fig tree.",
                                image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80",
                                duration: "2-4 hours",
                                price: "$10",
                                tags: ["Nature", "Gardens", "Family"]
                            },
                            {
                                title: "Kandyan Dance Show",
                                category: "Culture",
                                description: "Experience the vibrant traditional dances and music of the Kandyan kingdom, including fire walking and acrobatic performances.",
                                image: "https://images.unsplash.com/photo-1618588507085-c79565432917?auto=format&fit=crop&q=80",
                                duration: "1 hour",
                                price: "$8-12",
                                tags: ["Cultural", "Evening", "Performance"]
                            },
                            {
                                title: "Tea Plantation Visit",
                                category: "Experience",
                                description: "Tour a working tea estate, learn about Ceylon tea production, and enjoy fresh tea with panoramic mountain views.",
                                image: "https://images.unsplash.com/photo-1586511623600-cb6f44f647d8?auto=format&fit=crop&q=80",
                                duration: "Half day",
                                price: "$15-30",
                                tags: ["Tea", "Scenic", "Educational"]
                            },
                            {
                                title: "Udawattakele Forest",
                                category: "Nature",
                                description: "A biodiverse forest sanctuary above the city, home to rare birds, monkeys, and ancient trees. A peaceful escape from urban bustle.",
                                image: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80",
                                duration: "2-3 hours",
                                price: "$5",
                                tags: ["Hiking", "Wildlife", "Nature"]
                            }
                        ].map((activity, idx) => (
                            <div key={idx} className="group cursor-pointer bg-white rounded-[32px] overflow-hidden shadow-xl border-2 border-stone-200 hover:border-[#FFD600] transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    <img
                                        src={activity.image}
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        alt={activity.title}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                                    <div className="absolute top-4 left-4 bg-[#FFD600] text-black text-xs font-black px-4 py-2 rounded-full">
                                        {activity.category}
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <div className="flex items-center gap-3 text-white text-xs font-bold">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                <span>{activity.duration}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span>💰</span>
                                                <span>{activity.price}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h4 className="text-2xl font-black uppercase tracking-tight leading-tight mb-3">
                                        {activity.title}
                                    </h4>
                                    <p className="text-sm text-stone-600 leading-relaxed mb-4">
                                        {activity.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {activity.tags.map((tag, tIdx) => (
                                            <span key={tIdx} className="text-[9px] font-bold uppercase tracking-wide bg-stone-100 text-stone-700 px-3 py-1.5 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div ref={stayRef} id="section-stay" className="max-w-[1800px] mx-auto px-4 md:px-6 mb-32">
                    <SectionHeader title="Where to Stay" subtitle="Curated Accommodations" color="#00E676" />

                    <p className="text-lg md:text-xl text-stone-600 max-w-3xl mb-16 leading-relaxed">
                        From colonial heritage hotels to modern luxury resorts, Kandy offers accommodations that capture the spirit of the ancient kingdom while providing world-class comfort.
                    </p>

                    {/* Interactive Map Section */}
                    <div className="mb-20">
                        <div className="bg-gradient-to-br from-stone-50 to-white rounded-[40px] p-8 md:p-12 shadow-2xl border border-stone-100">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight italic">Interactive Map</h3>
                                <div className="flex items-center gap-3">
                                    <MapPin size={20} className="text-[#00E676]" />
                                    <span className="text-sm font-black uppercase tracking-widest text-stone-500">
                                        {accommodations.length} Hotels
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-[32px] overflow-hidden shadow-xl border-4 border-white h-[400px] md:h-[500px] relative">
                                <MapContainer center={[7.2906, 80.6337]} zoom={13} style={{ height: "100%", width: "100%" }}>
                                    <TileLayer
                                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                    />
                                    <MapViewController selectedHotel={selectedHotel} hotels={articleAccommodations} />

                                    {/* Hotel Markers */}
                                    {articleAccommodations.map((hotel, idx) => (
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
                                                    <h3 className="font-black uppercase text-sm">{hotel.name}</h3>
                                                    <p className="text-xs text-stone-500">{hotel.type}</p>
                                                    <p className="text-xs font-bold text-[#00E676] mt-1">{hotel.price}</p>
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

                                {/* Map Legend */}
                                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest z-[1000] shadow-xl">
                                    <div className="flex flex-wrap justify-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-[#00E676]"></span>
                                            <span>Selected</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-stone-400"></span>
                                            <span>Hotel</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-[#FFB300]"></span>
                                            <span>Temple</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-[#FF3D00]"></span>
                                            <span>Route</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hotel Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {articleAccommodations.map((hotel, idx) => (
                            <div
                                key={idx}
                                onMouseEnter={() => setSelectedHotel(idx)}
                                onClick={() => setSelectedHotel(idx)}
                                className={`group cursor-pointer transition-all duration-300 ${
                                    selectedHotel === idx ? 'scale-100' : 'hover:scale-[1.02]'
                                }`}
                            >
                                <div className={`relative bg-white rounded-[32px] overflow-hidden shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
                                    selectedHotel === idx
                                        ? 'border-[#00E676] shadow-2xl ring-4 ring-[#00E676]/20'
                                        : 'border-stone-200 hover:border-[#00E676]'
                                }`}>
                                    {/* Hotel Image */}
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <img
                                            src={hotel.image}
                                            loading="lazy"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            alt={hotel.name}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

                                        {/* Price Badge */}
                                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-black text-xs font-black px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                                            <span>💰</span>
                                            <span>{hotel.price}</span>
                                        </div>

                                        {/* Selected Badge */}
                                        {selectedHotel === idx && (
                                            <div className="absolute top-4 left-4 bg-[#00E676] text-white text-xs font-black px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-in fade-in duration-300">
                                                <MapPin size={14} />
                                                <span>On Map</span>
                                            </div>
                                        )}

                                        {/* Rating Badge */}
                                        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white text-xs font-black px-3 py-2 rounded-full flex items-center gap-2">
                                            <Star size={12} className="fill-[#FFD600] text-[#FFD600]" />
                                            <span>{hotel.rating}</span>
                                        </div>
                                    </div>

                                    {/* Hotel Details */}
                                    <div className="p-6">
                                        <div className="mb-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00E676] mb-2">
                                                {hotel.type}
                                            </p>
                                            <h4 className="text-2xl font-black uppercase tracking-tight leading-tight mb-3">
                                                {hotel.name}
                                            </h4>
                                        </div>

                                        <p className="font-serif text-stone-600 text-sm leading-relaxed mb-4 line-clamp-3">
                                            {hotel.description}
                                        </p>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {hotel.tags.map((tag, tIdx) => (
                                                <span
                                                    key={tIdx}
                                                    className="text-[9px] font-bold uppercase tracking-wide bg-stone-100 text-stone-700 px-3 py-1.5 rounded-full"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <button className="w-full bg-stone-950 text-white py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#00E676] transition-all flex items-center justify-center gap-2 group">
                                            <span>View Details</span>
                                            <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Call to Action */}
                    <div className="mt-20 bg-gradient-to-br from-stone-950 via-stone-900 to-black rounded-[40px] p-12 md:p-16 text-center relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E676] opacity-10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FFD600] opacity-10 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-white mb-6">
                                Need Help Choosing?
                            </h3>
                            <p className="text-stone-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                                Our local travel experts can help you find the perfect accommodation based on your preferences, budget, and travel style.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button className="bg-[#00E676] hover:bg-[#00C853] text-stone-950 px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-3">
                                    <Building size={18} />
                                    <span>View All Hotels</span>
                                </button>
                                <button className="bg-white/10 hover:bg-white/20 border-2 border-white/30 text-white px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest transition-all hover:scale-105 backdrop-blur-sm flex items-center justify-center gap-3">
                                    <span>Contact Expert</span>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Where to Eat Section */}
                {articleData.restaurants && articleData.restaurants.length > 0 && (
                    <div ref={eatRef} id="section-eat" className="max-w-[1800px] mx-auto px-4 md:px-6 mb-32">
                        <SectionHeader title="Where to Eat" subtitle="Dining & Cuisine" color="#FF3D00" />

                        <p className="text-lg md:text-xl text-stone-600 max-w-3xl mb-16 leading-relaxed">
                            From street food stalls to fine dining establishments, discover the flavors that make this destination unforgettable. Authentic local cuisine, colonial-era tea rooms, and modern fusion await.
                        </p>

                        {/* Interactive Map Section */}
                        <div className="mb-20">
                            <div className="bg-gradient-to-br from-amber-50 to-white rounded-[40px] p-8 md:p-12 shadow-2xl border border-orange-100">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight italic">Restaurant Map</h3>
                                    <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-orange-200 shadow-sm">
                                        <Utensils size={16} className="text-[#FF3D00]" />
                                        <span className="text-sm font-bold text-stone-700">{articleData.restaurants.length} Restaurants</span>
                                    </div>
                                </div>

                                {/* Map Container */}
                                <div className="relative rounded-[32px] overflow-hidden shadow-2xl border-4 border-white" style={{ height: "500px" }}>
                                    <MapContainer center={articleData.location.coordinates} zoom={14} style={{ height: "100%", width: "100%" }}>
                                        <TileLayer
                                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                        />
                                        <MapViewController selectedHotel={selectedRestaurant} hotels={articleData.restaurants} />

                                        {/* Restaurant Markers */}
                                        {articleData.restaurants.map((restaurant, idx) => (
                                            <Marker
                                                key={idx}
                                                position={restaurant.coordinates}
                                                icon={selectedRestaurant === idx ? createMarkerIcon('#FF3D00', true) : createMarkerIcon('#FF3D00')}
                                                eventHandlers={{
                                                    click: () => setSelectedRestaurant(idx),
                                                }}
                                            >
                                                <Popup className="font-sans">
                                                    <div className="p-2">
                                                        <h4 className="font-black text-base mb-1">{restaurant.name}</h4>
                                                        <p className="text-xs text-stone-600 mb-2">{restaurant.type}</p>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <Star size={12} className="text-[#FFD600] fill-[#FFD600]" />
                                                            <span className="font-bold">{restaurant.rating}</span>
                                                            <span className="text-stone-500">• {restaurant.price}</span>
                                                        </div>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>

                                    {/* Map Legend */}
                                    <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-orange-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-[#FF3D00]"></div>
                                            <span className="text-xs font-bold text-stone-700">Restaurants</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-stone-500 mt-6 text-center">
                                    💡 <span className="font-bold">Tip:</span> Click on markers to see details • Hover over cards below to locate on map
                                </p>
                            </div>
                        </div>

                        {/* Restaurant Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {articleData.restaurants.map((restaurant, idx) => (
                                <div
                                    key={idx}
                                    onMouseEnter={() => setSelectedRestaurant(idx)}
                                    onClick={() => setSelectedRestaurant(idx)}
                                    className={`group cursor-pointer transition-all duration-300 ${
                                        selectedRestaurant === idx ? 'scale-100' : 'hover:scale-[1.02]'
                                    }`}
                                >
                                    <div className={`relative bg-white rounded-[32px] overflow-hidden shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
                                        selectedRestaurant === idx
                                            ? 'border-[#FF3D00] shadow-2xl ring-4 ring-[#FF3D00]/20'
                                            : 'border-stone-200 hover:border-[#FF3D00]'
                                    }`}>
                                        {/* Restaurant Image */}
                                        <div className="relative aspect-[4/3] overflow-hidden">
                                            <img
                                                src={restaurant.image}
                                                alt={restaurant.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                                            {/* Type & Price Badge */}
                                            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                                                <span className="text-xs font-bold text-stone-700">{restaurant.price}</span>
                                            </div>

                                            {/* Selected Badge */}
                                            {selectedRestaurant === idx && (
                                                <div className="absolute top-4 left-4 bg-[#FF3D00] text-white text-xs font-black px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-in fade-in duration-300">
                                                    <MapPin size={14} />
                                                    <span>On Map</span>
                                                </div>
                                            )}

                                            {/* Restaurant Name Overlay */}
                                            <div className="absolute bottom-4 left-4 right-4">
                                                <h4 className="text-xl font-black text-white mb-1">{restaurant.name}</h4>
                                                <p className="text-sm text-white/90 font-medium">{restaurant.type}</p>
                                            </div>
                                        </div>

                                        {/* Restaurant Details */}
                                        <div className="p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="flex items-center gap-1">
                                                    <Star size={16} className="text-[#FFD600] fill-[#FFD600]" />
                                                    <span className="text-lg font-black text-stone-900">{restaurant.rating}</span>
                                                </div>
                                                <span className="text-sm text-stone-400">•</span>
                                                <div className="flex items-center gap-2 text-stone-600">
                                                    <Clock size={14} />
                                                    <span className="text-xs font-medium">{restaurant.hours}</span>
                                                </div>
                                            </div>

                                            <p className="font-serif text-stone-600 text-sm leading-relaxed mb-4 line-clamp-3">
                                                {restaurant.description}
                                            </p>

                                            {/* Specialty */}
                                            <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-orange-100">
                                                <p className="text-xs font-black uppercase tracking-wide text-stone-500 mb-1">Specialty</p>
                                                <p className="text-sm font-bold text-[#FF3D00]">{restaurant.specialty}</p>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {restaurant.tags.map((tag, tIdx) => (
                                                    <span
                                                        key={tIdx}
                                                        className="text-[9px] font-bold uppercase tracking-wide bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            <button className="w-full bg-[#FF3D00] hover:bg-[#E63600] text-white py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group">
                                                <Utensils size={16} />
                                                <span>View Menu & Hours</span>
                                                <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Call to Action */}
                        <div className="mt-20 bg-gradient-to-br from-orange-950 via-red-900 to-black rounded-[40px] p-12 md:p-16 text-center relative overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF3D00] opacity-10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FFD600] opacity-10 rounded-full blur-3xl"></div>

                            <div className="relative z-10">
                                <Utensils size={48} className="text-[#FF3D00] mx-auto mb-6" />
                                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-white mb-6">
                                    Hungry for More?
                                </h3>
                                <p className="text-stone-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                                    Discover more culinary gems and hidden food spots with our local dining guide.
                                </p>
                                <button className="bg-[#FF3D00] hover:bg-[#E63600] text-white px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl inline-flex items-center gap-3">
                                    <span>Explore Food Scene</span>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ArticlePage;
>>>>>>> Stashed changes
