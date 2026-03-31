import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Coins } from "lucide-react";
import { FrustrationTrigger } from "@/shared/hooks/useFrustrationDetector";

interface Props {
  open: boolean;
  trigger: FrustrationTrigger | null;
  swipeCount?: number;
  onBuyCoins: () => void;
  onBoost: () => void;
  onDismiss: () => void;
}

const COPY: Record<FrustrationTrigger, { headline: string; sub: string; emoji: string }> = {
  swipes_no_match: {
    headline: "Not getting matches?",
    sub: "Boost your profile — get seen by 8× more people in your area right now.",
    emoji: "😤",
  },
  low_balance: {
    headline: "Coins running low",
    sub: "Grab more coins to reveal who liked you and keep the conversation going.",
    emoji: "🪙",
  },
  vault_peek: {
    headline: "Someone liked you!",
    sub: "You don't have enough coins to reveal who it is. Get coins now.",
    emoji: "💝",
  },
};

export default function FrustrationModal({ open, trigger, swipeCount, onBuyCoins, onBoost, onDismiss }: Props) {
  const copy = trigger ? COPY[trigger] : COPY.swipes_no_match;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            style={{
              position: "fixed", inset: 0, zIndex: 999,
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000,
              background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
              borderRadius: "20px 20px 0 0",
              padding: "20px 20px 36px",
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            {/* Drag handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 18px" }} />

            {/* Dismiss */}
            <button
              onClick={onDismiss}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", padding: 4 }}
            >
              <X size={18} color="rgba(255,255,255,0.4)" />
            </button>

            {/* Emoji */}
            <div style={{ textAlign: "center", fontSize: 48, marginBottom: 12 }}>{copy.emoji}</div>

            {/* Headline */}
            <h2 style={{ textAlign: "center", color: "white", fontSize: 20, fontWeight: 900, margin: "0 0 8px" }}>
              {copy.headline}
            </h2>
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 24px", lineHeight: 1.5 }}>
              {copy.sub}
            </p>

            {/* Stats (only for swipes trigger) */}
            {trigger === "swipes_no_match" && swipeCount && (
              <div style={{
                display: "flex", justifyContent: "center", gap: 20, marginBottom: 20,
                padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, color: "rgba(251,191,36,0.9)", fontSize: 22, fontWeight: 900 }}>{swipeCount}</p>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 10 }}>swipes</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, color: "rgba(239,68,68,0.9)", fontSize: 22, fontWeight: 900 }}>0</p>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 10 }}>matches</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, color: "rgba(168,85,247,0.9)", fontSize: 22, fontWeight: 900 }}>8×</p>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 10 }}>with boost</p>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Primary: Boost */}
              {trigger === "swipes_no_match" && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onBoost(); onDismiss(); }}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 14,
                    background: "linear-gradient(135deg, #fbbf24, #f97316)",
                    border: "none", color: "white", fontSize: 14, fontWeight: 900,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <Zap size={16} fill="white" />
                  Activate Boost — 50 coins
                </motion.button>
              )}

              {/* Primary: Buy coins */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { onBuyCoins(); onDismiss(); }}
                style={{
                  width: "100%", padding: "14px", borderRadius: 14,
                  background: trigger === "swipes_no_match"
                    ? "rgba(251,191,36,0.12)"
                    : "linear-gradient(135deg, #fbbf24, #f97316)",
                  border: trigger === "swipes_no_match" ? "1.5px solid rgba(251,191,36,0.35)" : "none",
                  color: trigger === "swipes_no_match" ? "#fbbf24" : "white",
                  fontSize: 14, fontWeight: 900, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Coins size={16} />
                Get Coins
              </motion.button>

              {/* Social proof */}
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "4px 0 0" }}>
                🔥 {Math.floor(Math.random() * 200 + 300)} people boosted their profile today
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
