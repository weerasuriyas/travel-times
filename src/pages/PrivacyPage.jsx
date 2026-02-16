import { SharedHeader } from '../components/UI';
import { useScrolled } from '../hooks/useScrolled';

const PrivacyPage = () => {
  const isScrolled = useScrolled(50);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <SharedHeader isScrolled={isScrolled} showTabs={false} />
      <main className="pt-56 md:pt-52 pb-32 max-w-3xl mx-auto px-6">
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic mb-6">Privacy Policy</h1>
        <div className="prose prose-stone max-w-none">
          <p className="text-stone-600 leading-relaxed mb-6">Last updated: February 2026</p>
          <div className="space-y-6 text-sm text-stone-600 leading-relaxed">
            <p>Travel Times respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website.</p>
            <h3 className="text-lg font-black uppercase tracking-tight text-stone-900">Information We Collect</h3>
            <p>We may collect information you provide directly, such as your email address when subscribing to our newsletter. We also collect standard analytics data including page views and general location data.</p>
            <h3 className="text-lg font-black uppercase tracking-tight text-stone-900">How We Use Your Information</h3>
            <p>We use your information to improve our content, send newsletter updates (with your consent), and analyze site performance. We never sell your personal data to third parties.</p>
            <h3 className="text-lg font-black uppercase tracking-tight text-stone-900">Contact</h3>
            <p>For privacy-related questions, contact us at privacy@traveltimes.lk.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
