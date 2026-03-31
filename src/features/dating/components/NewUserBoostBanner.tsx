import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useUserScore } from "@/shared/hooks/useUserScore";

interface Props {
  userId: string;
}

function fmtExpiry(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  const s = Math.floor((diff % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function NewUserBoostBanner({ userId }: Props) {
  const { score } = useUserScore(userId);
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!score?.new_user_boost_expires_at) return;
    const tick = () => setTimeLeft(fmtExpiry(score.new_user_boost_expires_at!));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [score?.new_user_boost_expires_at]);

  const show =
    !dismissed &&
    score?.is_new_user &&
    score.new_user_boost_expires_at &&
    new Date(score.new_user_boost_expires_at).getTime() > Date.now();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          style={{
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(168,85,247,0.22) 0%, rgba(59,130,246,0.18) 100%)",
            border: "1px solid rgba(168,85,247,0.45)",
            padding: "11px 14px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* Sparkle icon */}
          <motion.div
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "rgba(168,85,247,0.25)",
              border: "1.5px solid rgba(168,85,247,0.55)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Sparkles size={16} color="#c084fc" fill="#c084fc" />
          </motion.div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "white" }}>
              5× New User Boost active! 🚀
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(192,132,252,0.85)" }}>
              Your profile is shown to 5× more people — expires in{" "}
              <strong style={{ color: "#c084fc" }}>{timeLeft}</strong>
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 4, flexShrink: 0, color: "rgba(255,255,255,0.3)",
              display: "flex", alignItems: "center",
            }}
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
