import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, MapPin, MessageCircle, X, ShieldCheck } from "lucide-react";
import { Button } from "@/shared/components/button";
import { useNavigate } from "react-router-dom";
import { AppLogo } from "@/shared/components";
import { useLanguage } from "@/i18n/LanguageContext";

interface GuestAuthPromptProps {
  open: boolean;
  onClose: () => void;
  /** What the guest tried to do — determines the headline copy */
  trigger?: "like" | "superlike" | "profile" | "map" | "match" | "filter" | "generic" | "purchase";
}

const GuestAuthPrompt = ({ open, onClose, trigger = "generic" }: GuestAuthPromptProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const titleKey = `guest.${trigger}.title`;
  const bodyKey = `guest.${trigger}.body`;
  const title = t(titleKey as any);
  const body = t(bodyKey as any);

  const goSignUp = () => { onClose(); navigate("/?register=1"); };
  const goSignIn = () => { onClose(); navigate("/?signin=1"); };

  const perks = [
    { icon: <Heart className="w-4 h-4 text-primary" fill="currentColor" />, textKey: "guest.perk1" },
    { icon: <Star className="w-4 h-4 text-amber-400" fill="currentColor" />, textKey: "guest.perk2" },
    { icon: <MapPin className="w-4 h-4 text-teal-400" />, textKey: "guest.perk3" },
    { icon: <MessageCircle className="w-4 h-4 text-green-400" fill="currentColor" />, textKey: "guest.perk4" },
    { icon: <ShieldCheck className="w-4 h-4 text-blue-400" />, textKey: "guest.perk5" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-10 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            <div className="bg-black/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-[calc(100%-theme(spacing.10)*6)] right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Hero gradient strip */}
              <div className="h-1.5 w-full gradient-love" />

              <div className="p-6 space-y-5">
                {/* Logo + headline — no icon over title */}
                <div className="flex items-center gap-3">
                  <AppLogo className="w-12 h-12 object-contain drop-shadow-xl flex-shrink-0" />
                  <div>
                    <h2 className="text-white font-display font-bold text-lg leading-tight">{title}</h2>
                    <p className="text-white/50 text-xs mt-0.5">{body}</p>
                  </div>
                </div>

                {/* Perks list */}
                <ul className="space-y-2">
                  {perks.map((p, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <span className="flex-shrink-0">{p.icon}</span>
                      <span className="text-white/70 text-sm">{t(p.textKey as any)}</span>
                    </li>
                  ))}
                </ul>

                {/* Free badge — Heart + 100% Free to Join; No Credit Card Required */}
                <div className="flex flex-col gap-2 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" />
                    <span className="text-primary text-xs font-semibold">{t("guest.freeToJoin")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary text-xs font-semibold">{t("guest.noCard")}</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-2.5">
                  <Button
                    onClick={goSignUp}
                    className="w-full h-13 gradient-love border-0 text-white font-bold text-base rounded-2xl shadow-[0_0_24px_rgba(180,80,150,0.35)] hover:shadow-[0_0_32px_rgba(180,80,150,0.5)] transition-shadow"
                  >
                    <Heart className="w-5 h-5 mr-2" fill="currentColor" />
                    {t("guest.createAccount")}
                  </Button>
                  <button
                    onClick={goSignIn}
                    className="w-full py-3 text-white/50 hover:text-white/80 text-sm font-medium transition-colors"
                  >
                    {t("guest.haveAccount")} <span className="text-primary underline underline-offset-2">{t("guest.signIn")}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GuestAuthPrompt;
