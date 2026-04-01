import { motion, AnimatePresence } from "framer-motion";
import { Lock, Coins, Clock } from "lucide-react";

interface Props {
  open: boolean;
  swipesLeft: number;
  coinsBalance: number;
  coinsPerRefill: number;
  swipesPerRefill: number;
  refilling: boolean;
  canRefillWithCoins: boolean;
  onRefill: () => void;
  onBuyCoins: () => void;
}

function msUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function SwipeLockOverlay({
  open, swipesLeft, coinsBalance, coinsPerRefill, swipesPerRefill,
  refilling, canRefillWithCoins, onRefill, onBuyCoins,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Frosted backdrop over swipe area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, zIndex: 80,
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(10px)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 16, padding: "0 24px",
            }}
          >
            {/* Lock icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
              style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "rgba(251,191,36,0.18)",
                border: "2px solid rgba(251,191,36,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Lock size={32} color="#fbbf24" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ textAlign: "center" }}
            >
              <h2 style={{ color: "white", fontSize: 20, fontWeight: 900, margin: "0 0 6px" }}>
                Daily swipes used up!
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                You've used all 50 free swipes today.{"\n"}Unlock more with coins or come back tomorrow.
              </p>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                display: "flex", gap: 20,
                padding: "10px 20px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, color: "#fbbf24", fontSize: 20, fontWeight: 900 }}>{coinsBalance}</p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 10 }}>🪙 coins</p>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, color: "white", fontSize: 20, fontWeight: 900 }}>{swipesPerRefill}</p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 10 }}>per refill</p>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, color: "#34d399", fontSize: 14, fontWeight: 900 }}>{msUntilMidnight()}</p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 10 }}>free reset</p>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300 }}
            >
              {/* Refill with coins */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onRefill}
                disabled={!canRefillWithCoins || refilling}
                style={{
                  width: "100%", padding: "13px",
                  borderRadius: 14,
                  background: canRefillWithCoins
                    ? "linear-gradient(135deg, #fbbf24, #f97316)"
                    : "rgba(255,255,255,0.08)",
                  border: "none",
                  color: canRefillWithCoins ? "white" : "rgba(255,255,255,0.3)",
                  fontSize: 14, fontWeight: 900, cursor: canRefillWithCoins ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Coins size={16} />
                {refilling ? "Unlocking…" : `+${swipesPerRefill} swipes — ${coinsPerRefill} coins`}
              </motion.button>

              {/* Buy more coins */}
              {!canRefillWithCoins && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onBuyCoins}
                  style={{
                    width: "100%", padding: "13px",
                    borderRadius: 14,
                    background: "rgba(251,191,36,0.15)",
                    border: "1.5px solid rgba(251,191,36,0.4)",
                    color: "#fbbf24",
                    fontSize: 14, fontWeight: 900, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <Coins size={16} />
                  Get Coins
                </motion.button>
              )}

              {/* Reset timer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Clock size={12} color="rgba(255,255,255,0.3)" />
                <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                  50 free swipes reset in {msUntilMidnight()}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
