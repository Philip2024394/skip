import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/70 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      <h1 className="text-3xl font-display font-bold mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-white/70 text-sm leading-relaxed">
        <p><strong className="text-white">Last Updated:</strong> March 6, 2026</p>
        <h2 className="text-lg font-semibold text-white mt-6">1. Information We Collect</h2>
        <p>We collect information you provide during registration (name, email, age, gender, location, WhatsApp number, photos, bio) and usage data (interactions, likes, payments).</p>
        <h2 className="text-lg font-semibold text-white mt-6">2. How We Use Your Information</h2>
        <p>We use your information to: provide and improve the Service; match you with other users; process payments; send important notifications; and prevent fraud and abuse.</p>
        <h2 className="text-lg font-semibold text-white mt-6">3. Information Sharing</h2>
        <p>Your public profile (name, age, photos, bio, city) is visible to other users. Your WhatsApp number is only shared when both users have matched and a connection payment is completed. We do not sell your personal data to third parties.</p>
        <h2 className="text-lg font-semibold text-white mt-6">4. Data Storage & Security</h2>
        <p>Your data is stored securely using industry-standard encryption. We use Stripe for payment processing — we never store your credit card details directly.</p>
        <h2 className="text-lg font-semibold text-white mt-6">5. Your Rights</h2>
        <p>You may: access, update, or delete your profile data at any time; request a copy of your personal data; withdraw consent for data processing; or request account deletion by contacting support.</p>
        <h2 className="text-lg font-semibold text-white mt-6">6. Cookies & Tracking</h2>
        <p>We use essential cookies for authentication and session management. We do not use third-party advertising trackers.</p>
        <h2 className="text-lg font-semibold text-white mt-6">7. Location Data</h2>
        <p>If you grant permission, we collect approximate location data to show nearby users. You can disable this in your device settings.</p>
        <h2 className="text-lg font-semibold text-white mt-6">8. Data Retention</h2>
        <p>We retain your data for as long as your account is active. Deleted accounts are purged within 30 days.</p>
        <h2 className="text-lg font-semibold text-white mt-6">9. Children's Privacy</h2>
        <p>SkipTheApp is not intended for users under 18. We do not knowingly collect data from minors.</p>
        <h2 className="text-lg font-semibold text-white mt-6">10. Contact</h2>
        <p>For privacy concerns, contact us at privacy@skiptheapp.com.</p>
      </div>
    </div>
  );
};

export default PrivacyPage;
