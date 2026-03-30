import { motion } from "framer-motion";

const GOLD = "#d4af37";
interface Props { onClose: () => void; }

const RULES = [
  { emoji: "🎯", title: "Drop your disc", desc: "Tap any column to drop your disc into the lowest available slot." },
  { emoji: "🔴", title: "Red goes first", desc: "The red player always takes the opening move." },
  { emoji: "4️⃣", title: "Connect Four", desc: "Be the first to line up 4 discs in a row — horizontal, vertical, or diagonal." },
  { emoji: "🚫", title: "Block & Attack", desc: "Watch your opponent's moves. Block their fours while building your own." },
];

export default function Connect4HowToPlay({ onClose }: Props) {
  return (
    <>
      <motion.div key="how-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 200 }} />
      <motion.div key="how-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 340, damping: 32 }} style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", background: "linear-gradient(180deg, #0e0a18, #08060a)", borderRadius: "26px 26px 0 0", borderTop: "1px solid rgba(212,175,55,0.25)", padding: "8px 22px 48px", zIndex: 201, boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: GOLD, opacity: 0.5 }} />
        </div>
        <div style={{ marginBottom: 6 }}>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>How to Play</div>
          <div style={{ color: GOLD, fontSize: 13, fontWeight: 700, marginTop: 2 }}>Connect 4</div>
        </div>
        <div style={{ height: 1, background: `linear-gradient(90deg, ${GOLD}40, ${GOLD}10)`, margin: "16px 0" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {RULES.map(rule => (
            <div key={rule.title} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{rule.emoji}</span>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, marginBottom: 3 }}>{rule.title}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.5 }}>{rule.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 14, padding: "14px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.55 }}>
            <span style={{ color: GOLD, fontWeight: 700 }}>Bot Tip: </span>The centre column is the strongest opening. The bot always tries to play there first.
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onClose} style={{ width: "100%", height: 54, borderRadius: 16, border: "none", background: "linear-gradient(135deg, #92400e, #d4af37, #f0d060)", color: "#000", fontWeight: 900, fontSize: 15, cursor: "pointer", letterSpacing: 0.2 }}>Got it — Let's Play</motion.button>
      </motion.div>
    </>
  );
}
