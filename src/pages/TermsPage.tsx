import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-8">
    <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
    <div className="space-y-2 text-white/70 text-sm leading-relaxed">{children}</div>
  </div>
);

const TermsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-5 py-8 pb-20">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/70 hover:text-white mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Terms of Service</h1>
          <p className="text-white/40 text-xs">2DateMe.com · Last updated: March 7, 2026</p>
        </div>

        <p className="text-white/70 text-sm leading-relaxed">
          Please read these Terms of Service ("<strong className="text-white">Terms</strong>") carefully before using 2DateMe ("<strong className="text-white">we</strong>", "<strong className="text-white">us</strong>", "<strong className="text-white">our</strong>") at 2DateMe.com or our mobile application (the "<strong className="text-white">Service</strong>"). By accessing or using the Service, you agree to be legally bound by these Terms. If you do not agree, please do not use the Service.
        </p>

        <Section title="1. Eligibility">
          <p>You must be at least <strong className="text-white">18 years of age</strong> to use 2DateMe. By creating an account, you confirm that you are 18 or older and legally capable of entering into a binding agreement. We reserve the right to verify your age and to terminate accounts where we have reasonable cause to believe a user is under 18.</p>
        </Section>

        <Section title="2. Account Registration">
          <p>You agree to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Keep your password secure and confidential</li>
            <li>Notify us immediately of any unauthorised use of your account</li>
            <li>Take full responsibility for all activity conducted under your account</li>
          </ul>
          <p>2DateMe is not liable for any loss or damage arising from your failure to keep your credentials secure.</p>
        </Section>

        <Section title="3. Acceptable Use">
          <p>You agree <strong className="text-white">not</strong> to use the Service to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Violate any applicable local, national, or international law or regulation</li>
            <li>Harass, intimidate, bully, stalk, abuse, or harm other users</li>
            <li>Post false, misleading, defamatory, or fraudulent content</li>
            <li>Impersonate any person or entity, or misrepresent your identity or affiliation</li>
            <li>Upload content that is pornographic, violent, hateful, or discriminatory</li>
            <li>Solicit money, engage in commercial promotion, or advertise products or services without our prior written consent</li>
            <li>Attempt to gain unauthorised access to any part of the Service or its infrastructure</li>
            <li>Use automated tools (bots, scrapers, scripts) to access or collect data from the Service</li>
            <li>Engage in any activity that could damage, disable, or impair the Service</li>
            <li>Facilitate or engage in human trafficking, exploitation, or any criminal activity</li>
          </ul>
          <p>Violation of these rules may result in immediate account suspension or permanent termination without notice or refund.</p>
        </Section>

        <Section title="4. Profile Content & Photos">
          <p>You are solely responsible for all content you upload, including photos, voice introductions, bio text, and first-date suggestions. By uploading content, you represent that:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>You own the content or have all necessary rights to post it</li>
            <li>The content does not infringe any third-party intellectual property, privacy, or other rights</li>
            <li>The content is accurate and does not misrepresent your identity or appearance</li>
            <li>Photos show only yourself — no group shots as your primary photo</li>
          </ul>
          <p>We reserve the right to remove any content that violates these Terms or our community standards, without notice.</p>
        </Section>

        <Section title="5. Premium Features & Payments">
          <p>Certain features of 2DateMe require payment, including but not limited to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-white">WhatsApp Connection ($1.99):</strong> Unlocks sharing of WhatsApp contact details between matched users</li>
            <li><strong className="text-white">Super Like ($1.99):</strong> Elevates your profile to the top of another user's library</li>
            <li><strong className="text-white">VIP Membership ($10.99/month):</strong> Includes 7 WhatsApp unlocks, 5 super likes, and profile spotlight</li>
            <li><strong className="text-white">Plus-One Premium ($19.99):</strong> Activates the Plus-One badge for event companion connections and includes WhatsApp access</li>
            <li><strong className="text-white">Profile Boost, Incognito Mode, Spotlight, Verified Badge:</strong> As described at time of purchase</li>
          </ul>
          <p>All payments are processed securely by <strong className="text-white">Stripe</strong>. By making a purchase, you authorise the charge to your nominated payment method.</p>
          <p><strong className="text-white">Refund policy:</strong> All purchases are final and non-refundable, except where required by applicable consumer protection laws. If you believe you have been charged in error, contact us at <a href="mailto:support@2DateMe.com" className="text-primary underline">support@2DateMe.com</a> within 7 days of the charge.</p>
          <p>Subscription features renew automatically unless cancelled before the renewal date. You may cancel at any time through your account settings.</p>
        </Section>

        <Section title="6. WhatsApp Connections — Safety Notice">
          <p>By using the WhatsApp connection feature, you acknowledge that:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>2DateMe facilitates introductions only — we are not responsible for the conduct of users after a connection is made</li>
            <li>You should take time to evaluate a profile thoroughly before sharing personal information</li>
            <li>We recommend meeting for the first time in well-established, public locations</li>
            <li>You should not share your home address, financial details, or other sensitive personal information until you are confident in the other person's identity</li>
            <li>WhatsApp offers advanced blocking and reporting tools — please use them if you feel uncomfortable at any time</li>
          </ul>
          <p>2DateMe is not liable for any harm, loss, or damage arising from interactions or meetings that take place outside the platform.</p>
        </Section>

        <Section title="7. Plus-One Feature — Companion Connections">
          <p>The Plus-One feature is designed for members seeking event companions and social experiences. It is not a commercial escort service. By activating Plus-One:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>You confirm the connection is consensual and social in nature</li>
            <li>You agree not to use the feature for any commercial, exploitative, or illegal purpose</li>
            <li>2DateMe takes no responsibility for arrangements, agreements, or events organised between members</li>
          </ul>
        </Section>

        <Section title="8. Intellectual Property">
          <p>The 2DateMe brand, logo, design, and all proprietary software are owned by 2DateMe and are protected by copyright, trademark, and other intellectual property laws. You may not copy, reproduce, distribute, or create derivative works without our express written permission.</p>
          <p>You retain ownership of content you upload to the Service. By uploading, you grant 2DateMe a non-exclusive, worldwide, royalty-free licence to store, display, and use your content within the Service for the purpose of operating and improving the platform.</p>
        </Section>

        <Section title="9. Privacy">
          <p>Your use of the Service is also governed by our <a href="/privacy" className="text-primary underline">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>
        </Section>

        <Section title="10. Termination & Account Suspension">
          <p>We reserve the right to suspend, restrict, or permanently terminate your account at any time, with or without notice, if we determine that you have violated these Terms, engaged in harmful conduct, or for any other reason we deem necessary to protect the Service or its users.</p>
          <p>You may delete your account at any time from your Dashboard. Upon deletion, your profile is removed from public view and your data is purged within 30 days in accordance with our Privacy Policy.</p>
          <p>No refunds will be issued upon account termination due to a breach of these Terms.</p>
        </Section>

        <Section title="11. Disclaimers">
          <p>The Service is provided on an "<strong className="text-white">as is</strong>" and "<strong className="text-white">as available</strong>" basis without warranties of any kind, either express or implied. We do not warrant that:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>The Service will be uninterrupted, error-free, or secure</li>
            <li>Any particular matches, connections, or relationships will result from using the Service</li>
            <li>Profile information provided by other users is accurate or truthful</li>
          </ul>
          <p>2DateMe is a platform that facilitates connections between independent adult users. We are not a matchmaking agency and make no guarantees regarding the quality, safety, or suitability of any user.</p>
        </Section>

        <Section title="12. Limitation of Liability">
          <p>To the maximum extent permitted by applicable law, 2DateMe, its directors, officers, employees, and partners shall not be liable for any:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Indirect, incidental, special, consequential, or punitive damages</li>
            <li>Loss of data, revenue, profits, or goodwill</li>
            <li>Damages arising from interactions or meetings between users facilitated through the Service</li>
            <li>Unauthorised access to or alteration of your data</li>
          </ul>
          <p>Where liability cannot be excluded, our total liability to you shall not exceed the amount you paid to us in the 12 months preceding the claim.</p>
        </Section>

        <Section title="13. Indemnification">
          <p>You agree to indemnify, defend, and hold harmless 2DateMe and its affiliates from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in connection with your use of the Service, your content, or your violation of these Terms.</p>
        </Section>

        <Section title="14. Governing Law & Disputes">
          <p>These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising from these Terms or your use of the Service shall first be attempted to be resolved informally by contacting us at <a href="mailto:support@2DateMe.com" className="text-primary underline">support@2DateMe.com</a>. If a dispute cannot be resolved informally, it shall be subject to the exclusive jurisdiction of the competent courts.</p>
        </Section>

        <Section title="15. Changes to These Terms">
          <p>We may update these Terms from time to time. We will notify you of material changes by updating the "Last Updated" date at the top of this page and, where appropriate, by sending you an email notification. Your continued use of the Service after changes take effect constitutes your acceptance of the revised Terms.</p>
        </Section>

        <Section title="16. Contact Us">
          <p>For questions, concerns, or support regarding these Terms:</p>
          <p className="mt-2">
            <strong className="text-white">2DateMe Support</strong><br />
            <a href="mailto:support@2DateMe.com" className="text-primary underline">support@2DateMe.com</a><br />
            <a href="https://2DateMe.com" className="text-primary underline" target="_blank" rel="noopener noreferrer">2DateMe.com</a>
          </p>
        </Section>
      </div>
    </div>
  );
};

export default TermsPage;
