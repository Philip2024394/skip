import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

// ── Data ────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "EN", name: "English",    flag: "🇬🇧" },
  { code: "ID", name: "Indonesian", flag: "🇮🇩" },
  { code: "ZH", name: "Mandarin",   flag: "🇨🇳" },
  { code: "HI", name: "Hindi",      flag: "🇮🇳" },
  { code: "AR", name: "Arabic",     flag: "🇸🇦" },
  { code: "PT", name: "Portuguese", flag: "🇧🇷" },
  { code: "ES", name: "Spanish",    flag: "🇪🇸" },
  { code: "FR", name: "French",     flag: "🇫🇷" },
  { code: "RU", name: "Russian",    flag: "🇷🇺" },
  { code: "JA", name: "Japanese",   flag: "🇯🇵" },
  { code: "KO", name: "Korean",     flag: "🇰🇷" },
  { code: "DE", name: "German",     flag: "🇩🇪" },
  { code: "TR", name: "Turkish",    flag: "🇹🇷" },
  { code: "VI", name: "Vietnamese", flag: "🇻🇳" },
  { code: "TH", name: "Thai",       flag: "🇹🇭" },
  { code: "MS", name: "Malay",      flag: "🇲🇾" },
  { code: "NL", name: "Dutch",      flag: "🇳🇱" },
  { code: "PL", name: "Polish",     flag: "🇵🇱" },
  { code: "IT", name: "Italian",    flag: "🇮🇹" },
  { code: "SV", name: "Swedish",    flag: "🇸🇪" },
];

const INTENT_OPTIONS = [
  { id: "longterm",  label: "Long-term relationship" },
  { id: "chat",      label: "Chat & friendship" },
  { id: "casual",    label: "Something casual" },
  { id: "marriage",  label: "Marriage" },
  { id: "travel",    label: "Travel companion" },
  { id: "unsure",    label: "Not sure yet" },
];

const COUNTRIES = [
  { code: "SG", name: "Singapore",       flag: "🇸🇬" },
  { code: "MY", name: "Malaysia",        flag: "🇲🇾" },
  { code: "PH", name: "Philippines",     flag: "🇵🇭" },
  { code: "TH", name: "Thailand",        flag: "🇹🇭" },
  { code: "VN", name: "Vietnam",         flag: "🇻🇳" },
  { code: "ID", name: "Indonesia",       flag: "🇮🇩" },
  { code: "AU", name: "Australia",       flag: "🇦🇺" },
  { code: "GB", name: "United Kingdom",  flag: "🇬🇧" },
  { code: "US", name: "United States",   flag: "🇺🇸" },
  { code: "NL", name: "Netherlands",     flag: "🇳🇱" },
  { code: "DE", name: "Germany",         flag: "🇩🇪" },
  { code: "FR", name: "France",          flag: "🇫🇷" },
  { code: "IT", name: "Italy",           flag: "🇮🇹" },
  { code: "ES", name: "Spain",           flag: "🇪🇸" },
  { code: "BR", name: "Brazil",          flag: "🇧🇷" },
  { code: "IN", name: "India",           flag: "🇮🇳" },
  { code: "CN", name: "China",           flag: "🇨🇳" },
  { code: "JP", name: "Japan",           flag: "🇯🇵" },
  { code: "KR", name: "South Korea",     flag: "🇰🇷" },
  { code: "SA", name: "Saudi Arabia",    flag: "🇸🇦" },
  { code: "AE", name: "UAE",             flag: "🇦🇪" },
  { code: "ZA", name: "South Africa",    flag: "🇿🇦" },
  { code: "NG", name: "Nigeria",         flag: "🇳🇬" },
  { code: "CA", name: "Canada",          flag: "🇨🇦" },
  { code: "NZ", name: "New Zealand",     flag: "🇳🇿" },
  { code: "RU", name: "Russia",          flag: "🇷🇺" },
  { code: "TR", name: "Turkey",          flag: "🇹🇷" },
  { code: "PK", name: "Pakistan",        flag: "🇵🇰" },
  { code: "BD", name: "Bangladesh",      flag: "🇧🇩" },
  { code: "EG", name: "Egypt",           flag: "🇪🇬" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function detectCountryCode(): Promise<string> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    const json = await res.json();
    return (json.country_code as string) ?? "ID";
  } catch {
    return "ID";
  }
}

function getCountryByCode(code: string) {
  return COUNTRIES.find(c => c.code === code) ?? COUNTRIES[5]; // default Indonesia
}

