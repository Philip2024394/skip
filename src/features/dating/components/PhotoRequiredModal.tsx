/**
 * PhotoRequiredModal
 * Shown when a preview-mode user (no photo) tries to like, match, chat or unlock.
 * Frames the policy as a trust promise, not a punishment.
 */
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Camera, X } from "lucide-react";

interface PhotoRequiredModalProps {
  action: "like" | "match" | "chat" | "unlock" | "rose";
  onClose: () => void;
}

const ACTION_COPY: Record<PhotoRequiredModalProps["action"], { verb: string; emoji: string }> = {
  like:    { verb: "like someone",         emoji: "💕" },
  match:   { verb: "match with someone",   emoji: "🎉" },
  chat:    { verb: "open a chat",          emoji: "💬" },
  unlock:  { verb: "unlock contact",       emoji: "🔓" },
  rose:    { verb: "send a rose",          emoji: "🌹" },
};

const TRUST_POINTS = [
  { icon: "🛡️", text: "Every photo is reviewed by our team within 24 hours" },
  { icon: "🚫", text: "Fake accounts and bots are removed before they can match" },
  { icon: "✅", text: "You get a Verified Member badge visible to everyone" },
  { icon: "📈", text: "Profiles with photos get 5× more matches" },
];

export default function PhotoRequiredModal({ action, onClose }: PhotoRequiredModalProps) {
  const navigate = useNavigate();
  const copy = ACTION_COPY[action];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Scrim */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          className="relative w-full max-w-md rounded-t-3xl overflow-hidden"
          style={{ background: `url('https://ik.imagekit.io/dateme/Untitledfdsfsdfdsfsdfg.png?updatedAt=1774981955914') center/cover no-repeat` }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="px-6 pt-7 pb-8 space-y-5">
            {/* Icon + headline */}
            <div className="flex flex-col items-center gap-3 text-center">
              <img
                src="https://ik.imagekit.io/dateme/Smartphone%20capturing%20DSLR%20camera%20flash.png?updatedAt=1775005180680"
                alt=""
                className="w-20 h-20 object-contain drop-shadow-[0_0_16px_rgba(236,72,153,0.4)]"
              />
              <div>
                <h2 className="text-white font-bold text-lg leading-snug">
                  Add your photo to {copy.verb} {copy.emoji}
                </h2>
                <p className="text-white/50 text-sm mt-1 leading-relaxed">
                  2DateMe is a verified-member community. Every person you see here has been reviewed — and we ask the same of you.
                </p>
              </div>
            </div>

            {/* Trust points */}
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {TRUST_POINTS.map((pt, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base flex-shrink-0 mt-0.5">{pt.icon}</span>
                  <p className="text-white/65 text-sm leading-snug">{pt.text}</p>
                </div>
              ))}
            </div>

            {/* What happens next */}
            <div className="flex items-center gap-3 px-1">
              {["Upload photo", "24h review", "Full access + badge"].map((step, i) => (
                <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: i === 0 ? "linear-gradient(135deg,#ec4899,#a855f7)" : "rgba(255,255,255,0.1)" }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-white/40 text-[10px] text-center leading-tight">{step}</p>
                  {i < 2 && (
                    <div className="absolute" style={{ display: "none" }} /> /* spacer */
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => { onClose(); navigate("/welcome?step=4"); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-base transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)", boxShadow: "0 4px 20px rgba(236,72,153,0.35)" }}
            >
              <Camera className="w-5 h-5" />
              Upload My Photo
            </button>

            <p className="text-center text-white/25 text-xs">
              You can keep browsing in preview mode — you just can't interact yet.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
