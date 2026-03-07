import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/70 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      <h1 className="text-3xl font-display font-bold mb-6">Terms of Service</h1>
      <div className="space-y-4 text-white/70 text-sm leading-relaxed">
        <p><strong className="text-white">Last Updated:</strong> March 6, 2026</p>
        <h2 className="text-lg font-semibold text-white mt-6">1. Acceptance of Terms</h2>
        <p>By accessing or using SkipTheApp ("Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
        <h2 className="text-lg font-semibold text-white mt-6">2. Eligibility</h2>
        <p>You must be at least 18 years old to use this Service. By using SkipTheApp, you represent and warrant that you are at least 18 years of age.</p>
        <h2 className="text-lg font-semibold text-white mt-6">3. Account Registration</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree to provide accurate information during registration.</p>
        <h2 className="text-lg font-semibold text-white mt-6">4. User Conduct</h2>
        <p>You agree not to: use the Service for illegal purposes; harass, abuse, or harm other users; post false, misleading, or offensive content; impersonate another person; or attempt to circumvent any security features.</p>
        <h2 className="text-lg font-semibold text-white mt-6">5. Payments & Refunds</h2>
        <p>Certain features require payment. All payments are processed via Stripe. Payments are non-refundable unless required by applicable law. Connection fees ($1.99) unlock WhatsApp contact sharing between matched users.</p>
        <h2 className="text-lg font-semibold text-white mt-6">6. Content & Intellectual Property</h2>
        <p>You retain ownership of content you upload. By uploading, you grant SkipTheApp a non-exclusive, worldwide license to use, display, and distribute your content within the Service.</p>
        <h2 className="text-lg font-semibold text-white mt-6">7. Termination</h2>
        <p>We reserve the right to suspend or terminate your account at our discretion, including for violations of these Terms.</p>
        <h2 className="text-lg font-semibold text-white mt-6">8. Disclaimers</h2>
        <p>The Service is provided "as is" without warranties of any kind. We do not guarantee matches, connections, or any particular outcome from using the Service.</p>
        <h2 className="text-lg font-semibold text-white mt-6">9. Limitation of Liability</h2>
        <p>SkipTheApp shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
        <h2 className="text-lg font-semibold text-white mt-6">10. Contact</h2>
        <p>For questions about these Terms, contact us at support@skiptheapp.com.</p>
      </div>
    </div>
  );
};

export default TermsPage;