// Map country code → default language code
const COUNTRY_LANG_MAP: Record<string, string> = {
  ID:"ID", MY:"MS", SG:"EN", PH:"EN", TH:"TH", VN:"VI",
  CN:"ZH", TW:"ZH", HK:"ZH", JP:"JA", KR:"KO",
  IN:"HI", PK:"AR", BD:"EN", EG:"AR", SA:"AR", AE:"AR",
  DE:"DE", AT:"DE", CH:"DE", FR:"FR", BE:"FR", ES:"ES",
  MX:"ES", AR:"ES", CO:"ES", BR:"PT", PT:"PT",
  RU:"RU", PL:"PL", TR:"TR", NL:"NL", IT:"IT",
  SE:"SV", NO:"SV", DK:"SV",
  GB:"EN", US:"EN", AU:"EN", CA:"EN", NZ:"EN",
};

function getLangByCountryCode(countryCode: string) {
  const langCode = COUNTRY_LANG_MAP[countryCode] ?? "EN";
  return LANGUAGES.find(l => l.code === langCode) ?? LANGUAGES[0];
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WelcomePage() {
  const navigate = useNavigate();
  const { setLocale } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [showSlider, setShowSlider] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [country, setCountry] = useState(COUNTRIES[5]); // Indonesia default
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [language2, setLanguage2] = useState(LANGUAGES[1]);
  const [intent, setIntent] = useState(INTENT_OPTIONS[0]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const dragControls = useDragControls();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Wait 3 seconds on page before starting video
  useEffect(() => {
    const t = setTimeout(() => {
      videoRef.current?.play().catch(() => {});
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  // Get session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/", { replace: true }); return; }
      setUserId(session.user.id);
    });
  }, []);

  // Detect country + default language via IP
  useEffect(() => {
    detectCountryCode().then(code => {
      setCountry(getCountryByCode(code));
      const primary = getLangByCountryCode(code);
      setLanguage(primary);
      // Smart secondary: English unless primary is English, then Indonesian
      setLanguage2(primary.code === "EN"
        ? LANGUAGES.find(l => l.code === "ID")!
        : LANGUAGES.find(l => l.code === "EN")!);
    });
  }, []);

  // Fallback: show slider after 15s if video never fires onEnded
  useEffect(() => {
    const t = setTimeout(() => setShowSlider(true), 15_000);
    return () => clearTimeout(t);
  }, []);

  const handlePhotoUpload = async (file: File) => {
    if (!userId) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Photo must be under 10MB"); return; }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-images")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
      const url = urlData.publicUrl;
      await supabase.from("profiles").update({ avatar_url: url } as any).eq("id", userId);
      setAvatarUrl(url);
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFinish = async () => {
    if (!name.trim()) { toast.error("Please enter your name or alias"); return; }
    if (!userId) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        name: name.trim(),
        country: country.code,
        preferred_language: language.code.toLowerCase(),
        languages_spoken: `${language.code.toLowerCase()},${language2.code.toLowerCase()}`,
        looking_for: intent.id,
      } as any).eq("id", userId);
      const appLocale = language.code.toLowerCase() === "id" ? "id" : "en";
      setLocale(appLocale as any);
      navigate("/home", { replace: true });
    } catch {
      toast.error("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 1) return name.trim().length >= 2;
    if (step === 2) return true;
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) return agreedToTerms;
    return false;
  };

  const handleNext = () => {
    if (step < 5) setStep(s => s + 1);
    else handleFinish();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#050508", overflow: "hidden" }}>
      {/* ── Background video ─────────────────────────────────────── */}
      <video
        ref={videoRef}
        src="https://ik.imagekit.io/dateme/ted%20running%20office.mp4"
        muted
        playsInline
        preload="auto"
        onEnded={() => setShowSlider(true)}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />

      {/* ── Welcome text ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.9 }}
        style={{
          position: "absolute", bottom: "46%", left: 0, right: 0,
          zIndex: 2, textAlign: "center", padding: "0 32px",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
          Welcome to
        </p>
        <p style={{
          color: "white", fontSize: 40, fontWeight: 900, lineHeight: 1.1,
          textShadow: "0 2px 24px rgba(0,0,0,0.7)",
          background: "linear-gradient(135deg, #fff 30%, #f9a8d4)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          2DateMe
        </p>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, marginTop: 10, lineHeight: 1.5 }}>
          Indonesia's home for real connections ❤️
        </p>
      </motion.div>

      {/* ── Bottom sheet sliders (steps 1–4) ─────────────────────── */}
      <AnimatePresence>
        {showSlider && step <= 4 && (
          <>
            {/* Scrim */}
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: "absolute", inset: 0, zIndex: 3, background: "rgba(0,0,0,0.45)" }}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => { if (info.offset.y > 100) setShowSlider(false); }}
              style={{
                position: "absolute", left: 0, right: 0, bottom: 0,
                zIndex: 4,
                maxHeight: "78dvh",
                borderRadius: "28px 28px 0 0",
                backgroundImage: "url('/images/app-background.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* ── Top rim: pink→purple gradient stripe ── */}
              <div style={{
                height: 3, flexShrink: 0,
                background: "linear-gradient(90deg, #e848c7, #c33cff, #e848c7)",
                backgroundSize: "200% 100%",
                animation: "rim-shift 3s linear infinite",
              }} />

              {/* ── Drag handle: fuchsia pill ── */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                style={{ flexShrink: 0, padding: "10px 0 4px", display: "flex", justifyContent: "center", cursor: "grab" }}
              >
                <div style={{
                  width: 38, height: 5, borderRadius: 99,
                  background: "linear-gradient(90deg, rgba(232,72,199,0.7), rgba(195,60,255,0.7))",
                  boxShadow: "0 0 10px rgba(232,72,199,0.5)",
                }} />
              </div>

              {/* ── Progress bar: segmented pill strip ── */}
              <div style={{ display: "flex", gap: 5, padding: "10px 20px 2px", flexShrink: 0 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 4, borderRadius: 99,
                    background: i <= step
                      ? "linear-gradient(90deg, #e848c7, #c33cff)"
                      : "rgba(255,255,255,0.12)",
                    boxShadow: i === step ? "0 0 8px rgba(232,72,199,0.6)" : "none",
                    transition: "all 0.35s ease",
                  }} />
                ))}
              </div>

              {/* ── Step label ── */}
              <div style={{ padding: "6px 20px 0", flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 3, height: 16, borderRadius: 99, background: "linear-gradient(180deg, #e848c7, #c33cff)" }} />
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Step {step} of 4
                </span>
              </div>

              {/* Scrollable content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 8px" }}>
                <AnimatePresence mode="wait">
                  {step === 1 && <Step1 key="s1" name={name} setName={setName} country={country} setCountry={setCountry} />}
                  {step === 2 && <Step2 key="s2" language={language} setLanguage={setLanguage} language2={language2} setLanguage2={setLanguage2} />}
                  {step === 3 && <Step3 key="s3" intent={intent} setIntent={setIntent} />}
                  {step === 4 && <Step4 key="s4" avatarUrl={avatarUrl} uploading={uploadingPhoto} onUpload={handlePhotoUpload} />}
                </AnimatePresence>
              </div>

              {/* ── CTA button ── */}
              <div style={{ flexShrink: 0, padding: "12px 20px 32px" }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNext}
                  disabled={!canNext() || saving}
                  style={{
                    width: "100%", height: 52, borderRadius: 16, border: "none",
                    background: canNext() && !saving
                      ? "linear-gradient(135deg, #e848c7, #c33cff)"
                      : "rgba(255,255,255,0.07)",
                    color: "white",
                    fontWeight: 900, fontSize: 16,
                    cursor: canNext() && !saving ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: canNext() && !saving ? "0 4px 24px rgba(195,60,255,0.45), inset 0 1px 0 rgba(255,255,255,0.15)" : "none",
                    transition: "all 0.25s",
                  }}
                >
                  {saving ? (
                    <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  ) : step < 4 ? (
                    <span>Continue →</span>
                  ) : (
                    avatarUrl ? <span>Continue →</span> : <span>Skip & Continue →</span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Terms & Conditions full-screen overlay (step 5) ──────── */}
      <AnimatePresence>
        {step === 5 && (
          <motion.div
            key="terms"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "absolute", inset: 0, zIndex: 10,
              display: "flex", flexDirection: "column",
              backgroundImage: "url('/images/app-background.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Header */}
            <div style={{
              flexShrink: 0,
              background: "linear-gradient(135deg, #e848c7, #c33cff)",
              padding: "max(44px, env(safe-area-inset-top, 44px)) 20px 18px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <button
                onClick={() => setStep(4)}
                style={{
                  width: 36, height: 36, borderRadius: "50%", border: "none",
                  background: "rgba(255,255,255,0.2)", color: "white",
                  fontSize: 18, cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                ←
              </button>
              <div>
                <p style={{ color: "white", fontWeight: 900, fontSize: 18, margin: 0 }}>Terms & Conditions</p>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: 0, marginTop: 2 }}>Please read before joining</p>
              </div>
            </div>

            {/* Scrollable T&C body */}
            <div style={{
              flex: 1, overflowY: "auto",
              padding: "24px 20px",
              fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.75,
            }}>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" }}>
                Last updated: March 2026
              </p>

              {[
                ["1. Eligibility", "You must be 18 years of age or older to use 2DateMe. By creating an account you confirm you meet this requirement. We reserve the right to terminate accounts that violate this rule."],
                ["2. Respectful Conduct", "You agree to treat all members with respect. Harassment, hate speech, threats, unsolicited explicit content, or abusive behaviour toward any user will result in immediate and permanent account removal."],
                ["3. Authentic Profiles", "You agree to represent yourself honestly. Fake profiles, impersonation of real people, catfishing, and any scam or fraudulent activity are strictly prohibited."],
                ["4. Privacy & Data", "We collect and store only the information necessary to operate the service. We do not sell your personal data to third parties. Your location is used only to show you nearby members and is never shared without consent."],
                ["5. Payments & Refunds", "Premium features are billed through Stripe. Monthly subscriptions auto-renew unless cancelled at least 24 hours before the renewal date. One-time purchases are final. Refunds are handled in accordance with local consumer law."],
                ["6. User Content", "You retain ownership of photos and content you upload. By uploading you grant 2DateMe a non-exclusive licence to display your content within the platform. You must not upload illegal, explicit, violent, or copyright-infringing content."],
                ["7. Safety", "2DateMe is not responsible for the actions of other users. Always meet in public places for first dates. Report suspicious behaviour using the in-app report feature and our support team will review within 24 hours."],
                ["8. Limitation of Liability", "The platform is provided 'as is'. We do not guarantee you will find a match. We are not liable for any loss or damage arising from your use of the service beyond the maximum permitted by law."],
                ["9. Changes to Terms", "We may update these terms at any time. We will notify you of significant changes via the app or email. Continued use after notice constitutes acceptance of the updated terms."],
                ["10. Contact", "For questions or support: support@date2me.com"],
              ].map(([title, body]) => (
                <div key={title as string} style={{ marginBottom: 22 }}>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: "0 0 6px" }}>{title}</p>
                  <p style={{ margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              flexShrink: 0,
              padding: "16px 20px max(28px, env(safe-area-inset-bottom, 28px))",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.3)",
            }}>
              {/* Agree checkbox */}
              <button
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", borderRadius: 14, border: "none", width: "100%",
                  background: agreedToTerms ? "rgba(232,72,199,0.12)" : "rgba(255,255,255,0.05)",
                  outline: agreedToTerms ? "2px solid rgba(232,72,199,0.5)" : "2px solid rgba(255,255,255,0.1)",
                  cursor: "pointer", textAlign: "left", marginBottom: 12,
                  transition: "all 0.2s",
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: agreedToTerms ? "linear-gradient(135deg, #e848c7, #c33cff)" : "rgba(255,255,255,0.08)",
                  border: agreedToTerms ? "none" : "1.5px solid rgba(255,255,255,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}>
                  {agreedToTerms && <span style={{ color: "white", fontSize: 13, fontWeight: 900 }}>✓</span>}
                </div>
                <p style={{ margin: 0, color: agreedToTerms ? "white" : "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 600 }}>
                  I have read and agree to the Terms & Conditions
                </p>
              </button>

              {/* Agree button */}
              <button
                onClick={handleFinish}
                disabled={!agreedToTerms || saving}
                style={{
                  width: "100%", height: 52, borderRadius: 16, border: "none",
                  background: agreedToTerms && !saving
                    ? "linear-gradient(135deg, #e848c7, #c33cff)"
                    : "rgba(255,255,255,0.08)",
                  color: "white", fontWeight: 900, fontSize: 16,
                  cursor: agreedToTerms && !saving ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: agreedToTerms ? "0 4px 24px rgba(195,60,255,0.45)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {saving ? (
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                    animation: "spin 0.7s linear infinite", display: "inline-block",
                  }} />
                ) : (
                  <span>I Agree & Enter the App 🚀</span>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes rim-shift { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
      `}</style>
    </div>
  );
}

// ── Wheel Picker ──────────────────────────────────────────────────────────────

const ITEM_H = 58;

function WheelPicker({ items, selected, onSelect }: {
  items: { key: string; label: string }[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(() => Math.max(0, items.findIndex(i => i.key === selected)));
  const snapTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = activeIdx * ITEM_H;
  }, []);

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    setActiveIdx(clamped);
    clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
      onSelect(items[clamped].key);
    }, 120);
  };

  return (
    <div style={{ position: "relative", height: ITEM_H * 3, overflow: "hidden", borderRadius: 14 }}>
      {/* ── Top fade ── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: ITEM_H, background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)", zIndex: 2, pointerEvents: "none" }} />
      {/* ── Bottom fade ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: ITEM_H, background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)", zIndex: 2, pointerEvents: "none" }} />
      {/* ── Centre highlight: home-page card style ── */}
      <div style={{
        position: "absolute", top: ITEM_H, left: 6, right: 6, height: ITEM_H,
        background: "linear-gradient(135deg, rgba(232,72,199,0.13), rgba(195,60,255,0.1))",
        border: "1px solid rgba(232,72,199,0.28)",
        borderRadius: 12,
        boxShadow: "0 0 14px rgba(232,72,199,0.15)",
        zIndex: 1, pointerEvents: "none",
      }} />
      {/* Scrollable list */}
      <div
        ref={ref}
        onScroll={handleScroll}
        className="wheel-hide-scroll"
        style={{ height: "100%", overflowY: "scroll", scrollSnapType: "y mandatory", paddingTop: ITEM_H, paddingBottom: ITEM_H, scrollbarWidth: "none", position: "relative", zIndex: 0 }}
      >
        {items.map((item, i) => {
          const dist = Math.abs(i - activeIdx);
          const isCenter = i === activeIdx;
          return (
            <div
              key={item.key}
              onClick={() => {
                setActiveIdx(i);
                ref.current?.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
                onSelect(item.key);
              }}
              style={{
                height: ITEM_H, scrollSnapAlign: "center",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <span style={{
                color: isCenter ? "#ffffff" : dist === 1 ? "#ffffffaa" : "#ffffff55",
                fontSize: isCenter ? 15 : dist === 1 ? 13 : 11,
                fontWeight: isCenter ? 800 : dist === 1 ? 500 : 400,
                letterSpacing: isCenter ? "0.02em" : 0,
                transition: "all 0.18s",
                textAlign: "center",
                userSelect: "none",
                paddingLeft: 8,
                paddingRight: 4,
              }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`.wheel-hide-scroll::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

// ── Step 1: Name + Country ────────────────────────────────────────────────────

function Step1({ name, setName, country, setCountry }: {
  name: string;
  setName: (v: string) => void;
  country: { code: string; name: string; flag: string };
  setCountry: (v: { code: string; name: string; flag: string }) => void;
}) {
  const countryItems = COUNTRIES.map(c => ({ key: c.code, label: `${c.flag}  ${c.name}` }));

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.22 }}
    >
      <p style={{ color: "white", fontWeight: 900, fontSize: 20, margin: "0 0 18px" }}>
        What shall we call you?
      </p>

      {/* Name input */}
      <div style={{ marginBottom: 18 }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 30))}
          placeholder="e.g. Anya, Marco, Jay…"
          maxLength={30}
          autoFocus
          style={{
            width: "100%", height: 48, borderRadius: 14, padding: "0 16px",
            background: "rgba(0,0,0,0.4)", border: "1.5px solid rgba(255,255,255,0.15)",
            color: "white", fontSize: 15, fontWeight: 600, outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(232,72,199,0.8)"; e.target.style.boxShadow = "0 0 0 3px rgba(232,72,199,0.15)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.boxShadow = "none"; }}
        />
      </div>

      {/* Country wheel */}
      <label style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
        Your country
      </label>
      <WheelPicker
        items={countryItems}
        selected={country.code}
        onSelect={(key) => {
          const found = COUNTRIES.find(c => c.code === key);
          if (found) setCountry(found);
        }}
      />
    </motion.div>
  );
}

// ── Step 2: Language — two side-by-side wheel carousels ───────────────────────

function Step2({ language, setLanguage, language2, setLanguage2 }: {
  language: typeof LANGUAGES[0];
  setLanguage: (v: typeof LANGUAGES[0]) => void;
  language2: typeof LANGUAGES[0];
  setLanguage2: (v: typeof LANGUAGES[0]) => void;
}) {
  const langItems = LANGUAGES.map(l => ({ key: l.code, label: `${l.flag}  ${l.name}` }));

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.22 }}
    >
      <p style={{ color: "white", fontWeight: 900, fontSize: 20, margin: "0 0 4px" }}>
        Which language do you speak?
      </p>
      <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: "0 0 16px", lineHeight: 1.5 }}>
        Select up to 2 languages
      </p>

      <div style={{ display: "flex", gap: 10 }}>
        {/* Primary */}
        <div style={{ flex: 1 }}>
          <label style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
            Primary
          </label>
          <WheelPicker
            items={langItems}
            selected={language.code}
            onSelect={(key) => {
              const found = LANGUAGES.find(l => l.code === key);
              if (found) setLanguage(found);
            }}
          />
        </div>

        {/* Also speaks */}
        <div style={{ flex: 1 }}>
          <label style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
            Also speaks
          </label>
          <WheelPicker
            items={langItems}
            selected={language2.code}
            onSelect={(key) => {
              const found = LANGUAGES.find(l => l.code === key);
              if (found) setLanguage2(found);
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── Step 3: Intent pill chips ─────────────────────────────────────────────────

const INTENT_ICONS: Record<string, string> = {
  longterm: "💞",
  chat: "💬",
  casual: "✨",
  marriage: "💍",
  travel: "✈️",
  unsure: "🤔",
};

function Step3({ intent, setIntent }: {
  intent: typeof INTENT_OPTIONS[0];
  setIntent: (v: typeof INTENT_OPTIONS[0]) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.22 }}
    >
      <p style={{ color: "white", fontWeight: 900, fontSize: 20, margin: "0 0 4px" }}>
        What are you seeking?
      </p>
      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: "0 0 16px", lineHeight: 1.5 }}>
        Tap to select
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {INTENT_OPTIONS.map(o => {
          const active = intent.id === o.id;
          return (
            <motion.button
              key={o.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIntent(o)}
              style={{
                padding: "13px 12px",
                borderRadius: 16,
                border: active ? "1.5px solid rgba(232,72,199,0.7)" : "1px solid rgba(255,255,255,0.1)",
                background: active
                  ? "linear-gradient(135deg, rgba(232,72,199,0.18), rgba(195,60,255,0.14))"
                  : "rgba(0,0,0,0.35)",
                boxShadow: active ? "0 0 16px rgba(232,72,199,0.3), inset 0 0 8px rgba(232,72,199,0.08)" : "none",
                cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6,
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{INTENT_ICONS[o.id]}</span>
              <span style={{ color: active ? "white" : "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: active ? 800 : 500, lineHeight: 1.2, textAlign: "left" }}>
                {o.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Step 4: Profile photo ─────────────────────────────────────────────────────

function Step4({ avatarUrl, uploading, onUpload }: {
  avatarUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.22 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 8 }}
    >
      <p style={{ color: "white", fontWeight: 900, fontSize: 20, margin: "0 0 4px", alignSelf: "flex-start" }}>
        Add your photo 📸
      </p>
      <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: "0 0 28px", lineHeight: 1.5, alignSelf: "flex-start" }}>
        Profiles with a photo get 5× more matches — you can skip for now
      </p>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{
          width: 140, height: 140, borderRadius: "50%", border: "none",
          background: avatarUrl ? "transparent" : "rgba(0,0,0,0.2)",
          outline: avatarUrl ? "3px solid rgba(255,255,255,0.9)" : "2px dashed rgba(255,255,255,0.4)",
          outlineOffset: 3,
          cursor: uploading ? "default" : "pointer",
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : uploading ? (
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#ec4899",
            animation: "spin 0.7s linear infinite",
          }} />
        ) : (
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700 }}>Tap to upload</span>
        )}
      </motion.button>

      {avatarUrl && (
        <motion.button
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => fileRef.current?.click()}
          style={{
            marginTop: 16, padding: "8px 20px", borderRadius: 24,
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          Change photo
        </motion.button>
      )}

      <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 10, marginTop: 20, textAlign: "center" }}>
        JPG or PNG · Max 10MB · You can update this later in your profile
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onUpload(file);
        }}
      />
    </motion.div>
  );
}
