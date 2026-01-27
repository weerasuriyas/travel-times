import React from 'react';
import { Globe, Clock, Quote, Flame, Calendar, Compass, Zap, Search } from 'lucide-react';

export const SectionHeader = ({ title, subtitle, color = "#00E676" }) => (
    <div className="mb-8 sm:mb-10 md:mb-12">
        <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
            <div className="h-[2px] w-8 sm:w-10 md:w-12" style={{ backgroundColor: color }}></div>
            <h3 className="text-[9px] sm:text-[10px] md:text-[11px] font-sans font-black uppercase tracking-[0.4em] text-stone-400">{subtitle}</h3>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black uppercase tracking-tighter leading-none italic">{title}</h2>
    </div>
);

export const InfoBanner = ({ currentTime }) => (
    <div className="flex bg-white border-b border-stone-100 py-1.5 md:py-2.5 px-4 md:px-6 flex-wrap md:flex-nowrap justify-between items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">
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

// Modern minimal status bar - Ultra minimal with accent line
export const LiveBanner = () => (
    <div className="relative h-[1px] bg-gradient-to-r from-transparent via-stone-200 to-transparent">
        <div className="absolute left-1/2 -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-[#00E676] to-transparent"></div>
    </div>
);

// Shared Header Component
export const SharedHeader = ({ setCurrentPage, activeTab, setActiveTab, isScrolled, showTabs = true }) => {
    return (
        <header className={`fixed top-0 w-full z-50 smooth-header header-initial-animation ${isScrolled ? 'bg-white/95 backdrop-blur-xl border-b border-stone-100 shadow-sm' : 'bg-[#FDFDFB]'}`}>
            <InfoBanner />
            <LiveBanner />
            <div className={`max-w-[1800px] mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-5 ${isScrolled ? 'py-2' : 'py-3 md:py-5'}`}>
                <div className="text-center md:text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" onClick={() => setCurrentPage('home')}>
                    <h1 className={`${isScrolled ? 'text-2xl md:text-3xl' : 'text-2xl md:text-4xl lg:text-5xl'} font-black text-black uppercase tracking-tighter leading-[0.8] italic transition-all duration-300`}>
                        TRAVEL<br />
                        TIMES<span className="text-stone-300">.</span>
                    </h1>
                </div>
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
                        <button className="ml-1.5 md:ml-3 flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-stone-50 text-stone-600 hover:bg-black hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md">
                            <Search size={16} />
                        </button>
                    </nav>
                )}
            </div>
        </header>
    );
};
