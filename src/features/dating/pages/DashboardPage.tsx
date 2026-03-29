import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, User, LogOut, Check, HelpCircle, Star, Copy, UserPlus, Eye, EyeOff, RefreshCw } from "lucide-react";
import DailyPromptPicker from "@/features/prompts/components/DailyPromptPicker";
import PhotoVerifyPage from "@/features/verification/pages/PhotoVerifyPage";
import { VerificationSubmitDialog } from "@/features/dating/components";
import { Button } from "@/shared/components/button";
import { PREMIUM_FEATURES, PremiumFeature, getFeatureIcon, getFeatureGradient } from "@/data/premiumFeatures";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProfileEditor } from "@/features/dating/components";
import { GiftReceiver } from "@/features/gifts/components";
import SuperLikeSelector from "@/features/dating/components/SuperLikeSelector";
import { useLanguage } from "@/i18n/LanguageContext";
import { isNetworkError } from "@/shared/utils/payments";

const featureNameKeys: Record<string, string> = {
  vip: "premium.vip",
  plusone: "premium.plusone",
  boost: "premium.boost",
  superlike: "premium.superlike",
  verified: "premium.verified",
  incognito: "premium.incognito",
  spotlight: "premium.spotlight",
};

const featureDescKeys: Record<string, string> = {
  vip: "premium.vipDesc",
  plusone: "premium.plusoneDesc",
  boost: "premium.boostDesc",
  superlike: "premium.superlikeDesc",
  verified: "premium.verifiedDesc",
  incognito: "premium.incognitoDesc",
  spotlight: "premium.spotlightDesc",
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"profile" | "powerups" | "gifts">("profile");
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyFeature, setVerifyFeature] = useState<PremiumFeature | null>(null);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [isProfileActive, setIsProfileActive] = useState(true);
  const [hiddenUntil, setHiddenUntil] = useState<string | null>(null);
  const [togglingActivity, setTogglingActivity] = useState(false);
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const [showPhotoVerify, setShowPhotoVerify] = useState(false);
  const [promptId, setPromptId] = useState<number | null>(null);
  const [promptAnswer, setPromptAnswer] = useState<string | null>(null);
  const [photoVerified, setPhotoVerified] = useState(false);

  // Load current user's age, ID, referral code, and visibility status
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase.from("profiles").select("age, referral_code, is_active, hidden_until, prompt_id, prompt_answer, photo_verified").eq("id", session.user.id).single();
      if (data) {
        setUserAge((data as any).age ?? null);
        setReferralCode((data as any).referral_code ?? null);
        const hu = (data as any).hidden_until;
        const active = (data as any).is_active !== false && (!hu || new Date(hu) <= new Date());
        setIsProfileActive(active);
        setHiddenUntil(hu ?? null);
        setPromptId((data as any).prompt_id ?? null);
        setPromptAnswer((data as any).prompt_answer ?? null);
        setPhotoVerified(!!(data as any).photo_verified);
      }
      const { count } = await supabase.from("referrals" as any).select("id", { count: "exact", head: true }).eq("referrer_id", session.user.id);
      setReferralCount(count ?? 0);
    });
  }, []);

  const handleToggleVisibility = async (goActive: boolean) => {
    if (!userId) return;
    setTogglingActivity(true);
    try {
      if (goActive) {
        await supabase.from("profiles").update({ is_active: true, hidden_until: null }).eq("id", userId);
        setIsProfileActive(true);
        setHiddenUntil(null);
        toast.success("Profile is now active — you're visible in feeds!");
      } else {
        // Pause: hide for 30 days (user can reactivate any time)
        const pauseUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("profiles").update({ is_active: false, hidden_until: pauseUntil }).eq("id", userId);
        setIsProfileActive(false);
        setHiddenUntil(pauseUntil);
        toast.success("Profile paused — you're hidden from all feeds.");
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setTogglingActivity(false);
    }
  };
  const [autoOpenFeatureId, setAutoOpenFeatureId] = useState<string | null>(null);

  // Handle ?purchase=featureId param from ProfileEditor redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const purchaseId = params.get("purchase");
    if (purchaseId) {
      setTab("powerups");
      setAutoOpenFeatureId(purchaseId);
      // Clean URL
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  const handlePurchase = async (feature: PremiumFeature) => {
    setLoadingId(feature.id);
    const isSubscription = feature.isSubscription === true;
    const fnName = isSubscription ? "purchase-subscription" : "purchase-feature";
    const invokeFn = () => supabase.functions.invoke(fnName, {
      body: { priceId: feature.priceId, featureId: feature.id },
    });
    try {
      let result = await invokeFn();
      if (result.error && isNetworkError(result.error)) {
        await new Promise((r) => setTimeout(r, 1200));
        result = await invokeFn();
      }
      const { data, error } = result;
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success(t("popup.checkoutOpen"));
      } else {
        toast.error(t("popup.checkoutError"));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Purchase failed";
      if (isNetworkError(err)) {
        toast.error(t("popup.connectionError"));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancelVip = async () => {
    if (!window.confirm(t("popup.vipCancelConfirm"))) return;
    setLoadingId("vip-cancel");
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { featureId: "vip" },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(t("popup.vipCancelled"));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("popup.cancellationFailed"));
    } finally {
      setLoadingId(null);
    }
  };

  // Auto-trigger purchase if redirected from ProfileEditor with ?purchase=id
  useEffect(() => {
    if (!autoOpenFeatureId) return;
    const feature = PREMIUM_FEATURES.find(f => f.id === autoOpenFeatureId);
    if (feature) {
      handlePurchase(feature);
    }
    setAutoOpenFeatureId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenFeatureId]);

  const handleLogout = async () => {
    // Clear online dot before signing out
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await (supabase.from("profiles").update as any)({ last_seen_at: null }).eq("id", session.user.id);
    }
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="h-screen-safe bg-[#0a0a0a] text-white flex flex-col overflow-hidden max-w-full mx-auto">
      <header className="flex items-center justify-between px-3 py-2.5 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/8" style={{ paddingTop: `max(0.5rem, env(safe-area-inset-top, 0px))` }}>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")} className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors" title="Back">
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-display font-bold text-white text-xs sm:text-sm">{t("dash.title")}</span>
        </div>
        <div className="flex items-center gap-1.5">
<button onClick={handleLogout} className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors" title={t("dash.logout")}>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Tab toggle */}
      <div className="px-3 pt-2.5">
        <div className="flex gap-1 p-1 bg-black/40 rounded-2xl border border-white/10">
          <button
            onClick={() => setTab("profile")}
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${tab === "profile"
              ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-[0_4px_10px_rgba(236,72,153,0.3)]"
              : "text-white/40 hover:text-white/70"
              }`}
          >
            <User className="w-3 h-3" /> Profile
          </button>
          <button
            onClick={() => setTab("powerups")}
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${tab === "powerups"
              ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-[0_4px_12px_rgba(236,72,153,0.3)]"
              : "text-white/40 hover:text-white/70"
              }`}
          >
            <Zap className="w-3 h-3" /> Power-ups
          </button>
          <button
            onClick={() => setTab("gifts")}
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${tab === "gifts"
              ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-[0_4px_12px_rgba(236,72,153,0.3)]"
              : "text-white/40 hover:text-white/70"
              }`}
          >
            <Star className="w-3 h-3" /> Super
          </button>
          <button
            onClick={() => navigate("/faq")}
            className="flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 text-white/40 hover:text-white/70 transition-all"
          >
            <HelpCircle className="w-3 h-3" /> Help
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ background: "#0a0a0a", paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}>
        {tab === "profile" ? (
          <>
            <ProfileEditor />

            {/* ── Teddy Room entry ─────────────────────────────────── */}
            <div className="mx-4 mb-4">
              <button
                onClick={() => navigate("/teddy")}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, rgba(180,80,150,0.15), rgba(100,40,120,0.12))",
                  border: "1.5px solid rgba(180,80,150,0.3)",
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(180,80,150,0.2)" }}>
                  <span className="text-lg">🧸</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm">My Teddy Room</p>
                  <p className="text-white/40 text-[11px]">Your private photo & video vault — PIN protected</p>
                </div>
                <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* ── Daily Prompt ─────────────────────────────────────── */}
            <div className="mx-4 mb-4">
              <button
                onClick={() => setShowPromptPicker(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
                style={{
                  background: promptAnswer
                    ? "linear-gradient(135deg, rgba(236,72,153,0.12), rgba(168,85,247,0.1))"
                    : "rgba(255,255,255,0.03)",
                  border: promptAnswer ? "1.5px solid rgba(236,72,153,0.3)" : "1.5px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(236,72,153,0.15)" }}>
                  <span className="text-lg">💬</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm">Daily Prompt</p>
                  <p className="text-white/40 text-[11px] truncate">
                    {promptAnswer ? `"${promptAnswer}"` : "Add a prompt — shows on your profile card"}
                  </p>
                </div>
                <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* ── Photo Verification ───────────────────────────────── */}
            <div className="mx-4 mb-4">
              <button
                onClick={() => !photoVerified && setShowPhotoVerify(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
                style={{
                  background: photoVerified
                    ? "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.08))"
                    : "rgba(255,255,255,0.03)",
                  border: photoVerified ? "1.5px solid rgba(34,197,94,0.3)" : "1.5px solid rgba(255,255,255,0.08)",
                  cursor: photoVerified ? "default" : "pointer",
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: photoVerified ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)" }}>
                  <span className="text-lg">{photoVerified ? "✅" : "📸"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm">
                    {photoVerified ? "Photo Verified" : "Get Photo Verified"}
                  </p>
                  <p className="text-white/40 text-[11px]">
                    {photoVerified ? "Your profile shows a ✅ verified badge" : "Take a selfie — builds trust with matches"}
                  </p>
                </div>
                {!photoVerified && <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>}
              </button>
            </div>

            {/* ── Referral section ──────────────────────────────────── */}
            {referralCode && (
              <div className="mx-4 mb-6 rounded-3xl overflow-hidden" style={{
                background: "linear-gradient(135deg, rgba(236,72,153,0.12), rgba(168,85,247,0.1))",
                border: "1.5px solid rgba(236,72,153,0.25)",
              }}>
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🎁</span>
                    <p className="text-white font-black text-sm">Invite Friends — Earn Free Unlocks</p>
                  </div>
                  <p className="text-white/40 text-xs leading-snug">
                    Share your link. When a friend joins, you both get <strong className="text-pink-400">10 free Super Likes</strong>.
                  </p>
                </div>

                {/* Stats row */}
                <div className="px-4 pb-3 flex items-center gap-3">
                  <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                    <p className="text-pink-400 font-black text-xl">{referralCount}</p>
                    <p className="text-white/30 text-[9px] font-semibold uppercase tracking-wider">Friends Joined</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                    <p className="text-purple-400 font-black text-xl">{referralCount * 10}</p>
                    <p className="text-white/30 text-[9px] font-semibold uppercase tracking-wider">Super Likes Earned</p>
                  </div>
                </div>

                {/* Referral link */}
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                    <p className="text-white/60 text-xs font-mono flex-1 truncate">
                      2dateme.com/?ref={referralCode}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://2dateme.com/?ref=${referralCode}`);
                        toast.success("Link copied!");
                      }}
                      className="flex-shrink-0 p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-white/60" />
                    </button>
                  </div>
                </div>

                {/* WhatsApp share button */}
                <div className="px-4 pb-4">
                  <button
                    onClick={() => {
                      const msg = encodeURIComponent(
                        `Hey! 👋 I just joined 2DateMe — Indonesia's dating app where you skip the chat and get their WhatsApp directly! 🇮🇩❤️\n\nJoin free here: https://2dateme.com/?ref=${referralCode}\n\nWomen always free. Matches from $1.99.`
                      );
                      window.open(`https://wa.me/?text=${msg}`, "_blank");
                    }}
                    className="w-full py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #25D366, #128C7E)",
                      boxShadow: "0 0 15px rgba(37,211,102,0.25)",
                      color: "white",
                    }}
                  >
                    <span className="text-lg">💬</span>
                    Share on WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* ── Account Visibility ────────────────────────────── */}
            <div className="mx-4 mb-6 rounded-3xl overflow-hidden" style={{
              background: isProfileActive
                ? "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.06))"
                : "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(180,20,40,0.06))",
              border: `1.5px solid ${isProfileActive ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
            }}>
              <div className="px-4 pt-4 pb-3">
                {/* Status row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isProfileActive ? "bg-green-500/15" : "bg-red-500/15"}`}>
                    {isProfileActive
                      ? <Eye className="w-4 h-4 text-green-400" />
                      : <EyeOff className="w-4 h-4 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className={`font-black text-sm ${isProfileActive ? "text-green-400" : "text-red-400"}`}>
                      {isProfileActive ? "Profile Active" : "Profile Paused"}
                    </p>
                    <p className="text-white/40 text-[11px] leading-tight">
                      {isProfileActive
                        ? "You're visible in feeds — people can find and match you."
                        : "You're hidden from all feeds. No one can see or match you."
                      }
                    </p>
                  </div>
                </div>

                {/* Match expiry info */}
                <div className="rounded-xl px-3 py-2.5 mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-white/60 text-[11px] leading-relaxed">
                    <span className="text-amber-400 font-bold">⏰ Matches last 3 days.</span> After 3 days, the match card locks and profiles can no longer be viewed from it. If you haven't unlocked by then, you may re-appear in each other's feed naturally.
                  </p>
                </div>

                {/* Action buttons */}
                {isProfileActive ? (
                  <button
                    disabled={togglingActivity}
                    onClick={() => handleToggleVisibility(false)}
                    className="w-full py-3 rounded-2xl text-[12px] font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "rgba(239,68,68,0.9)" }}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    {togglingActivity ? "Pausing…" : "Pause My Profile"}
                  </button>
                ) : (
                  <button
                    disabled={togglingActivity}
                    onClick={() => handleToggleVisibility(true)}
                    className="w-full py-3 rounded-2xl text-[12px] font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.15))", border: "1px solid rgba(34,197,94,0.4)", color: "rgba(34,197,94,1)" }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {togglingActivity ? "Activating…" : "Go Live Again"}
                  </button>
                )}

                <p className="text-white/25 text-[10px] text-center mt-2">
                  Changes take effect within 1 hour across all feeds
                </p>
              </div>
            </div>
          </>
        ) : tab === "gifts" ? (
          <div className="px-3 pt-3 pb-4 space-y-4">
            <div>
              <p className="text-white font-bold text-sm mb-0.5">⭐ Super Likes</p>
              <p className="text-white/40 text-xs">Send a Super Like to anyone — they'll see it at the top of their Likes Library with a glow effect.</p>
            </div>
            <SuperLikeSelector userId={userId || undefined} />
          </div>
        ) : (
          <div className="px-3 pt-3 pb-4 space-y-3">
            <p className="text-white/40 text-xs text-center pb-1">
              {t("dash.supercharge")}
            </p>

            {/* ── Earn Free Rewards Card ────────────────────────── */}
            <div className="rounded-2xl overflow-hidden border border-yellow-400/20 shadow-[0_0_20px_rgba(250,204,21,0.08)]"
              style={{ background: "linear-gradient(135deg, rgba(20,14,0,0.95) 0%, rgba(10,8,0,0.98) 100%)" }}>
              {/* Header */}
              <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(250,204,21,0.15)", border: "1px solid rgba(250,204,21,0.3)" }}>
                  <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">Earn Free Rewards</p>
                  <p className="text-white/40 text-[10px] mt-0.5">Super Likes &amp; Likes — no payment needed</p>
                </div>
              </div>

              <div className="px-4 pb-4 space-y-3 mt-1">
                {/* Reward 1 — Besties */}
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(232,72,199,0.08)", border: "1px solid rgba(232,72,199,0.18)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: "rgba(232,72,199,0.15)" }}>
                    👯
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white font-bold text-xs">Add a Bestie / Mate</p>
                      <span className="text-yellow-400 font-black text-xs whitespace-nowrap">+1 ⭐ each</span>
                    </div>
                    <p className="text-white/45 text-[11px] mt-0.5 leading-snug">
                      Tap 👯 on any profile to send a Bestie request. When they accept, you earn 1 free Super Like. Max 10 Besties = 10 free Super Likes.
                    </p>
                  </div>
                </div>

                {/* Reward 2 — Invite a friend */}
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.18)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(74,222,128,0.12)" }}>
                    <UserPlus className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white font-bold text-xs">Invite a Friend</p>
                      <span className="text-green-400 font-black text-xs whitespace-nowrap">+5 ❤️ each</span>
                    </div>
                    <p className="text-white/45 text-[11px] mt-0.5 leading-snug">
                      Share your link. When a friend signs up and completes their profile, you both get 5 free Likes instantly — no expiry.
                    </p>
                    <button
                      onClick={() => {
                        const link = `https://2dateme.com/?ref=${userId || "friend"}`;
                        navigator.clipboard.writeText(link).then(() => {
                          import("sonner").then(({ toast }) => toast.success("Invite link copied! 🎉"));
                        });
                      }}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-green-400 transition-colors hover:bg-green-400/10"
                      style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)" }}
                    >
                      <Copy className="w-3 h-3" /> Copy Invite Link
                    </button>
                  </div>
                </div>

                {/* Reward summary row */}
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-yellow-400 font-black text-base">10 ⭐</span>
                    <span className="text-white/35 text-[10px] text-center leading-tight">Max free<br />Super Likes</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-pink-400 font-black text-base">5 ❤️</span>
                    <span className="text-white/35 text-[10px] text-center leading-tight">Per friend<br />invited</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-white/70 font-black text-base">∞</span>
                    <span className="text-white/35 text-[10px] text-center leading-tight">Never<br />expire</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── VIP Hero Card ─────────────────────────────────── */}
            {(() => {
              const vip = PREMIUM_FEATURES.find(f => f.id === "vip");
              if (!vip) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  className="relative overflow-hidden rounded-3xl border-2 border-pink-400/60 shadow-[0_0_30px_rgba(236,72,153,0.2)]"
                >
                  {/* Pink gradient background */}
                  <div className="bg-gradient-to-br from-pink-900/40 via-black/40 to-violet-900/40 p-5">
                    {/* Best Value badge */}
                    <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                      <span className="text-[10px] font-black text-white tracking-wider">BEST VALUE</span>
                    </div>

                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-black/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-pink-400/30">
                        <img
                          src="https://ik.imagekit.io/7grri5v7d/VIP%20heart%20with%20golden%20accents.png"
                          alt="VIP"
                          style={{ width: 36, height: 36, objectFit: "contain" }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-black text-white text-xl">VIP Monthly</h3>
                          <img src="https://ik.imagekit.io/7grri5v7d/VIP%20heart%20with%20golden%20accents.png" alt="VIP" style={{ width: 16, height: 16, objectFit: "contain" }} />
                        </div>
                        <p className="text-white/80 text-xs mt-0.5">Everything you need in one plan</p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="font-display font-black text-white text-3xl">$10.99</span>
                          <span className="text-white/70 text-sm">/month</span>
                        </div>
                      </div>
                    </div>

                    {/* Perks list */}
                    <div className="space-y-2 mb-4">
                      {vip.perks?.map((perk, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-pink-400/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-pink-400" />
                          </div>
                          <span className="text-white/90 text-xs">{perk}</span>
                        </div>
                      ))}
                    </div>

                    {/* Value bar */}
                    <div className="bg-black/20 rounded-xl p-2.5 mb-4 flex items-center justify-between">
                      <div className="text-center flex-1">
                        <p className="text-white/60 text-[9px] uppercase tracking-wider">Retail Value</p>
                        <p className="text-white font-bold text-sm line-through opacity-60">$23.88</p>
                      </div>
                      <div className="w-px h-8 bg-white/20" />
                      <div className="text-center flex-1">
                        <p className="text-white/60 text-[9px] uppercase tracking-wider">You Pay</p>
                        <p className="text-white font-black text-sm">$10.99</p>
                      </div>
                      <div className="w-px h-8 bg-white/20" />
                      <div className="text-center flex-1">
                        <p className="text-white/60 text-[9px] uppercase tracking-wider">You Save</p>
                        <p className="text-green-300 font-black text-sm">54%</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handlePurchase(vip)}
                      disabled={loadingId === vip.id}
                      className="w-full bg-black/30 hover:bg-black/40 backdrop-blur-sm text-white border border-white/30 font-black h-12 rounded-xl text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {loadingId === vip.id ? "Processing..." : (
                        <span className="flex items-center justify-center gap-1.5">
                          <img src="https://ik.imagekit.io/7grri5v7d/VIP%20heart%20with%20golden%20accents.png" alt="VIP" style={{ width: 18, height: 18, objectFit: "contain" }} />
                          Get VIP — $10.99/mo
                        </span>
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })()}

            {/* ── Individual features ───────────────────────────── */}
            <p className="text-white/25 text-[10px] text-center font-semibold uppercase tracking-wider pt-1">
              Or buy individually
            </p>

            {PREMIUM_FEATURES.filter(f => f.id !== "vip").map((feature, i) => {
              const Icon = getFeatureIcon(feature.icon);
              const gradient = getFeatureGradient(feature.color);
              const nameKey = featureNameKeys[feature.id] as any;
              const descKey = featureDescKeys[feature.id] as any;
              const borderShadowMap: Record<string, { border: string; shadow: string }> = {
                plusone: { border: "border-2 border-pink-400/60", shadow: "shadow-[0_0_30px_rgba(236,72,153,0.2)]" },
                boost: { border: "border-2 border-pink-400/60", shadow: "shadow-[0_0_30px_rgba(236,72,153,0.2)]" },
                superlike: { border: "border-2 border-pink-400/60", shadow: "shadow-[0_0_30px_rgba(236,72,153,0.2)]" },
                verified: { border: "border-2 border-pink-400/60", shadow: "shadow-[0_0_30px_rgba(236,72,153,0.2)]" },
                incognito: { border: "border-2 border-pink-400/60", shadow: "shadow-[0_0_30px_rgba(236,72,153,0.2)]" },
                spotlight: { border: "border-2 border-pink-400/60", shadow: "shadow-[0_0_30px_rgba(236,72,153,0.2)]" },
              };
              const { border, shadow } = borderShadowMap[feature.id] || { border: "border-2 border-white/20", shadow: "" };
              const perks = feature.perks ?? [1, 2, 3].map((n) => t(`premium.${feature.id}.${n}` as any)).filter(Boolean);
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i + 1) * 0.08 }}
                  className={`relative overflow-hidden rounded-3xl ${border} ${shadow}`}
                >
                  <div className="bg-gradient-to-br from-pink-900/40 via-black/40 to-violet-900/40 p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-black/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-pink-400/30">
                        <Icon className="w-7 h-7 text-pink-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-black text-white text-xl">
                            {feature.emoji} {t(nameKey)}
                          </h3>
                        </div>
                        <p className="text-white/80 text-xs mt-0.5">{t(descKey)}</p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="font-display font-black text-white text-3xl">{feature.price.replace(/\/mo$/, "")}</span>
                          {feature.isSubscription && <span className="text-white/70 text-sm">/month</span>}
                        </div>
                      </div>
                    </div>

                    {perks.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {perks.map((perk, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-pink-400/20 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5 text-pink-400" />
                            </div>
                            <span className="text-white/90 text-xs">{perk}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        if (feature.id === "verified") {
                          setVerifyFeature(feature);
                          setShowVerifyDialog(true);
                        } else {
                          handlePurchase(feature);
                        }
                      }}
                      disabled={loadingId === feature.id}
                      className="w-full bg-black/30 hover:bg-black/40 backdrop-blur-sm text-white border border-white/30 font-black h-12 rounded-xl text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {loadingId === feature.id ? t("dash.processing") : `${t("dash.get")} ${t(nameKey)} — ${feature.price}`}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verification ID submission dialog */}
      {showVerifyDialog && verifyFeature && (
        <VerificationSubmitDialog
          userAge={userAge}
          onClose={() => setShowVerifyDialog(false)}
          onSubmitted={() => {
            setShowVerifyDialog(false);
            handlePurchase(verifyFeature);
          }}
        />
      )}

      {/* Gift Receiver for handling incoming gifts */}
      <GiftReceiver currentUserId={userId ?? undefined} />

      {/* Daily Prompt Picker overlay */}
      <AnimatePresence>
        {showPromptPicker && userId && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DailyPromptPicker
              userId={userId}
              currentPromptId={promptId}
              currentAnswer={promptAnswer}
              onSaved={(id, ans) => { setPromptId(id); setPromptAnswer(ans); }}
              onClose={() => setShowPromptPicker(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Verify overlay */}
      <AnimatePresence>
        {showPhotoVerify && userId && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PhotoVerifyPage
              userId={userId}
              onVerified={() => { setPhotoVerified(true); setShowPhotoVerify(false); }}
              onClose={() => setShowPhotoVerify(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;
