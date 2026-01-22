import React from 'react';
import { Flame, Calendar, Compass, Zap, Search, User, ArrowUpRight, Quote } from 'lucide-react';
import { SectionHeader, InfoBanner, LiveBanner } from '../components/UI';

const HomePage = ({ setCurrentPage, activeTab, setActiveTab, isScrolled, peraheraImg, parallaxOffset, trainImg, teaImg, beachImg, templeImg, wildlifeImg, surfImg, foodImg, marketImg }) => (
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

export default HomePage;
