import { Calendar, Clock, Zap } from 'lucide-react';
import { isHappeningNow, isHappeningSoon, isInSeason, daysUntilEvent } from '../../data/destinations';

const EventDateBadge = ({ event, size = 'default' }) => {
  const now = isHappeningNow(event);
  const soon = isHappeningSoon(event);
  const seasonal = isInSeason(event);
  const days = daysUntilEvent(event);

  if (now) {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-[#00E676] text-stone-950 rounded-full shadow-lg ${size === 'large' ? 'px-5 py-2.5 text-sm' : 'px-3 py-1.5 text-[10px]'} font-black uppercase tracking-[0.2em]`}>
        <div className="w-2 h-2 bg-stone-950 rounded-full animate-pulse"></div>
        <span>Happening Now</span>
      </div>
    );
  }

  if (soon && days !== null) {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-[#FFD600] text-stone-950 rounded-full shadow-lg ${size === 'large' ? 'px-5 py-2.5 text-sm' : 'px-3 py-1.5 text-[10px]'} font-black uppercase tracking-[0.2em]`}>
        <Zap size={size === 'large' ? 16 : 12} />
        <span>Starts in {days} day{days !== 1 ? 's' : ''}</span>
      </div>
    );
  }

  if (seasonal) {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-stone-700 border border-stone-200 rounded-full shadow-sm ${size === 'large' ? 'px-5 py-2.5 text-sm' : 'px-3 py-1.5 text-[10px]'} font-black uppercase tracking-[0.2em]`}>
        <Calendar size={size === 'large' ? 16 : 12} className="text-[#00E676]" />
        <span>In Season</span>
      </div>
    );
  }

  // Default: show season or date range
  if (event.startDate && event.endDate) {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return (
      <div className={`inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-stone-600 border border-stone-200 rounded-full shadow-sm ${size === 'large' ? 'px-5 py-2.5 text-sm' : 'px-3 py-1.5 text-[10px]'} font-bold`}>
        <Calendar size={size === 'large' ? 16 : 12} className="text-stone-400" />
        <span>{fmt(start)} - {fmt(end)}</span>
      </div>
    );
  }

  if (event.season) {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-stone-600 border border-stone-200 rounded-full shadow-sm ${size === 'large' ? 'px-5 py-2.5 text-sm' : 'px-3 py-1.5 text-[10px]'} font-bold`}>
        <Clock size={size === 'large' ? 16 : 12} className="text-stone-400" />
        <span>{event.season}</span>
      </div>
    );
  }

  return null;
};

export default EventDateBadge;
