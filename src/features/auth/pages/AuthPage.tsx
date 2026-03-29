import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGhostMode } from "@/features/ghost/hooks/useGhostMode";
import { Button } from "@/shared/components/button";
import { Input } from "@/shared/components/input";
import { AppLogo } from "@/shared/components";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
const IndexPage = lazy(() => import("@/features/dating/pages/HomePage"));

const LANDING_BG_URL = (import.meta.env.VITE_LANDING_BG_URL as string | undefined) || "https://ik.imagekit.io/7grri5v7d/uytg.png";
const LANDING_BG_URL_VERSION = (import.meta.env.VITE_LANDING_BG_URL_VERSION as string | undefined) || "v2";

const APP_LIVE = true;

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
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isGhost } = useGhostMode();

  const [onlineCount, setOnlineCount] = useState(getDailyOnlineCount());

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
      if (event === "SIGNED_IN" && session) navigate("/home", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

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

  const [form, setForm] = useState({ email: "", password: "" });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const getLoginErrorMessage = (error: { message: string }): string => {
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login") || msg.includes("invalid credentials")) return t("auth.invalidLogin");
    if (msg.includes("email not confirmed") || msg.includes("confirm your email")) return t("auth.emailNotConfirmed");
    return error.message;
  };

  const handleAuth = async () => {
    if (!form.email || !form.password) { toast.error(t("auth.fillAllFields")); return; }
    setLoading(true);

    // Try sign-in first — avoids triggering confirmation emails on every attempt
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (!error && data.session) {
      // Existing user signed in
      toast.success(t("auth.welcomeBack"));
      await processPendingReferral();
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", data.session.user.id),
        supabase.from("profiles").select("name").eq("id", data.session.user.id).maybeSingle(),
      ]);
      setLoading(false);
      if (roles?.some((r: any) => r.role === "admin")) {
        navigate("/admin");
        return;
      }
      // No name yet → send through onboarding
      if (!profile?.name) {
        navigate("/welcome", { replace: true });
        return;
      }
      navigate("/home");
      return;
    }

    // If error is NOT "invalid credentials" (i.e. user doesn't exist yet), try sign-up
    const isNewUser = error?.message?.toLowerCase().includes("invalid login") ||
      error?.message?.toLowerCase().includes("invalid credentials") ||
      error?.message?.toLowerCase().includes("user not found") ||
      error?.message?.toLowerCase().includes("no user found");

    if (isNewUser) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            preferred_language: locale, // "en" or "id" — used by send-auth-email hook
          },
        },
      });
      setLoading(false);
      if (signUpError) { toast.error(signUpError.message); return; }
      if (signUpData.session) {
        toast.success("Welcome to 2DateMe! 🎉");
        await processPendingReferral();
        navigate("/welcome", { replace: true });
        return;
      }
      // Email confirmation required
      toast.success("Check your email to confirm your account!");
      return;
    }

    // Other errors (email not confirmed, rate limit, etc.)
    setLoading(false);
    toast.error(getLoginErrorMessage(error!));
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
  return (
      <>
        <div className="flex flex-col" style={{
          position: "fixed", inset: 0,
          minHeight: "100dvh",
          overflowY: "auto",
          overflowX: "hidden",
          background: "#000",
        }}>

          {/* ── Background video — no black bars, watermark hidden ── */}
          {/* Wrapper clips the bottom ~60px where the watermark lives */}
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0,
            bottom: -60, /* extend 60px below viewport to hide watermark */
            zIndex: 0,
            overflow: "hidden",
          }}>
            <video
              autoPlay
              muted
              playsInline
              style={{
                position: "absolute", inset: 0,
                width: "100%",
                height: "calc(100% + 60px)",
                objectFit: "cover",
                objectPosition: "calc(50% - 230px) top",
              }}
            >
              <source src="https://ik.imagekit.io/dateme/video%20landing%20page%20date%202%20me%20com.mp4?tr=q-100" type="video/mp4" />
            </video>
          </div>

          {/* Gradient overlay */}
          <div style={{
            position: "fixed", inset: 0, zIndex: 1,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)",
            pointerEvents: "none",
          }} />

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
              "Unlock Their Contact Instantly — from $1.99",
              "Meet Quickly On WhatsApp, WeChat & More",
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

            {/* Women always free badge */}
            <div className="flex items-center gap-2.5 mt-1">
              <span className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                <span className="text-[10px] leading-none">♀</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-white text-[13px] font-semibold drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
                  Women Always Free
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-pink-500/80 text-white border border-pink-400/50 shadow-[0_0_8px_rgba(236,72,153,0.4)]">
                  FOREVER
                </span>
              </div>
            </div>
          </div>

          {/* Spacer — background image visible here */}
          <div className="flex-1" />

          {/* ── CTA card — pinned to bottom ─────────────────────── */}
          <div className="relative z-20 px-4 pb-safe"
            style={{ paddingBottom: `max(1.25rem, env(safe-area-inset-bottom, 1.25rem))` }}>
            <div className="rounded-3xl bg-yellow-400 p-4 shadow-[0_0_40px_rgba(250,204,21,0.3)] border border-yellow-300/60">
              <p className="text-black text-[17px] font-black text-center leading-tight">Get Started Free</p>
              <p className="text-black/65 text-[11px] font-semibold text-center mt-0.5">
                🔥 {onlineCount.toLocaleString()} Online · ♀ Women Always Free
              </p>

              <div className="mt-3 space-y-2">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="Email address"
                  className="bg-white border-white/70 text-black placeholder:text-black/40 rounded-xl h-11"
                  autoComplete="email"
                />
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Password"
                  className="bg-white border-white/70 text-black placeholder:text-black/40 rounded-xl h-11"
                  autoComplete="current-password"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }}
                />
                <Button
                  onClick={handleAuth}
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 font-black text-[15px] disabled:opacity-50"
                >
                  {loading ? "Please wait..." : "Continue →"}
                </Button>
                <p className="text-black/45 text-[10px] text-center">New here? We'll create your account automatically.</p>
              </div>
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
      </>
    );
};

export default AuthPage;
