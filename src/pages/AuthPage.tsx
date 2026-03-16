import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Mail, Lock, User, MapPin, Calendar, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import SecureTextarea from "@/components/ui/SecureTextarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FIRST_DATE_IDEAS } from "@/data/firstDateIdeas";
import AppLogo from "@/components/AppLogo";
import { useLanguage } from "@/i18n/LanguageContext";
import { COUNTRIES_WITH_CODES, ALL_COUNTRIES, COUNTRY_ISO2 } from "@/data/countries";
import LaunchBanner from "@/components/ui/LaunchBanner";
import Index from "./Index";

const COUNTRY_CODES = COUNTRIES_WITH_CODES;
const COUNTRIES = ALL_COUNTRIES;

// Test account for local development (create with: npx tsx scripts/create-test-user.ts)
const TEST_EMAIL = import.meta.env.VITE_TEST_EMAIL || "test@2dateme.demo";
const TEST_PASSWORD = import.meta.env.VITE_TEST_PASSWORD || "TestPass123";

const LANDING_BG_URL = (import.meta.env.VITE_LANDING_BG_URL as string | undefined) || "https://ik.imagekit.io/7grri5v7d/uytg.png";
const LANDING_BG_URL_VERSION = (import.meta.env.VITE_LANDING_BG_URL_VERSION as string | undefined) || "v2";

const isoToFlag = (iso: string) =>
  iso.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0))
  );

const getFlagForCountry = (country: string) => {
  const iso = COUNTRY_ISO2[country];
  return iso ? isoToFlag(iso) : "🏳️";
};

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

// Cached so we don't re-fetch on every render
let _cachedOnlineCount: number | null = null;
const getDailyOnlineCount = () => _cachedOnlineCount ?? 1_247; // shown before Supabase resolves

