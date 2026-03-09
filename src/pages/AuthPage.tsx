import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Mail, Lock, User, MapPin, Calendar, ChevronRight, MessageCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";import { FIRST_DATE_IDEAS } from "@/data/firstDateIdeas";
import AppLogo from "@/components/AppLogo";
import { useLanguage } from "@/i18n/LanguageContext";
import { COUNTRIES_WITH_CODES, ALL_COUNTRIES } from "@/data/countries";

const COUNTRY_CODES = COUNTRIES_WITH_CODES;
const COUNTRIES = ALL_COUNTRIES;

// Test account for local development (create with: npx tsx scripts/create-test-user.ts)
const TEST_EMAIL = import.meta.env.VITE_TEST_EMAIL || "test@2dateme.demo";
const TEST_PASSWORD = import.meta.env.VITE_TEST_PASSWORD || "TestPass123";

const LANDING_BG_URL = (import.meta.env.VITE_LANDING_BG_URL as string | undefined) || "https://ik.imagekit.io/7grri5v7d/sddfffaaa.png";
const LANDING_BG_URL_VERSION = (import.meta.env.VITE_LANDING_BG_URL_VERSION as string | undefined) || "v2";

const FLAG_BY_COUNTRY: Record<string, string> = {
  Indonesia: "🇮🇩",
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  Singapore: "🇸🇬",
  Malaysia: "🇲🇾",
  Thailand: "🇹🇭",
  Philippines: "🇵🇭",
  Vietnam: "🇻🇳",
  India: "🇮🇳",
  Australia: "🇦🇺",
  Japan: "🇯🇵",
  "South Korea": "🇰🇷",
  Canada: "🇨🇦",
  Germany: "🇩🇪",
  France: "🇫🇷",
  Netherlands: "🇳🇱",
  Italy: "🇮🇹",
  Spain: "🇪🇸",
  Portugal: "🇵🇹",
  UAE: "🇦🇪",
  "Saudi Arabia": "🇸🇦",
};

const getFlagForCountry = (country: string) => FLAG_BY_COUNTRY[country] || "🏳️";

const appendQueryParams = (url: string, params: Record<string, string>) => {
  const hasQuery = url.includes("?");
  const base = `${url}${hasQuery ? "&" : "?"}`;
  const query = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return `${base}${query}`;
};

const buildLandingBgSrc = (url: string, version: string, extra?: Record<string, string>) => {
  return appendQueryParams(url, { v: version, ...(extra || {}) });
};

