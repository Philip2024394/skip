import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, MapPin, MessageCircle, X, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logoHeart from "@/assets/logo-heart.png";

interface GuestAuthPromptProps {
  open: boolean;
  onClose: () => void;
  /** What the guest tried to do — determines the headline copy */
  trigger?: "like" | "superlike" | "profile" | "map" | "match" | "filter" | "generic" | "purchase";
}

const TRIGGER_COPY: Record<NonNullable<GuestAuthPromptProps["trigger"]>, { icon: string; title: string; body: string }> = {
  like:      { icon: "💗", title: "Like profiles for free",       body: "Create a free account to like and get matched in seconds." },
  superlike: { icon: "⭐", title: "Super Like to stand out",      body: "Sign up free — Super Like puts you first in their library." },
  profile:   { icon: "👤", title: "See their full profile",       body: "Create a free account to unlock full profiles, photos & voice intros." },
  map:       { icon: "🗺️", title: "Explore the live map",        body: "Sign up free to interact with profiles you find on the map." },
  match:     { icon: "🔥", title: "You've got a match!",          body: "Create a free account to reveal your mutual match." },
  filter:    { icon: "🎛️", title: "Filter by your preferences",  body: "Sign up free to filter by age, city, gender and more." },
  purchase:  { icon: "🔒", title: "Create account to proceed",    body: "Paid features require a free account. Sign up or sign in to continue." },
  generic:   { icon: "✨", title: "Join free — it only takes 30s", body: "Thousands of real profiles are waiting. No credit card needed." },
};

const PERKS = [
  { icon: <Heart className="w-4 h-4 text-primary" fill="currentColor" />,         text: "Unlimited likes & matches" },
  { icon: <Star className="w-4 h-4 text-amber-400" fill="currentColor" />,         text: "Super Like to jump to #1" },
  { icon: <MapPin className="w-4 h-4 text-teal-400" />,                            text: "Live map — find people near you" },
  { icon: <MessageCircle className="w-4 h-4 text-green-400" fill="currentColor" />, text: "Unlock WhatsApp on a match" },
  { icon: <ShieldCheck className="w-4 h-4 text-blue-400" />,                        text: "Private & verified profiles" },
];

const GuestAuthPrompt = ({ open, onClose, trigger = "generic" }: GuestAuthPromptProps) => {
  const navigate = useNavigate();
  const copy = TRIGGER_COPY[trigger];

  const goSignUp  = () => { onClose(); navigate("/auth?register=1"); };
  const goSignIn  = () => { onClose(); navigate("/auth?signin=1"); };

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
                {/* Logo + headline */}
                <div className="flex items-center gap-3">
                  <img src={logoHeart} alt="2DateMe" className="w-12 h-12 object-contain drop-shadow-xl flex-shrink-0" />
                  <div>
                    <p className="text-2xl">{copy.icon}</p>
                    <h2 className="text-white font-display font-bold text-lg leading-tight">{copy.title}</h2>
                    <p className="text-white/50 text-xs mt-0.5">{copy.body}</p>
                  </div>
                </div>

                {/* Perks list */}
                <ul className="space-y-2">
                  {PERKS.map((p, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <span className="flex-shrink-0">{p.icon}</span>
                      <span className="text-white/70 text-sm">{p.text}</span>
                    </li>
                  ))}
                </ul>

                {/* Free badge */}
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2.5">
                  <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-primary text-xs font-semibold">100% Free to Join</span>
                    <span className="text-primary text-xs font-semibold">No Credit Card Required</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-2.5">
                  <Button
                    onClick={goSignUp}
                    className="w-full h-13 gradient-love border-0 text-white font-bold text-base rounded-2xl shadow-[0_0_24px_rgba(180,80,150,0.35)] hover:shadow-[0_0_32px_rgba(180,80,150,0.5)] transition-shadow"
                  >
                    <Heart className="w-5 h-5 mr-2" fill="currentColor" />
                    Create Free Account
                  </Button>
                  <button
                    onClick={goSignIn}
                    className="w-full py-3 text-white/50 hover:text-white/80 text-sm font-medium transition-colors"
                  >
                    Already have an account? <span className="text-primary underline underline-offset-2">Sign in</span>
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
