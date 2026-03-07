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
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { FIRST_DATE_IDEAS } from "@/data/firstDateIdeas";
import logoHeart from "@/assets/logo-heart.png";
import { useLanguage } from "@/i18n/LanguageContext";
import { COUNTRIES_WITH_CODES, ALL_COUNTRIES } from "@/data/countries";

const COUNTRY_CODES = COUNTRIES_WITH_CODES;
const COUNTRIES = ALL_COUNTRIES;

const AuthPage = () => {
  const { t, locale, toggleLocale } = useLanguage();
  const [isLogin, setIsLogin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleLogin = async () => {
    if (!form.email || !form.password) { toast.error(t("auth.fillAllFields")); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("auth.welcomeBack"));
    navigate("/");
  };

  const handleRegisterStep = async () => {
    if (step === 1 && (!form.email || !form.password || !form.name)) { toast.error(t("auth.fillAllFields")); return; }
    if (step === 2 && (!form.age || !form.gender || !form.lookingFor)) { toast.error(t("auth.completeProfile")); return; }
    if (step === 3 && (!form.country || !form.whatsapp)) { toast.error(t("auth.addLocation")); return; }
    if (step < 3) { setStep(step + 1); } else {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { name: form.name, age: form.age, gender: form.gender, looking_for: form.lookingFor, country: form.country, city: form.city, bio: form.bio, whatsapp: form.whatsapp, first_date_idea: form.firstDateIdea || null } },
      });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success(t("auth.checkEmail"));
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error(error.message);
  };

  // Landing screen
  if (!showAuth) {
    return (
      <div className="h-screen-safe relative overflow-hidden" style={{ backgroundImage: "url('/images/app-background.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        {/* Language toggle */}
        <button onClick={toggleLocale} className="absolute top-4 right-4 z-20 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/70 hover:text-white transition-colors text-[10px] font-medium">
          {locale === "en" ? "🇮🇩 ID" : "🇬🇧 EN"}
        </button>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6"
        >
          <img src={logoHeart} alt="SkipTheApp" className="w-44 h-44 object-contain drop-shadow-xl mb-2" />
          {/* 5-star rating */}
          <div className="flex items-center gap-0.5 mb-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.7)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            ))}
          </div>
          <h1 className="text-2xl font-display font-bold text-white drop-shadow-lg">{t("app.tagline")}</h1>
          <p className="text-white/70 text-sm drop-shadow-md">{t("app.subtitle")}</p>
          <div className="mt-6 w-full flex flex-col items-center gap-3">
          <Button
            onClick={() => navigate("/")}
            className="w-full max-w-sm h-14 text-base font-bold gradient-love text-primary-foreground border-0 rounded-2xl shadow-glow"
          >
            <MessageCircle className="w-5 h-5 mr-2" /> {t("landing.getStarted")}
          </Button>
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
        {/* Logo */}
        <div className="text-center mb-4">
          <img src={logoHeart} alt="SkipTheApp" className="w-20 h-20 mx-auto mb-2 object-contain drop-shadow-xl" />
          <h1 className="text-xl font-display font-bold text-white">SkipTheApp</h1>
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
                <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-12 border-white/10 text-white/80 hover:bg-white/10 hover:text-white rounded-xl bg-white/5">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  {t("auth.continueGoogle")}
                </Button>
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

                {step === 1 && (
                  <>
                    <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-12 border-white/10 text-white/80 hover:bg-white/10 hover:text-white rounded-xl bg-white/5">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      {t("auth.continueGoogle")}
                    </Button>
                  </>
                )}
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