const AuthPage = () => {
  const { t, locale, toggleLocale } = useLanguage();
  const [isLogin, setIsLogin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [landingPrefix, setLandingPrefix] = useState<string>(COUNTRY_CODES["Indonesia"] || "+62");
  const [landingNumber, setLandingNumber] = useState<string>("");
  const [landingSubmitting, setLandingSubmitting] = useState(false);

  // If a session already exists (user navigated here while logged in), send them home
  // Also listens for SIGNED_IN event so the header on Index updates immediately
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/", { replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only redirect on sign-in from the login form — signup is handled in handleRegisterStep
      if (event === "SIGNED_IN" && session && isLogin) navigate("/", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate, isLogin]);

  // Auto-open sign-in tab if ?signin=1 is in URL
  // Auto-open register tab if ?register=1 is in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signin") === "1") {
      setShowAuth(true);
      setIsLogin(true);
    } else if (params.get("register") === "1") {
      setShowAuth(true);
      setIsLogin(false);
    }
  }, []);

  const GENDERS = [
    { value: "Male", label: t("gender.male") },
    { value: "Female", label: t("gender.female") },
    { value: "Non-binary", label: t("gender.nonbinary") },
    { value: "Other", label: t("gender.other") },
  ];
  const LOOKING_FOR = [
    { value: "Men", label: t("lookingFor.men") },
    { value: "Women", label: t("lookingFor.women") },
    { value: "Everyone", label: t("lookingFor.everyone") },
  ];

  const [form, setForm] = useState({
    email: "", password: "", name: "", age: "", gender: "",
    lookingFor: "", country: "", city: "", bio: "", whatsapp: "", firstDateIdea: "",
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const getLoginErrorMessage = (error: { message: string }): string => {
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login") || msg.includes("invalid credentials")) return t("auth.invalidLogin");
    if (msg.includes("email not confirmed") || msg.includes("confirm your email")) return t("auth.emailNotConfirmed");
    return error.message;
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) { toast.error(t("auth.fillAllFields")); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setLoading(false);
    if (error) { toast.error(getLoginErrorMessage(error)); return; }
    toast.success(t("auth.welcomeBack"));
    navigate("/");
  };

  const handleRegisterStep = async () => {
    if (step === 1 && (!form.email || !form.password || !form.name)) { toast.error(t("auth.fillAllFields")); return; }
    if (step === 2 && (!form.age || !form.gender || !form.lookingFor)) { toast.error(t("auth.completeProfile")); return; }
    if (step === 3 && (!form.country || !form.whatsapp)) { toast.error(t("auth.addLocation")); return; }
    if (step < 3) { setStep(step + 1); } else {
      setLoading(true);
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { name: form.name, age: form.age, gender: form.gender, looking_for: form.lookingFor, country: form.country, city: form.city, bio: form.bio, whatsapp: form.whatsapp, first_date_idea: form.firstDateIdea || null } },
      });
      if (error) { setLoading(false); toast.error(error.message); return; }

      // If Supabase auto-confirmed the session, go straight to dashboard
      if (signUpData.session) {
        setLoading(false);
        toast.success(t("auth.welcome2DateMe") + " 🎉 " + t("auth.completeProfile"));
        navigate("/dashboard");
        return;
      }

      // Email confirmation may be required — try silent sign-in first
      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
        email: form.email, password: form.password,
      });
      setLoading(false);
      if (!loginErr && loginData.session) {
        toast.success(t("auth.welcome2DateMe") + " 🎉 " + t("auth.completeProfile"));
        navigate("/dashboard");
      } else {
        toast.success(t("auth.accountCreated"));
        setIsLogin(true);
        setStep(1);
      }
    }
  };

  // Landing screen
  if (!showAuth) {
    const selectedCountryForPrefix =
      Object.entries(COUNTRY_CODES).find(([, code]) => code === landingPrefix)?.[0] || "Indonesia";
    const selectedFlag = getFlagForCountry(selectedCountryForPrefix);

    const buildE164 = (prefix: string, national: string) => {
      const p = String(prefix || "").trim();
      const pDigits = p.replace(/\D/g, "");
      const nDigits = String(national || "").trim().replace(/\D/g, "");
      return `+${pDigits}${nDigits}`;
    };

    const handleLandingEnter = async () => {
      const digits = landingNumber.replace(/\D/g, "");
      if (digits.length <= 1) {
        toast.error("Please enter a valid WhatsApp number");
        return;
      }

      const e164 = buildE164(landingPrefix, landingNumber);
      const saved = typeof localStorage !== "undefined" ? localStorage.getItem("landing_whatsapp_e164") : null;
      if (saved === e164) {
        navigate("/");
        return;
      }

      setLandingSubmitting(true);
      try {
        const prefixDigits = String(landingPrefix || "").trim().replace(/\D/g, "");
        const nationalDigits = String(landingNumber || "").trim().replace(/\D/g, "");

        const { error } = await (supabase as any)
          .from("whatsapp_leads")
          .upsert(
            {
              whatsapp_e164: e164,
              country_prefix: `+${prefixDigits}`,
              national_number: nationalDigits,
              source: "landing",
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "whatsapp_e164" }
          );
        if (error) throw error;

        if (typeof localStorage !== "undefined") {
          localStorage.setItem("landing_whatsapp_e164", e164);
        }
      } catch {
        // Always allow entry even if lead capture fails
      } finally {
        setLandingSubmitting(false);
        navigate("/");
      }
    };

    return (
      <div className="h-screen-safe relative overflow-hidden">
        <img
          src={buildLandingBgSrc(
            LANDING_BG_URL,
            LANDING_BG_URL_VERSION,
            LANDING_BG_URL.includes("imagekit.io") ? { tr: "q-100,fo-auto,w-2160" } : undefined
          )}
          srcSet={
            LANDING_BG_URL.includes("imagekit.io")
              ? [
                  `${buildLandingBgSrc(LANDING_BG_URL, LANDING_BG_URL_VERSION, { tr: "q-100,fo-auto,w-1080" })} 1080w`,
                  `${buildLandingBgSrc(LANDING_BG_URL, LANDING_BG_URL_VERSION, { tr: "q-100,fo-auto,w-2160" })} 2160w`,
                ].join(", ")
              : undefined
          }
          sizes={LANDING_BG_URL.includes("imagekit.io") ? "100vw" : undefined}
          alt=""
          className="fixed inset-0 w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        {/* Language toggle */}
        <button onClick={toggleLocale} className="absolute top-4 right-4 z-20 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/70 hover:text-white transition-colors text-[10px] font-medium">
          {locale === "en" ? "🇮🇩 ID" : "🇬🇧 EN"}
        </button>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-[min(86vw,13.25rem)] sm:w-[min(92vw,18rem)]"
          style={{ paddingTop: `max(0px, env(safe-area-inset-top, 0px))` }}
        >
          <div className="rounded-3xl bg-yellow-400 p-3 shadow-[0_0_30px_rgba(250,204,21,0.25)] border border-yellow-300/60">
            <div className="flex items-center justify-center mb-1.5">
              <AppLogo className="w-14 h-14 object-contain" />
            </div>

            <p className="text-black/80 text-xs font-semibold text-center">
              Enter WhatsApp to continue
            </p>

            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-[96px_1fr] gap-2">
                <Select value={landingPrefix} onValueChange={setLandingPrefix}>
                  <SelectTrigger className="bg-white border-white/70 text-black rounded-xl h-10">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm leading-none">{selectedFlag}</span>
                      <span className="text-[12px] font-semibold">{landingPrefix}</span>
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 text-black rounded-xl max-h-[240px]">
                    {Object.entries(COUNTRY_CODES).map(([country, code]) => (
                      <SelectItem key={country} value={code} className="text-black">
                        <span className="flex items-center gap-2">
                          <span className="text-sm leading-none">{getFlagForCountry(country)}</span>
                          <span className="text-black/90">{country}</span>
                          <span className="text-black/60">{code}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={landingNumber}
                  onChange={(e) => setLandingNumber(e.target.value)}
                  placeholder="WhatsApp number"
                  className="bg-white border-white/70 text-black placeholder:text-black/40 rounded-xl h-10"
                  inputMode="tel"
                />
              </div>

              <Button
                onClick={handleLandingEnter}
                disabled={landingSubmitting}
                className="w-full h-11 rounded-2xl bg-black text-white hover:bg-black/90 font-bold"
              >
                {landingSubmitting ? "Entering..." : "Enter App"}
              </Button>

              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className="w-full text-center text-black/70 text-[11px] font-semibold underline underline-offset-2"
              >
                Sign in / Register
              </button>

              <p className="text-black/60 text-[10px] text-center">
                No verification required.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Auth form screen
  return (
    <div className="h-screen-safe flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundImage: "url('/images/app-background.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* Home icon — floating on right, below header area */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-black/70 transition-all"
        aria-label="Go to home"
      >
        <Home className="w-5 h-5" />
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        {/* Logo — 30% larger than before (w-20 → ~w-[6.5rem]) */}
        <div className="text-center mb-4">
          <AppLogo className="w-[6.5rem] h-[6.5rem] mx-auto mb-2 object-contain drop-shadow-xl" />
          <h1 className="text-xl font-display font-bold text-white">2DateMe</h1>
          <p className="text-white/60 text-xs mt-1">{t("app.realConnections")}</p>
        </div>

        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5">
          {/* Toggle */}
          <div className="flex gap-1 mb-6 p-1 bg-white/5 rounded-2xl border border-white/5">
            <button onClick={() => { setIsLogin(true); setStep(1); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${isLogin ? "gradient-love text-white shadow-glow" : "text-white/50"}`}>
              {t("auth.signIn")}
            </button>
            <button onClick={() => { setIsLogin(false); setStep(1); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${!isLogin ? "gradient-love text-white shadow-glow" : "text-white/50"}`}>
              {t("auth.register")}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                <div>
                  <Label className="text-white/50 text-xs mb-1.5 block">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input type="email" placeholder="your@email.com" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" value={form.email} onChange={(e) => update("email", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-white/50 text-xs mb-1.5 block">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input type="password" placeholder="••••••••" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" value={form.password} onChange={(e) => update("password", e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleLogin} disabled={loading} className="w-full gradient-love text-white border-0 h-12 text-base font-semibold rounded-xl">
                  {loading ? t("auth.signingIn") : t("auth.signIn")} <Heart className="ml-2 w-4 h-4" />
                </Button>
                <button onClick={() => navigate("/reset-password")} className="text-white/40 hover:text-white/70 text-xs text-center w-full transition-colors">
                  {t("auth.forgotPassword")}
                </button>
                {import.meta.env.DEV && (
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-white/40 text-[10px] mb-2">Test account (run: npx tsx scripts/create-test-user.ts)</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-white/20 text-white/70 hover:bg-white/10 hover:text-white text-xs"
                      disabled={loading}
                      onClick={async () => {
                        setForm((f) => ({ ...f, email: TEST_EMAIL, password: TEST_PASSWORD }));
                        setLoading(true);
                        const { error: err } = await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
                        setLoading(false);
                        if (err) {
                          toast.error(getLoginErrorMessage(err), {
                            description: "Create user first: npx tsx scripts/create-test-user.ts — or turn off email confirmation in Supabase.",
                          });
                          return;
                        }
                        toast.success(t("auth.welcomeBack"));
                        navigate("/");
                      }}
                    >
                      Sign in as test@2dateme.demo
                    </Button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key={`register-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? "gradient-love" : "bg-white/10"}`} />
                  ))}
                </div>

                {step === 1 && (
                  <>
                    <div>
                      <Label className="text-white/50 text-xs mb-1.5 block">{t("auth.fullName")}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input placeholder={t("auth.yourName")} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" value={form.name} onChange={(e) => update("name", e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/50 text-xs mb-1.5 block">{t("auth.email")}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input type="email" placeholder="your@email.com" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" value={form.email} onChange={(e) => update("email", e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/50 text-xs mb-1.5 block">{t("auth.password")}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input type="password" placeholder={t("auth.minChars")} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" value={form.password} onChange={(e) => update("password", e.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <Label className="text-white/50 text-xs mb-1.5 block">{t("auth.age")}</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input type="number" placeholder="25" min="18" max="99" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" value={form.age} onChange={(e) => update("age", e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/50 text-xs mb-1.5 block">{t("auth.iAm")}</Label>
                      <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl"><SelectValue placeholder={t("auth.selectGender")} /></SelectTrigger>
                        <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10 text-white rounded-xl">
                          {GENDERS.map((g) => <SelectItem key={g.value} value={g.value} className="text-white/80 focus:bg-white/10 focus:text-white">{g.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white/50 text-xs mb-1.5 block">{t("auth.lookingFor")}</Label>
                      <Select value={form.lookingFor} onValueChange={(v) => update("lookingFor", v)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl"><SelectValue placeholder={t("auth.whoInterests")} /></SelectTrigger>
                        <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10 text-white rounded-xl">
                          {LOOKING_FOR.map((l) => <SelectItem key={l.value} value={l.value} className="text-white/80 focus:bg-white/10 focus:text-white">{l.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white/50 text-xs mb-1.5 block">💕 First Date Would Be Nice...</Label>
                      <Select value={form.firstDateIdea} onValueChange={(v) => update("firstDateIdea", v)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl"><SelectValue placeholder="Select your ideal first date" /></SelectTrigger>
                        <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10 text-white rounded-xl max-h-[200px]">
                          {FIRST_DATE_IDEAS.map((idea) => <SelectItem key={idea} value={idea} className="text-white/80 focus:bg-white/10 focus:text-white">{idea}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div>
                      <Label className="text-white/50 text-xs mb-1.5 block">{t("auth.country")}</Label>
                      <Select value={form.country} onValueChange={(v) => {
                        update("country", v);
                        const prefix = COUNTRY_CODES[v] || "";
                        if (!form.whatsapp || Object.values(COUNTRY_CODES).some(c => form.whatsapp === c + " ")) {
                          update("whatsapp", prefix + " ");
                        }
                      }}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl"><SelectValue placeholder={t("auth.selectCountry")} /></SelectTrigger>
                        <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10 text-white rounded-xl">{COUNTRIES.map((c) => <SelectItem key={c} value={c} className="text-white/80 focus:bg-white/10 focus:text-white">{c} ({COUNTRY_CODES[c]})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white/50 text-xs mb-1.5 block">{t("auth.city")}</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input placeholder={t("auth.yourCity")} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" value={form.city} onChange={(e) => update("city", e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/50 text-xs mb-1.5 block">{t("auth.whatsapp")}</Label>
                      <Input placeholder="+62 812 3456 7890" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-white/50 text-xs mb-1.5 block">{t("auth.shortBio")}</Label>
                      <Textarea placeholder={t("auth.tellUs")} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none rounded-xl" rows={2} value={form.bio} onChange={(e) => update("bio", e.target.value)} />
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  {step > 1 && (
                    <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 h-12 border-white/10 text-white/70 hover:bg-white/10 hover:text-white rounded-xl">{t("auth.back")}</Button>
                  )}
                  <Button onClick={handleRegisterStep} disabled={loading} className="flex-1 gradient-love text-white border-0 h-12 text-base font-semibold rounded-xl">
                    {loading ? t("auth.creating") : step < 3 ? t("auth.next") : t("auth.createAccount")} <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-white/30 text-[10px] mt-4">
            <a href="/terms" className="underline">{t("terms.title")}</a> · <a href="/privacy" className="underline">{t("terms.privacy")}</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
