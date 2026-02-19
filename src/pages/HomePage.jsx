import React, { memo, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, MapPin, Clock, ChevronRight } from 'lucide-react';
import { SharedHeader, SectionHeader } from '../components/UI';
import { getAllDestinations, getTimelyEvents } from '../data/destinations';
import { useScrolled } from '../hooks/useScrolled';
import EventDateBadge from '../components/ui/EventDateBadge';
import JournalTab from './tabs/JournalTab';
import MapsTab from './tabs/MapsTab';
import PlanYourTripTab from './tabs/PlanYourTripTab';

const peraheraImg = "/perahera_banner.jpg";
const trainImg = "https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?q=80&w=3402&auto=format&fit=crop";
const teaImg = "https://images.unsplash.com/photo-1586511623600-cb6f44f647d8?auto=format&fit=crop&q=80";
const beachImg = "https://images.unsplash.com/photo-1646894232861-a0ad84f1ad5d?auto=format&fit=crop&q=80";
const templeImg = "https://images.unsplash.com/photo-1695748394754-9a8f807f9568?auto=format&fit=crop&q=80";
const wildlifeImg = "https://images.unsplash.com/photo-1661768508643-e260f6f8e06c?auto=format&fit=crop&q=80";
const surfImg = "https://images.unsplash.com/photo-1581420456035-58b8efadcdea?auto=format&fit=crop&q=80";
const foodImg = "https://images.unsplash.com/photo-1687688207113-34bea1617467?auto=format&fit=crop&q=80";

