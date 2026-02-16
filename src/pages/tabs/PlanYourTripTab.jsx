import { Train, Car, Bus, Smartphone, CreditCard, Shield, Shirt, Sun, CloudRain, Thermometer } from 'lucide-react';

const months = [
  { name: 'Jan - Mar', weather: 'Dry (West & South)', highlights: 'Beaches, whale watching in Mirissa, cultural triangle', temp: '27-30°C' },
  { name: 'April', weather: 'Inter-monsoon', highlights: 'Sinhala & Tamil New Year festivals, Kandy cultural events', temp: '28-32°C' },
  { name: 'May - Jun', weather: 'Southwest monsoon', highlights: 'East coast beaches, Trincomalee, surfing in Arugam Bay', temp: '26-30°C' },
  { name: 'Jul - Aug', weather: 'Dry (Hill Country)', highlights: 'Kandy Esala Perahera, hill country trekking, tea plantations', temp: '24-28°C' },
  { name: 'Sep - Oct', weather: 'Inter-monsoon', highlights: 'Whale watching (east), shoulder season deals', temp: '27-30°C' },
  { name: 'Nov - Dec', weather: 'Northeast monsoon', highlights: 'West & south coast, Galle Literary Festival, Christmas', temp: '26-29°C' },
];

const transport = [
  { icon: Train, name: 'Train', desc: 'Scenic routes through hill country. Kandy-Ella is world-famous. Book first class in advance.', tip: 'Rs. 200-1500' },
  { icon: Car, name: 'Private Driver', desc: 'Most comfortable way to explore. Negotiate daily rates. Driver doubles as guide.', tip: '$40-60/day' },
  { icon: Bus, name: 'Bus', desc: 'Extensive network, very cheap. Express buses between major cities. Can be crowded.', tip: 'Rs. 100-500' },
  { icon: Smartphone, name: 'Tuk-Tuk', desc: 'Perfect for short trips. Use PickMe app for fair pricing. Negotiate before boarding.', tip: 'Rs. 50-100/km' },
];

const tips = [
  { icon: CreditCard, title: 'Currency', desc: 'Sri Lankan Rupee (LKR). ATMs widespread. Cards accepted at hotels/restaurants. Carry cash for markets.' },
  { icon: Shield, title: 'Visa', desc: 'Most nationalities need ETA (Electronic Travel Authorization). Apply online before arrival. ~$50 USD.' },
  { icon: Smartphone, title: 'SIM Card', desc: 'Buy at airport on arrival. Dialog or Mobitel recommended. ~$5 for 10GB data. Passport required.' },
  { icon: Shirt, title: 'Dress Code', desc: 'Cover shoulders and knees at temples. Remove shoes before entering. Modest swimwear outside resorts.' },
  { icon: Shield, title: 'Safety', desc: 'Generally very safe for tourists. Watch for traffic, protect valuables. Avoid unlicensed guides.' },
];

const PlanYourTripTab = () => {
  return (
    <div className="space-y-16">
      {/* Best Time to Visit */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-1 bg-[#FFD600] rounded-full"></div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500">When to Go</h2>
        </div>
        <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic mb-8">Best Time to Visit</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {months.map((m) => (
            <div key={m.name} className="bg-white rounded-[24px] p-6 border border-stone-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-black uppercase tracking-tight">{m.name}</h4>
                <div className="flex items-center gap-1 text-xs text-stone-400">
                  <Thermometer size={12} />
                  <span>{m.temp}</span>
                </div>
              </div>
              <div className="inline-block bg-[#00E676]/10 text-[#00E676] text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-3">
                {m.weather}
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">{m.highlights}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Getting Around */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-1 bg-[#00E676] rounded-full"></div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500">Transport</h2>
        </div>
        <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic mb-8">Getting Around</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {transport.map((t) => (
            <div key={t.name} className="bg-white rounded-[24px] p-6 border border-stone-100 shadow-sm hover:shadow-lg transition-all duration-300 flex gap-5">
              <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center shrink-0">
                <t.icon size={24} className="text-stone-600" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-black uppercase tracking-tight">{t.name}</h4>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded-full">{t.tip}</span>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Tips */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-1 bg-[#FF3D00] rounded-full"></div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500">Essentials</h2>
        </div>
        <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic mb-8">Quick Tips</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map((t) => (
            <div key={t.title} className="bg-white rounded-[24px] p-6 border border-stone-100 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="w-10 h-10 bg-[#FF3D00]/10 rounded-xl flex items-center justify-center mb-4">
                <t.icon size={20} className="text-[#FF3D00]" />
              </div>
              <h4 className="text-base font-black uppercase tracking-tight mb-2">{t.title}</h4>
              <p className="text-sm text-stone-600 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PlanYourTripTab;
