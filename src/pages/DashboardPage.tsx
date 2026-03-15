import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, User, LogOut, Crown, Check, HelpCircle, Gift } from "lucide-react";
import VerificationSubmitDialog from "@/components/overlays/VerificationSubmitDialog";
import { Button } from "@/components/ui/button";
import { PREMIUM_FEATURES, PremiumFeature, getFeatureIcon, getFeatureGradient } from "@/data/premiumFeatures";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProfileEditor from "@/components/ProfileEditor";
import GiftSelector from "@/components/gifts/GiftSelector";
import { useLanguage } from "@/i18n/LanguageContext";
import { isNetworkError } from "@/utils/payments";

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
  const { t, toggleLocale, locale } = useLanguage();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"profile" | "powerups" | "gifts">("profile");
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyFeature, setVerifyFeature] = useState<PremiumFeature | null>(null);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Load current user's age and ID for the verification age-match check
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase.from("profiles").select("age").eq("id", session.user.id).single();
      if (data) setUserAge((data as any).age ?? null);
    });
  }, []);
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
    const fnName = feature.id === "vip" ? "purchase-subscription" : "purchase-feature";
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
          <button onClick={toggleLocale} className="px-1.5 py-0.5 rounded-full bg-white/8 text-white/60 hover:text-white transition-colors text-[9px] sm:text-[10px] font-medium">
            {locale === "en" ? "🇮🇩 ID" : "🇬🇧 EN"}
          </button>
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
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
              tab === "profile"
                ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-[0_4px_10px_rgba(236,72,153,0.3)]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <User className="w-3 h-3" /> <span className="hidden sm:inline">{t("dash.myProfile")}</span><span className="sm:hidden">Profile</span>
          </button>
          <button
            onClick={() => setTab("powerups")}
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
              tab === "powerups"
                ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-[0_4px_12px_rgba(236,72,153,0.3)]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <Zap className="w-3 h-3" /> <span className="hidden sm:inline">{t("dash.powerups")}</span><span className="sm:hidden">Power</span>
          </button>
          <button
            onClick={() => setTab("gifts")}
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
              tab === "gifts"
                ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-[0_4px_12px_rgba(236,72,153,0.3)]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <Gift className="w-3 h-3" /> <span className="hidden sm:inline">Gifts</span><span className="sm:hidden">🎁</span>
          </button>
          <button
            onClick={() => navigate("/faq")}
            className="flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 text-white/40 hover:text-white/70 transition-all"
          >
            <HelpCircle className="w-3 h-3" /> <span className="hidden sm:inline">Help</span><span className="sm:hidden">?</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ background: "#0a0a0a", paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}>
        {tab === "profile" ? (
          <>
            <ProfileEditor />
          </>
        ) : tab === "gifts" ? (
          <div className="px-3 pt-3 pb-4">
            {userId && <GiftSelector userId={userId} profileId="" profileName="" />}
          </div>
        ) : (
          <div className="px-3 pt-3 pb-4 space-y-3">
            <p className="text-white/40 text-xs text-center pb-1">
              {t("dash.supercharge")}
            </p>

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
                        <Crown className="w-7 h-7 text-pink-400" fill="currentColor" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-black text-white text-xl">VIP Monthly</h3>
                          <span className="text-pink-400 text-xs">👑</span>
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
                      {loadingId === vip.id ? "Processing..." : "👑 Get VIP — $10.99/mo"}
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
    </div>
  );
};

export default DashboardPage;
