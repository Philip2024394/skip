import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
}

const RULES = [
  { icon: "🎯", title: "Drop your disc", desc: "Tap any column to drop your coloured disc into the board." },
  { icon: "🔴", title: "Red goes first", desc: "Red player always takes the first turn." },
  { icon: "4️⃣", title: "Connect Four", desc: "Line up 4 discs horizontally, vertically, or diagonally." },
  { icon: "🏆", title: "First to four wins", desc: "Block your opponent and plan ahead to claim victory." },
];

export default function Connect4HowToPlay({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="how-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <motion.div
            key="how-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              background: "linear-gradient(180deg, #0e0a18 0%, #08060a 100%)",
              borderTop: "1px solid rgba(212,175,55,0.2)",
              borderRadius: "26px 26px 0 0",
              padding: "8px 22px max(48px,env(safe-area-inset-bottom,48px))",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 8, paddingBottom: 18 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(212,175,55,0.35)" }} />
            </div>

            {/* Title */}
            <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginBottom: 12 }}>
              How to Play
            </div>

            {/* Gold divider */}
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #d4af37, transparent)", marginBottom: 20 }} />

            {/* Rules */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {RULES.map(r => (
                <div key={r.title} style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  background: "rgba(255,255,255,0.04)", borderRadius: 14,
                  padding: "12px 14px",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{r.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "white", marginBottom: 2 }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.55 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tip box */}
            <div style={{
              background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)",
              borderRadius: 14, padding: "12px 14px", marginBottom: 22,
              fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6,
            }}>
              💡 Playing vs Bot? It thinks 2 moves ahead. Start in the centre column for the best advantage.
            </div>

            {/* Close */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              style={{
                width: "100%", height: 52, borderRadius: 16, border: "none",
                background: "linear-gradient(135deg, #92400e, #d4af37, #f0d060)",
                color: "#000", fontWeight: 900, fontSize: 15, cursor: "pointer",
                boxShadow: "0 4px 20px rgba(212,175,55,0.35)",
              }}
            >
              Got it — Let's Play
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
