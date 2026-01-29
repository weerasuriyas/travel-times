import { useState, useEffect, useRef } from 'react'
import HomePage from './pages/HomePage'
import ArticlePage from './pages/ArticlePage'
import DestinationsPage from './pages/DestinationsPage'
import DestinationDetailPage from './pages/DestinationDetailPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminArticleEditor from './pages/AdminArticleEditor'
import AdminLogin from './pages/AdminLogin'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './contexts/AuthContext'

const peraheraImg = "/perahera_banner.jpg";
const trainImg = "https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?q=80&w=3402&auto=format&fit=crop";
const teaImg = "https://images.unsplash.com/photo-1586511623600-cb6f44f647d8?auto=format&fit=crop&q=80";
const beachImg = "https://images.unsplash.com/photo-1646894232861-a0ad84f1ad5d?auto=format&fit=crop&q=80";
const templeImg = "https://images.unsplash.com/photo-1695748394754-9a8f807f9568?auto=format&fit=crop&q=80";
const wildlifeImg = "https://images.unsplash.com/photo-1661768508643-e260f6f8e06c?auto=format&fit=crop&q=80";
const surfImg = "https://images.unsplash.com/photo-1581420456035-58b8efadcdea?auto=format&fit=crop&q=80";
const foodImg = "https://images.unsplash.com/photo-1687688207113-34bea1617467?auto=format&fit=crop&q=80";
const marketImg = "https://images.unsplash.com/photo-1743674453123-93356ade2891?auto=format&fit=crop&q=80";

