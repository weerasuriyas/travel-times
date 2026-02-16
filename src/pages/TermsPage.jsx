import { SharedHeader } from '../components/UI';
import { useScrolled } from '../hooks/useScrolled';

const TermsPage = () => {
  const isScrolled = useScrolled(50);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <SharedHeader isScrolled={isScrolled} showTabs={false} />
      <main className="pt-56 md:pt-52 pb-32 max-w-3xl mx-auto px-6">
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic mb-6">Terms of Service</h1>
        <div className="prose prose-stone max-w-none">
          <p className="text-stone-600 leading-relaxed mb-6">Last updated: February 2026</p>
          <div className="space-y-6 text-sm text-stone-600 leading-relaxed">
            <p>By accessing Travel Times, you agree to these terms of service. Please read them carefully before using our platform.</p>
            <h3 className="text-lg font-black uppercase tracking-tight text-stone-900">Content</h3>
            <p>All content on Travel Times, including text, images, and design, is owned by Travel Times or its content creators. You may not reproduce, distribute, or create derivative works without our written permission.</p>
            <h3 className="text-lg font-black uppercase tracking-tight text-stone-900">User Conduct</h3>
            <p>You agree to use our platform responsibly and not to engage in any activity that could harm the site, its users, or the communities we feature.</p>
            <h3 className="text-lg font-black uppercase tracking-tight text-stone-900">Disclaimer</h3>
            <p>Travel information is provided for guidance only. Always verify current conditions, visa requirements, and safety advisories before traveling. Travel Times is not liable for decisions made based on our content.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
