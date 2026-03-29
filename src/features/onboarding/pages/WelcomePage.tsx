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
  { id: "longterm",  emoji: "💑", label: "Long-term relationship" },
  { id: "chat",      emoji: "💬", label: "Chat & friendship" },
  { id: "casual",    emoji: "🔥", label: "Something casual" },
  { id: "marriage",  emoji: "💍", label: "Marriage" },
  { id: "travel",    emoji: "✈️", label: "Travel companion" },
  { id: "unsure",    emoji: "🎯", label: "Not sure yet" },
];

const COUNTRIES = [
  { code: "ID", name: "Indonesia",       flag: "🇮🇩" },
  { code: "SG", name: "Singapore",       flag: "🇸🇬" },
  { code: "MY", name: "Malaysia",        flag: "🇲🇾" },
  { code: "PH", name: "Philippines",     flag: "🇵🇭" },
  { code: "TH", name: "Thailand",        flag: "🇹🇭" },
  { code: "VN", name: "Vietnam",         flag: "🇻🇳" },
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
  return COUNTRIES.find(c => c.code === code) ?? COUNTRIES[0];
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
  const [step, setStep] = useState(1); // 1 | 2 | 3
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [countryDetected, setCountryDetected] = useState(false);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [intent, setIntent] = useState(INTENT_OPTIONS[0]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const dragControls = useDragControls();

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
      setLanguage(getLangByCountryCode(code));
      setCountryDetected(true);
    });
  }, []);

  // Fallback: show slider after 15s if video never fires onEnded (e.g. slow load)
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
        looking_for: intent.id,
      } as any).eq("id", userId);
      // Update app locale — falls back to "en" for languages not fully translated yet
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
    if (step === 4) return true; // photo optional — can skip
    return false;
  };

  const handleNext = () => {
    if (step < 4) setStep(s => s + 1);
    else handleFinish();
  };

  // Sorted countries: detected first, then rest
  const sortedCountries = countryDetected
    ? [country, ...COUNTRIES.filter(c => c.code !== country.code)]
    : COUNTRIES;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#050508", overflow: "hidden" }}>
      {/* ── Background video ─────────────────────────────────────── */}
      <video
        src="https://ik.imagekit.io/dateme/ted%20running%20office.mp4"
        autoPlay
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

      {/* ── Bottom sheet sliders ──────────────────────────────────── */}
      <AnimatePresence>
        {showSlider && (
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
                background: "linear-gradient(160deg, #0a0014 0%, #1a0030 50%, #050008 100%)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Top rim gradient */}
              <div style={{ height: 3, background: "linear-gradient(90deg, #e848c7, #c33cff, #e848c7)", flexShrink: 0 }} />

              {/* Drag handle */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                style={{ flexShrink: 0, padding: "10px 0 0", display: "flex", justifyContent: "center", cursor: "grab" }}
              >
                <div style={{ width: 36, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.18)" }} />
              </div>

              {/* Step dots */}
              <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "10px 0 0", flexShrink: 0 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    width: i === step ? 22 : 6, height: 6, borderRadius: 3,
                    background: i <= step ? "linear-gradient(90deg, #e848c7, #c33cff)" : "rgba(255,255,255,0.12)",
                    transition: "all 0.3s",
                  }} />
                ))}
              </div>

              {/* Scrollable content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
                <AnimatePresence mode="wait">
                  {step === 1 && <Step1 key="s1" name={name} setName={setName} country={country} setCountry={setCountry} countries={sortedCountries} />}
                  {step === 2 && <Step2 key="s2" language={language} setLanguage={setLanguage} />}
                  {step === 3 && <Step3 key="s3" intent={intent} setIntent={setIntent} />}
                  {step === 4 && <Step4 key="s4" avatarUrl={avatarUrl} uploading={uploadingPhoto} onUpload={handlePhotoUpload} />}
                </AnimatePresence>
              </div>

              {/* CTA */}
              <div style={{ flexShrink: 0, padding: "12px 20px 32px" }}>
                <button
                  onClick={handleNext}
                  disabled={!canNext() || saving}
                  style={{
                    width: "100%", height: 52, borderRadius: 16, border: "none",
                    background: canNext() && !saving
                      ? "linear-gradient(135deg, #e848c7, #c33cff)"
                      : "rgba(255,255,255,0.08)",
                    color: "white", fontWeight: 900, fontSize: 16,
                    cursor: canNext() && !saving ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: canNext() ? "0 4px 24px rgba(195,60,255,0.45)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {saving ? (
                    <span style={{
                      width: 20, height: 20, borderRadius: "50%",
                      border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                      animation: "spin 0.7s linear infinite", display: "inline-block",
                    }} />
                  ) : step < 4 ? (
                    <span>Continue</span>
                  ) : avatarUrl ? (
                    <><span>Let's Go 🚀</span></>
                  ) : (
                    <><span>Skip & Continue →</span></>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Step 1: Name + Country ────────────────────────────────────────────────────

function Step1({ name, setName, country, setCountry, countries }: {
  name: string;
  setName: (v: string) => void;
  country: { code: string; name: string; flag: string };
  setCountry: (v: { code: string; name: string; flag: string }) => void;
  countries: typeof COUNTRIES;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.22 }}
    >
      <p style={{ color: "white", fontWeight: 900, fontSize: 20, margin: "0 0 4px" }}>
        What shall we call you? 👋
      </p>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 22px", lineHeight: 1.5 }}>
        An alias is fine — your privacy is yours to keep
      </p>

      {/* Name input */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
          Your name or alias
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 30))}
          placeholder="e.g. Anya, Marco, Jay…"
          maxLength={30}
          autoFocus
          style={{
            width: "100%", height: 48, borderRadius: 14, padding: "0 16px",
            background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.13)",
            color: "white", fontSize: 15, fontWeight: 600, outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(236,72,153,0.55)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.13)")}
        />
      </div>

      {/* Country select */}
      <div>
        <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
          Your country
        </label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 20, pointerEvents: "none" }}>
            {country.flag}
          </span>
          <select
            value={country.code}
            onChange={(e) => {
              const found = countries.find(c => c.code === e.target.value);
              if (found) setCountry(found);
            }}
            style={{
              width: "100%", height: 48, borderRadius: 14, padding: "0 16px 0 46px",
              background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.13)",
              color: "white", fontSize: 14, fontWeight: 600, outline: "none",
              appearance: "none", WebkitAppearance: "none",
              cursor: "pointer",
            }}
          >
            {countries.map(c => (
              <option key={c.code} value={c.code} style={{ background: "#1a1a2e", color: "white" }}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none", fontSize: 12 }}>▾</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Step 2: Language ──────────────────────────────────────────────────────────

function Step2({ language, setLanguage }: {
  language: typeof LANGUAGES[0];
  setLanguage: (v: typeof LANGUAGES[0]) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.22 }}
    >
      <p style={{ color: "white", fontWeight: 900, fontSize: 20, margin: "0 0 4px" }}>
        Which language do you speak? 🌐
      </p>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 16px", lineHeight: 1.5 }}>
        Scroll and tap to select your primary language
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {LANGUAGES.map((lang) => {
          const selected = lang.code === language.code;
          return (
            <motion.button
              key={lang.code}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLanguage(lang)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px", borderRadius: 14, border: "none",
                background: selected ? "rgba(236,72,153,0.12)" : "rgba(255,255,255,0.04)",
                outline: selected ? "2px solid rgba(236,72,153,0.5)" : "2px solid transparent",
                cursor: "pointer", width: "100%", textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 24, flexShrink: 0 }}>{lang.flag}</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}>{lang.name}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: 0, fontWeight: 600 }}>{lang.code}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Step 3: Intent carousel (What are you seeking?) ──────────────────────────

function Step3({ intent, setIntent }: {
  intent: typeof INTENT_OPTIONS[0];
  setIntent: (v: typeof INTENT_OPTIONS[0]) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into center
  useEffect(() => {
    const idx = INTENT_OPTIONS.findIndex(o => o.id === intent.id);
    const container = listRef.current;
    if (!container) return;
    const item = container.children[idx] as HTMLElement;
    if (!item) return;
    item.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [intent]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.22 }}
    >
      <p style={{ color: "white", fontWeight: 900, fontSize: 20, margin: "0 0 4px" }}>
        What are you seeking? 💫
      </p>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 16px", lineHeight: 1.5 }}>
        Scroll and tap to select one
      </p>

      <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {INTENT_OPTIONS.map((opt, idx) => {
          const selected = opt.id === intent.id;
          const distFromCenter = Math.abs(INTENT_OPTIONS.findIndex(o => o.id === intent.id) - idx);
          const scale = selected ? 1 : distFromCenter === 1 ? 0.96 : 0.92;
          const opacity = selected ? 1 : distFromCenter === 1 ? 0.7 : 0.45;

          return (
            <motion.button
              key={opt.id}
              animate={{ scale, opacity }}
              transition={{ duration: 0.2 }}
              onClick={() => setIntent(opt)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: selected ? "16px 18px" : "13px 18px",
                borderRadius: 18, border: "none",
                background: selected
                  ? "linear-gradient(135deg, rgba(236,72,153,0.18), rgba(168,85,247,0.14))"
                  : "rgba(255,255,255,0.04)",
                outline: selected ? "2px solid rgba(236,72,153,0.55)" : "2px solid transparent",
                cursor: "pointer", width: "100%", textAlign: "left",
                transition: "padding 0.2s, background 0.2s",
                transformOrigin: "center",
              }}
            >
              <span style={{ fontSize: selected ? 30 : 24, transition: "font-size 0.2s", flexShrink: 0 }}>
                {opt.emoji}
              </span>
              <p style={{
                color: selected ? "white" : "rgba(255,255,255,0.65)",
                fontWeight: selected ? 800 : 600,
                fontSize: selected ? 16 : 14,
                margin: 0,
                transition: "all 0.2s",
              }}>
                {opt.label}
              </p>
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
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 28px", lineHeight: 1.5, alignSelf: "flex-start" }}>
        Profiles with a photo get 5× more matches — you can skip for now
      </p>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{
          width: 140, height: 140, borderRadius: "50%", border: "none",
          background: avatarUrl ? "transparent" : "rgba(255,255,255,0.06)",
          outline: avatarUrl ? "3px solid rgba(236,72,153,0.55)" : "2px dashed rgba(255,255,255,0.2)",
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
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700 }}>Tap to upload</span>
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