// Inner component that has access to AuthContext
const AppContent = () => {
  const { user, isAdmin } = useAuth();

  // Use URL hash for routing to persist on refresh
  const getPageFromHash = () => {
    const hash = window.location.hash.replace('#', '');
    const parts = hash.split('/');
    const page = parts[0];

    if (page === 'article') return { page: 'article', slug: parts[1] || 'kandy-perahera' };
    if (page === 'destinations') return { page: 'destinations', slug: null };
    if (page === 'destination') return { page: 'destination', slug: parts[1] || 'kandy' };
    if (page === 'admin') return { page: 'admin', slug: null };
    if (page === 'admin-editor') return { page: 'admin-editor', slug: null };
    if (page === 'admin-login') return { page: 'admin-login', slug: null };
    return { page: 'home', slug: null };
  };

  const initialRoute = getPageFromHash();
  const [activeTab, setActiveTab] = useState('feature');
  const [currentPage, setCurrentPage] = useState(initialRoute.page);
  const [articleSlug, setArticleSlug] = useState(initialRoute.slug);
  const [isScrolled, setIsScrolled] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const bannerStartRef = useRef(null);

  // Update URL hash when page changes
  const handlePageChange = (page, slug = null) => {
    setCurrentPage(page);
    setArticleSlug(slug);

    if (page === 'home') {
      window.location.hash = '';
    } else if (page === 'article' && slug) {
      window.location.hash = `article/${slug}`;
    } else if (page === 'destination' && slug) {
      window.location.hash = `destination/${slug}`;
    } else {
      window.location.hash = page;
    }
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const route = getPageFromHash();
      setCurrentPage(route.page);
      setArticleSlug(route.slug);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = Math.max(0, window.scrollY);
          setIsScrolled(scrollY > 50);
          
          // Calculate parallax offset - ensure it's exactly 0 at top
          // Use a threshold to prevent tiny offsets near the top
          if (scrollY < 1) {
            setParallaxOffset(0);
          } else {
            // Calculate parallax relative to when banner enters view
            // Header: InfoBanner (~30px) + LiveBanner (1px) + Nav (~100px mobile, ~180px desktop) ≈ 131px mobile, 211px desktop
            // Main padding: pt-32 (128px) mobile, pt-48 (192px) desktop
            // Banner starts when scrollY reaches header + padding
            const isDesktop = window.innerWidth >= 768;
            const headerHeight = isDesktop ? 211 : 131;
            const mainPadding = isDesktop ? 192 : 128;
            const parallaxStart = headerHeight + mainPadding;
            
            if (scrollY <= parallaxStart) {
              setParallaxOffset(0);
            } else {
              const relativeScroll = scrollY - parallaxStart;
              setParallaxOffset(relativeScroll * 0.5);
            }
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    // Set initial state
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#1a1a1a] font-sans selection:bg-[#00E676] selection:text-white">
      {currentPage === 'home' ? (
          <HomePage
            setCurrentPage={handlePageChange}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isScrolled={isScrolled}
            peraheraImg={peraheraImg}
            parallaxOffset={parallaxOffset}
            trainImg={trainImg}
            teaImg={teaImg}
            beachImg={beachImg}
            templeImg={templeImg}
            wildlifeImg={wildlifeImg}
            surfImg={surfImg}
            foodImg={foodImg}
            marketImg={marketImg}
          />
        ) : currentPage === 'article' ? (
          <ArticlePage
            slug={articleSlug}
            setCurrentPage={handlePageChange}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isScrolled={isScrolled}
            peraheraImg={peraheraImg}
          />
        ) : currentPage === 'destinations' ? (
          <DestinationsPage
            setCurrentPage={handlePageChange}
            isScrolled={isScrolled}
          />
        ) : currentPage === 'destination' ? (
          <DestinationDetailPage
            slug={articleSlug}
            setCurrentPage={handlePageChange}
            isScrolled={isScrolled}
          />
        ) : currentPage === 'admin-login' ? (
          <AdminLogin
            setCurrentPage={handlePageChange}
          />
        ) : currentPage === 'admin' ? (
          <ProtectedRoute setCurrentPage={handlePageChange}>
            <AdminDashboard
              setCurrentPage={handlePageChange}
            />
          </ProtectedRoute>
        ) : currentPage === 'admin-editor' ? (
          <ProtectedRoute setCurrentPage={handlePageChange}>
            <AdminArticleEditor
              setCurrentPage={handlePageChange}
            />
          </ProtectedRoute>
        ) : null}

        {currentPage !== 'admin-login' && (
          <footer className="bg-stone-950 text-white pt-32 pb-12 px-6 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[#00E676] blur-[200px] opacity-10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-[35rem] h-[35rem] bg-[#FFD600] blur-[200px] opacity-10 rounded-full"></div>

            <div className="max-w-7xl mx-auto relative z-10">
              {/* Main Footer Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 md:gap-16 mb-24">

                {/* Brand Section */}
                <div className="lg:col-span-4">
                  <div className="cursor-pointer group mb-8" onClick={() => handlePageChange('home')}>
                    <h2 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none mb-2 group-hover:text-[#00E676] transition-colors">TRAVEL</h2>
                    <h2 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-stone-800">TIMES<span className="text-stone-700">.</span></h2>
                  </div>
                  <p className="text-sm text-stone-400 leading-relaxed mb-6 max-w-xs">
                    Your definitive guide to Sri Lanka's hidden gems, cultural treasures, and unforgettable experiences.
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00E676]">
                    Curating the Island rhythm since 2012
                  </p>
                </div>

                {/* Quick Links */}
                <div className="lg:col-span-2">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500 mb-6">Explore</h3>
                  <ul className="space-y-4">
                    {['Destinations', 'Experiences', 'Culture', 'Food & Drink', 'Adventure', 'Heritage'].map((item) => (
                      <li key={item}>
                        <button className="text-sm text-stone-400 hover:text-[#00E676] transition-colors hover:translate-x-1 transform duration-200 block">
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resources */}
                <div className="lg:col-span-2">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500 mb-6">Resources</h3>
                  <ul className="space-y-4">
                    {['Travel Guides', 'Trip Planning', 'Photography', 'Travel Tips', 'About Us', 'Contact'].map((item) => (
                      <li key={item}>
                        <button className="text-sm text-stone-400 hover:text-[#00E676] transition-colors hover:translate-x-1 transform duration-200 block">
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Newsletter & Social */}
                <div className="lg:col-span-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500 mb-6">Stay Connected</h3>
                  <p className="text-sm text-stone-400 mb-6 leading-relaxed">
                    Get weekly stories and insider tips delivered to your inbox.
                  </p>

                  {/* Social Links */}
                  <div className="flex gap-3 mb-8">
                    {[
                      { name: 'Instagram', handle: '@traveltimes.lk' },
                      { name: 'Twitter', handle: '@traveltimes' },
                      { name: 'Facebook', handle: '/traveltimes' }
                    ].map((social) => (
                      <button
                        key={social.name}
                        className="w-12 h-12 rounded-full bg-white/5 hover:bg-[#00E676]/20 border border-white/10 hover:border-[#00E676] transition-all duration-300 hover:scale-110 flex items-center justify-center group"
                        title={social.handle}
                      >
                        <span className="text-[10px] font-black text-stone-500 group-hover:text-[#00E676]">
                          {social.name.slice(0, 2)}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Awards/Badges */}
                  <div className="space-y-2">
                    <div className="inline-block bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FFD600]">
                        ★ Featured in Lonely Planet 2025
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="border-t border-white/5 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-stone-700">
                    <p>© 2026 Travel Times</p>
                    <span className="hidden md:inline">•</span>
                    <button className="hover:text-[#00E676] transition-colors">Privacy</button>
                    <span>•</span>
                    <button className="hover:text-[#00E676] transition-colors">Terms</button>
                    <span>•</span>
                    <button className="hover:text-[#00E676] transition-colors">Cookies</button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-600">
                      Proudly made by weerasuriya inc
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        )}
    </div>
  );
};

// Main App component wraps AppContent with AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
