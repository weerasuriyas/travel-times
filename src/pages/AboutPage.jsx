import { useEffect, useState } from 'react';
import { SharedHeader } from '../components/UI';
import { useScrolled } from '../hooks/useScrolled';
import { apiGet } from '../lib/api';

const AboutPage = () => {
  const isScrolled = useScrolled(50);
  const [content, setContent] = useState({})
  const [photo, setPhoto] = useState(null)

  useEffect(() => {
    Promise.all([
      apiGet('settings').catch(() => ({})),
      apiGet('images?entity_type=about&entity_id=1').catch(() => []),
    ]).then(([settings, imgs]) => {
      setContent(settings)
      setPhoto(Array.isArray(imgs) && imgs.length ? imgs[0] : null)
    })
  }, [])

  const name = content.about_name || 'About Us'
  const role = content.about_role || ''
  const bio  = content.about_bio  || ''

  return (
    <div className="min-h-screen bg-[#FDFDFB] dark:bg-stone-950">
      <SharedHeader isScrolled={isScrolled} showTabs={false} />
      <main className="pt-56 md:pt-52 pb-32 max-w-3xl mx-auto px-6">

        <div className="flex flex-col md:flex-row md:items-start gap-10 md:gap-16">
          {photo && (
            <div className="shrink-0">
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-[32px] overflow-hidden shadow-xl">
                <img src={photo.url} alt={name} className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-tight mb-2">
              {name}
            </h1>
            {role && (
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#00E676] mb-8">{role}</p>
            )}
            {bio && (
              <div className="text-stone-700 dark:text-stone-300 leading-relaxed text-base whitespace-pre-line">
                {bio}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default AboutPage;
