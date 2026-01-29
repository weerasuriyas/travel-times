import React, { memo } from 'react';
import { User, ArrowUpRight, Quote } from 'lucide-react';
import { SectionHeader, SharedHeader } from '../components/UI';

const HomePage = memo(({ setCurrentPage, activeTab, setActiveTab, isScrolled, peraheraImg, parallaxOffset, trainImg, teaImg, beachImg, templeImg, wildlifeImg, surfImg, foodImg, marketImg }) => (
    <div className="animate-in fade-in duration-700">
        <SharedHeader 
            setCurrentPage={setCurrentPage}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isScrolled={isScrolled}
            showTabs={true}
        />

        <main className="max-w-[1800px] mx-auto px-4 md:px-6 pb-24 pt-32 md:pt-48">
            {activeTab === 'feature' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <section
                        onClick={() => setCurrentPage('article', 'kandy-perahera')}
                        className="relative aspect-[16/9] md:aspect-[21/9] bg-stone-100 overflow-hidden rounded-[40px] mb-16 group cursor-pointer shadow-2xl preserve-rounded"
                    >
                        <img
                            src={peraheraImg}
                            className="w-full h-full object-cover parallax-image"
                            style={{ 
                              transform: `translateY(${parallaxOffset}px) scale(1.1)`
                            }}
                            alt="Kandy"
                            fetchPriority="high"
                            loading="eager"
                            decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-4 sm:p-6 md:p-12 lg:p-20 text-white max-w-5xl">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
                                <span className="inline-block bg-[#FF3D00] text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-black uppercase tracking-[0.3em] px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-1.5 rounded-sm">Cover Story</span>
                                <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-black uppercase tracking-[0.3em] opacity-60 italic">Issue 04: The Relic</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black uppercase tracking-tighter italic mb-4 sm:mb-6 md:mb-10 leading-[0.85]">
                                THE FIRE <br />OF KANDY.
                            </h2>
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-10 text-[10px] sm:text-[11px] md:text-[12px] font-black uppercase tracking-widest opacity-80">
                                <span className="flex items-center"><User className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1.5 sm:mr-2" /> Editorial Reportage</span>
                                <span>•</span>
                                <span>8 Min Read →</span>
                            </div>
                        </div>
                        <button className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 md:bottom-12 md:right-12 lg:bottom-20 lg:right-20 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white rounded-full flex items-center justify-center hover:bg-[#00E676] hover:scale-110 transition-all group shadow-2xl hover-glow animate-float">
                            <ArrowUpRight className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-10 lg:h-10 text-black group-hover:rotate-45 transition-transform" />
                        </button>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24 items-start">
                        <div className="lg:col-span-5 lg:border-r border-stone-100 lg:pr-16">
                            <SectionHeader title="The Insider's Pulse" subtitle="Travel Dispatch" color="#FF3D00" />
                            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif italic text-stone-600 leading-relaxed mb-6 sm:mb-8 md:mb-10">
                                "Sri Lanka is not a destination you visit; it is a rhythm you learn to follow. From the misty heights of the tea country to the salt-spray of the southern coast."
                            </p>
                            <div className="flex space-x-6 items-center border-t border-stone-100 pt-10">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 border border-stone-100 shadow-inner">
                                    <Quote className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                                </div>
                                <div>
                                    <p className="font-black uppercase text-xs sm:text-sm tracking-widest">Travel Times Official</p>
                                    <p className="text-[10px] uppercase text-stone-400 tracking-widest">Field Correspondent • Colombo</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div
                                onClick={() => setCurrentPage('article', 'ella-to-kandy')}
                                className="group cursor-pointer animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 hover-lift bg-white rounded-[40px] p-6 shadow-lg"
                            >
                                <div className="aspect-[4/5] overflow-hidden rounded-[28px] mb-6 bg-stone-100">
                                    <img src={trainImg} className="w-full h-full object-cover transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-110" alt="Train" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#00E676] mb-2 block">The Blue Line</span>
                                <h4 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight italic leading-tight">Ella to Kandy: The Slowest Express</h4>
                            </div>
                            <div
                                onClick={() => setCurrentPage('article', 'dambatenne-liptons-trail')}
                                className="group cursor-pointer animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 hover-lift bg-white rounded-[40px] p-6 shadow-lg"
                            >
                                <div className="aspect-[4/5] overflow-hidden rounded-[28px] mb-6 bg-stone-100">
                                    <img src={teaImg} className="w-full h-full object-cover transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-110" alt="Tea" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF3D00] mb-2 block">Heritage</span>
                                <h4 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight italic leading-tight">Dambatenne: Lipton's Lost Trail</h4>
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
                                        <p className="text-xs sm:text-sm font-black uppercase tracking-widest">Southern Paradise</p>
                                        <p className="text-[10px] sm:text-xs opacity-80">Mirissa Beach • 2026</p>
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
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                                        <p className="text-xs sm:text-sm font-black uppercase tracking-widest">Highland Majesty</p>
                                        <p className="text-[10px] sm:text-xs opacity-80">Nuwara Eliya • 2026</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 text-center">
                            <button className="bg-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-[#00E676] hover:scale-105 transition-all shadow-xl hover-glow">
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
                                    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/90 backdrop-blur-sm text-black text-[9px] sm:text-[10px] md:text-xs font-black px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full">
                                        COASTAL
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#00E676] mb-2 block">Southern Coast</span>
                                <h4 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight italic leading-tight mb-3">Galle & Mirissa</h4>
                                <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">Colonial charm meets turquoise waters in the island's southern paradise.</p>
                            </div>

                            <div className="group cursor-pointer hover-lift">
                                <div className="aspect-[3/4] overflow-hidden rounded-[32px] mb-6 bg-stone-100 shadow-xl relative">
                                    <img src={wildlifeImg} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Wildlife" />
                                    <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm text-black text-xs font-black px-4 py-2 rounded-full">
                                        SAFARI
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#FFD600] mb-2 block">National Parks</span>
                                <h4 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight italic leading-tight mb-3">Yala & Udawalawe</h4>
                                <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">Encounter leopards, elephants, and exotic wildlife in pristine habitats.</p>
                            </div>

                            <div className="group cursor-pointer hover-lift">
                                <div className="aspect-[3/4] overflow-hidden rounded-[32px] mb-6 bg-stone-100 shadow-xl relative">
                                    <img src={templeImg} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Temple" />
                                    <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm text-black text-xs font-black px-4 py-2 rounded-full">
                                        HERITAGE
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF3D00] mb-2 block">Cultural Triangle</span>
                                <h4 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight italic leading-tight mb-3">Ancient Kingdoms</h4>
                                <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">Explore 2,000 years of Buddhist civilization across sacred sites.</p>
                            </div>
                        </div>
                    </section>

                    {/* Experience Cards */}
                    <section className="mb-24">
                        <SectionHeader title="Experiences" subtitle="Immersive Adventures" color="#00E676" />

                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-8">
                            <div className="group cursor-pointer bg-gradient-to-br from-stone-50 to-stone-100 rounded-[40px] p-6 sm:p-8 md:p-10 hover-lift">
                                <div className="aspect-video overflow-hidden rounded-[24px] mb-6 shadow-lg">
                                    <img src={surfImg} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Surf" />
                                </div>
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Active Adventure</span>
                                </div>
                                <h4 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight italic leading-tight mb-4">Surf The East</h4>
                                <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-6">Catch world-class waves at Arugam Bay, rated among Asia's best surf spots.</p>
                                <button className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#00E676] flex items-center space-x-2 group-hover:underline">
                                    <span>Learn More</span>
                                    <ArrowUpRight size={16} />
                                </button>
                            </div>

                            <div className="group cursor-pointer bg-gradient-to-br from-stone-50 to-stone-100 rounded-[40px] p-6 sm:p-8 md:p-10 hover-lift">
                                <div className="aspect-video overflow-hidden rounded-[24px] mb-6 shadow-lg">
                                    <img src={foodImg} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Food" />
                                </div>
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-[#FF3D00] animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Culinary Journey</span>
                                </div>
                                <h4 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight italic leading-tight mb-4">Spice Route</h4>
                                <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-6">Taste authentic flavors from street food to fine dining across the island.</p>
                                <button className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#FF3D00] flex items-center space-x-2 group-hover:underline">
                                    <span>Explore More</span>
                                    <ArrowUpRight size={16} />
                                </button>
                            </div>

                            <div
                                onClick={() => setCurrentPage('article', 'ella-to-kandy')}
                                className="group cursor-pointer bg-gradient-to-br from-stone-50 to-stone-100 rounded-[40px] p-6 sm:p-8 md:p-10 hover-lift"
                            >
                                <div className="aspect-video overflow-hidden rounded-[24px] mb-6 shadow-lg">
                                    <img src={trainImg} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Train" />
                                </div>
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-[#FFD600] animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Scenic Journey</span>
                                </div>
                                <h4 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight italic leading-tight mb-4">Hill Country Express</h4>
                                <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-6">Experience one of the world's most scenic train rides through tea plantations.</p>
                                <div className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#FFD600] flex items-center space-x-2 group-hover:underline pointer-events-none">
                                    <span>Book Journey</span>
                                    <ArrowUpRight size={16} />
                                </div>
                            </div>

                            <div
                                onClick={() => setCurrentPage('article', 'dambatenne-liptons-trail')}
                                className="group cursor-pointer bg-gradient-to-br from-stone-50 to-stone-100 rounded-[40px] p-6 sm:p-8 md:p-10 hover-lift"
                            >
                                <div className="aspect-video overflow-hidden rounded-[24px] mb-6 shadow-lg">
                                    <img src={teaImg} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Tea" />
                                </div>
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Heritage Trail</span>
                                </div>
                                <h4 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight italic leading-tight mb-4">Tea Estate Tours</h4>
                                <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-6">Visit colonial-era plantations and learn the art of Ceylon tea production.</p>
                                <div className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#00E676] flex items-center space-x-2 group-hover:underline pointer-events-none">
                                    <span>Discover More</span>
                                    <ArrowUpRight size={16} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Newsletter CTA */}
                    <section className="mb-24">
                        <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-stone-950 via-stone-900 to-black p-12 md:p-20 shadow-2xl">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E676] opacity-10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FFD600] opacity-10 rounded-full blur-3xl"></div>

                            <div className="relative z-10 max-w-4xl mx-auto text-center">
                                <div className="inline-block mb-6">
                                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-[#00E676] bg-[#00E676]/10 px-4 py-2 rounded-full">
                                        Stay Connected
                                    </span>
                                </div>
                                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter italic text-white mb-6 leading-[0.9]">
                                    Never Miss<br />An Adventure
                                </h2>
                                <p className="text-lg md:text-xl text-stone-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                                    Get exclusive stories, travel tips, and destination guides delivered to your inbox. Join our community of explorers.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        className="flex-1 px-6 py-4 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder:text-stone-500 focus:outline-none focus:border-[#00E676] transition-all text-sm md:text-base"
                                    />
                                    <button className="px-8 py-4 bg-[#00E676] hover:bg-[#00C853] text-stone-950 rounded-full font-black uppercase tracking-widest text-xs md:text-sm transition-all hover:scale-105 shadow-xl hover-glow whitespace-nowrap">
                                        Subscribe Now
                                    </button>
                                </div>

                                <p className="text-xs text-stone-600 mt-6">
                                    No spam, ever. Unsubscribe anytime. Read our privacy policy.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </main>
    </div>
));

HomePage.displayName = 'HomePage';

export default HomePage;
