import { Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();

  return (
    <>
      <Outlet />

      <footer className="bg-stone-950 text-white pt-32 pb-12 px-6 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[#00E676] blur-[200px] opacity-10 rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[35rem] h-[35rem] bg-[#FFD600] blur-[200px] opacity-10 rounded-full"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 md:gap-16 mb-24">

            {/* Brand Section */}
            <div className="lg:col-span-4">
              <div className="cursor-pointer group mb-8" onClick={() => navigate('/')}>
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
                {[
                  { label: 'Destinations', path: '/destinations' },
                  { label: 'Experiences' },
                  { label: 'Culture' },
                  { label: 'Food & Drink' },
                  { label: 'Adventure' },
                  { label: 'Heritage' },
                ].map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={item.path ? () => navigate(item.path) : undefined}
                      className="text-sm text-stone-400 hover:text-[#00E676] transition-colors hover:translate-x-1 transform duration-200 block"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div className="lg:col-span-2">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500 mb-6">Resources</h3>
              <ul className="space-y-4">
                {[
                  { label: 'Travel Guides' },
                  { label: 'Trip Planning' },
                  { label: 'Photography' },
                  { label: 'Travel Tips' },
                  { label: 'About Us', path: '/about' },
                  { label: 'Contact', path: '/contact' },
                ].map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={item.path ? () => navigate(item.path) : undefined}
                      className="text-sm text-stone-400 hover:text-[#00E676] transition-colors hover:translate-x-1 transform duration-200 block"
                    >
                      {item.label}
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
                <p>&copy; 2026 Travel Times</p>
                <span className="hidden md:inline">&bull;</span>
                <button onClick={() => navigate('/privacy')} className="hover:text-[#00E676] transition-colors">Privacy</button>
                <span>&bull;</span>
                <button onClick={() => navigate('/terms')} className="hover:text-[#00E676] transition-colors">Terms</button>
                <span>&bull;</span>
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
    </>
  );
}
