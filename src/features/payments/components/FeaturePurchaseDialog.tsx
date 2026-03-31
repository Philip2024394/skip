import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/shared/components/button";
import { PremiumFeature, getFeatureIcon, getFeatureGradient, getFeaturePriceCents } from "@/data/premiumFeatures";
import { useLanguage } from "@/i18n/LanguageContext";
import { useUserCurrency, getUserCountry } from "@/shared/hooks/useUserCurrency";
import { getRegionForCountry } from "@/shared/utils/regionalPricing";

const featureDetails: Record<string, { bullets: string[]; tagline: string }> = {
  boost: {
    tagline: "Get seen by more people, fast!",
    bullets: [
      "⏱ Lasts 1 hour",
      "👀 5–10× more profile views",
      "📊 See views & matches after",
      "🔝 Jump to the top of the swipe stack",
    ],
  },
  superlike: {
    tagline: "Make them notice you instantly!",
    bullets: [
      "⭐ Appears first in their library",
      "🔔 They get a notification",
      "💫 Highlighted with a star badge",
      "💘 3× more likely to match",
    ],
  },
  verified: {
    tagline: "Build trust & rank higher!",
    bullets: [
      "✅ Verified badge on your profile",
      "📈 Rank higher in search results",
      "🛡️ Show others you're real",
      "💎 Stand out from the crowd",
    ],
  },
  incognito: {
    tagline: "Browse without being seen!",
    bullets: [
      "👻 Invisible for 24 hours",
      "🔍 Browse profiles privately",
      "🛡️ No trace left behind",
      "🔒 Your profile hidden from everyone",
    ],
  },
  spotlight: {
    tagline: "Be the star of the show!",
    bullets: [
      "🌟 Featured at top of everyone's stack",
      "⏰ Lasts a full 24 hours",
      "📊 10–20× more views",
      "🎯 Maximum visibility guaranteed",
    ],
  },
  plusone: {
    tagline: "Great company for events & experiences.",
    bullets: [
      "🎫 Plus-One badge on your profile",
      "💬 WhatsApp connection for fast coordination",
      "🍽 Dinners, weddings, concerts & more",
      "🤝 Events and outings — no pressure, just good company",
    ],
  },
};

interface FeaturePurchaseDialogProps {
  feature: PremiumFeature | null;
  onClose: () => void;
  onContinue: (feature: PremiumFeature, region?: string) => void;
  loading?: boolean;
}

const FeaturePurchaseDialog = ({ feature, onClose, onContinue, loading }: FeaturePurchaseDialogProps) => {
  const { t } = useLanguage();
  const { fmt } = useUserCurrency();
  if (!feature) return null;

  const userCountry = getUserCountry();
  const userRegion  = getRegionForCountry(userCountry);
  const regionalCents = getFeaturePriceCents(feature.id, userCountry);

  const Icon = getFeatureIcon(feature.icon);
  const gradient = getFeatureGradient(feature.color);
  const details = featureDetails[feature.id] || { tagline: feature.description, bullets: [] };
  // Detect subscription (VIP) by feature id or price string containing "/mo"
  const priceSuffix = feature.id === "vip" || feature.price.includes("/mo") ? "/mo" : "";
  const displayPrice = fmt(regionalCents, priceSuffix);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-sm rounded-3xl overflow-hidden"
          style={{ background: "rgba(12,12,18,0.72)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.10)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pink top bar */}
          <div style={{ height: 4, background: "linear-gradient(90deg, #ec4899, #f472b6, #ec4899)" }} />
          <div className="p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-2xl ${gradient} flex items-center justify-center shadow-glow`}>
              {feature.id === "vip" ? (
                <img
                  src="https://ik.imagekit.io/7grri5v7d/VIP%20heart%20with%20golden%20accents.png"
                  alt="VIP"
                  style={{ width: 40, height: 40, objectFit: "contain" }}
                />
              ) : (
                <Icon className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="font-display font-bold text-xl text-foreground text-center">
            {feature.emoji} {feature.name}
          </h2>
          <p className="text-muted-foreground text-sm text-center mt-1 mb-4">
            {details.tagline}
          </p>

          {/* Feature bullets */}
          <div className="bg-muted/50 rounded-2xl p-4 space-y-2.5 mb-5">
            {details.bullets.map((bullet, i) => (
              <p key={i} className="text-foreground text-sm">
                {bullet}
              </p>
            ))}
          </div>

          {/* Price & CTA */}
          <Button
            onClick={() => onContinue(feature, userRegion)}
            disabled={loading}
            className={`w-full ${gradient} text-primary-foreground border-0 font-bold h-12 rounded-xl text-base`}
          >
            {loading ? t("popup.processing") : `${t("popup.continueToPayment")} — ${displayPrice}`}
          </Button>

          <p className="text-muted-foreground text-[10px] text-center mt-3">
            {t("popup.securePayment")}
          </p>
          </div>{/* /p-6 */}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FeaturePurchaseDialog;
