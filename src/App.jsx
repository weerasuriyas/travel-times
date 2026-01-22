import { useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
import ArticlePage from './pages/ArticlePage'

const peraheraImg = "https://images.unsplash.com/photo-1566766188646-5d0310191714?auto=format&fit=crop&q=80";
const trainImg = "https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?q=80&w=3402&auto=format&fit=crop";
const teaImg = "https://images.unsplash.com/photo-1586511623600-cb6f44f647d8?auto=format&fit=crop&q=80";
const beachImg = "https://images.unsplash.com/photo-1646894232861-a0ad84f1ad5d?auto=format&fit=crop&q=80";
const templeImg = "https://images.unsplash.com/photo-1695748394754-9a8f807f9568?auto=format&fit=crop&q=80";
const wildlifeImg = "https://images.unsplash.com/photo-1661768508643-e260f6f8e06c?auto=format&fit=crop&q=80";
const surfImg = "https://images.unsplash.com/photo-1581420456035-58b8efadcdea?auto=format&fit=crop&q=80";
const foodImg = "https://images.unsplash.com/photo-1687688207113-34bea1617467?auto=format&fit=crop&q=80";
const marketImg = "https://images.unsplash.com/photo-1743674453123-93356ade2891?auto=format&fit=crop&q=80";

const App = () => {
  const [activeTab, setActiveTab] = useState('feature');
  const [currentPage, setCurrentPage] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setParallaxOffset(window.scrollY * 0.5);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#1a1a1a] font-sans selection:bg-[#00E676] selection:text-white">
      {currentPage === 'home' ? (
        <HomePage 
          setCurrentPage={setCurrentPage}
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
      ) : (
        <ArticlePage 
          setCurrentPage={setCurrentPage}
          peraheraImg={peraheraImg}
        />
      )}

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
    </div>
  );
};

export default App;
