import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, Sparkles } from "lucide-react";

interface DailyMatchSuggestionProps {
  profile: any;
  onConnect: (profile: any) => void;
  onDismiss: () => void;
}

const DAILY_KEY = "2dateme_daily_match_date";

/** Returns true if the daily match popup should show (once per calendar day). */
export function shouldShowDailyMatch(): boolean {
  try {
    const stored = localStorage.getItem(DAILY_KEY);
    const today = new Date().toDateString();
    return stored !== today;
  } catch {
    return false;
  }
}

/** Mark today's daily match as shown. */
export function markDailyMatchShown(): void {
  try {
    localStorage.setItem(DAILY_KEY, new Date().toDateString());
  } catch {}
}

// ─── Floating hearts ────────────────────────────────────────────────────────
function FloatingHearts() {
  const hearts = useRef(
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: 5 + Math.random() * 90,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
      size: 8 + Math.random() * 10,
    }))
  ).current;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {hearts.map((h) => (
        <motion.span
          key={h.id}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.7, 0], y: -120 }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, repeatDelay: Math.random() * 2 }}
          style={{ position: "absolute", left: `${h.left}%`, bottom: 20, fontSize: h.size, color: "#e848c7" }}
        >
          ♥
        </motion.span>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function DailyMatchSuggestion({ profile, onConnect, onDismiss }: DailyMatchSuggestionProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 600);
    return () => clearTimeout(t);
  }, []);

  const avatar = profile?.avatar_url || profile?.image || "/placeholder.svg";
  const name = profile?.name || "Mystery";
  const age = profile?.age ? `, ${profile.age}` : "";
  const city = profile?.city || profile?.location || "";
  const bio = profile?.bio || "Looking for a genuine connection 💫";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          position: "fixed", inset: 0, zIndex: 295,
          background: "rgba(4,0,16,0.88)",
          backdropFilter: "blur(18px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 20px",
        }}
      >
        <FloatingHearts />

        <motion.div
          initial={{ scale: 0.78, opacity: 0, y: 48 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          style={{
            position: "relative",
            width: "100%", maxWidth: 340,
            borderRadius: 28,
            overflow: "hidden",
            background: "linear-gradient(145deg, rgba(10,0,24,0.98) 0%, rgba(20,4,40,0.98) 100%)",
            border: "1.5px solid rgba(232,72,199,0.4)",
            boxShadow: "0 0 0 1px rgba(139,92,246,0.15), 0 8px 40px rgba(232,72,199,0.25), 0 0 80px rgba(139,92,246,0.12)",
            paddingBottom: 24,
            textAlign: "center",
          }}
        >
          {/* App-theme radial glow */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse at 50% 20%, rgba(232,72,199,0.14) 0%, rgba(139,92,246,0.08) 45%, transparent 70%)",
          }} />

          {/* Top accent bar — matches app gradient */}
          <div style={{
            height: 3, width: "100%",
            background: "linear-gradient(90deg, #ec4899, #a855f7, #ec4899)",
          }} />

          {/* Header */}
          <div style={{ position: "relative", zIndex: 10, padding: "18px 24px 0" }}>
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}
            >
              <Sparkles size={14} style={{ color: "#e848c7" }} />
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "rgba(232,72,199,0.9)",
              }}>
                Daily Match
              </span>
              <Sparkles size={14} style={{ color: "#e848c7" }} />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              style={{
                margin: "0 0 16px", fontSize: 18, fontWeight: 900,
                background: "linear-gradient(135deg, #f472b6, #e848c7, #a855f7)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}
            >
              Someone new for you today ✨
            </motion.h2>
          </div>

          {/* Profile image */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 240, damping: 18 }}
            style={{
              position: "relative", zIndex: 10, margin: "0 16px",
              borderRadius: 18, overflow: "hidden", height: 210,
              background: "#0a0018",
              border: "1px solid rgba(232,72,199,0.25)",
            }}
          >
            <img
              src={avatar}
              alt={name}
              onLoad={() => setImgLoaded(true)}
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: imgLoaded ? 1 : 0, transition: "opacity 0.3s" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(4,0,16,0.92) 0%, transparent 55%)" }} />

            {/* Name + city */}
            <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#fff" }}>{name}{age}</p>
              {city && (
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={10} /> {city}
                </p>
              )}
            </div>

            {/* New badge */}
            <div style={{
              position: "absolute", top: 10, right: 10,
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
              borderRadius: 10, padding: "3px 9px", fontSize: 9, fontWeight: 800,
              color: "#fff", boxShadow: "0 2px 10px rgba(232,72,199,0.45)",
            }}>
              🌟 New Today
            </div>
          </motion.div>

          {/* Bio */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              position: "relative", zIndex: 10,
              color: "rgba(255,255,255,0.55)", fontSize: 11, lineHeight: 1.55,
              margin: "10px 22px 4px", fontStyle: "italic",
            }}
          >
            "{bio.length > 80 ? bio.slice(0, 80) + "…" : bio}"
          </motion.p>

          {/* Like-first hint */}
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            style={{
              position: "relative", zIndex: 10,
              color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 600,
              margin: "6px 20px 14px", lineHeight: 1.5,
            }}
          >
            Like to show interest — when you{" "}
            <span style={{ color: "#e848c7" }}>both like each other</span>
            {" "}you can unlock WhatsApp contact 💬
          </motion.p>

          {/* Pulsing heart */}
          {pulse && (
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
              style={{ position: "relative", zIndex: 10, marginBottom: 14, display: "flex", justifyContent: "center" }}
            >
              <Heart size={20} style={{ color: "#e848c7" }} fill="#e848c7" />
            </motion.div>
          )}

          {/* Buttons */}
          <div style={{ position: "relative", zIndex: 10, display: "flex", gap: 10, padding: "0 18px" }}>
            <button
              onClick={onDismiss}
              style={{
                flex: 1, padding: "11px 0", borderRadius: 16, fontSize: 12, fontWeight: 700,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.45)", cursor: "pointer",
              }}
            >
              Skip Today
            </button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onConnect(profile)}
              style={{
                flex: 2, padding: "11px 0", borderRadius: 16, fontSize: 13, fontWeight: 900,
                background: "linear-gradient(135deg, #ec4899, #a855f7)",
                border: "none", color: "#fff", cursor: "pointer",
                boxShadow: "0 4px 18px rgba(232,72,199,0.45)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Heart size={14} fill="currentColor" /> Like
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
