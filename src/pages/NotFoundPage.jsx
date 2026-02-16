import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <h1 className="text-[12rem] font-black uppercase italic tracking-tighter leading-none text-stone-100 select-none">404</h1>
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic mb-4 -mt-12">Page Not Found</h2>
        <p className="text-sm text-stone-500 leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#00E676] hover:text-stone-950 hover:scale-105 transition-all shadow-xl hover-glow"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
