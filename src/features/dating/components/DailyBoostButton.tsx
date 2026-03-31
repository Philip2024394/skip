import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2 } from "lucide-react";
import { useUserScore } from "@/shared/hooks/useUserScore";
import { toast } from "sonner";

interface Props {
  userId: string;
}

function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function fmtCountdown(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

function fmtExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "expired";
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function DailyBoostButton({ userId }: Props) {
  const { score, claimDailyBoost, refresh } = useUserScore(userId);
  const [claiming, setClaiming] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [boostRemaining, setBoostRemaining] = useState("");

  // Tick countdowns every second
  useEffect(() => {
    const tick = () => {
      if (score?.daily_boost_claimed_today) {
        setCountdown(fmtCountdown(msUntilMidnight()));
      }
      if (score?.boost_expires_at && !score.is_new_user) {
        setBoostRemaining(fmtExpiry(score.boost_expires_at));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [score?.daily_boost_claimed_today, score?.boost_expires_at, score?.is_new_user]);

  if (!score) return null;

  const claimed = score.daily_boost_claimed_today;
  const activeBoost = score.boost_multiplier > 1 && score.boost_expires_at;
  const boostExpired = activeBoost && new Date(score.boost_expires_at!).getTime() <= Date.now();

  const handleClaim = async () => {
    if (claiming || claimed) return;
    setClaiming(true);
    const result = await claimDailyBoost();
    setClaiming(false);
    if (result.success) {
      toast.success("Daily boost activated! 🔥", {
        description: "3× visibility for 30 minutes",
      });
      await refresh();
    } else if (result.reason === "already_claimed") {
      toast.info("Already claimed today — come back tomorrow!");
    } else {
      toast.error("Could not claim boost — try again");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 12,
        background: claimed
          ? "rgba(255,255,255,0.04)"
          : "linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(249,115,22,0.18) 100%)",
        border: claimed
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(251,191,36,0.4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
        {/* Icon */}
        <div
          style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: claimed ? "rgba(255,255,255,0.06)" : "rgba(251,191,36,0.2)",
            border: `1.5px solid ${claimed ? "rgba(255,255,255,0.1)" : "rgba(251,191,36,0.5)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <AnimatePresence mode="wait">
            {claimed ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <CheckCircle2 size={18} color="rgba(255,255,255,0.4)" />
              </motion.div>
            ) : (
              <motion.div
                key="zap"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
              >
                <Zap size={18} color="#fbbf24" fill="#fbbf24" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: claimed ? "rgba(255,255,255,0.35)" : "white" }}>
            {claimed ? "Daily boost claimed ✓" : "Claim free daily boost"}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 10, color: claimed ? "rgba(255,255,255,0.25)" : "rgba(251,191,36,0.8)" }}>
            {claimed
              ? `Resets in ${countdown}`
              : activeBoost && !boostExpired
              ? `Active — ${boostRemaining} left (${score.boost_multiplier}×)`
              : "3× visibility · 30 min · free every day"}
          </p>
        </div>

        {/* Button */}
        {!claimed && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handleClaim}
            disabled={claiming}
            style={{
              padding: "7px 14px", borderRadius: 20, flexShrink: 0,
              background: claiming ? "rgba(251,191,36,0.15)" : "rgba(251,191,36,0.25)",
              border: "1.5px solid rgba(251,191,36,0.6)",
              color: "#fbbf24", fontSize: 11, fontWeight: 800, cursor: claiming ? "default" : "pointer",
            }}
          >
            {claiming ? "…" : "Boost!"}
          </motion.button>
        )}
      </div>

      {/* Active boost glow bar */}
      <AnimatePresence>
        {activeBoost && !boostExpired && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            style={{
              height: 2,
              background: "linear-gradient(90deg, #fbbf24, #f97316)",
              transformOrigin: "left",
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
