import React from 'react';
import { Globe, Clock, Quote, Flame, Calendar, Compass, Zap, Search } from 'lucide-react';

export const SectionHeader = ({ title, subtitle, color = "#00E676" }) => (
  <div className="mb-12">
    <div className="flex items-center space-x-4 mb-4">
      <div className="h-[2px] w-12" style={{ backgroundColor: color }}></div>
      <h3 className="text-[11px] font-sans font-black uppercase tracking-[0.4em] text-stone-400">{subtitle}</h3>
    </div>
    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none italic">{title}</h2>
  </div>
);

export const InfoBanner = ({ currentTime }) => (
  <div className="flex bg-white border-b border-stone-100 py-2 md:py-3.5 px-4 md:px-6 flex-wrap md:flex-nowrap justify-between items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">
    <div className="flex items-center space-x-4 md:space-x-6 text-stone-500 w-full md:w-auto justify-between md:justify-start">
      <span className="flex items-center">
        <Globe size={12} className="mr-2 text-[#00E676] md:mr-2.5 md:w-[14px] md:h-[14px]" /> <span className="hidden xs:inline">Dispatch: </span>Sri Lanka
      </span>
      <span className="hidden md:block opacity-30">|</span>
      <span className="flex items-center"><span className="hidden xs:inline mr-2">Local Time:</span> {currentTime}</span>
    </div>
    <button className="hidden md:block bg-black text-white px-4 md:px-5 py-1.5 md:py-2 rounded-full hover:bg-[#FF3D00] transition-all hover:scale-105 active:scale-95 shadow-lg hover-glow">Subscribe</button>
  </div>
);

export const LiveBanner = () => (
  <div className="flex bg-stone-950 text-white py-2 overflow-hidden whitespace-nowrap border-b border-white/10">
    <div className="flex animate-marquee items-center text-[10px] font-black uppercase tracking-[0.3em]">
      {[1, 2, 3, 4].map((i) => (
        <React.Fragment key={i}>
          <span className="mx-8 text-[#00E676]">● DISPATCH FROM GALLE</span>
          <span className="mx-8">WEATHER: 29°C HUMID</span>
          <span className="mx-8 text-[#FF3D00]">● BREAKING: NEW NOMAD VISA ANNOUNCED</span>
          <span className="mx-8">TRAIN DELAYS ON COAST LINE</span>
        </React.Fragment>
      ))}
    </div>
  </div>
);
