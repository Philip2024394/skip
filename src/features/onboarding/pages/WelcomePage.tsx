import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { checkProfilePhoto } from "@/shared/utils/photoFaceCheck";
import AppLogo from "@/shared/components/AppLogo";

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
  { id: "tonight",   label: "Meet Tonight",          icon: "🌙", desc: "You're ready to meet someone today. We'll show you people who are free right now and nearby.", vip: true },
  { id: "weekend",   label: "Weekend Companion",     icon: "☀️", desc: "Someone to share your weekend with — brunch, beach, spontaneous adventures. No strings, just vibes.", vip: false },
  { id: "events",    label: "Events Companion",      icon: "🎟️", desc: "A plus-one for concerts, dinners, weddings or work events. Build real connections through shared experiences.", vip: false },
  { id: "longterm",  label: "Long-term",             icon: "💞", desc: "You want something real and lasting. Someone to grow with, build with, and come home to.", vip: false },
  { id: "marriage",  label: "Marriage",              icon: "💍", desc: "You're serious about finding a life partner. We'll highlight profiles who share the same commitment.", vip: false },
  { id: "chat",      label: "Chat & Friendship",     icon: "💬", desc: "No pressure, just genuine connections. Great conversations, new friends, maybe something more.", vip: false },
  { id: "casual",    label: "Something Casual",      icon: "✨", desc: "Fun and light — you know what you want and you're honest about it. Mutual respect always.", vip: false },
  { id: "travel",    label: "Travel Companion",      icon: "✈️", desc: "Explore new places with someone who loves adventure as much as you do. Near or far.", vip: false },
  { id: "unsure",    label: "Not Sure Yet",          icon: "🤔", desc: "Still figuring it out — that's perfectly fine. Browse freely and see what feels right.", vip: false },
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

  // ── Coins reward state ───────────────────────────────────────────────────
  const STEP_COINS: Record<number, number> = { 1: 2, 2: 3, 3: 5, 4: 5 };
  const SOCIAL_PROOF_BONUS = 5;
  const STEP_COIN_IMG: Record<number, string> = {
    2: "https://ik.imagekit.io/dateme/Three%20golden%20coins%20with%20confetti.png",
  };
  const CONGRATS_IMG: Record<number, string> = {
    1: "https://ik.imagekit.io/dateme/Celebrating%20earned%20coins%20with%20confetti.png",
    2: "https://ik.imagekit.io/dateme/Three%20golden%20coins%20with%20confetti.png",
    3: "https://ik.imagekit.io/dateme/Congrats%20on%20your%205%20coins!.png",
    4: "https://ik.imagekit.io/dateme/Celebratory%20coin%20reward%20graphic.png",
  };
  const [totalCoins, setTotalCoins] = useState(0);
  const [coinFalling, setCoinFalling] = useState(false);
  const [earnedThisStep, setEarnedThisStep] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsStep, setCongratsStep] = useState(1);
  const [showCoinsPopup, setShowCoinsPopup] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [country, setCountry] = useState(COUNTRIES[5]); // Indonesia default
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [language2, setLanguage2] = useState<typeof LANGUAGES[0] | null>(null);
  const [gender, setGender] = useState<"man" | "woman" | null>(null);
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [intent, setIntent] = useState(INTENT_OPTIONS[3]); // default: long-term
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [socialPlatform, setSocialPlatform] = useState<string | null>(null);
  const [socialFollowers, setSocialFollowers] = useState<string>("");

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
    if (import.meta.env.DEV) { setUserId("dev-user"); return; }
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
      // Secondary defaults to None — user picks manually
      setLanguage2(null);
    });
  }, []);

  // Fallback: show slider after 15s if video never fires onEnded
  useEffect(() => {
    const t = setTimeout(() => setShowSlider(true), 15_000);
    return () => clearTimeout(t);
  }, []);

  // Auto-close coins popup after 5s → open terms
  useEffect(() => {
    if (!showCoinsPopup) return;
    const t = setTimeout(() => { setShowCoinsPopup(false); setStep(5); }, 5000);
    return () => clearTimeout(t);
  }, [showCoinsPopup]);

  const handlePhotoUpload = async (file: File) => {
    if (!userId) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Photo must be under 10MB"); return; }
    setUploadingPhoto(true);
    try {
      // ── Smart photo check (warnings only — never block the upload) ──────────
      const check = await checkProfilePhoto(file);
      check.warnings.forEach(w => toast.warning(w, { duration: 4000 }));
      // ───────────────────────────────────────────────────────────────────────

      // DEV: skip real storage, use object URL
      if (import.meta.env.DEV) {
        const url = URL.createObjectURL(file);
        setAvatarUrl(url);
        toast.success("Photo uploaded!");
        return;
      }

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
      const followers = parseInt(socialFollowers.replace(/[^0-9]/g, ""), 10);
      await supabase.from("profiles").update({
        name: name.trim(),
        country: country.code,
        preferred_language: language.code.toLowerCase(),
        languages_spoken: language2 ? `${language.code.toLowerCase()},${language2.code.toLowerCase()}` : language.code.toLowerCase(),
        gender: gender ?? undefined,
        looking_for: intent.id,
        ...(dobDay && dobMonth && dobYear ? { date_of_birth: `${dobYear}-${dobMonth.padStart(2,"0")}-${dobDay.padStart(2,"0")}` } : {}),
        coins_balance: 50 + totalCoins,
        ...(socialPlatform ? { social_platform: socialPlatform, social_followers: isNaN(followers) ? null : followers } : {}),
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
    if (step === 2) return gender !== null;
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) return agreedToTerms;
    return false;
  };

  // Persist earned coins to DB atomically via award_coins RPC
  const persistCoins = async (amount: number, reason: string) => {
    if (!userId || amount <= 0 || import.meta.env.DEV) return;
    try {
      await supabase.rpc("award_coins" as any, {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
      });
    } catch {
      // Non-blocking — UI already updated optimistically
    }
  };

  const handleNext = () => {
    if (step <= 4) {
      // Step 4: coins only for completed tasks
      let earned: number;
      if (step === 4) {
        const photoCoins = avatarUrl ? 5 : 0;
        const socialCoins = socialPlatform ? SOCIAL_PROOF_BONUS : 0;
        earned = photoCoins + socialCoins;
      } else if (step === 2) {
        earned = gender !== null ? (STEP_COINS[2] ?? 0) : 0;
      } else {
        earned = STEP_COINS[step] ?? 0;
      }

      const advanceStep = () => {
        if (step === 4) setShowCoinsPopup(true);
        else setStep(s => s + 1);
      };

      if (earned === 0) {
        advanceStep();
        return;
      }

      // Persist to DB (fire-and-forget, non-blocking)
      const reasonMap: Record<number, string> = {
        1: "onboarding_step_1_name",
        2: "onboarding_step_2_gender",
        3: "onboarding_step_3_intent",
        4: "onboarding_step_4_photo",
      };
      persistCoins(earned, reasonMap[step] ?? `onboarding_step_${step}`);

      setEarnedThisStep(earned);
      setCongratsStep(step);
      setCoinFalling(true);
      setTimeout(() => {
        setTotalCoins(t => t + earned);
        setCoinFalling(false);
        setShowCongrats(true);
      }, 1000);
      setTimeout(() => {
        setShowCongrats(false);
        advanceStep();
      }, 5000);
    } else {
      handleFinish();
    }
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
        <p style={{ color: "white", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8, textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>
          Welcome to
        </p>
        <p style={{ color: "white", fontSize: 40, fontWeight: 900, lineHeight: 1.1, textShadow: "0 2px 24px rgba(0,0,0,0.8)" }}>
          2DateMe
        </p>
        <p style={{ color: "white", fontSize: 14, marginTop: 10, lineHeight: 1.5, textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>
          Indonesia's home for real connections ❤️
        </p>
      </motion.div>

      {/* ── Bottom sheet sliders (steps 1–4) ─────────────────────── */}
      <AnimatePresence>
        {showSlider && step <= 4 && (
          <>

            {/* Sheet — matches PaymentSheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => { if (info.offset.y > 120) setShowSlider(false); }}
              style={{
                position: "absolute", left: 0, right: 0, bottom: 0,
                zIndex: 4,
                maxHeight: "82dvh",
                borderRadius: "28px 28px 0 0",
                backgroundImage: "url('/images/app-background.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "1px solid rgba(255,255,255,0.15)",
                borderBottom: "none",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* ── Accent bar — exact PaymentSheet */}
              <div style={{
                height: 3, flexShrink: 0,
                background: "#c2185b",
              }} />

              {/* ── Drag handle — PaymentSheet style */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                style={{ flexShrink: 0, padding: "10px 0 2px", display: "flex", justifyContent: "center", cursor: "grab" }}
              >
                <div style={{ width: 40, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.15)" }} />
              </div>


              {/* Scrollable content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 8px" }}>
                <AnimatePresence mode="wait">
                  {step === 1 && <Step1 key="s1" name={name} setName={setName} country={country} setCountry={setCountry} />}
                  {step === 2 && <Step2 key="s2" gender={gender} setGender={setGender} dobDay={dobDay} setDobDay={setDobDay} dobMonth={dobMonth} setDobMonth={setDobMonth} dobYear={dobYear} setDobYear={setDobYear} />}
                  {step === 3 && <Step3 key="s3" intent={intent} setIntent={setIntent} />}
                  {step === 4 && <Step4 key="s4" avatarUrl={avatarUrl} uploading={uploadingPhoto} onUpload={handlePhotoUpload} socialPlatform={socialPlatform} setSocialPlatform={setSocialPlatform} socialFollowers={socialFollowers} setSocialFollowers={setSocialFollowers} />}
                </AnimatePresence>
              </div>

              {/* ── Falling coins → converge into button badge ── */}
              <AnimatePresence>
                {coinFalling && Array.from({ length: earnedThisStep }).map((_, i) => {
                  const startX = (i - (earnedThisStep - 1) / 2) * 38;
                  const delay = i * 0.1;
                  const imgSrc = STEP_COIN_IMG[step];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 1, y: 60, x: startX, scale: 1.2 }}
                      animate={{ opacity: [1, 1, 1, 0], y: 520, x: 0, scale: [1.2, 1, 0.5] }}
                      transition={{ duration: 0.9, ease: "easeIn", delay }}
                      style={{ position: "absolute", left: "50%", top: 0, marginLeft: -16, zIndex: 20, pointerEvents: "none" }}
                    >
                      {imgSrc
                        ? <img src={imgSrc} alt="coin" style={{ width: 32, height: 32, objectFit: "contain" }} />
                        : <span style={{ fontSize: 28 }}>🪙</span>
                      }
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* ── Congrats overlay ── */}
              <AnimatePresence>
                {showCongrats && (
                  <motion.div
                    key="congrats"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      position: "absolute", inset: 0, zIndex: 30,
                      background: "rgba(0,0,0,0.78)",
                      backdropFilter: "blur(8px)",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 14,
                      pointerEvents: "none",
                    }}
                  >
                    <motion.img
                      src={
                        congratsStep === 4
                          ? earnedThisStep >= 10
                            ? CONGRATS_IMG[4]
                            : "https://ik.imagekit.io/dateme/Congrats%20on%20your%205%20coins!.png"
                          : CONGRATS_IMG[congratsStep]
                      }
                      alt="Congrats"
                      initial={{ scale: 0.3, rotate: -20 }}
                      animate={{ scale: [0.3, 1.25, 1], rotate: [-20, 8, 0] }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                      style={{ width: 150, height: 150, objectFit: "contain" }}
                    />
                    <motion.p
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, duration: 0.35 }}
                      style={{ color: "white", fontWeight: 900, fontSize: 31, margin: 0, textAlign: "center", lineHeight: 1.3 }}
                    >
                      Congrats!
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: [0.6, 1.18, 1] }}
                      transition={{ delay: 0.35, duration: 0.4 }}
                      style={{
                        background: "linear-gradient(135deg,#f59e0b,#fbbf24)",
                        borderRadius: 22, padding: "12px 28px",
                        display: "flex", alignItems: "center", gap: 10,
                        boxShadow: "0 4px 28px rgba(251,191,36,0.55)",
                      }}
                    >
                      <span style={{ fontSize: 28 }}>🪙</span>
                      <span style={{ color: "#78350f", fontWeight: 900, fontSize: 22 }}>+{earnedThisStep} coins earned!</span>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.55 }}
                      style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: 0 }}
                    >
                      Total balance: 🪙 {totalCoins}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── CTA — PaymentSheet sticky footer */}
              <div style={{
                flexShrink: 0,
                padding: "12px 16px 32px",
                background: "linear-gradient(to top, #c2185b 60%, transparent)",
              }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNext}
                  disabled={!canNext() || saving || coinFalling || showCongrats}
                  style={{
                    width: "100%", height: 52, borderRadius: 16, border: "none",
                    background: "linear-gradient(135deg,#ec4899,#a855f7)",
                    color: "white", fontWeight: 900, fontSize: 16,
                    cursor: canNext() && !saving && !coinFalling && !showCongrats ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    opacity: canNext() && !saving ? 1 : 0.45,
                    animation: canNext() && !saving && !coinFalling && !showCongrats ? "btn-glow 1.8s ease-in-out infinite" : "none",
                    transition: "opacity 0.2s",
                  }}
                >
                  {saving ? (
                    <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", justifyContent: "center" }}>
                      <span>{step < 4 ? "Continue →" : avatarUrl ? "Continue →" : "Skip & Continue →"}</span>
                      <motion.span
                        key={totalCoins}
                        animate={coinFalling ? { scale: [1, 1.4, 1] } : {}}
                        transition={{ duration: 0.4 }}
                        style={{
                          display: "flex", alignItems: "center", gap: 3,
                          background: "rgba(0,0,0,0.25)", borderRadius: 10,
                          padding: "2px 8px", fontSize: 12, fontWeight: 900,
                          color: "#fbbf24", border: "1px solid rgba(251,191,36,0.4)",
                        }}
                      >
                        🪙 {totalCoins}
                      </motion.span>
                    </span>
                  )}
                </motion.button>
                <p style={{ textAlign: "center", fontSize: 10, color: "#fbbf24", marginTop: 8, fontWeight: 600 }}>
                  🔒 Your data is private and secure
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Coins earned popup (shown after step 4, before terms) ── */}
      <AnimatePresence>
        {showCoinsPopup && (
          <motion.div
            key="coins-popup-scrim"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, zIndex: 20,
              background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 32px",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 24 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              style={{
                width: "100%", borderRadius: 28,
                backgroundImage: "url('https://ik.imagekit.io/dateme/tretert.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "1.5px solid rgba(251,191,36,0.35)",
                boxShadow: "0 8px 48px rgba(251,191,36,0.2)",
                padding: "32px 24px 28px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                textAlign: "center",
                overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.18, 1], rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.7, delay: 0.2 }}
                style={{ fontSize: 56 }}
              >
                🪙
              </motion.div>
              <p style={{ color: "white", fontWeight: 900, fontSize: 22, margin: 0, lineHeight: 1.2 }}>
                You earned
              </p>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.3, 1], opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{
                  background: "linear-gradient(135deg,#f59e0b,#fbbf24)",
                  borderRadius: 22, padding: "10px 28px",
                  color: "#78350f", fontWeight: 900, fontSize: 32,
                  boxShadow: "0 4px 24px rgba(251,191,36,0.5)",
                }}
              >
                🪙 {totalCoins} coins
              </motion.div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Coins unlock premium features — keep going to earn more!
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setShowCoinsPopup(false); setStep(5); }}
                style={{
                  width: "100%", height: 52, borderRadius: 16, border: "none",
                  background: "linear-gradient(135deg,#ec4899,#a855f7)",
                  color: "white", fontWeight: 900, fontSize: 17,
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(236,72,153,0.4)",
                  marginTop: 4,
                }}
              >
                Let's Go 🚀
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Terms & Conditions — frosted glass popup ─────────────── */}
      <AnimatePresence>
        {step === 5 && (
          <motion.div
            key="terms-scrim"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, zIndex: 10,
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "20px 16px",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              style={{
                width: "100%", maxHeight: "90dvh",
                borderRadius: 24,
                backgroundImage: "url('/images/app-background.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
                border: "1.5px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
                display: "flex", flexDirection: "column", overflow: "hidden",
              }}
            >
              {/* ── Accent top bar */}
              <div style={{ height: 3, background: "linear-gradient(90deg,#ec4899,#a855f7,#ec4899)", backgroundSize: "200% 100%", animation: "rim-shift 3s linear infinite", flexShrink: 0 }} />

              {/* ── Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "white", fontWeight: 900, fontSize: 16, margin: 0, lineHeight: 1 }}>Terms & Conditions</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "3px 0 0" }}>Scroll down to read · then accept</p>
                </div>
                <AppLogo style={{ width: 44, height: 44, objectFit: "contain" }} />
              </div>

              {/* ── Scrollable body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 8px", scrollbarWidth: "thin", scrollbarColor: "rgba(236,72,153,0.4) transparent" }}>

                <p style={{ color: "rgba(236,72,153,0.7)", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 16px" }}>
                  Last updated: March 2026
                </p>
                {[
                  ["1. Eligibility", "You must be 18 years of age or older to use 2DateMe. By creating an account you confirm you meet this requirement. We reserve the right to terminate accounts that violate this rule."],
                  ["2. Respectful Conduct", "You agree to treat all members with respect. Harassment, hate speech, threats, unsolicited inappropriate content, or abusive behaviour toward any user will result in immediate and permanent account removal."],
                  ["3. Authentic Profiles", "You agree to represent yourself honestly. Fake profiles, impersonation of real people, catfishing, and any scam or fraudulent activity are strictly prohibited."],
                  ["4. Privacy & Data", "We collect and store only the information necessary to operate the service. We do not sell your personal data to third parties. Your location is used only to show you nearby members and is never shared without consent."],
                  ["5. Payments & Refunds", "Premium features are billed through Stripe. Monthly subscriptions auto-renew unless cancelled at least 24 hours before the renewal date. One-time purchases are final. Refunds are handled in accordance with local consumer law."],
                  ["6. User Content", "You retain ownership of photos and content you upload. By uploading you grant 2DateMe a non-exclusive licence to display your content within the platform. You must not upload illegal, offensive, violent, or copyright-infringing content."],
                  ["7. Safety", "2DateMe is not responsible for the actions of other users. Always meet in public places for first dates. Report suspicious behaviour using the in-app report feature and our support team will review within 24 hours."],
                  ["8. Limitation of Liability", "The platform is provided 'as is'. We do not guarantee you will find a match. We are not liable for any loss or damage arising from your use of the service beyond the maximum permitted by law."],
                  ["9. Changes to Terms", "We may update these terms at any time. We will notify you of significant changes via the app or email. Continued use after notice constitutes acceptance of the updated terms."],
                  ["10. Contact", "For questions or support: 2dateme.com@gmail.com"],
                ].map(([title, body]) => (
                  <div key={title as string} style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 14, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ color: "#ec4899", fontWeight: 800, fontSize: 13, margin: "0 0 5px" }}>{title}</p>
                    <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12.5, margin: 0, lineHeight: 1.7 }}>{body}</p>
                  </div>
                ))}
                {/* ── Accept section at the end of scroll ── */}
                <div style={{ marginTop: 8, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                  {/* Checkbox row */}
                  <button
                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 14, border: "none", width: "100%", cursor: "pointer",
                      background: agreedToTerms ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.3)",
                      outline: agreedToTerms ? "2px solid rgba(255,255,255,0.6)" : "1.5px solid rgba(255,255,255,0.2)",
                      textAlign: "left", marginBottom: 12, transition: "all 0.2s",
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                      background: agreedToTerms ? "linear-gradient(135deg,#fff,#f9a8d4)" : "rgba(0,0,0,0.4)",
                      border: agreedToTerms ? "none" : "1.5px solid rgba(255,255,255,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                    }}>
                      {agreedToTerms && <span style={{ color: "#c2185b", fontSize: 14, fontWeight: 900 }}>✓</span>}
                    </div>
                    <p style={{ margin: 0, color: "white", fontSize: 13, fontWeight: 700 }}>
                      I have read and agree to the Terms & Conditions
                    </p>
                  </button>

                  {/* CTA button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleFinish}
                    disabled={!agreedToTerms || saving}
                    style={{
                      width: "100%", height: 52, borderRadius: 16, border: "none",
                      background: agreedToTerms && !saving
                        ? "linear-gradient(135deg,#ec4899,#a855f7)"
                        : "rgba(0,0,0,0.5)",
                      color: "white",
                      fontWeight: 900, fontSize: 16, letterSpacing: "0.04em",
                      cursor: agreedToTerms && !saving ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: agreedToTerms ? "0 4px 20px rgba(236,72,153,0.38)" : "none",
                      transition: "all 0.2s", marginBottom: 8,
                    } as React.CSSProperties}
                  >
                    {saving ? (
                      <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    ) : (
                      <span>🔓 Grant Me ACCESS</span>
                    )}
                  </motion.button>
                </div>
                <div style={{ height: 6 }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes rim-shift { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes btn-glow {
          0%,100% { box-shadow: 0 0 10px 2px rgba(236,72,153,0.35), 0 0 0 0 rgba(236,72,153,0); }
          50%      { box-shadow: 0 0 22px 6px rgba(168,85,247,0.55), 0 0 40px 10px rgba(236,72,153,0.2); }
        }
      `}</style>
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
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.22 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 18px" }}>
        <p style={{ color: "white", fontWeight: 900, fontSize: 20, margin: 0 }}>
          What shall we call you?
        </p>
        <img
          src="https://ik.imagekit.io/dateme/Thoughtful%20teddy%20bear%20in%20soft%20light.png"
          alt=""
          style={{ width: 64, height: 64, objectFit: "contain", flexShrink: 0 }}
        />
      </div>

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
            background: "#c2185b",
            border: "1.5px solid rgba(255,255,255,0.25)",
            color: "white", fontSize: 15, fontWeight: 600, outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(236,72,153,0.25)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.25)"; e.target.style.boxShadow = "none"; }}
        />
      </div>

      {/* Country dropdown */}
      <label style={{ color: "white", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
        Your country
      </label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 22, pointerEvents: "none", zIndex: 1 }}>
          {country.flag}
        </span>
        <select
          value={country.code}
          onChange={(e) => {
            const found = COUNTRIES.find(c => c.code === e.target.value);
            if (found) setCountry(found);
          }}
          style={{
            width: "100%", height: 52, borderRadius: 14,
            paddingLeft: 48, paddingRight: 36,
            background: "#c2185b",
            border: "1.5px solid rgba(255,255,255,0.25)",
            color: "white", fontSize: 15, fontWeight: 600,
            appearance: "none", WebkitAppearance: "none",
            cursor: "pointer", outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(236,72,153,0.65)"; e.target.style.boxShadow = "0 0 0 3px rgba(236,72,153,0.15)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.14)"; e.target.style.boxShadow = "none"; }}
        >
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code} style={{ background: "#000", color: "white" }}>
              {c.flag}  {c.name}
            </option>
          ))}
        </select>
        {/* chevron */}
        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>▼</span>
      </div>
    </motion.div>
  );
}

