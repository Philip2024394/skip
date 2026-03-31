import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CityStatus } from "@/shared/hooks/useCityLaunch";

interface Props {
  status: CityStatus;
  onInvite: () => void;
  justWentLive?: boolean;
}

export default function CityProgressBanner({ status, onInvite, justWentLive }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [showLiveCelebration, setShowLiveCelebration] = useState(justWentLive ?? false);

  if (dismissed && !status.is_live) return null;

  // ── City just went live ────────────────────────────────────────────────────
  if (showLiveCelebration) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{
            margin: "8px 14px",
            borderRadius: 16,
            overflow: "hidden",
            background: "linear-gradient(135deg,#c2185b,#e91e8c,#a855f7)",
            boxShadow: "0 4px 24px rgba(194,24,91,0.5)",
            padding: "16px",
            position: "relative",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6 }}
              style={{ fontSize: 36, marginBottom: 8 }}
            >
              🎉
            </motion.div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "white", marginBottom: 4 }}>
              {status.city} just went live!
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 12, lineHeight: 1.5 }}>
              {status.member_count} people in your city are now live.
              Your local feed is ready.
            </div>
            {status.is_pioneer && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(0,0,0,0.25)", borderRadius: 50,
                padding: "5px 14px", marginBottom: 12,
                fontSize: 11, fontWeight: 800, color: "white",
              }}>
                🏆 You're a Founding Member of {status.city}
              </div>
            )}
            <button
              onClick={() => setShowLiveCelebration(false)}
              style={{
                display: "block", width: "100%", padding: "11px",
                borderRadius: 50, background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              See my city feed →
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── City already live — compact live badge ─────────────────────────────────
  if (status.is_live) {
    return (
      <div style={{
        margin: "4px 14px",
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px", borderRadius: 50,
        background: "rgba(34,197,94,0.1)",
        border: "1px solid rgba(34,197,94,0.3)",
      }}>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }}
        />
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(34,197,94,0.9)" }}>
          {status.city} is live
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>
          {status.member_count.toLocaleString()} members
        </span>
        {status.is_pioneer && (
          <span style={{
            fontSize: 9, fontWeight: 800, color: "#fbbf24",
            background: "rgba(251,191,36,0.15)", borderRadius: 50,
            padding: "2px 8px", border: "1px solid rgba(251,191,36,0.3)",
          }}>
            🏆 Founder
          </span>
        )}
      </div>
    );
  }

  // ── City not yet live — progress banner ────────────────────────────────────
  const pct = Math.round(status.progress * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        margin: "4px 14px",
        borderRadius: 16,
        overflow: "hidden",
        background: "rgba(0,0,0,0.55)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div style={{ padding: "12px 14px" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 14 }}>🌍</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "white", lineHeight: 1 }}>
                {status.city}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                Currently on global feed
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {status.is_pioneer && (
              <span style={{
                fontSize: 8, fontWeight: 800, color: "#fbbf24",
                background: "rgba(251,191,36,0.15)", borderRadius: 50,
                padding: "2px 8px", border: "1px solid rgba(251,191,36,0.25)",
              }}>
                🏆 PIONEER
              </span>
            )}
            <button
              onClick={() => setDismissed(true)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 0 }}
            >×</button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              height: "100%", borderRadius: 99,
              background: "linear-gradient(90deg,#c2185b,#e91e8c,#a855f7)",
              boxShadow: "0 0 8px rgba(194,24,91,0.6)",
            }}
          />
        </div>

        {/* Count row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
            <strong style={{ color: "white" }}>{status.member_count.toLocaleString()}</strong>
            {" "}/ {status.threshold.toLocaleString()} members
          </span>
          <span style={{ fontSize: 10, color: "rgba(194,24,91,0.8)", fontWeight: 700 }}>
            {status.remaining.toLocaleString()} to go · {pct}%
          </span>
        </div>

        {/* Invite CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onInvite}
          style={{
            width: "100%", padding: "10px",
            borderRadius: 50,
            background: "linear-gradient(135deg,#c2185b,#e91e8c)",
            border: "none", color: "white", fontSize: 12, fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 3px 16px rgba(194,24,91,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <span>💌</span>
          <span>Invite friends — earn 🪙50 per signup</span>
        </motion.button>

      </div>
    </motion.div>
  );
}
