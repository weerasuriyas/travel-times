import { SharedHeader } from '../components/UI';
import { useScrolled } from '../hooks/useScrolled';
import { MapPin, Heart, Camera } from 'lucide-react';

const AboutPage = () => {
  const isScrolled = useScrolled(50);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <SharedHeader isScrolled={isScrolled} showTabs={false} />
      <main className="pt-56 md:pt-52 pb-32 max-w-4xl mx-auto px-6">
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic mb-6">About Travel Times</h1>
        <p className="text-xl text-stone-600 font-serif italic mb-12 leading-relaxed">
          Your definitive guide to Sri Lanka's hidden gems, cultural treasures, and unforgettable experiences.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: MapPin, title: 'Local Expertise', desc: 'Deep knowledge of every corner of the island, from ancient cities to hidden beaches.' },
            { icon: Heart, title: 'Authentic Stories', desc: 'Real experiences from local correspondents who live and breathe Sri Lankan culture.' },
            { icon: Camera, title: 'Visual Storytelling', desc: 'Stunning photography that captures the spirit and beauty of each destination.' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-[24px] p-6 border border-stone-100 shadow-sm">
              <div className="w-10 h-10 bg-[#00E676]/10 rounded-xl flex items-center justify-center mb-4">
                <item.icon size={20} className="text-[#00E676]" />
              </div>
              <h3 className="text-base font-black uppercase tracking-tight mb-2">{item.title}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-stone-950 rounded-[32px] p-8 md:p-12 text-white">
          <h2 className="text-2xl font-black uppercase tracking-tight italic mb-4">Our Mission</h2>
          <p className="text-stone-400 leading-relaxed">
            Travel Times was founded to share the extraordinary beauty and culture of Sri Lanka with the world. We believe in responsible tourism that respects local communities, preserves cultural heritage, and creates meaningful connections between travelers and the island's people.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
