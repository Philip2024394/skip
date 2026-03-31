import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flame, TrendingUp, ChevronUp, Star } from "lucide-react";
import { useUserScore, UserScore } from "@/shared/hooks/useUserScore";
import { useState } from "react";

const LABEL_COLORS: Record<UserScore["score_label"], { ring: string; glow: string; text: string }> = {
  Rising:   { ring: "#60a5fa", glow: "rgba(96,165,250,0.35)",  text: "#93c5fd" },
  Active:   { ring: "#34d399", glow: "rgba(52,211,153,0.35)",  text: "#6ee7b7" },
  Popular:  { ring: "#a78bfa", glow: "rgba(167,139,250,0.35)", text: "#c4b5fd" },
  Hot:      { ring: "#fb923c", glow: "rgba(251,146,60,0.4)",   text: "#fdba74" },
  "On Fire":{ ring: "#ef4444", glow: "rgba(239,68,68,0.45)",   text: "#fca5a5" },
};

const LABEL_ICONS: Record<UserScore["score_label"], React.ReactNode> = {
  Rising:    <TrendingUp size={11} />,
  Active:    <ChevronUp size={11} />,
  Popular:   <Star size={11} />,
  Hot:       <Flame size={11} />,
  "On Fire": <Flame size={11} />,
};

interface Props {
  userId: string;
  onBoostPress?: () => void;
  size?: number;
}

const CIRCUMFERENCE = 2 * Math.PI * 16; // r=16

export default function ScoreRing({ userId, onBoostPress, size = 72 }: Props) {
  const { score, loading } = useUserScore(userId);
  const [showTip, setShowTip] = useState(false);

  if (loading || !score) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />
    );
  }

  const colors = LABEL_COLORS[score.score_label];
  const pct = score.score_percent / 100; // 0–1
  const strokeDash = pct * CIRCUMFERENCE;
  const svgSize = 40; // internal SVG units, scaled by CSS

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <motion.div
        whileTap={{ scale: 0.93 }}
        onClick={() => { setShowTip(p => !p); onBoostPress?.(); }}
        style={{
          width: size, height: size, cursor: "pointer", position: "relative",
          filter: `drop-shadow(0 0 ${Math.round(size * 0.1)}px ${colors.glow})`,
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${svgSize} ${svgSize}`} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx={20} cy={20} r={16} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
          {/* Progress */}
          <motion.circle
            cx={20} cy={20} r={16} fill="none"
            stroke={colors.ring}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: CIRCUMFERENCE - strokeDash }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>

        {/* Center label */}
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
        }}>
          <span style={{ fontSize: Math.round(size * 0.22), fontWeight: 900, color: colors.text, lineHeight: 1 }}>
            {score.score_percent}
          </span>
          <span style={{ fontSize: Math.round(size * 0.12), color: "rgba(255,255,255,0.35)", lineHeight: 1 }}>
            /100
          </span>
        </div>

        {/* Active boost indicator */}
        {score.boost_multiplier > 1 && (
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            style={{
              position: "absolute", bottom: -2, right: -2,
              width: Math.round(size * 0.32), height: Math.round(size * 0.32),
              borderRadius: "50%",
              background: "linear-gradient(135deg, #fbbf24, #f97316)",
              border: "2px solid #0f0f23",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Zap size={Math.round(size * 0.14)} color="white" fill="white" />
          </motion.div>
        )}
      </motion.div>

      {/* Label badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.0 }}
        style={{
          position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 3,
          padding: "2px 7px", borderRadius: 10,
          background: `rgba(${colors.ring.match(/\d+/g)?.slice(0,3).join(",") ?? "255,255,255"}, 0.15)`,
          border: `1px solid ${colors.ring}55`,
          color: colors.text, fontSize: 9, fontWeight: 800, whiteSpace: "nowrap",
        }}
      >
        {LABEL_ICONS[score.score_label]}
        {score.score_label}
      </motion.div>

      {/* Tooltip on tap */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            style={{
              position: "absolute", top: size + 18, left: "50%", transform: "translateX(-50%)",
              width: 200, zIndex: 100,
              background: "#1a1a2e",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}
          >
            <p style={{ margin: "0 0 8px", color: "white", fontSize: 11, fontWeight: 800 }}>
              Your Attractiveness Score
            </p>
            {[
              { label: "Desirability", val: score.desirability, color: "#f87171" },
              { label: "Activity",     val: score.activity,     color: "#fbbf24" },
              { label: "Profile",      val: score.profile_quality, color: "#a78bfa" },
              { label: "Chat",         val: score.chat_score,   color: "#34d399" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ marginBottom: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)" }}>{label}</span>
                  <span style={{ fontSize: 9, color, fontWeight: 800 }}>{Math.round(val * 100)}</span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${val * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    style={{ height: "100%", borderRadius: 2, background: color }}
                  />
                </div>
              </div>
            ))}
            {score.boost_multiplier > 1 && (
              <p style={{ margin: "8px 0 0", fontSize: 9, color: "#fbbf24", fontWeight: 800 }}>
                ⚡ {score.boost_multiplier}× boost active
              </p>
            )}
            <button
              onClick={() => setShowTip(false)}
              style={{ position: "absolute", top: 6, right: 8, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 12 }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
