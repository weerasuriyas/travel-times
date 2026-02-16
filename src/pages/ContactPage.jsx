import { SharedHeader } from '../components/UI';
import { useScrolled } from '../hooks/useScrolled';
import { Mail, MapPin, Phone } from 'lucide-react';

const ContactPage = () => {
  const isScrolled = useScrolled(50);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <SharedHeader isScrolled={isScrolled} showTabs={false} />
      <main className="pt-56 md:pt-52 pb-32 max-w-4xl mx-auto px-6">
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic mb-6">Contact Us</h1>
        <p className="text-xl text-stone-600 font-serif italic mb-12 leading-relaxed">
          Have a question, story tip, or partnership inquiry? We'd love to hear from you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Mail, title: 'Email', detail: 'hello@traveltimes.lk', desc: 'For general inquiries and story submissions' },
            { icon: MapPin, title: 'Location', detail: 'Colombo, Sri Lanka', desc: 'Our editorial team is based on the island' },
            { icon: Phone, title: 'Phone', detail: '+94 11 234 5678', desc: 'Available Monday to Friday, 9am - 5pm IST' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-[24px] p-6 border border-stone-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-[#00E676]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <item.icon size={24} className="text-[#00E676]" />
              </div>
              <h3 className="text-base font-black uppercase tracking-tight mb-1">{item.title}</h3>
              <p className="text-sm font-bold text-[#00E676] mb-2">{item.detail}</p>
              <p className="text-xs text-stone-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