const AuthPage = () => {
  const { t, locale, toggleLocale } = useLanguage();
  const [isLogin, setIsLogin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [landingPrefix, setLandingPrefix] = useState<string>(COUNTRY_CODES["Indonesia"] || "+62");
  const [landingNumber, setLandingNumber] = useState<string>("");
  const [landingSubmitting, setLandingSubmitting] = useState(false);
  const [whatsappSubmitted, setWhatsappSubmitted] = useState(false);
  const [onlineCount, setOnlineCount] = useState(getDailyOnlineCount());

  // Admin login state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");

  // Fetch real online user count from Supabase (last 5 min)
  useEffect(() => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("is_banned", false)
      .gte("last_seen_at", fiveMinAgo)
      .then(({ count }) => {
        if (count !== null && count > 0) {
          _cachedOnlineCount = count;
          setOnlineCount(count);
        }
      });
  }, []);

  // If a session already exists (user navigated here while logged in), send them home
  // Also listens for SIGNED_IN event so the header on Index updates immediately
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && location.pathname === "/auth") navigate("/home", { replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only redirect on sign-in from the login form — signup is handled in handleRegisterStep
      if (event === "SIGNED_IN" && session && isLogin) navigate("/home", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate, isLogin, location.pathname]);

  // Auto-open sign-in tab if ?signin=1 is in URL
  // Auto-open register tab if ?register=1 is in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      try {
        localStorage.setItem("pending_referral_code", ref);
      } catch {
        // ignore
      }
    }
    if (params.get("signin") === "1") {
      setShowAuth(true);
      setIsLogin(true);
    } else if (params.get("register") === "1") {
      setShowAuth(true);
      setIsLogin(false);
    }
  }, []);

  const processPendingReferral = useCallback(async () => {
    let code: string | null = null;
    try {
      code = localStorage.getItem("pending_referral_code");
    } catch {
      code = null;
    }
    if (!code) return;
    try {
      const { data } = await (supabase as any).rpc("process_referral", { _referral_code: code });
      if (data?.ok) {
        try { localStorage.removeItem("pending_referral_code"); } catch { /* ignore */ }
      }
    } catch {
      // ignore
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

  // Custom authentication handler with admin bypass and WhatsApp integration
  const handleCustomAuth = async (input: string) => {
    // Top-level admin bypass check - priority over all other logic
    if (input === "12345") {
      console.log("Admin bypass activated - granting full admin access");

      // Set admin session with full permissions
      const adminSession = {
        access_token: 'admin-token-12345',
        refresh_token: 'admin-refresh-12345',
        expires_in: 3600,
        user: {
          id: 'admin-12345',
          email: 'admin@2dateme.demo',
          user_metadata: {
            name: 'Admin User',
            role: 'admin',
            is_admin_bypass: true
          }
        }
      };

      // Persist admin session in localStorage for dev session
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('supabase.auth.token', JSON.stringify(adminSession));
        localStorage.setItem('supabase.auth.user', JSON.stringify(adminSession.user));
        localStorage.setItem('admin_session_active', 'true');
      }

      // Navigate to home page with admin access
      navigate("/home");
      toast.success("Admin access granted - Dashboard unlocked");
      return;
    }

    // WhatsApp number validation and user processing
    const whatsappDigits = input.replace(/\D/g, "");
    if (whatsappDigits.length < 10) {
      toast.error("Please enter a valid WhatsApp number");
      return;
    }

    try {
      setLoading(true);

      // Check if WhatsApp number exists in whatsapp_leads table
      const { data: existingUser, error: fetchError } = await (supabase as any)
        .from('whatsapp_leads')
        .select('*')
        .eq('whatsapp_e164', input)
        .single();

      let userId;
      let isNewUser = false;

      if (fetchError && fetchError.code === 'PGRST116') {
        // User doesn't exist, create new record
        isNewUser = true;
        const { data: newUser, error: insertError } = await (supabase as any)
          .from('whatsapp_leads')
          .insert({
            whatsapp_e164: input,
            created_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            source: 'whatsapp_auth'
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }
        userId = `whatsapp_${input.replace(/\D/g, '')}`;
        console.log("New user created:", newUser);
      } else if (fetchError) {
        throw fetchError;
      } else {
        // User exists, update last seen
        userId = `whatsapp_${input.replace(/\D/g, '')}`;
        await (supabase as any)
          .from('whatsapp_leads')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('whatsapp_e164', input);
        console.log("Existing user updated:", existingUser);
      }

      // Create session for WhatsApp user
      const userSession = {
        access_token: `whatsapp-token-${userId}`,
        refresh_token: `whatsapp-refresh-${userId}`,
        expires_in: 3600,
        user: {
          id: userId,
          email: `user_${userId}@2dateme.demo`,
          user_metadata: {
            whatsapp_number: input,
            role: 'user',
            is_whatsapp_user: true,
            is_new_user: isNewUser
          }
        }
      };

      // Persist user session
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('supabase.auth.token', JSON.stringify(userSession));
        localStorage.setItem('supabase.auth.user', JSON.stringify(userSession.user));
        localStorage.setItem('whatsapp_session_active', 'true');
      }

      // Navigate to home page
      navigate("/home");
      toast.success(isNewUser ? "Welcome to 2DateMe!" : "Welcome back!");

    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) { toast.error(t("auth.fillAllFields")); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setLoading(false);
    if (error) { toast.error(getLoginErrorMessage(error)); return; }
    toast.success(t("auth.welcomeBack"));
    await processPendingReferral();
    // Check if user has admin role — if so, go directly to admin dashboard
    if (data.session) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id);
      if (roles?.some((r: any) => r.role === "admin")) {
        navigate("/admin");
        return;
      }
    }
    // Navigate to home page for regular users
    navigate("/home");
  };

  const handleRegisterStep = async () => {
    if (step === 1 && (!form.email || !form.password || !form.name)) { toast.error(t("auth.fillAllFields")); return; }
    if (step === 2 && (!form.age || !form.gender || !form.lookingFor)) { toast.error(t("auth.completeProfile")); return; }
    if (step === 3 && (!form.country || !form.whatsapp)) { toast.error(t("auth.addLocation")); return; }

    // Store WhatsApp lead and show launch popup for all users except 12345
    const whatsappDigits = form.whatsapp.replace(/\D/g, "");
    if (whatsappDigits !== "12345") {
      // Store the WhatsApp lead first
      try {
        const { error: insertError } = await (supabase as any)
          .from("whatsapp_leads")
          .upsert(
            {
              whatsapp_e164: form.whatsapp,
              country_prefix: form.whatsapp.split(' ')[0],
              national_number: whatsappDigits,
              source: "registration",
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "whatsapp_e164" }
          );

        // Show launch popup after storing lead
        toast.error("🚀 2DateMe is going live on March 25th! You'll be notified when we launch. Get ready to meet amazing people! 🎉");
        return;
      } catch (error) {
        console.error("Error storing WhatsApp lead:", error);
        toast.error("🚀 2DateMe is going live on March 25th! You'll be notified when we launch. Get ready to meet amazing people! 🎉");
        return;
      }
    }
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
        await processPendingReferral();
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
        await processPendingReferral();
        navigate("/dashboard");
      } else {
        toast.success(t("auth.accountCreated"));
        setIsLogin(true);
        setStep(1);
      }
    }
  };

  const [showHomePage, setShowHomePage] = useState(false);

  // Check if user should see home page content
  useEffect(() => {
    const checkHomePageAccess = async () => {
      // Check for admin session (12345 now enabled)
      if (typeof localStorage !== 'undefined') {
        try {
          const adminSessionStr = localStorage.getItem('supabase.auth.token');
          if (adminSessionStr) {
            const session = JSON.parse(adminSessionStr);
            if (session.user?.id === 'admin-12345') {
              setShowHomePage(true); // Admin access enabled
              return;
            }
          }
        } catch (error) {
          console.error('Error parsing admin session:', error);
        }
      }

      // Check if there's a real Supabase session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setShowHomePage(session !== null);
      } catch (error) {
        console.error('Error checking session:', error);
        setShowHomePage(false);
      }
    };

    checkHomePageAccess();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setShowHomePage(true);
      } else if (event === 'SIGNED_OUT') {
        setShowHomePage(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // If user should see home page, show Index component
  if (showHomePage) {
    return <Index />;
  }

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

      // Build E164 format for WhatsApp number
      const prefixDigits = String(landingPrefix || "").trim().replace(/\D/g, "");
      const nationalDigits = landingNumber.replace(/\D/g, "");
      const e164 = `+${prefixDigits}${nationalDigits}`;

      // Use custom authentication system
        </div >

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

    <AnimatePresence>
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
                  navigate("/home");
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
};

          export default AuthPage;
