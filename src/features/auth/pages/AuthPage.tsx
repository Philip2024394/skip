import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGhostMode } from "@/features/ghost/hooks/useGhostMode";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Mail, Lock, User, MapPin, Calendar, ChevronRight, Home } from "lucide-react";
import { Button } from "@/shared/components/button";
import { Input } from "@/shared/components/input";
import { Label } from "@/shared/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/select";
import { Textarea } from "@/shared/components/textarea";
import SecureTextarea from "@/shared/components/SecureTextarea";
import { AppLogo } from "@/shared/components";
import { LaunchBanner } from "@/shared/components";
import { supabase } from "@/integrations/supabase/client";
import { FIRST_DATE_IDEAS } from "@/data/firstDateIdeas";
import { useLanguage } from "@/i18n/LanguageContext";
import { COUNTRIES_WITH_CODES, ALL_COUNTRIES, COUNTRY_ISO2 } from "@/data/countries";
import { toast } from "sonner";
import LegalModal from "@/features/auth/components/LegalModal";
const IndexPage = lazy(() => import("@/features/dating/pages/HomePage"));

const COUNTRY_CODES = COUNTRIES_WITH_CODES;
const COUNTRIES = ALL_COUNTRIES;

// Test account for local development (create with: npx tsx scripts/create-test-user.ts)
const TEST_EMAIL = import.meta.env.VITE_TEST_EMAIL || "test@2dateme.demo";
const TEST_PASSWORD = import.meta.env.VITE_TEST_PASSWORD || "TestPass123";

const LANDING_BG_URL = (import.meta.env.VITE_LANDING_BG_URL as string | undefined) || "https://ik.imagekit.io/7grri5v7d/uytg.png";
const LANDING_BG_URL_VERSION = (import.meta.env.VITE_LANDING_BG_URL_VERSION as string | undefined) || "v2";

