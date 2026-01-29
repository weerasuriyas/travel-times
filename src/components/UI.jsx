import React from 'react';
import { Globe, Clock, Quote, Flame, Calendar, Compass, Zap, Search, X, TrendingUp, MapPin, Utensils } from 'lucide-react';
import { UserProfile } from './UserProfile';

export const SectionHeader = ({ title, subtitle, color = "#00E676" }) => (
  <div className="mb-12">
    <div className="flex items-center space-x-4 mb-4">
      <div className="h-[2px] w-12" style={{ backgroundColor: color }}></div>
      <h3 className="text-[11px] font-sans font-black uppercase tracking-[0.4em] text-stone-400">{subtitle}</h3>
    </div>
    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none italic">{title}</h2>
  </div>
);

export const InfoBanner = ({ currentTime }) => (
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

export const LiveBanner = () => (
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
<<<<<<< Updated upstream
=======

// Search Modal Component
export const SearchModal = ({ isOpen, onClose, setCurrentPage }) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const inputRef = React.useRef(null);

    React.useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleResultClick = (item) => {
        // Navigate based on item type
        if (item.type === 'Article') {
            // Map article titles to slugs
            const slugMap = {
                'The Fire of Kandy': 'kandy-perahera',
                'Ella to Kandy: The Slowest Express': 'ella-to-kandy',
                'Dambatenne: Lipton\'s Lost Trail': 'dambatenne-liptons-trail'
            };
            const slug = slugMap[item.title] || 'kandy-perahera';
            setCurrentPage('article', slug);
        } else if (item.type === 'Destination') {
            // Map destination titles to slugs
            const destinationSlugMap = {
                'Kandy': 'kandy',
                'Ella': 'ella',
                'Haputale': 'haputale',
                'Galle': 'galle',
                'Arugam Bay': 'arugam-bay',
                'Sigiriya': 'sigiriya'
            };
            const slug = destinationSlugMap[item.title] || item.title.toLowerCase().replace(/\s+/g, '-');
            setCurrentPage('destination', slug);
        } else {
            // For other types, stay on home or navigate to home
            setCurrentPage('home');
        }
        onClose();
    };

    const popularSearches = [
        { label: 'Kandy Perahera', icon: <Flame size={16} />, color: '#FF3D00' },
        { label: 'Best Beaches', icon: <TrendingUp size={16} />, color: '#00E676' },
        { label: 'Tea Plantations', icon: <MapPin size={16} />, color: '#FFD600' },
        { label: 'Sri Lankan Food', icon: <Utensils size={16} />, color: '#FF3D00' }
    ];

    const recentArticles = [
        { title: 'The Fire of Kandy', slug: 'kandy-perahera' },
        { title: 'Ella to Kandy: The Slowest Express', slug: 'ella-to-kandy' },
        { title: 'Dambatenne: Lipton\'s Lost Trail', slug: 'dambatenne-liptons-trail' }
    ];

    // Searchable content database
    const searchableContent = [
        { type: 'Article', title: 'The Fire of Kandy', description: 'We walked through the smoke of a thousand copra torches, following the rhythm of drums into the heart of the ancient kingdom.', tags: ['Culture', 'Festival', 'Kandy', 'Perahera', 'Buddhist'] },
        { type: 'Article', title: 'Ella to Kandy: The Slowest Express', description: 'Experience one of the world\'s most scenic train rides through tea plantations.', tags: ['Train', 'Tea', 'Scenic', 'Ella', 'Kandy', 'Hills'] },
        { type: 'Article', title: 'Dambatenne: Lipton\'s Lost Trail', description: 'Visit colonial-era plantations and learn the art of Ceylon tea production.', tags: ['Tea', 'Heritage', 'Colonial', 'Dambatenne', 'Lipton'] },
        { type: 'Destination', title: 'Kandy', description: 'The cultural capital of Sri Lanka, home to the Temple of the Tooth and the famous Esala Perahera festival.', tags: ['City', 'Culture', 'Heritage', 'Temple', 'Sacred', 'Central Province'] },
        { type: 'Destination', title: 'Ella', description: 'A charming village surrounded by tea plantations, offering breathtaking views, hiking trails, and the famous train journey.', tags: ['Village', 'Tea', 'Hiking', 'Nine Arch Bridge', 'Hill Country'] },
        { type: 'Destination', title: 'Haputale', description: 'A sleepy hill town perched on the edge of a mountain, offering stunning views and access to historic tea estates.', tags: ['Hill Town', 'Tea', 'Lipton\'s Seat', 'Dambatenne', 'Views'] },
        { type: 'Destination', title: 'Galle', description: 'A perfectly preserved colonial town with Dutch architecture, rampart walls, and pristine beaches.', tags: ['Beach', 'Coastal', 'Colonial', 'Fort', 'Dutch', 'Southern'] },
        { type: 'Destination', title: 'Arugam Bay', description: 'World-renowned surf destination with laid-back vibes, golden beaches, and perfect waves.', tags: ['Surf', 'Beach', 'Waves', 'Eastern', 'Surfing'] },
        { type: 'Destination', title: 'Sigiriya', description: 'Ancient rock fortress rising 200m above the jungle, crowned with palace ruins and stunning frescoes.', tags: ['Heritage', 'Ancient', 'UNESCO', 'Rock', 'Fortress', 'Lion Rock'] },
        { type: 'Experience', title: 'Surf The East', description: 'Catch world-class waves at Arugam Bay, rated among Asia\'s best surf spots.', tags: ['Surf', 'Beach', 'Adventure', 'Arugam Bay', 'Water Sports'] },
        { type: 'Experience', title: 'Spice Route', description: 'Taste authentic flavors from street food to fine dining across the island.', tags: ['Food', 'Culinary', 'Spices', 'Sri Lankan Cuisine'] },
        { type: 'Experience', title: 'Hill Country Express', description: 'One of the world\'s most scenic train journeys through misty tea country.', tags: ['Train', 'Scenic', 'Tea', 'Mountains', 'Journey'] },
        { type: 'Experience', title: 'Tea Estate Tours', description: 'Visit working tea plantations and learn about Ceylon tea production.', tags: ['Tea', 'Plantation', 'Heritage', 'Tour', 'Ceylon'] },
        { type: 'Accommodation', title: 'Queen\'s Hotel Kandy', description: 'A colonial gem located right in the heart of the city, adjacent to the Temple of the Tooth.', tags: ['Hotel', 'Heritage', 'Colonial', 'Kandy', 'Central'] },
        { type: 'Restaurant', title: 'White House Restaurant', description: 'Authentic Kandyan cuisine serving rice and curry with over 15 different curries daily.', tags: ['Restaurant', 'Sri Lankan', 'Kandy', 'Curry', 'Authentic'] }
    ];

    // Filter results based on search query
    const searchResults = searchQuery.trim()
        ? searchableContent.filter(item => {
            const query = searchQuery.toLowerCase();
            return (
                item.title.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                item.tags.some(tag => tag.toLowerCase().includes(query))
            );
        })
        : [];

    return (
        <div className="fixed inset-0 z-[100] animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            ></div>

            {/* Search Panel */}
            <div className="relative z-10 max-w-4xl mx-auto mt-20 md:mt-32 px-4">
                <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-top duration-300">
                    {/* Search Input */}
                    <div className="p-6 md:p-8 border-b border-stone-200">
                        <div className="flex items-center gap-4">
                            <Search size={24} className="text-stone-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search destinations, articles, experiences..."
                                className="flex-1 text-xl md:text-2xl font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none"
                            />
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Search Results / Suggestions */}
                    <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto">
                        {searchQuery ? (
                            <div>
                                <p className="text-sm text-stone-500 mb-4">
                                    {searchResults.length > 0 ? (
                                        <>Found <span className="font-bold text-stone-900">{searchResults.length}</span> result{searchResults.length !== 1 ? 's' : ''} for "<span className="font-bold text-stone-900">{searchQuery}</span>"</>
                                    ) : (
                                        <>No results found for "<span className="font-bold text-stone-900">{searchQuery}</span>"</>
                                    )}
                                </p>
                                {searchResults.length > 0 ? (
                                    <div className="space-y-3">
                                        {searchResults.map((item, idx) => {
                                            const typeColors = {
                                                'Article': '#00E676',
                                                'Destination': '#FF3D00',
                                                'Experience': '#FFD600',
                                                'Accommodation': '#00E676',
                                                'Restaurant': '#FF3D00'
                                            };
                                            const typeColor = typeColors[item.type] || '#00E676';

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleResultClick(item)}
                                                    className="w-full p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-stone-300 transition-all text-left group"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex-shrink-0 mt-0.5"
                                                            style={{
                                                                backgroundColor: `${typeColor}15`,
                                                                color: typeColor
                                                            }}
                                                        >
                                                            {item.type}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-stone-900 mb-1 group-hover:text-[#00E676] transition-colors">
                                                                {item.title}
                                                            </h4>
                                                            <p className="text-sm text-stone-600 mb-2 line-clamp-2">
                                                                {item.description}
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {item.tags.slice(0, 4).map((tag, tagIdx) => (
                                                                    <span
                                                                        key={tagIdx}
                                                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-stone-500"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                                {item.tags.length > 4 && (
                                                                    <span className="text-[10px] font-semibold px-2 py-0.5 text-stone-400">
                                                                        +{item.tags.length - 4} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Search size={48} className="text-stone-300 mx-auto mb-4" />
                                        <p className="text-stone-500 mb-2">No matches found</p>
                                        <p className="text-xs text-stone-400">Try different keywords or browse popular searches below</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Popular Searches */}
                                <div className="mb-8">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-stone-400 mb-4">
                                        Popular Searches
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {popularSearches.map((item, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSearchQuery(item.label)}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-stone-300 transition-all group"
                                            >
                                                <span style={{ color: item.color }}>
                                                    {item.icon}
                                                </span>
                                                <span className="text-sm font-bold text-stone-700">
                                                    {item.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Articles */}
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-stone-400 mb-4">
                                        Recent Articles
                                    </h3>
                                    <div className="space-y-2">
                                        {recentArticles.map((article, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setCurrentPage('article', article.slug);
                                                    onClose();
                                                }}
                                                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-stone-50 transition-colors text-left group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00E676] to-[#00C853] flex items-center justify-center flex-shrink-0">
                                                    <Clock size={18} className="text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-stone-900 group-hover:text-[#00E676] transition-colors">
                                                        {article.title}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Tips */}
                                <div className="mt-8 p-4 bg-gradient-to-br from-stone-50 to-stone-100 rounded-2xl border border-stone-200">
                                    <p className="text-xs text-stone-600">
                                        <span className="font-black">💡 Tip:</span> Try searching for destinations like "Kandy", "Ella", or experiences like "tea plantations", "beaches"
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Keyboard Shortcut Hint */}
                <div className="text-center mt-4">
                    <p className="text-xs text-white/60">
                        Press <kbd className="px-2 py-1 bg-white/10 rounded text-white/80 font-mono">ESC</kbd> to close
                    </p>
                </div>
            </div>
        </div>
    );
};

// Shared Header Component
export const SharedHeader = ({ setCurrentPage, activeTab, setActiveTab, isScrolled, showTabs = true }) => {
    const [currentTime, setCurrentTime] = React.useState(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Colombo'
    }));
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Colombo'
            }));
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    return (
        <header className={`fixed top-0 w-full z-50 smooth-header header-initial-animation ${isScrolled ? 'bg-white/95 backdrop-blur-xl border-b border-stone-100 shadow-sm' : 'bg-[#FDFDFB]'}`}>
            <InfoBanner currentTime={currentTime} />
            <LiveBanner />
            <div className={`max-w-[1800px] mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-5 ${isScrolled ? 'py-2' : 'py-3 md:py-5'}`}>
                <div className="text-center md:text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" onClick={() => setCurrentPage('home')}>
                    <h1 className={`${isScrolled ? 'text-2xl md:text-3xl' : 'text-2xl md:text-4xl lg:text-5xl'} font-black text-black uppercase tracking-tighter leading-[0.8] italic transition-all duration-300`}>
                        TRAVEL<br />
                        TIMES<span className="text-stone-300">.</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    {/* Destinations Link - Always visible */}
                    <button
                        onClick={() => setCurrentPage('destinations')}
                        className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-stone-50 text-stone-600 hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                    >
                        <MapPin size={14} />
                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em]">Destinations</span>
                    </button>

                    {showTabs && (
                        <nav className="flex flex-wrap justify-center items-center gap-1.5 md:gap-2.5">
                            {[
                                { id: 'feature', label: 'Feature', icon: <Flame size={14} />, color: '#00E676' },
                                { id: 'events', label: 'Journal', icon: <Calendar size={14} />, color: '#FF3D00' },
                                { id: 'attractions', label: 'Maps', icon: <Compass size={14} />, color: '#FFD600' },
                                { id: 'todo', label: 'Gear', icon: <Zap size={14} />, color: '#00E676' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all duration-300 group ${
                                        activeTab === tab.id
                                            ? 'bg-black text-white shadow-lg scale-105'
                                            : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-black hover:scale-105 active:scale-95'
                                    }`}
                                >
                                    <span className={`transition-all duration-300 ${activeTab === tab.id ? 'text-white' : 'text-stone-400 group-hover:text-black'}`}>
                                        {tab.icon}
                                    </span>
                                    <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${isScrolled ? 'hidden md:inline' : ''}`}>
                                        {tab.label}
                                    </span>
                                    {activeTab === tab.id && (
                                        <div
                                            className="absolute inset-0 rounded-full opacity-10 animate-pulse"
                                            style={{ backgroundColor: tab.color }}
                                        ></div>
                                    )}
                                </button>
                            ))}
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="ml-1.5 md:ml-3 flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-stone-50 text-stone-600 hover:bg-black hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                            >
                                <Search size={16} />
                            </button>
                        </nav>
                    )}
                    <UserProfile setCurrentPage={setCurrentPage} />
                </div>
            </div>

            {/* Search Modal */}
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} setCurrentPage={setCurrentPage} />
        </header>
    );
};
>>>>>>> Stashed changes
