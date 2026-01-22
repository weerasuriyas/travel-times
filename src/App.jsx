import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Clock,
  ArrowUpRight,
  Calendar,
  Compass,
  Zap,
  Flame,
  Search,
  Globe,
  ArrowLeft,
  Share2,
  Bookmark,
  MapPin,
  Info,
  Layers,
  Star,
  User,
  Quote,
  Navigation,
  ChevronRight
} from 'lucide-react';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [35, 57],
  iconAnchor: [17, 57],
  popupAnchor: [1, -48],
  shadowSize: [57, 57],
  className: 'selected-marker'
});

const templeIcon = L.divIcon({
  className: 'custom-temple-icon',
  html: '<div style="background: #FF3D00; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});


// Component to handle map view updates - DISABLED for static map
const MapViewController = ({ center }) => {
  // Map stays static, no panning or zooming
  // Only marker icons change to show selection
  return null;
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [activeTab, setActiveTab] = useState('feature');
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [selectedHotel, setSelectedHotel] = useState(0);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  // Image Assets
  const peraheraImg = "https://lh3.googleusercontent.com/d/1AxaQJY9HOmrP_fLVVcgP1t7U2tPU0fCq";
  const extraImg1 = "https://placehold.co/600x800?text=Detail+1";
  const extraImg2 = "https://placehold.co/600x800?text=Detail+2";
  const extraImg3 = "https://placehold.co/600x800?text=Detail+3";

  const trainImg = "https://images.unsplash.com/photo-1474487548417-781cb71495f3?q=80&w=2070&auto=format&fit=crop";
  const teaImg = "https://images.unsplash.com/photo-1512100356956-c1b47f4b8a21?q=80&w=1964&auto=format&fit=crop";
  const beachImg = "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=2070&auto=format&fit=crop";
  const templeImg = "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop";
  const wildlifeImg = "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?q=80&w=2076&auto=format&fit=crop";
  const surfImg = "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=2070&auto=format&fit=crop";
  const foodImg = "https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=2076&auto=format&fit=crop";
  const marketImg = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2074&auto=format&fit=crop";

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Simple threshold without hysteresis to prevent jitter
          setIsScrolled(currentScrollY > 150);

          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = (currentScrollY / totalHeight) * 100;
          setScrollProgress(progress);

          // Parallax effect - slower scroll for background (negative for upward movement)
          setParallaxOffset(currentScrollY * -0.2);
          ticking = false;
        });
        ticking = true;
      }
    };

    const updateTime = () => {
      const options = { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', hour12: true };
      setCurrentTime(new Intl.DateTimeFormat('en-US', options).format(new Date()));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const timer = setInterval(updateTime, 1000);
    updateTime();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Update browser history
    if (currentPage === 'home') {
      window.history.pushState({ page: 'home' }, '', '/');
    } else if (currentPage === 'article') {
      window.history.pushState({ page: 'article' }, '', '/article');
    }
  }, [currentPage]);

  // Prevent image copying and right-click
  useEffect(() => {
    const preventContextMenu = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    const preventDragStart = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('dragstart', preventDragStart);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('dragstart', preventDragStart);
    };
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
      } else {
        setCurrentPage('home');
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Set initial state
    window.history.replaceState({ page: 'home' }, '', '/');

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Intersection Observer for scroll reveal animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach(el => observer.observe(el));

    return () => {
      revealElements.forEach(el => observer.unobserve(el));
    };
  }, [currentPage, activeTab]);

  const SectionHeader = ({ title, subtitle, color = "#00E676" }) => (
    <div className="mb-12">
      <div className="flex items-center space-x-4 mb-4">
        <div className="h-[2px] w-12" style={{ backgroundColor: color }}></div>
        <h3 className="text-[11px] font-sans font-black uppercase tracking-[0.4em] text-stone-400">{subtitle}</h3>
      </div>
      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none italic">{title}</h2>
    </div>
  );

  const InfoBanner = () => (
    <div className="flex bg-white border-b border-stone-100 py-2 md:py-3.5 px-4 md:px-6 flex-wrap md:flex-nowrap justify-between items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">
      <div className="flex items-center space-x-4 md:space-x-6 text-stone-500 w-full md:w-auto justify-between md:justify-start">
        <span className="flex items-center">
          <Globe size={12} className="mr-2 text-[#00E676] md:mr-2.5 md:w-[14px] md:h-[14px]" /> <span className="hidden xs:inline">Dispatch: </span>Sri Lanka
        </span>
        <span className="hidden md:block opacity-30">|</span>
        <span className="flex items-center"><span className="hidden xs:inline mr-2">Local Time:</span> {currentTime}</span>
      </div>
      <button className="hidden md:block bg-black text-white px-4 md:px-5 py-1.5 md:py-2 rounded-full hover:bg-[#FF3D00] transition-all hover:scale-105 active:scale-95 shadow-lg hover-glow">Subscribe</button>
    </div>
  );

  const LiveBanner = () => (
    <div className="flex bg-stone-950 text-white py-2 overflow-hidden whitespace-nowrap border-b border-white/10">
      <div className="flex animate-marquee items-center text-[10px] font-black uppercase tracking-[0.3em]">
        {[1, 2, 3, 4].map((i) => (
          <React.Fragment key={i}>
            <span className="mx-8 text-[#00E676]">● DISPATCH FROM GALLE</span>
            <span className="mx-8">WEATHER: 29°C HUMID</span>
            <span className="mx-8 text-[#FF3D00]">● BREAKING: NEW NOMAD VISA ANNOUNCED</span>
            <span className="mx-8">TRAIN DELAYS ON COAST LINE</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // --- COMPONENT: HOME PAGE ---
  const HomePage = () => (
    <div className="animate-in fade-in duration-700">
      <header className={`fixed top-0 w-full z-50 smooth-header header-initial-animation ${isScrolled ? 'bg-white/95 backdrop-blur-xl border-b border-stone-100 shadow-sm' : 'bg-[#FDFDFB]'}`}>
        <InfoBanner />
        <LiveBanner />
        <div className={`max-w-[1800px] mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10 ${isScrolled ? 'py-4' : 'py-8 md:py-20'}`}>
          <div className="text-center md:text-left cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => setCurrentPage('home')}>
            <h1 className={`${isScrolled ? 'text-2xl md:text-3xl' : 'text-5xl md:text-7xl'} font-black text-black uppercase tracking-tighter leading-[0.8] italic`}>
              TRAVEL<br />
              TIMES<span className="text-stone-300">.</span>
            </h1>
          </div>
          <nav className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 md:gap-10 text-[12px] md:text-[15px] font-black uppercase tracking-[0.2em]">
            {[
              { id: 'feature', label: 'Feature', icon: <Flame size={18} /> },
              { id: 'events', label: 'Journal', icon: <Calendar size={18} /> },
              { id: 'attractions', label: 'Maps', icon: <Compass size={18} /> },
              { id: 'todo', label: 'Gear', icon: <Zap size={18} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 transition-all group py-2 border-b-2 ${activeTab === tab.id ? 'text-black border-black' : 'text-stone-400 border-transparent hover:text-stone-600'}`}
              >
                <span className={`transition-colors ${activeTab === tab.id ? 'text-[#00E676]' : 'text-stone-300 group-hover:text-stone-400'}`}>{tab.icon}</span>
                <span className="tracking-[0.25em]">{tab.label}</span>
              </button>
            ))}
            <button className="text-stone-400 hover:text-black transition-colors md:pl-6 md:border-l border-stone-200"><Search size={22} /></button>
          </nav>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 md:px-6 pb-24 pt-72 md:pt-[400px]">
        {activeTab === 'feature' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <section
              onClick={() => setCurrentPage('article')}
              className="relative aspect-[16/9] md:aspect-[21/9] bg-stone-100 overflow-hidden rounded-[40px] mb-16 group cursor-pointer shadow-2xl preserve-rounded"
            >
              <img
                src={peraheraImg}
                className="w-full h-full object-cover transition-transform duration-[8000ms] group-hover:scale-105 parallax-image scale-110"
                style={{ transform: `translateY(${parallaxOffset}px) scale(1.1)` }}
                alt="Kandy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 md:p-20 text-white max-w-5xl">
                <div className="flex items-center space-x-4 mb-8">
                  <span className="inline-block bg-[#FF3D00] text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-sm">Cover Story</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 italic">Issue 04: The Relic</span>
                </div>
                <h2 className="fluid-headline-home font-black uppercase tracking-tighter italic mb-10">
                  THE FIRE <br />OF KANDY.
                </h2>
                <div className="flex items-center space-x-10 text-[12px] font-black uppercase tracking-widest opacity-80">
                  <span className="flex items-center"><User size={14} className="mr-2" /> Editorial Reportage</span>
                  <span>•</span>
                  <span>8 Min Read →</span>
                </div>
              </div>
              <button className="absolute bottom-12 right-12 md:bottom-20 md:right-20 w-24 h-24 bg-white rounded-full flex items-center justify-center hover:bg-[#00E676] hover:scale-110 transition-all group shadow-2xl hover-glow animate-float">
                <ArrowUpRight size={40} className="text-black group-hover:rotate-45 transition-transform" />
              </button>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24 items-start">
              <div className="lg:col-span-5 lg:border-r border-stone-100 lg:pr-16">
                <SectionHeader title="The Insider's Pulse" subtitle="Travel Dispatch" color="#FF3D00" />
                <p className="text-2xl md:text-3xl font-serif italic text-stone-600 leading-relaxed mb-10">
                  "Sri Lanka is not a destination you visit; it is a rhythm you learn to follow. From the misty heights of the tea country to the salt-spray of the southern coast."
                </p>
                <div className="flex space-x-6 items-center border-t border-stone-100 pt-10">
                  <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 border border-stone-100 shadow-inner">
                    <Quote size={28} />
                  </div>
                  <div>
                    <p className="font-black uppercase text-sm tracking-widest">Travel Times Official</p>
                    <p className="text-[10px] uppercase text-stone-400 tracking-widest">Field Correspondent • Colombo</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="group cursor-pointer animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 hover-lift bg-white rounded-[40px] p-6 shadow-lg">
                  <div className="aspect-[4/5] overflow-hidden rounded-[28px] mb-6 bg-stone-100">
                    <img src={trainImg} className="w-full h-full object-cover transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-110" alt="Train" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00E676] mb-2 block">The Blue Line</span>
                  <h4 className="text-3xl font-black uppercase tracking-tight italic leading-tight">Ella to Kandy: The Slowest Express</h4>
                </div>
                <div className="group cursor-pointer animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 hover-lift bg-white rounded-[40px] p-6 shadow-lg">
                  <div className="aspect-[4/5] overflow-hidden rounded-[28px] mb-6 bg-stone-100">
                    <img src={teaImg} className="w-full h-full object-cover transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-110" alt="Tea" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF3D00] mb-2 block">Heritage</span>
                  <h4 className="text-3xl font-black uppercase tracking-tight italic leading-tight">Dambatenne: Lipton's Lost Trail</h4>
                </div>
              </div>
            </section>

            {/* Instagram-style Photo Gallery */}
            <section className="mb-24">
              <SectionHeader title="Visual Stories" subtitle="From The Field" color="#FFD600" />

              <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-6 gap-4">
                <div className="col-span-2 row-span-2 group cursor-pointer overflow-hidden rounded-[32px] shadow-xl relative animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <img
                    src={beachImg}
                    loading="lazy"
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                    alt="Gallery 1"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute bottom-6 left-6 text-white">
                      <p className="text-sm font-black uppercase tracking-widest">Southern Paradise</p>
                      <p className="text-xs opacity-80">Mirissa Beach • 2026</p>
                    </div>
                  </div>
                </div>

                <div className="col-span-1 row-span-1 group cursor-pointer overflow-hidden rounded-[24px] shadow-xl relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                  <img
                    src={templeImg}
                    loading="lazy"
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                    alt="Gallery 2"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <ArrowUpRight size={20} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="col-span-1 row-span-1 group cursor-pointer overflow-hidden rounded-[24px] shadow-xl relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                  <img
                    src={wildlifeImg}
                    loading="lazy"
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                    alt="Gallery 3"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <ArrowUpRight size={20} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="col-span-1 row-span-1 group cursor-pointer overflow-hidden rounded-[24px] shadow-xl relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700">
                  <img
                    src={surfImg}
                    loading="lazy"
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                    alt="Gallery 4"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <ArrowUpRight size={20} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="col-span-1 row-span-1 group cursor-pointer overflow-hidden rounded-[24px] shadow-xl relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-1000">
                  <img
                    src={foodImg}
                    loading="lazy"
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                    alt="Gallery 5"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <ArrowUpRight size={20} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="col-span-1 row-span-1 group cursor-pointer overflow-hidden rounded-[24px] shadow-xl relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                  <img
                    src={trainImg}
                    loading="lazy"
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                    alt="Gallery 6"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <ArrowUpRight size={20} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="col-span-1 row-span-1 group cursor-pointer overflow-hidden rounded-[24px] shadow-xl relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                  <img
                    src={marketImg}
                    loading="lazy"
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                    alt="Gallery 7"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <ArrowUpRight size={20} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="col-span-2 row-span-1 group cursor-pointer overflow-hidden rounded-[32px] shadow-xl relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700">
                  <img
                    src={teaImg}
                    loading="lazy"
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                    alt="Gallery 8"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute bottom-6 left-6 text-white">
                      <p className="text-sm font-black uppercase tracking-widest">Highland Majesty</p>
                      <p className="text-xs opacity-80">Nuwara Eliya • 2026</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 text-center">
                <button className="bg-black text-white px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest hover:bg-[#00E676] hover:scale-105 transition-all shadow-xl hover-glow">
                  View Full Gallery
                </button>
              </div>
            </section>

            {/* Featured Destinations */}
            <section className="mb-24">
              <SectionHeader title="Top Destinations" subtitle="Must-Visit Places" color="#FF3D00" />

              <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-8">
                <div className="group cursor-pointer hover-lift">
                  <div className="aspect-[3/4] overflow-hidden rounded-[32px] mb-6 bg-stone-100 shadow-xl relative">
                    <img src={beachImg} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Beach" />
                    <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm text-black text-xs font-black px-4 py-2 rounded-full">
                      COASTAL
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00E676] mb-2 block">Southern Coast</span>
                  <h4 className="text-3xl font-black uppercase tracking-tight italic leading-tight mb-3">Galle & Mirissa</h4>
                  <p className="text-sm text-stone-500 leading-relaxed">Colonial charm meets turquoise waters in the island's southern paradise.</p>
                </div>

                <div className="group cursor-pointer hover-lift">
                  <div className="aspect-[3/4] overflow-hidden rounded-[32px] mb-6 bg-stone-100 shadow-xl relative">
                    <img src={wildlifeImg} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Wildlife" />
                    <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm text-black text-xs font-black px-4 py-2 rounded-full">
                      SAFARI
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FFD600] mb-2 block">National Parks</span>
                  <h4 className="text-3xl font-black uppercase tracking-tight italic leading-tight mb-3">Yala & Udawalawe</h4>
                  <p className="text-sm text-stone-500 leading-relaxed">Encounter leopards, elephants, and exotic wildlife in pristine habitats.</p>
                </div>

                <div className="group cursor-pointer hover-lift">
                  <div className="aspect-[3/4] overflow-hidden rounded-[32px] mb-6 bg-stone-100 shadow-xl relative">
                    <img src={templeImg} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Temple" />
                    <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm text-black text-xs font-black px-4 py-2 rounded-full">
                      HERITAGE
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF3D00] mb-2 block">Cultural Triangle</span>
                  <h4 className="text-3xl font-black uppercase tracking-tight italic leading-tight mb-3">Ancient Kingdoms</h4>
                  <p className="text-sm text-stone-500 leading-relaxed">Explore 2,000 years of Buddhist civilization across sacred sites.</p>
                </div>
              </div>
            </section>

            {/* Experience Cards */}
            <section className="mb-24">
              <SectionHeader title="Experiences" subtitle="Immersive Adventures" color="#00E676" />

              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-8">
                <div className="group cursor-pointer bg-gradient-to-br from-stone-50 to-stone-100 rounded-[40px] p-10 hover-lift">
                  <div className="aspect-video overflow-hidden rounded-[24px] mb-6 shadow-lg">
                    <img src={surfImg} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Surf" />
                  </div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Active Adventure</span>
                  </div>
                  <h4 className="text-4xl font-black uppercase tracking-tight italic leading-tight mb-4">Surf The East</h4>
                  <p className="text-stone-600 leading-relaxed mb-6">Catch world-class waves at Arugam Bay, rated among Asia's best surf spots.</p>
                  <button className="text-sm font-black uppercase tracking-widest text-[#00E676] flex items-center space-x-2 group-hover:underline">
                    <span>Learn More</span>
                    <ArrowUpRight size={16} />
                  </button>
                </div>

                <div className="group cursor-pointer bg-gradient-to-br from-stone-50 to-stone-100 rounded-[40px] p-10 hover-lift">
                  <div className="aspect-video overflow-hidden rounded-[24px] mb-6 shadow-lg">
                    <img src={foodImg} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Food" />
                  </div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#FF3D00] animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Culinary Journey</span>
                  </div>
                  <h4 className="text-4xl font-black uppercase tracking-tight italic leading-tight mb-4">Spice Route</h4>
                  <p className="text-stone-600 leading-relaxed mb-6">Taste authentic flavors from street food to fine dining across the island.</p>
                  <button className="text-sm font-black uppercase tracking-widest text-[#FF3D00] flex items-center space-x-2 group-hover:underline">
                    <span>Explore More</span>
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );

  // --- COMPONENT: ARTICLE PAGE ---
  const ArticlePage = () => {
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
      setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;

      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      // Right swipe goes back to home
      if (isRightSwipe) {
        setCurrentPage('home');
      }
    };

    // Removed scroll-based selection to prevent map flickering
    // Selection now only happens on hover or click

    const accommodations = useMemo(() => [
      {
        id: 0,
        name: "Queen's Hotel",
        type: "Victorian Landmark",
        description: "A living museum standing for over 160 years. Facing the Temple of the Tooth, its grand ballrooms and vintage lifts whisper secrets of the British Raj.",
        price: "$$$",
        image: "https://images.unsplash.com/photo-1590073844006-33379778ae09?q=80&w=2000&auto=format&fit=crop",
        tags: ["Iconic", "Historic", "Central"],
        coords: { x: 45, y: 40 }, // Position on custom SVG map
        latLng: [7.2938, 80.6408] // Real coordinates for Leaflet
      },
      {
        id: 1,
        name: "Hotel Suisse",
        type: "Colonial Manor",
        description: "Set in a lush garden by the Kandy Lake, this former residence of a Chieftain offers a serene escape with old-world charm and sweeping corridors.",
        price: "$$$",
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop",
        tags: ["Heritage", "Lakefront", "Classic"],
        coords: { x: 75, y: 65 },
        latLng: [7.2920, 80.6425]
      },
      {
        id: 2,
        name: "The Grand Kandyan",
        type: "Luxury Palatial Resort",
        description: "Perched on a hill with 360-degree views of the mist-covered mountains, combining traditional Kandyan aesthetics with modern 5-star opulence.",
        price: "$$$$",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop",
        tags: ["Luxury", "Mountain View", "Grandeur"],
        coords: { x: 25, y: 15 },
        latLng: [7.2975, 80.6350]
      }
    ], []);

    // Kandy Perahera Route (approximate path around Temple of the Tooth and Kandy Lake)
    const peraheraRoute = useMemo(() => [
      [7.2940, 80.6410], // Start at Temple of the Tooth
      [7.2935, 80.6420], // Along Dalada Veediya
      [7.2925, 80.6430], // Near Queen's Hotel area
      [7.2915, 80.6425], // Along the lake
      [7.2910, 80.6415], // Lakeside path
      [7.2905, 80.6400], // South side of lake
      [7.2900, 80.6385], // Continuing around
      [7.2905, 80.6370], // Western shore
      [7.2915, 80.6360], // North-west corner
      [7.2925, 80.6355], // Heading back north
      [7.2935, 80.6365], // Approaching temple
      [7.2940, 80.6380], // Near temple complex
      [7.2945, 80.6395], // Final approach
      [7.2940, 80.6410]  // Complete the circuit
    ], []);

    const mapStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);

    return (
      <div
        className="animate-in fade-in slide-in-from-right-4 duration-700"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="fixed top-0 left-0 h-1.5 bg-[#FF3D00] z-[100] transition-all duration-100" style={{ width: `${scrollProgress}%` }} />

        <div className="fixed top-0 w-full z-50 smooth-header header-initial-animation">
          <InfoBanner />
          <LiveBanner />
          <nav className="bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 md:px-6 py-3 md:py-5 flex justify-between items-center shadow-sm">
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center space-x-2 md:space-x-3 text-[10px] md:text-[12px] font-black uppercase tracking-widest hover:text-[#00E676] transition-colors"
            >
              <ArrowLeft size={14} className="md:w-[16px] md:h-[16px]" />
              <span className="hidden sm:inline">Back to Dispatch</span>
            </button>
            <div className="cursor-pointer" onClick={() => setCurrentPage('home')}>
              <h1 className="text-lg md:text-2xl font-black uppercase tracking-tighter italic leading-none">
                TRAVEL TIMES<span className="text-stone-300">.</span>
              </h1>
            </div>
            <div className="flex items-center space-x-3 md:space-x-6 text-stone-400">
              <Bookmark size={18} className="cursor-pointer hover:text-[#00E676] transition-colors md:w-[20px] md:h-[20px]" />
              <Share2 size={18} className="cursor-pointer hover:text-[#00E676] transition-colors md:w-[20px] md:h-[20px]" />
            </div>
          </nav>
        </div>

        <header className="relative w-full min-h-[70vh] sm:min-h-[80vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden mb-4 bg-[#FDFDFB]">
          <img
            src={peraheraImg}
            className="absolute inset-0 w-full h-full object-cover object-bottom"
            alt="Kandy Perahera Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFDFB] via-black/40 to-black/30"></div>

          <div className="relative z-10 w-full h-full flex items-center justify-center px-6">
            <div className="w-full max-w-6xl mx-auto text-center pt-20 sm:pt-28 md:pt-36 pb-10 md:pb-16 flex flex-col items-center">
              <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 mb-8">
                <span className="bg-[#FF3D00] text-white text-[11px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-sm">Cover Story</span>
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">Vol 04 • Edition 01</span>
              </div>
              <h1 className="hero-title font-black uppercase tracking-tighter italic mb-8 md:mb-10 text-white drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]">
                KANDY ESALA <br /><span className="text-white/40">PERAHERA.</span>
              </h1>
              <p className="hero-subtitle font-serif italic text-white/90 mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-xl">
                Truth and the myth of the pageant: Unraveling the 1,500-year-old tradition of the Sacred Tooth Relic.
              </p>

              <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-white">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 md:px-8 py-3 md:py-4 rounded-2xl flex flex-col items-center min-w-[140px] md:min-w-[180px]">
                  <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">Author</p>
                  <p className="text-xs md:text-sm font-black uppercase tracking-widest">Sanath Weerasuriya</p>
                </div>

                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 md:px-8 py-3 md:py-4 rounded-2xl flex flex-col items-center min-w-[140px] md:min-w-[180px]">
                  <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">Location</p>
                  <p className="text-xs md:text-sm font-black uppercase tracking-widest flex items-center">
                    <MapPin size={12} className="mr-2 animate-dynamic-color" /> Kandy, Sri Lanka
                  </p>
                </div>

                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 md:px-8 py-3 md:py-4 rounded-2xl flex flex-col items-center min-w-[140px] md:min-w-[180px]">
                  <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">Read Time</p>
                  <p className="text-xs md:text-sm font-black uppercase tracking-widest flex items-center">
                    <Clock size={12} className="mr-2 animate-dynamic-color-delay" /> 8 Min Read
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="px-6 max-w-7xl mx-auto mb-20 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <div className="bg-white p-4 rounded-[40px] shadow-2xl border border-stone-100 lg:col-span-1">
              <img src={extraImg1} loading="lazy" className="w-full aspect-[3/4] object-cover rounded-[32px]" alt="Procession Detail 1" />
              <div className="mt-4 px-6 flex justify-between items-center pb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 italic">Plate 01: Emblems</p>
                <Layers size={14} className="text-stone-300" />
              </div>
            </div>

            <div className="bg-[#FFD600] p-4 rounded-[40px] shadow-2xl lg:col-span-1 flex flex-col">
              <img src={extraImg2} loading="lazy" className="w-full aspect-[3/4] object-cover rounded-[32px]" alt="Procession Detail 2" />
              <div className="mt-4 px-6 flex justify-between items-center pb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-950 italic">Plate 02: Rituals</p>
                <Flame size={14} className="text-stone-950" />
              </div>
            </div>

            <div className="bg-stone-950 p-4 rounded-[40px] shadow-2xl lg:col-span-1 flex flex-col">
              <img src={extraImg3} loading="lazy" className="w-full aspect-[3/4] object-cover rounded-[32px]" alt="Procession Detail 3" />
              <div className="mt-4 px-6 flex justify-between items-center text-white pb-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">Plate 03: The Guard</p>
                <Compass size={14} className="text-[#00E676]" />
              </div>
            </div>
          </div>
        </section>

        <article className="max-w-4xl mx-auto px-6 pb-20">
          <div className="font-serif text-2xl md:text-3xl leading-[1.8] text-stone-800 space-y-12">
            <p className="first-letter:text-9xl first-letter:font-black first-letter:float-left first-letter:mr-6 first-letter:leading-none first-letter:text-[#FF3D00]">
              The historic ‘Esala Perahera’ in Kandy, one of the oldest and grandest Cultural festivals in Sri Lanka, perhaps, in the world started on Friday, 29 July with the cap planting (‘cap situveema’). This will continue for 15 days with four Devala Peraheras, Kumbal Perahera and colourful Randoli followed by ‘day perahera’ on Friday, 12th August.
            </p>

            <p>
              This year’s ‘Esala Perehara’ is the first grand pageant after two years with no restrictions due to Covid Pandemic but blessed with heavy showers and bad weather. Despite the warning of re-emerging of Covid threat massive crowds turned up for the Kumbal Perhaera on Tuesday and Wednesday.
            </p>

            <div className="bg-white border-l-8 border-[#00E676] p-12 my-20 shadow-2xl rounded-r-[40px] not-italic">
              <p className="font-sans text-[12px] font-black uppercase tracking-[0.4em] text-[#00E676] mb-6 flex items-center">
                <Info size={18} className="mr-3" /> Global Draw
              </p>
              <p className="font-serif text-3xl md:text-4xl text-black leading-snug italic">
                "‘Esala Perahera’, for centuries, has drawn religious devotees from around the world and more recently tourists, to Kandy’s narrow hill-streets."
              </p>
            </div>

            <p>
              Heralded by thousands of Kandyan drummers, a host of majestic elephants, adorned in elaborately embroidered cloaks, are led by the brilliantly caparisoned Maligawa Tusker. Decorated from trunk to toe, he carries a huge canopy that shelters, a replica of the cask containing the Sacred Tooth Relic of the Lord Buddha.
            </p>

            <div className="my-24 bg-stone-50 rounded-[60px] p-10 md:p-16 border border-stone-100 shadow-inner">
              <div className="flex items-center space-x-4 mb-10">
                <Star size={20} className="text-[#FFD600] fill-[#FFD600]" />
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-stone-400">The Top Attraction</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <div className="bg-[#FFD600] inline-block px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest text-black">Lead Tusker</div>
                  <h4 className="text-6xl font-black uppercase tracking-tighter italic leading-none">SINHA RAJA</h4>
                  <p className="font-serif italic text-xl text-stone-600 leading-relaxed text-left">
                    Carrying the golden Karanduwa, Sinha Raja is the top attraction of the Perahera this year.
                  </p>
                </div>

                <div className="bg-white p-10 rounded-[40px] border border-stone-100 shadow-xl space-y-6">
                  <p className="text-[12px] font-black uppercase tracking-[0.3em] text-stone-400">The Guard</p>
                  <p className="font-serif text-2xl text-stone-800 leading-tight">
                    "Flanked by <span className="text-black font-bold underline decoration-[#FFD600] decoration-4">Myan Raja</span> and <span className="text-black font-bold underline decoration-[#FFD600] decoration-4">Buruma Raja</span> on either side."
                  </p>
                  <div className="pt-6 border-t border-stone-50 flex items-center text-[11px] font-black uppercase tracking-[0.3em] text-[#00E676]">
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

        <section className="bg-gradient-to-br from-[#FDFDFB] via-stone-50 to-stone-100 text-stone-950 py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-flex items-center space-x-3 mb-6 bg-[#00E676]/10 px-6 py-3 rounded-full">
                <MapPin size={16} className="text-[#00E676]" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#00E676]">Where to Stay</h3>
              </div>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
                KANDY'S<br />
                <span className="bg-gradient-to-r from-stone-950 via-stone-700 to-stone-950 bg-clip-text text-transparent">FINEST STAYS</span>
              </h2>
              <p className="text-xl text-stone-600 max-w-2xl mx-auto font-serif italic">
                Curated accommodations that blend heritage charm with modern luxury
              </p>
            </div>

            {/* INTEGRATED MAP AND LISTING */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

              {/* Leaflet Map */}
              <div className="lg:col-span-5 sticky top-32 hidden lg:block z-40" style={{ willChange: 'transform' }}>
                <div className="relative aspect-[4/5] rounded-3xl border-2 border-stone-200 overflow-hidden shadow-xl bg-white" style={{ isolation: 'isolate' }}>
                  <MapContainer
                    center={[7.2906, 80.6337]}
                    zoom={14}
                    style={mapStyle}
                    className="z-10"
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapViewController
                      center={accommodations[selectedHotel]?.latLng}
                    />
                    {/* Perahera Route */}
                    <Polyline
                      positions={peraheraRoute}
                      pathOptions={{
                        color: '#FF3D00',
                        weight: 4,
                        opacity: 0.7,
                        dashArray: '10, 10',
                        lineJoin: 'round',
                        className: 'perahera-route'
                      }}
                    >
                      <Popup>
                        <div className="text-center py-2">
                          <h3 className="font-black text-sm uppercase text-[#FF3D00] mb-2">Kandy Esala Perahera Route</h3>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            The sacred procession path around the Temple of the Tooth and Kandy Lake
                          </p>
                        </div>
                      </Popup>
                    </Polyline>
                    {/* Temple of the Tooth Marker */}
                    <Marker position={[7.2940, 80.6410]} icon={templeIcon}>
                      <Popup>
                        <div className="text-center py-2">
                          <h3 className="font-black text-sm uppercase mb-1">Temple of the Tooth</h3>
                          <p className="text-xs text-stone-600 mb-1">Sri Dalada Maligawa</p>
                          <p className="text-[10px] text-[#FF3D00] font-bold">Starting Point of Perahera</p>
                        </div>
                      </Popup>
                    </Marker>
                    {accommodations.map((hotel, idx) => (
                      <Marker
                        key={idx}
                        position={hotel.latLng}
                        icon={defaultIcon}
                        eventHandlers={{
                          click: () => setSelectedHotel(idx),
                        }}
                      >
                        <Popup>
                          <div className="text-center">
                            <h3 className="font-black text-sm uppercase">{hotel.name}</h3>
                            <p className="text-xs text-stone-600">{hotel.type}</p>
                            <p className={`text-xs font-bold mt-1 ${selectedHotel === idx ? 'text-[#00E676]' : 'text-stone-500'}`}>
                              {selectedHotel === idx ? '● ' : ''}{hotel.price}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>

                  {/* Legend */}
                  <div className="absolute bottom-6 left-6 right-6 z-[1000] bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-stone-200">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-[#00E676]"></div>
                        <span className="font-bold text-stone-700">Selected</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} className="text-blue-500" />
                        <span className="font-bold text-stone-700">Hotels</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-[#FF3D00] border-2 border-white"></div>
                        <span className="font-bold text-stone-700">Temple</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-0.5 w-4 bg-[#FF3D00] opacity-70" style={{ borderTop: '2px dashed #FF3D00' }}></div>
                        <span className="font-bold text-stone-700">Route</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hotel Listing Column */}
              <div className="lg:col-span-7 space-y-8 hotel-scroll-container">
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
                      style={selectedHotel === idx ? { animation: 'pulse-border 2s ease-in-out' } : {}}
                    >
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <img
                          src={hotel.image}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          alt={hotel.name}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                        {/* Price Badge */}
                        <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm text-black text-xs font-black px-4 py-2 rounded-full flex items-center shadow-lg">
                          <span className="mr-2">💰</span> {hotel.price}
                        </div>

                        {/* Selected Indicator */}
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
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#1a1a1a] font-sans selection:bg-[#00E676] selection:text-white">
      {currentPage === 'home' ? <HomePage /> : <ArticlePage />}

      <footer className="bg-stone-950 text-white pt-40 pb-16 px-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-[#00E676] blur-[200px] opacity-10 rounded-full"></div>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-32 gap-12">
            <div className="cursor-pointer group" onClick={() => setCurrentPage('home')}>
              <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none mb-3 group-hover:text-[#00E676] transition-colors">TRAVEL</h2>
              <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none text-stone-800">TIMES<span className="text-stone-700">.</span></h2>
            </div>
            <div className="text-right space-y-4">
              <p className="text-[12px] font-black uppercase tracking-[0.5em] text-stone-500">Curating the Island rhythm since 2012</p>
            </div>
          </div>
          <div className="border-t border-white/5 pt-16 flex flex-col md:flex-row justify-between items-center text-[11px] font-black uppercase tracking-[0.5em] text-stone-700">
            <p>© 2026 TRAVEL TIMES ARCHIVE • COLOMBO</p>
            <p>DESIGNED FOR THE MODERN TRAVELER</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 40s linear infinite;
        }
        
        @keyframes dynamicColor {
          0% { color: #00E676; }
          33% { color: #FF3D00; }
          66% { color: #FFD600; }
          100% { color: #00E676; }
        }

        .animate-dynamic-color {
          animation: dynamicColor 8s infinite ease-in-out;
        }

        .animate-dynamic-color-delay {
          animation: dynamicColor 8s infinite ease-in-out;
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default App;
