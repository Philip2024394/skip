import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-8">
    <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
    <div className="space-y-2 text-white/70 text-sm leading-relaxed">{children}</div>
  </div>
);

const PrivacyPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-5 py-8 pb-20">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/70 hover:text-white mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Privacy Policy</h1>
          <p className="text-white/40 text-xs">skiptheapp.com · Last updated: March 7, 2026</p>
        </div>

        <p className="text-white/70 text-sm leading-relaxed">
          SkipTheApp ("<strong className="text-white">we</strong>", "<strong className="text-white">us</strong>", or "<strong className="text-white">our</strong>") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and the choices you have. By using skiptheapp.com or our mobile application ("<strong className="text-white">Service</strong>"), you agree to this policy.
        </p>

        <Section title="1. Information We Collect">
          <p><strong className="text-white">Registration data:</strong> Name, email address, age, gender, sexual preference, country, city, bio, and profile photos provided when you create an account.</p>
          <p><strong className="text-white">Contact details:</strong> WhatsApp number, which is stored securely and only shared with another user after both parties have matched <em>and</em> a connection payment has been completed.</p>
          <p><strong className="text-white">Usage data:</strong> Likes, super likes, swipe activity, feature purchases, session duration, and app interaction logs.</p>
          <p><strong className="text-white">Location data:</strong> Approximate GPS coordinates (with your permission) to calculate distance between users and display profiles on the map. You can revoke this permission at any time in your device settings.</p>
          <p><strong className="text-white">Payment data:</strong> Payment transactions are processed by Stripe. We receive a confirmation record only — we never store your full card number, CVV, or bank details.</p>
          <p><strong className="text-white">Technical data:</strong> Device type, operating system, browser type, IP address, and crash/error logs collected automatically for performance and security purposes.</p>
          <p><strong className="text-white">Voice introductions:</strong> Audio clips you choose to upload to your profile. These are stored securely and visible only to other users browsing your profile.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use your data to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Provide, personalise, and improve the Service</li>
            <li>Match and display your profile to other compatible users</li>
            <li>Process payments and deliver purchased features</li>
            <li>Send transactional emails (e.g. account confirmation, password reset)</li>
            <li>Detect, prevent, and investigate fraud, abuse, and safety violations</li>
            <li>Comply with legal obligations</li>
            <li>Respond to your support requests</li>
          </ul>
          <p>We do <strong className="text-white">not</strong> use your data to serve third-party advertising.</p>
        </Section>

        <Section title="3. How We Share Your Information">
          <p><strong className="text-white">Other users:</strong> Your public profile (name, age, photos, bio, city, first-date idea, badges) is visible to other members. Your WhatsApp number is <em>only</em> revealed to a matched user after a successful connection payment by one of the parties.</p>
          <p><strong className="text-white">Service providers:</strong> We share data with trusted third-party providers who help operate the Service (e.g. Supabase for database/authentication, Stripe for payments, cloud storage for photos). These providers are contractually bound to protect your data.</p>
          <p><strong className="text-white">Legal requirements:</strong> We may disclose your data if required by law, court order, or to protect the rights and safety of SkipTheApp, its users, or the public.</p>
          <p><strong className="text-white">Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred to the new entity under the same privacy protections.</p>
          <p>We do <strong className="text-white">not</strong> sell, rent, or trade your personal data.</p>
        </Section>

        <Section title="4. Data Storage & Security">
          <p>Your data is stored on secure servers with industry-standard encryption (TLS in transit, AES-256 at rest). Access to personal data is restricted to authorised personnel only.</p>
          <p>While we apply all reasonable security measures, no system is completely immune to threats. In the event of a data breach that affects your rights, we will notify you as required by applicable law.</p>
        </Section>

        <Section title="5. Location Data">
          <p>Location is requested only when you grant permission. We store your approximate coordinates (latitude/longitude) to power the nearby-user map feature. You can disable location access at any time in your device settings — this will hide you from the map but will not affect other app features.</p>
        </Section>

        <Section title="6. Cookies & Local Storage">
          <p>We use essential browser storage (localStorage / sessionStorage) for authentication tokens and user preferences such as swipe history. We do not use third-party advertising cookies. You can clear this data at any time through your browser or device settings.</p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>SkipTheApp is strictly for users aged 18 and over. We do not knowingly collect any personal data from minors. If we become aware that a user under 18 has registered, we will promptly delete their account and associated data. If you believe a minor has created an account, please contact us at <a href="mailto:privacy@skiptheapp.com" className="text-primary underline">privacy@skiptheapp.com</a>.</p>
        </Section>

        <Section title="8. Your Rights">
          <p>Depending on your country of residence, you may have the right to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-white">Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong className="text-white">Rectification</strong> — correct inaccurate or incomplete data</li>
            <li><strong className="text-white">Erasure</strong> — request deletion of your account and associated data</li>
            <li><strong className="text-white">Restriction</strong> — ask us to limit how we process your data</li>
            <li><strong className="text-white">Portability</strong> — receive your data in a machine-readable format</li>
            <li><strong className="text-white">Objection</strong> — object to processing based on legitimate interests</li>
            <li><strong className="text-white">Withdraw consent</strong> — opt out of any processing based on consent</li>
          </ul>
          <p>To exercise any of these rights, contact us at <a href="mailto:privacy@skiptheapp.com" className="text-primary underline">privacy@skiptheapp.com</a>. We will respond within 30 days.</p>
        </Section>

        <Section title="9. Data Retention">
          <p>We retain your data for as long as your account is active. If you deactivate your account, your profile is hidden but data is retained for 90 days to allow reactivation. Permanently deleted accounts are fully purged within 30 days of deletion, except where retention is required by law (e.g. payment records for tax compliance).</p>
        </Section>

        <Section title="10. Third-Party Links">
          <p>Our Service may contain links to external websites (e.g. Instagram venue links on profiles, WhatsApp). We are not responsible for the privacy practices of those third parties. We encourage you to review their privacy policies before sharing any personal information with them.</p>
        </Section>

        <Section title="11. International Data Transfers">
          <p>Your data may be processed in countries outside your own. We ensure that appropriate safeguards are in place for any such transfers in accordance with applicable data protection laws.</p>
        </Section>

        <Section title="12. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. When we do, we will update the "Last Updated" date at the top of this page and, for significant changes, notify you via email or an in-app notice. Continued use of the Service after changes are posted constitutes your acceptance of the revised policy.</p>
        </Section>

        <Section title="13. Contact Us">
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us:</p>
          <p className="mt-2">
            <strong className="text-white">SkipTheApp Privacy Team</strong><br />
            <a href="mailto:privacy@skiptheapp.com" className="text-primary underline">privacy@skiptheapp.com</a><br />
            <a href="https://skiptheapp.com" className="text-primary underline" target="_blank" rel="noopener noreferrer">skiptheapp.com</a>
          </p>
        </Section>
      </div>
    </div>
  );
};

export default PrivacyPage;
