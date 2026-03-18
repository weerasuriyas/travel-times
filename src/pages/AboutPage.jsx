import { useEffect, useState } from 'react';
import { MapPin, Heart, Camera } from 'lucide-react';
import { SharedHeader } from '../components/UI';
import { useScrolled } from '../hooks/useScrolled';
import { apiGet } from '../lib/api';

const DEFAULT_CARDS = [
  { icon: MapPin, title: 'Local Expertise',     desc: 'Deep knowledge of every corner of the island, from ancient cities to hidden beaches.' },
  { icon: Heart,  title: 'Authentic Stories',   desc: 'Real experiences from local correspondents who live and breathe Sri Lankan culture.' },
  { icon: Camera, title: 'Visual Storytelling', desc: 'Stunning photography that captures the spirit and beauty of each destination.' },
]

const AboutPage = () => {
  const isScrolled = useScrolled(50);
  const [content, setContent] = useState({})
  const [images, setImages] = useState([])

  useEffect(() => {
    Promise.all([
      apiGet('settings').catch(() => ({})),
      apiGet('images?entity_type=about&entity_id=1').catch(() => []),
    ]).then(([settings, imgs]) => {
      setContent(settings)
      setImages(Array.isArray(imgs) ? imgs : [])
    })
  }, [])

  const title   = content.about_title   || 'About Travel Times'
  const tagline = content.about_tagline || "Your definitive guide to Sri Lanka's hidden gems, cultural treasures, and unforgettable experiences."
  const intro   = content.about_intro   || null
  const mission = content.about_mission || 'Travel Times was founded to share the extraordinary beauty and culture of Sri Lanka with the world. We believe in responsible tourism that respects local communities, preserves cultural heritage, and creates meaningful connections between travelers and the island\'s people.'

  const cards = DEFAULT_CARDS.map((def, i) => ({
    icon:  def.icon,
    title: content[`about_card${i + 1}_title`] || def.title,
    desc:  content[`about_card${i + 1}_desc`]  || def.desc,
  }))

  const heroImage    = images[0] || null
  const galleryImages = images.slice(1)

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <SharedHeader isScrolled={isScrolled} showTabs={false} />
      <main className="pt-56 md:pt-52 pb-32 max-w-4xl mx-auto px-6">

        {heroImage && (
          <div className="rounded-[32px] overflow-hidden mb-12 aspect-[16/7]">
            <img src={heroImage.url} alt={heroImage.alt_text || title} className="w-full h-full object-cover" />
          </div>
        )}

        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic mb-6">{title}</h1>
        <p className="text-xl text-stone-600 font-serif italic mb-12 leading-relaxed">{tagline}</p>

        {intro && (
          <p className="text-base text-stone-700 mb-12 leading-relaxed whitespace-pre-line">{intro}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {cards.map((card) => (
            <div key={card.title} className="bg-white rounded-[24px] p-6 border border-stone-100 shadow-sm">
              <div className="w-10 h-10 bg-[#00E676]/10 rounded-xl flex items-center justify-center mb-4">
                <card.icon size={20} className="text-[#00E676]" />
              </div>
              <h3 className="text-base font-black uppercase tracking-tight mb-2">{card.title}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-stone-950 rounded-[32px] p-8 md:p-12 text-white mb-12">
          <h2 className="text-2xl font-black uppercase tracking-tight italic mb-4">Our Mission</h2>
          <p className="text-stone-400 leading-relaxed whitespace-pre-line">{mission}</p>
        </div>

        {galleryImages.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {galleryImages.map(img => (
              <div key={img.id} className="rounded-[20px] overflow-hidden aspect-square">
                <img src={img.url} alt={img.alt_text || ''} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AboutPage;