// ── Step 2: I am … + Date of Birth ───────────────────────────────────────────

function Step2({ gender, setGender, dobDay, setDobDay, dobMonth, setDobMonth, dobYear, setDobYear }: {
  gender: "man" | "woman" | null;
  setGender: (v: "man" | "woman") => void;
  dobDay: string; setDobDay: (v: string) => void;
  dobMonth: string; setDobMonth: (v: string) => void;
  dobYear: string; setDobYear: (v: string) => void;
}) {
  const maxYear = new Date().getFullYear() - 18;

  // Days in selected month (account for leap year)
  const maxDay = (() => {
    const m = parseInt(dobMonth, 10);
    const y = parseInt(dobYear, 10) || 2000;
    if (!m || m < 1 || m > 12) return 31;
    return new Date(y, m, 0).getDate(); // day 0 of next month = last day of current month
  })();

  const handleDay = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 2);
    const num = parseInt(n, 10);
    if (n === "" || (num >= 1 && num <= maxDay)) setDobDay(n);
    else if (num > maxDay) setDobDay(String(maxDay));
  };

  const handleMonth = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 2);
    const num = parseInt(n, 10);
    if (n === "" || (num >= 1 && num <= 12)) setDobMonth(n);
    else if (num > 12) setDobMonth("12");
    // re-clamp day if month changes
    const newMax = new Date(parseInt(dobYear, 10) || 2000, num, 0).getDate();
    if (dobDay && parseInt(dobDay, 10) > newMax) setDobDay(String(newMax));
  };

  const handleYear = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 4);
    const num = parseInt(n, 10);
    if (n.length < 4) { setDobYear(n); return; }
    if (num < 1950) setDobYear("1950");
    else if (num > maxYear) setDobYear(String(maxYear));
    else setDobYear(n);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 52, borderRadius: 14, padding: "0 14px",
    background: "#c2185b", border: "1.5px solid rgba(255,255,255,0.25)",
    color: "white", fontSize: 16, fontWeight: 700, outline: "none",
    boxSizing: "border-box",
  };

  const [glowSide, setGlowSide] = useState(0); // 0 = man, 1 = woman

  // Cycle glow between the two cards until one is selected
  useEffect(() => {
    if (gender !== null) return;
    const t = setInterval(() => setGlowSide(s => s === 0 ? 1 : 0), 800);
    return () => clearInterval(t);
  }, [gender]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.22 }}
    >
      <p style={{ color: "white", fontWeight: 900, fontSize: 20, margin: "0 0 14px" }}>
        I am a…
      </p>

      <div style={{ display: "flex", gap: 20, marginBottom: 26 }}>
        {(["man", "woman"] as const).map((id, idx) => {
          const selected = gender === id;
          const glowing = gender === null && glowSide === idx;
          const imgSrc = id === "man"
            ? "https://ik.imagekit.io/dateme/sas-removebg-preview.png"
            : "https://ik.imagekit.io/dateme/sasfd-removebg-preview.png";
          return (
            <motion.div
              key={id}
              whileTap={{ scale: 0.93 }}
              onClick={() => setGender(id)}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 8, cursor: "pointer",
                padding: "12px 8px", borderRadius: 20,
                background: selected ? "rgba(194,24,91,0.18)" : glowing ? "rgba(194,24,91,0.08)" : "none",
                outline: selected
                  ? "2.5px solid #c2185b"
                  : "1.5px solid #c2185b",
                boxShadow: selected
                  ? "0 0 20px rgba(194,24,91,0.45)"
                  : glowing
                    ? "0 0 18px rgba(194,24,91,0.7), 0 0 6px #c2185b"
                    : "none",
                transition: "outline 0.2s, box-shadow 0.2s, background 0.2s",
              }}
            >
              <img src={imgSrc} alt={id} style={{ width: 64, height: 64, objectFit: "contain" }} />
              <span style={{
                fontWeight: 900, fontSize: 18,
                color: selected ? "#c2185b" : "white",
                textShadow: selected ? "0 0 12px rgba(194,24,91,0.8)" : "none",
                transition: "all 0.2s",
              }}>
                {id === "man" ? "Male" : "Female"}
              </span>
            </motion.div>
          );
        })}
      </div>

      <p style={{ color: "white", fontWeight: 900, fontSize: 20, margin: "0 0 14px" }}>
        Date of birth
      </p>

      <div style={{ display: "flex", gap: 10 }}>
        {/* Day */}
        <div style={{ flex: 1 }}>
          <label style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>
            Day <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>1–{maxDay}</span>
          </label>
          <input
            type="text" inputMode="numeric" placeholder="DD"
            value={dobDay}
            onChange={(e) => handleDay(e.target.value)}
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(236,72,153,0.25)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.25)"; e.target.style.boxShadow = "none"; }}
          />
        </div>
        {/* Month */}
        <div style={{ flex: 1 }}>
          <label style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>
            Month <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>1–12</span>
          </label>
          <input
            type="text" inputMode="numeric" placeholder="MM"
            value={dobMonth}
            onChange={(e) => handleMonth(e.target.value)}
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(236,72,153,0.25)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.25)"; e.target.style.boxShadow = "none"; }}
          />
        </div>
        {/* Year */}
        <div style={{ flex: 1.6 }}>
          <label style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>
            Year <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>1950–{maxYear}</span>
          </label>
          <input
            type="text" inputMode="numeric" placeholder="YYYY"
            value={dobYear}
            onChange={(e) => handleYear(e.target.value)}
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(236,72,153,0.25)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.25)"; e.target.style.boxShadow = "none"; }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── Step 3: Intent chips with inline expand ───────────────────────────────────

