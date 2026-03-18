import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/button";
import { useSEO } from "@/shared/hooks/useSEO";

const LANGUAGES = [
  { code: "id", flag: "🇮🇩", name: "Indonesia",  dir: "ltr" },
  { code: "en", flag: "🇬🇧", name: "English",    dir: "ltr" },
  { code: "ar", flag: "🇸🇦", name: "العربية",    dir: "rtl" },
  { code: "zh", flag: "🇨🇳", name: "中文",        dir: "ltr" },
  { code: "fr", flag: "🇫🇷", name: "Français",   dir: "ltr" },
] as const;

type LangCode = "id" | "en" | "ar" | "zh" | "fr";

const INTRO: Record<LangCode, { title: string; subtitle: string; body: string }> = {
  id: {
    title: "Syarat & Ketentuan",
    subtitle: "Dengan menggunakan 2DateMe, kamu setuju terikat oleh syarat-syarat berikut.",
    body: "2DateMe adalah aplikasi kencan online terbaik di Indonesia — platform dating app Indonesia yang memungkinkan kamu cari jodoh, kencan online, dan connect langsung via WhatsApp di Jakarta, Bali, Surabaya, Bandung, dan seluruh Indonesia. Dengan mendaftar dan menggunakan layanan 2DateMe, kamu setuju untuk terikat oleh Syarat dan Ketentuan di bawah ini.",
  },
  en: {
    title: "Terms of Service",
    subtitle: "By using 2DateMe you agree to be bound by the following terms.",
    body: "2DateMe is Indonesia's leading online dating platform, connecting singles via WhatsApp across Jakarta, Bali, Surabaya, Bandung, and all of Indonesia. By registering and using 2DateMe, you agree to be legally bound by these Terms and Conditions below.",
  },
  ar: {
    title: "الشروط والأحكام",
    subtitle: "باستخدام 2DateMe، فأنت توافق على الالتزام بالشروط التالية.",
    body: "2DateMe هو تطبيق المواعدة الرائد في إندونيسيا، يربط العزاب عبر واتساب في جاكرتا وبالي وسورابايا وباندونغ وجميع أنحاء إندونيسيا. بالتسجيل واستخدام 2DateMe، فأنت توافق على الالتزام بهذه الشروط والأحكام.",
  },
  zh: {
    title: "服务条款",
    subtitle: "使用 2DateMe 即表示您同意受以下条款的约束。",
    body: "2DateMe 是印度尼西亚领先的在线约会平台，通过 WhatsApp 连接雅加达、巴厘岛、泗水、万隆及印度尼西亚各地的单身人士。注册并使用 2DateMe，即表示您同意受以下条款和条件的法律约束。",
  },
  fr: {
    title: "Conditions d'Utilisation",
    subtitle: "En utilisant 2DateMe, vous acceptez d'être lié par les conditions suivantes.",
    body: "2DateMe est la principale plateforme de rencontres en ligne d'Indonésie, connectant des célibataires via WhatsApp à Jakarta, Bali, Surabaya, Bandung et dans toute l'Indonésie. En vous inscrivant et en utilisant 2DateMe, vous acceptez d'être lié par ces Conditions Générales d'Utilisation.",
  },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-8">
    <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
    <div className="space-y-2 text-white/70 text-sm leading-relaxed">{children}</div>
  </div>
);

const TermsPage = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<LangCode>("id");
  const intro = INTRO[lang];
  const isRtl = lang === "ar";

  useSEO({
    title: "Syarat & Ketentuan – 2DateMe Aplikasi Kencan Indonesia",
    description: "Syarat dan Ketentuan penggunaan 2DateMe, aplikasi kencan online terbaik di Indonesia.",
    canonical: "https://2dateme.com/terms",
    keywords: "syarat ketentuan 2DateMe, terms of service aplikasi kencan Indonesia",
  });

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-black text-white scroll-touch">
      <div className="max-w-2xl mx-auto px-5 py-8 pb-20">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/70 hover:text-white mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {/* ── Language Selector ─────────────────────────────── */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: "20px 16px 18px",
          marginBottom: 32,
        }}>
          <p style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: 15,
            fontWeight: 800,
            textAlign: "center",
            margin: "0 0 18px",
            letterSpacing: "0.02em",
          }}>
            🌐 Select Your Language
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            {LANGUAGES.map((l) => {
              const sel = lang === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as LangCode)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    outline: "none",
                  }}
                >
                  {/* 3D flag circle */}
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    background: sel
                      ? "linear-gradient(145deg, rgba(236,72,153,0.35), rgba(139,92,246,0.35))"
                      : "rgba(255,255,255,0.06)",
                    border: sel
                      ? "2.5px solid rgba(236,72,153,0.8)"
                      : "2px solid rgba(255,255,255,0.12)",
                    boxShadow: sel
                      ? "0 6px 20px rgba(236,72,153,0.35), inset 0 1px 0 rgba(255,255,255,0.2)"
                      : "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
                    transition: "all 0.2s",
                    transform: sel ? "scale(1.12)" : "scale(1)",
                  }}>
                    {l.flag}
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: sel ? 700 : 500,
                    color: sel ? "#f9a8d4" : "rgba(255,255,255,0.45)",
                    transition: "color 0.2s",
                  }}>
                    {l.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Translation disclaimer */}
          <p style={{
            color: "rgba(255,255,255,0.25)",
            fontSize: 9,
            textAlign: "center",
            margin: "14px 0 0",
            fontStyle: "italic",
          }}>
            The authoritative version of these Terms is in Bahasa Indonesia and English. Translations are provided for reference only.
          </p>
        </div>

        {/* ── Title + Intro ─────────────────────────────────── */}
        <div className="mb-8" dir={isRtl ? "rtl" : "ltr"}>
          <h1 className="text-3xl font-display font-bold mb-2">{intro.title}</h1>
          <p className="text-white/40 text-xs mb-3">2DateMe.com · Last updated: March 7, 2026</p>
          <p className="text-pink-300/80 text-sm font-medium mb-4">{intro.subtitle}</p>
          <p className="text-white/70 text-sm leading-relaxed">{intro.body}</p>
        </div>

        {/* ── Sections (English authoritative text) ────────── */}
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

        <Section title="16. Verified Profiles">
          <p>2DateMe offers an optional <strong className="text-white">Verified Badge</strong> programme to help members confirm their identity and build trust within the community.</p>
          <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
            <li>Verification is granted solely at the discretion of 2DateMe administrators following a review of the member's submitted information.</li>
            <li>Once a profile is verified, the member's <strong className="text-white">registered name</strong> and <strong className="text-white">main profile photo</strong> are confirmed and may no longer be changed. This ensures that verified identities remain accurate and trustworthy for all users.</li>
            <li>Additional photos and all other profile details may still be updated at any time.</li>
            <li>The Verified Badge indicates that a member's primary identity information has been reviewed — it does not constitute a guarantee of background, criminal history, or personal conduct. Members seeking further assurance may request a <a href="/marriage-agency" className="text-primary underline">Personal Due Diligence Report</a> through our partner agency.</li>
            <li>2DateMe reserves the right to revoke verification status at any time if information is found to be inaccurate or if the member violates these Terms.</li>
          </ul>
        </Section>

        <Section title="17. Contact Us">
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