const HomePage = memo(() => {
    const navigate = useNavigate();
    const isScrolled = useScrolled(50);
    const [activeTab, setActiveTab] = useState('feature');
    const [parallaxOffset, setParallaxOffset] = useState(0);

    // Parallax scroll effect
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = Math.max(0, window.scrollY);
                    if (scrollY < 1) {
                        setParallaxOffset(0);
                    } else {
                        const isDesktop = window.innerWidth >= 768;
                        const headerHeight = isDesktop ? 211 : 131;
                        const mainPadding = isDesktop ? 192 : 128;
                        const parallaxStart = headerHeight + mainPadding;
                        if (scrollY <= parallaxStart) {
                            setParallaxOffset(0);
                        } else {
                            setParallaxOffset((scrollY - parallaxStart) * 0.5);
                        }
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const destinations = useMemo(() => getAllDestinations(), []);
    const timelyEvents = useMemo(() => getTimelyEvents(), []);

    // getTimelyEvents() already returns sorted: happeningNow, happeningSoon, inSeason
    const spotlightEvents = timelyEvents.slice(0, 4);

    // The hero event - pick the most timely featured event
    const heroEvent = timelyEvents.find(e => e.featured) || timelyEvents[0];

    return (
        <div className="animate-in fade-in duration-700">
            <SharedHeader
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isScrolled={isScrolled}
                showTabs={true}
            />

            <main className="max-w-[1800px] mx-auto px-4 md:px-6 pb-24 pt-56 md:pt-52">
                {activeTab === 'feature' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">

                        {/* ─── Hero: Featured Event ─────────────────────────────── */}
                        {heroEvent && (
                            <section
                                onClick={() => heroEvent.slug && navigate('/event/' + heroEvent.slug)}
                                className="relative aspect-[16/9] md:aspect-[21/9] bg-stone-100 overflow-hidden rounded-[40px] mb-16 group cursor-pointer shadow-2xl preserve-rounded"
                            >
                                <img
                                    src={heroEvent.image || peraheraImg}
                                    className="w-full h-full object-cover parallax-image"
                                    style={{ transform: `translateY(${parallaxOffset}px) scale(1.1)` }}
                                    alt={heroEvent.name}
                                    fetchPriority="high"
                                    loading="eager"
                                    decoding="async"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-10 md:left-12 lg:top-12 lg:left-20">
                                    <EventDateBadge event={heroEvent} size="large" />
                                </div>
                                <div className="absolute bottom-0 left-0 p-4 sm:p-6 md:p-12 lg:p-20 text-white max-w-5xl">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
                                        <span className="inline-block bg-[#FF3D00] text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-black uppercase tracking-[0.3em] px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-1.5 rounded-sm">{heroEvent.type}</span>
                                        <span className="flex items-center text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-black uppercase tracking-[0.3em] opacity-60">
                                            <MapPin size={12} className="mr-1" />
                                            {heroEvent.destination.name}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black uppercase tracking-tighter italic mb-4 sm:mb-6 md:mb-10 leading-[0.85]">
                                        {heroEvent.name.split(':').map((part, i) => (
                                            <span key={i}>{i > 0 && <br />}{part.trim()}</span>
                                        ))}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-10 text-[10px] sm:text-[11px] md:text-[12px] font-black uppercase tracking-widest opacity-80">
                                        <span className="flex items-center"><Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1.5 sm:mr-2" /> {heroEvent.duration}</span>
                                        <span>•</span>
                                        <span>{heroEvent.month}</span>
                                    </div>
                                </div>
                                <button className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 md:bottom-12 md:right-12 lg:bottom-20 lg:right-20 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white rounded-full flex items-center justify-center hover:bg-[#00E676] hover:scale-110 transition-all group shadow-2xl hover-glow animate-float">
                                    <ArrowUpRight className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-10 lg:h-10 text-black group-hover:rotate-45 transition-transform" />
                                </button>
                            </section>
                        )}

                        {/* ─── Happening Now / Soon Spotlight ──────────────────── */}
                        {spotlightEvents.length > 0 && (
                            <section className="mb-24">
                                <SectionHeader title="What's Happening" subtitle="Timely Events" color="#00E676" />

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                    {spotlightEvents.map((event, i) => (
                                        <div
                                            key={`${event.destination.slug}-${event.name}-${i}`}
                                            onClick={() => event.slug ? navigate('/event/' + event.slug) : navigate('/destination/' + event.destination.slug)}
                                            className="group cursor-pointer bg-white rounded-[32px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative"
                                        >
                                            <div className="aspect-[4/3] overflow-hidden relative">
                                                <img
                                                    src={event.image}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                                    alt={event.name}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                                <div className="absolute top-3 left-3">
                                                    <EventDateBadge event={event} />
                                                </div>
                                                <div className="absolute bottom-3 left-3">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 flex items-center gap-1">
                                                        <MapPin size={10} />
                                                        {event.destination.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5 block">{event.type}</span>
                                                <h4 className="text-lg font-black uppercase tracking-tight italic leading-tight mb-2">{event.name}</h4>
                                                <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">{event.description}</p>
                                                <div className="mt-4 flex items-center text-[10px] font-black uppercase tracking-widest text-[#00E676] group-hover:underline">
                                                    <span>Explore</span>
                                                    <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ─── Destinations Grid ──────────────────────────────── */}
                        <section className="mb-24">
                            <SectionHeader title="Destinations" subtitle="Explore Sri Lanka" color="#FF3D00" />

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {destinations.map((dest) => {
                                    return (
                                        <div
                                            key={dest.slug}
                                            onClick={() => navigate('/destination/' + dest.slug)}
                                            className="group cursor-pointer hover-lift"
                                        >
                                            <div className="aspect-[4/5] overflow-hidden rounded-[32px] mb-5 bg-stone-100 shadow-xl relative">
                                                <img
                                                    src={dest.heroImage}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                                    alt={dest.name}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>

                                                {/* Destination info overlay */}
                                                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{dest.region}</span>
                                                    </div>
                                                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight italic text-white leading-none mb-1">
                                                        {dest.name}
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-white/60 font-medium">{dest.tagline}</p>
                                                </div>

                                                {/* Stats badge */}
                                                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white rounded-full px-3 py-1.5 text-[10px] font-bold flex items-center gap-2">
                                                    <span>{dest.stats.temperature}</span>
                                                    <span className="w-1 h-1 rounded-full bg-white/40"></span>
                                                    <span>{dest.stats.elevation}</span>
                                                </div>

                                                {/* Event count badge if there are timely events */}
                                                {dest.events.length > 0 && (
                                                    <div className="absolute top-4 left-4 bg-[#00E676] text-stone-950 rounded-full px-2.5 py-1 text-[10px] font-black">
                                                        {dest.events.length} event{dest.events.length !== 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Event previews below card */}
                                            {dest.events.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {dest.events.slice(0, 2).map((event, i) => (
                                                        <EventDateBadge key={i} event={event} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-12 text-center">
                                <button
                                    onClick={() => navigate('/destinations')}
                                    className="bg-black text-white px-8 py-4 rounded-full text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-[#00E676] hover:text-stone-950 hover:scale-105 transition-all shadow-xl hover-glow"
                                >
                                    View All Destinations
                                </button>
                            </div>
                        </section>

                        {/* ─── Featured Stories ───────────────────────────────── */}
                        <section className="mb-24">
                            <SectionHeader title="Featured Stories" subtitle="Deep Dives" color="#FFD600" />

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* Main feature */}
                                <div
                                    onClick={() => navigate('/event/kandy-perahera')}
                                    className="lg:col-span-7 group cursor-pointer"
                                >
                                    <div className="aspect-[16/10] overflow-hidden rounded-[32px] mb-6 bg-stone-100 shadow-xl relative">
                                        <img
                                            src={peraheraImg}
                                            loading="lazy"
                                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                                            alt="Kandy Perahera"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                                        <div className="absolute bottom-6 left-6 right-6 text-white">
                                            <span className="inline-block bg-[#FF3D00] text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-sm mb-3">Cover Story</span>
                                            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight italic leading-[0.9]">
                                                The Fire<br />of Kandy.
                                            </h3>
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-base text-stone-500 leading-relaxed">
                                        We walked through the smoke of a thousand copra torches, following the rhythm of drums into the heart of the ancient kingdom.
                                    </p>
                                </div>

                                {/* Side stories */}
                                <div className="lg:col-span-5 flex flex-col gap-8">
                                    <div
                                        onClick={() => navigate('/event/ella-to-kandy')}
                                        className="group cursor-pointer hover-lift bg-white rounded-[32px] p-5 shadow-lg flex gap-5"
                                    >
                                        <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden rounded-[20px] bg-stone-100">
                                            <img src={trainImg} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Train" />
                                        </div>
                                        <div className="flex flex-col justify-center min-w-0">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#00E676] mb-1.5">Scenic Journey</span>
                                            <h4 className="text-base sm:text-lg font-black uppercase tracking-tight italic leading-tight mb-2">Ella to Kandy: The Slowest Express</h4>
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1"><MapPin size={10} /> Ella</span>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => navigate('/event/dambatenne-liptons-trail')}
                                        className="group cursor-pointer hover-lift bg-white rounded-[32px] p-5 shadow-lg flex gap-5"
                                    >
                                        <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden rounded-[20px] bg-stone-100">
                                            <img src={teaImg} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="Tea" />
                                        </div>
                                        <div className="flex flex-col justify-center min-w-0">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF3D00] mb-1.5">Heritage Trail</span>
                                            <h4 className="text-base sm:text-lg font-black uppercase tracking-tight italic leading-tight mb-2">Dambatenne: Lipton's Lost Trail</h4>
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1"><MapPin size={10} /> Haputale</span>
                                        </div>
                                    </div>

                                    <div className="group cursor-pointer hover-lift bg-gradient-to-br from-stone-950 to-stone-900 rounded-[32px] p-6 shadow-lg text-white">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-2 h-2 rounded-full bg-[#FFD600] animate-pulse"></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Coming Soon</span>
                                        </div>
                                        <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight italic leading-tight mb-2">More stories on the way...</h4>
                                        <p className="text-xs text-stone-500 leading-relaxed">New destination guides, event coverage, and travel features being produced by our field correspondents.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ─── Visual Gallery ─────────────────────────────────── */}
                        <section className="mb-24">
                            <SectionHeader title="Visual Stories" subtitle="From The Field" color="#FFD600" />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="col-span-2 row-span-2 group cursor-pointer overflow-hidden rounded-[32px] shadow-xl relative">
                                    <img src={beachImg} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110" alt="Southern Coast" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        <div className="absolute bottom-6 left-6 text-white">
                                            <p className="text-xs sm:text-sm font-black uppercase tracking-widest">Southern Paradise</p>
                                            <p className="text-[10px] sm:text-xs opacity-80">Galle Coast</p>
                                        </div>
                                    </div>
                                </div>
                                {[
                                    { img: templeImg, label: 'Sacred Sites' },
                                    { img: wildlifeImg, label: 'Wildlife' },
                                    { img: surfImg, label: 'Surf Culture' },
                                    { img: foodImg, label: 'Cuisine' },
                                ].map((item, i) => (
                                    <div key={i} className="group cursor-pointer overflow-hidden rounded-[24px] shadow-xl relative aspect-square">
                                        <img src={item.img} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110" alt={item.label} />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">{item.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ─── Newsletter CTA ─────────────────────────────────── */}
                        <section className="mb-24">
                            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-stone-950 via-stone-900 to-black p-12 md:p-20 shadow-2xl">
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
                                        Get exclusive stories, travel tips, and destination guides delivered to your inbox.
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
                                </div>
                            </div>
                        </section>
                    </div>
                )}
                {activeTab === 'events' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <JournalTab />
                    </div>
                )}
                {activeTab === 'attractions' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <MapsTab />
                    </div>
                )}
                {activeTab === 'todo' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <PlanYourTripTab />
                    </div>
                )}
            </main>
        </div>
    );
});

HomePage.displayName = 'HomePage';

export default HomePage;