function Step3({ intent, setIntent }: {
  intent: typeof INTENT_OPTIONS[0];
  setIntent: (v: typeof INTENT_OPTIONS[0]) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [glowIdx, setGlowIdx] = useState(0);
  const confirmed = intent.id;

  // Cycle the rim glow across all containers
  useEffect(() => {
    const t = setInterval(() => setGlowIdx(i => (i + 1) % INTENT_OPTIONS.length), 500);
    return () => clearInterval(t);
  }, []);

  const handleTap = (o: typeof INTENT_OPTIONS[0]) => {
    setExpanded(prev => (prev === o.id ? null : o.id));
    setIntent(o);
  };

  const expandedOption = INTENT_OPTIONS.find(o => o.id === expanded) ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.22 }}
    >
      <p style={{ color: "white", fontWeight: 900, fontSize: 20, margin: "0 0 2px" }}>
        What are you seeking?
      </p>
      <p style={{ color: "white", fontSize: 13, margin: "0 0 10px", lineHeight: 1.5 }}>
        Tap a card to see what it means
      </p>

      {/* ── Center detail panel — always same position ── */}
      <AnimatePresence mode="wait">
        {expandedOption ? (
          <motion.div
            key={expandedOption.id}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{
              width: "100%",
              borderRadius: 18,
              background: "#c2185b",
              outline: "2.5px solid rgba(255,255,255,0.9)",
              boxShadow: "0 0 22px rgba(255,255,255,0.35)",
              padding: "14px 16px",
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 26 }}>{expandedOption.icon}</span>
              <span style={{ color: "white", fontWeight: 900, fontSize: 15, flex: 1 }}>{expandedOption.label}</span>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700 }}>✓ Selected</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.92)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {expandedOption.desc}
            </p>
            {expandedOption.vip && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", borderRadius: 10, marginTop: 10,
                background: "rgba(251,191,36,0.12)",
                border: "1px solid rgba(251,191,36,0.3)",
              }}>
                <span style={{ fontSize: 14 }}>⭐</span>
                <p style={{ margin: 0, color: "#fbbf24", fontSize: 11, fontWeight: 600, lineHeight: 1.4 }}>
                  VIP members get priority visibility for this intent
                </p>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── 3-column grid — all cards always same size ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {INTENT_OPTIONS.map((o, idx) => {
          const isConfirmed = confirmed === o.id;
          const isGlowing = glowIdx === idx;

          return (
            <motion.div
              key={o.id}
              whileTap={{ scale: 0.93 }}
              style={{
                borderRadius: 16,
                background: "#c2185b",
                outline: isConfirmed
                  ? "2.5px solid rgba(255,255,255,0.95)"
                  : isGlowing
                    ? "2.5px solid rgba(255,255,255,0.75)"
                    : "2px solid rgba(255,255,255,0.1)",
                boxShadow: isConfirmed
                  ? "0 0 18px rgba(255,255,255,0.35)"
                  : isGlowing
                    ? "0 0 12px rgba(255,255,255,0.25)"
                    : "none",
                overflow: "hidden",
                cursor: "pointer",
                transition: "outline 0.15s, box-shadow 0.15s",
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                minHeight: 72,
              }}
              onClick={() => handleTap(o)}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{o.icon}</span>
              <span style={{
                color: "white",
                fontSize: 11,
                fontWeight: isConfirmed ? 800 : 600,
                lineHeight: 1.2,
                textAlign: "center",
              }}>
                {o.label}
              </span>
              {isConfirmed && (
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>✓</span>
              )}
              {o.vip && !isConfirmed && (
                <span style={{
                  fontSize: 8, fontWeight: 800, color: "#fbbf24",
                  background: "rgba(251,191,36,0.2)", borderRadius: 6,
                  padding: "2px 5px", border: "1px solid rgba(251,191,36,0.4)",
                }}>VIP</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Step 4: Profile photo ─────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", emoji: "📸" },
  { key: "tiktok",    label: "TikTok",    emoji: "🎵" },
  { key: "facebook",  label: "Facebook",  emoji: "👥" },
  { key: "youtube",   label: "YouTube",   emoji: "▶️" },
  { key: "x",         label: "X (Twitter)", emoji: "✖️" },
];

function Step4({ avatarUrl, uploading, onUpload, socialPlatform, setSocialPlatform, socialFollowers, setSocialFollowers }: {
  avatarUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  socialPlatform: string | null;
  setSocialPlatform: (v: string | null) => void;
  socialFollowers: string;
  setSocialFollowers: (v: string) => void;
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
      <p style={{ color: "white", fontSize: 13, margin: "0 0 12px", lineHeight: 1.5, alignSelf: "flex-start" }}>
        Upload a photo to earn <span style={{ color: "#fbbf24", fontWeight: 800 }}>🪙 +5 coins</span> — skip and earn nothing
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
          <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img
              src="https://ik.imagekit.io/dateme/Thoughtful%20teddy%20bear%20in%20soft%20light.png"
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
            />
            {/* Dark overlay so text is readable */}
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.45)" }} />
            <span style={{ position: "absolute", color: "white", fontSize: 13, fontWeight: 800, textAlign: "center", textShadow: "0 1px 4px rgba(0,0,0,0.8)", lineHeight: 1.3 }}>
              Tap to<br />upload
            </span>
          </div>
        )}
      </motion.button>

      {avatarUrl && (
        <motion.button
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => fileRef.current?.click()}
          style={{
            marginTop: 16, padding: "8px 20px", borderRadius: 24,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          Change photo
        </motion.button>
      )}

      <p style={{ color: "white", fontSize: 12, marginTop: 20, textAlign: "center" }}>
        JPG or PNG · Max 10MB · You can update this later in your profile
      </p>

      {/* ── Social proof (optional) ── */}
      <div style={{ width: "100%", marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20 }}>
        <p style={{ color: "white", fontSize: 13, fontWeight: 800, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          Social Proof
          <span style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.15)" }}>optional</span>
          <span style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#78350f", fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 20, boxShadow: "0 2px 8px rgba(251,191,36,0.4)" }}>🪙 +5 coins bonus</span>
        </p>
        <p style={{ color: "white", fontSize: 13, margin: "0 0 14px", lineHeight: 1.5 }}>
          Show your follower count — no link or username shared
        </p>

        {/* Platform pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
          {SOCIAL_PLATFORMS.map(p => (
            <button
              key={p.key}
              onClick={() => setSocialPlatform(socialPlatform === p.key ? null : p.key)}
              style={{
                padding: "6px 12px", borderRadius: 22, cursor: "pointer",
                background: socialPlatform === p.key
                  ? "linear-gradient(135deg,#ec4899,#a855f7)"
                  : "rgba(0,0,0,0.45)",
                border: socialPlatform === p.key ? "none" : "1px solid rgba(255,255,255,0.12)",
                color: "white",
                fontWeight: 700, fontSize: 12,
                transition: "all 0.15s",
              }}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>

        {/* Follower count input */}
        {socialPlatform && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          >
            <input
              type="text"
              inputMode="numeric"
              value={socialFollowers}
              onChange={e => setSocialFollowers(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder={`Your ${SOCIAL_PLATFORMS.find(p => p.key === socialPlatform)?.label} followers (e.g. 12500)`}
              style={{
                width: "100%", height: 44, borderRadius: 12,
                border: "1.5px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
                color: "white", fontSize: 14, padding: "0 14px",
                outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
            {socialFollowers && (
              <p style={{ color: "white", fontSize: 12, margin: "6px 0 0" }}>
                Shown as: <span style={{ color: "#ec4899", fontWeight: 700 }}>
                  {parseInt(socialFollowers) >= 1_000_000
                    ? `${(parseInt(socialFollowers) / 1_000_000).toFixed(1)}M`
                    : parseInt(socialFollowers) >= 1_000
                    ? `${(parseInt(socialFollowers) / 1_000).toFixed(parseInt(socialFollowers) >= 10_000 ? 0 : 1)}K`
                    : socialFollowers} {SOCIAL_PLATFORMS.find(p => p.key === socialPlatform)?.emoji} followers
                </span>
              </p>
            )}
          </motion.div>
        )}
      </div>

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