// Set to true when ready to go live — until then only admin (12345) can access the dating app
const APP_LIVE = false;

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
  const { isGhost } = useGhostMode();

  const [landingPrefix, setLandingPrefix] = useState<string>(COUNTRY_CODES["Indonesia"] || "+62");
  const [landingNumber, setLandingNumber] = useState<string>("");
  const [landingSubmitting, setLandingSubmitting] = useState(false);
  const [whatsappSubmitted, setWhatsappSubmitted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [legalVerified, setLegalVerified] = useState(false);
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

  // Admin login handler - RE-ENABLED
  const handleAdminLogin = () => {
    if (adminPassword === "12345") {
      setAdminLoginError("");

      // Set admin session using Supabase for proper integration
      const adminSession = {
        access_token: 'admin-token-12345',
        refresh_token: 'admin-refresh-12345',
        expires_in: 3600,
        user: {
          id: 'admin-12345',
          email: 'admin@2dateme.demo',
          user_metadata: {
            name: 'Admin User',
            role: 'admin'
          }
        }
      };

      // Store session in Supabase auth format
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('supabase.auth.token', JSON.stringify(adminSession));
        localStorage.setItem('supabase.auth.user', JSON.stringify(adminSession.user));
      }

      // Show home page directly
      setShowHomePage(true);
    } else {
      setAdminLoginError("Invalid admin password");
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
        setShowHomePage(APP_LIVE && session !== null);
      } catch (error) {
        console.error('Error checking session:', error);
        setShowHomePage(false);
      }
    };

    checkHomePageAccess();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setShowHomePage(APP_LIVE);
      } else if (event === 'SIGNED_OUT') {
        setShowHomePage(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // If user should see home page (admin access via 12345)
  if (showHomePage) {
    return (
      <Suspense fallback={<div className="h-screen flex items-center justify-center bg-black text-white">Loading...</div>}>
        <IndexPage />
      </Suspense>
    );
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

      // Check for admin code 12345 - RE-ENABLED
      if (digits === "12345") {
        alert("Admin code detected! Setting up admin session and redirecting to home page");

        // Set admin session using Supabase for proper integration
        const adminSession = {
          access_token: 'admin-token-12345',
          refresh_token: 'admin-refresh-12345',
          expires_in: 3600,
          user: {
            id: 'admin-12345',
            email: 'admin@2dateme.demo',
            user_metadata: {
              name: 'Admin User',
              role: 'admin'
            }
          }
        };

        // Store session in Supabase auth format
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('supabase.auth.token', JSON.stringify(adminSession));
          localStorage.setItem('supabase.auth.user', JSON.stringify(adminSession.user));
        }

        // Show home page directly (navigate alone won't work since /home also renders AuthPage)
        setShowHomePage(true);
        return;
      }

      // Store WhatsApp lead and show launch popup for all other users
      setLandingSubmitting(true);
      try {
        const prefixDigits = String(landingPrefix || "").trim().replace(/\D/g, "");
        const nationalDigits = String(landingNumber || "").trim().replace(/\D/g, "");
        const e164 = buildE164(landingPrefix, landingNumber);

        // Save to Supabase - production ready with no fallback
        const { error } = await supabase
          .from('whatsapp_signups')
          .insert({
            whatsapp_number: e164,
            country: COUNTRIES.find(c => c.dial_code === landingPrefix)?.name || 'Unknown',
            consent_marketing: marketingConsent,
            legal_verified: legalVerified,
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error saving to Supabase:', error);
          toast.error("Failed to save your information. Please try again.");
          return;
        }

        // Also save to existing whatsapp_leads for compatibility
        const { error: insertError } = await (supabase as any)
          .from("whatsapp_leads")
          .upsert(
            {
              whatsapp_e164: e164,
              country_prefix: `+${prefixDigits}`,
              national_number: nationalDigits,
              consent_marketing: marketingConsent,
              legal_verified: legalVerified,
              source: "landing",
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "whatsapp_e164" }
          );

        if (typeof localStorage !== "undefined") {
          localStorage.setItem("landing_whatsapp_e164", e164);
        }

        setWhatsappSubmitted(true);
        // Show success message
        toast.success("🎉 Thank you! You'll be notified when we launch on March 25th!");

        // ACTIVATE FOR LAUNCH: Auto-divert to home page after legal verification
        // const IS_LIVE = false; // Set to true for launch
        // if (IS_LIVE && legalVerified) {
        //   setTimeout(() => {
        //     window.location.href = '/home';
        //   }, 2000);
        // }
      } catch {
        // Always save locally even if database fails
        const e164 = buildE164(landingPrefix, landingNumber);
        const signups = JSON.parse(localStorage.getItem('whatsapp_signups') || '[]');
        signups.push({
          id: `local_${Date.now()}`,
          whatsapp_number: e164,
          country: COUNTRIES.find(c => c.dial_code === landingPrefix)?.name || 'Unknown',
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('whatsapp_signups', JSON.stringify(signups));
        setWhatsappSubmitted(true);
        // Show Legal Modal for terms agreement after submission
        setShowLegalModal(true);
      } finally {
        setLandingSubmitting(false);
      }
    };

    return (
      <>
        <div
          className="h-screen-safe flex flex-col overflow-hidden"
          style={{
            backgroundImage: `url('${buildLandingBgSrc(
              LANDING_BG_URL,
              LANDING_BG_URL_VERSION,
              LANDING_BG_URL.includes("imagekit.io") ? { tr: "q-100,fo-auto,w-1080" } : undefined
            )}')`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Launch Banner */}
          <LaunchBanner />

          {/* Gradient overlay — darkens bottom for card readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/70 pointer-events-none" />

          {/* ── Top bar ─────────────────────────────────────────── */}
          <div className="relative z-20 flex items-center justify-between px-4 pt-safe"
            style={{ paddingTop: `max(1rem, env(safe-area-inset-top, 1rem))` }}>
            {/* Logo + name */}
            <div className="flex items-center gap-2.5">
              <AppLogo className="w-28 h-28 object-contain flex-shrink-0" />
              <div className="leading-none">
                <p className="text-white font-display font-black text-base tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                  2DateMe
                </p>
                <p className="text-yellow-300 text-[9px] font-bold tracking-wide drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
                  Indonesia's Dating App
                </p>
              </div>
            </div>

            {/* Language toggle */}
            <button
              onClick={toggleLocale}
              className="px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/80 hover:text-white transition-colors text-[11px] font-semibold"
            >
              {locale === "en" ? "🇮🇩 ID" : "🇬🇧 EN"}
            </button>
          </div>

          {/* ── Tagline under logo ──────────────────────────────── */}
          <div className="relative z-20 px-5 mt-3 text-left">
            <p className="text-white text-[28px] font-black leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
              Indonesia's<br />
              <span className="text-yellow-300">Fastest Way to</span><br />
              Meet Singles
            </p>
          </div>

          {/* ── Feature bullets (mid-screen) ────────────────────── */}
          <div className="relative z-20 mt-16 px-5 space-y-4">
            {[
              "Swipe & Match Real Singles",
              "Unlock WhatsApp Instantly",
              "Meet Quickly On WhatsApp",
            ].map((label) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                  <span className="text-[10px] leading-none text-white font-black">✓</span>
                </span>
                <span className="text-white text-[13px] font-semibold drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Spacer — background image visible here */}
          <div className="flex-1" />

          {/* ── CTA card — pinned to bottom ─────────────────────── */}
          <div className="relative z-20 px-4 pb-safe"
            style={{ paddingBottom: `max(1.25rem, env(safe-area-inset-bottom, 1.25rem))` }}>
            <div className="rounded-3xl bg-yellow-400 p-4 shadow-[0_0_40px_rgba(250,204,21,0.3)] border border-yellow-300/60">
              <p className="text-black text-[17px] font-black text-center leading-tight">Get Started Free</p>
              <p className="text-black/65 text-[11px] font-semibold text-center mt-0.5">
                🔥 {onlineCount.toLocaleString()} Online Looking For You
              </p>

              {whatsappSubmitted ? (
                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-center">
                  <div className="text-green-700 font-semibold mb-2">✅ You're on the list!</div>
                  <div className="text-green-600 text-sm">
                    Thank you for your interest! We'll notify you as soon as we launch on March 25th, 2026.
                  </div>
                  <div className="text-green-500 text-xs mt-2">
                    🚀 Get ready for the most advanced dating app experience!
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {/* Admin Login Toggle - Always Visible */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => setIsAdminMode(!isAdminMode)}
                      className="text-xs text-white/60 hover:text-white/80 transition-colors underline"
                    >
                      {isAdminMode ? "Back to User Signup" : "Admin Login"}
                    </button>
                  </div>

                  {isAdminMode ? (
                    /* Admin Login Form */
                    <div className="space-y-3">
                      <div>
                        <label className="text-black/70 text-xs block mb-1">Admin Password</label>
                        <Input
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Enter admin password"
                          className="bg-white border-white/70 text-black placeholder:text-black/40 rounded-xl h-11 w-full"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAdminLogin();
                            }
                          }}
                        />
                        {adminLoginError && (
                          <div className="text-red-500 text-xs mt-1">{adminLoginError}</div>
                        )}
                      </div>
                      <Button
                        onClick={handleAdminLogin}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 font-black text-[15px]"
                      >
                        Admin Login
                      </Button>
                    </div>
                  ) : (
                    /* User WhatsApp Form */
                    <div className="space-y-3">
                      {/* WhatsApp Number Input with Country Prefix and Flag */}
                      <div>
                        <label className="text-black/70 text-xs block mb-1">WhatsApp Number</label>
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                          <div className="bg-gray-100 border border-gray-300 rounded-xl h-11 flex items-center justify-center gap-1.5">
                            <span className="text-sm leading-none">{selectedFlag}</span>
                            <span className="text-sm font-semibold text-gray-700">{landingPrefix}</span>
                          </div>
                          <Input
                            value={landingNumber}
                            onChange={(e) => setLandingNumber(e.target.value.replace(/\D/g, ''))} // Only allow digits
                            placeholder="Phone number"
                            className="bg-white border-white/70 text-black placeholder:text-black/40 rounded-xl h-11 w-full"
                            inputMode="tel"
                            maxLength={15} // Reasonable limit for phone numbers
                          />
                        </div>
                        <div className="text-black/50 text-xs mt-1">
                          Enter your phone number without the country code
                        </div>
                      </div>

                      <Button
                        onClick={handleLandingEnter}
                        disabled={landingSubmitting || !landingNumber}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 font-black text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {landingSubmitting ? "Submitting..." : "Get Early Access"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Ghost Mode entry ── */}
            <button
              onClick={() => navigate("/ghost")}
              style={{
                width: "100%", height: 48, borderRadius: 20, marginTop: 10,
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(74,222,128,0.25)",
                color: "#fff", fontWeight: 800, fontSize: 14,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 0 20px rgba(74,222,128,0.08)",
              }}
            >
              <span style={{ fontSize: 18 }}>👻</span>
              {isGhost ? "Enter Ghost Mode" : "Ghost Mode — $9.99/mo"}
              <span style={{
                background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)",
                borderRadius: 6, padding: "2px 6px", fontSize: 9, fontWeight: 700,
                color: "rgba(74,222,128,0.85)", letterSpacing: "0.06em", marginLeft: 2,
              }}>
                PRIVATE
              </span>
            </button>
            <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
              Photo · Name · Age · City only · Hidden from map
            </p>
          </div>
        </div>
        <LegalModal
          isOpen={showLegalModal}
          onClose={() => setShowLegalModal(false)}
          onTermsAgreed={setTermsAgreed}
          onPrivacyAgreed={setPrivacyAgreed}
          onLegalVerified={setLegalVerified}
          initialTermsAgreed={termsAgreed}
          initialPrivacyAgreed={privacyAgreed}
        />
      </>
    );
  };
};

export default AuthPage;
