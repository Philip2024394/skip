import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PREMIUM_FEATURES, PremiumFeature, getFeatureIcon, getFeatureGradient } from "@/data/premiumFeatures";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProfileEditor from "@/components/ProfileEditor";
import { useLanguage } from "@/i18n/LanguageContext";

const featureNameKeys: Record<string, string> = {
  boost: "premium.boost",
  superlike: "premium.superlike",
  verified: "premium.verified",
  incognito: "premium.incognito",
  spotlight: "premium.spotlight",
};

const featureDescKeys: Record<string, string> = {
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
  const [tab, setTab] = useState<"profile" | "powerups">("profile");

  const handlePurchase = async (feature: PremiumFeature) => {
    setLoadingId(feature.id);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-feature", {
        body: { priceId: feature.priceId, featureId: feature.id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Purchase failed");
    } finally {
      setLoadingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-display font-bold text-gray-900 text-sm">{t("dash.title")}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleLocale} className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors text-[10px] font-medium">
            {locale === "en" ? "🇮🇩 ID" : "🇬🇧 EN"}
          </button>
          <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors" title={t("dash.logout")}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tab toggle */}
      <div className="px-4 pt-3">
        <div className="flex gap-1 p-0.5 bg-gray-100 rounded-2xl border border-gray-200">
          <button
            onClick={() => setTab("profile")}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              tab === "profile" ? "gradient-love text-white" : "text-gray-500"
            }`}
          >
            <User className="w-3.5 h-3.5" /> {t("dash.myProfile")}
          </button>
          <button
            onClick={() => setTab("powerups")}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              tab === "powerups" ? "gradient-gold text-white" : "text-gray-500"
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> {t("dash.powerups")}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === "profile" ? (
          <ProfileEditor />
        ) : (
          <>
            <p className="text-gray-500 text-xs text-center">
              {t("dash.supercharge")}
            </p>
            {PREMIUM_FEATURES.map((feature, i) => {
              const Icon = getFeatureIcon(feature.icon);
              const gradient = getFeatureGradient(feature.color);
              const nameKey = featureNameKeys[feature.id] as any;
              const descKey = featureDescKeys[feature.id] as any;
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-gray-900 text-sm">
                        {feature.emoji} {t(nameKey)}
                      </h3>
                      <p className="text-gray-500 text-xs mt-0.5">{t(descKey)}</p>
                      <ul className="text-gray-400 text-[10px] mt-2 space-y-0.5">
                        {[1, 2, 3].map((n) => {
                          const key = `premium.${feature.id}.${n}` as any;
                          return <li key={n}>{t(key)}</li>;
                        })}
                      </ul>
                    </div>
                  </div>
                  <Button
                    onClick={() => handlePurchase(feature)}
                    disabled={loadingId === feature.id}
                    className={`w-full mt-3 ${gradient} text-white border-0 font-bold h-10 rounded-xl`}
                  >
                    {loadingId === feature.id ? t("dash.processing") : `${t("dash.get")} ${t(nameKey)} — ${feature.price}`}
                  </Button>
                </motion.div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
