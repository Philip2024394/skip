import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, Sparkles, X } from "lucide-react";

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

// ─── Star particle background ──────────────────────────────────────────────
function StarParticles() {
  const particles = useRef(
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      left: 5 + Math.random() * 90,
      top: 5 + Math.random() * 90,
      delay: Math.random() * 3,
      duration: 1.5 + Math.random() * 2,
      emoji: ["✨", "⭐", "💫", "🌟"][Math.floor(Math.random() * 4)],
      size: 10 + Math.random() * 14,
    }))
  ).current;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, repeatDelay: Math.random() * 2 }}
          style={{ position: "absolute", left: `${p.left}%`, top: `${p.top}%`, fontSize: p.size }}
        >
          {p.emoji}
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
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 20px",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
      >
        <StarParticles />

        <motion.div
          initial={{ scale: 0.75, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{
            position: "relative",
            width: "100%", maxWidth: 340,
            borderRadius: 30,
            overflow: "hidden",
            background: "rgba(4,0,16,0.97)",
            border: "1.5px solid rgba(195,60,255,0.45)",
            boxShadow: "0 0 55px rgba(195,60,255,0.3), 0 0 110px rgba(232,72,199,0.15)",
            paddingBottom: 26,
            textAlign: "center",
          }}
        >
          {/* glow bg */}
          <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse at 50% 30%, rgba(195,60,255,0.18) 0%, transparent 65%)" }} />

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            style={{ position: "absolute", top: 14, right: 14, zIndex: 20,
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "rgba(255,255,255,0.5)" }}
          >
            <X size={14} />
          </button>

          {/* Header */}
          <div style={{ position: "relative", zIndex: 10, padding: "22px 24px 0" }}>
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}
            >
              <Sparkles size={16} style={{ color: "#e848c7" }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2,
                textTransform: "uppercase", color: "rgba(232,72,199,0.85)" }}>
                Daily Match
              </span>
              <Sparkles size={16} style={{ color: "#e848c7" }} />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              style={{ margin: "0 0 18px", fontSize: 20, fontWeight: 900,
                background: "linear-gradient(135deg, #ff6eb4, #e848c7, #c060ff)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
            >
              We found someone for you ✨
            </motion.h2>
          </div>

          {/* Profile image — tall card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 240, damping: 18 }}
            style={{ position: "relative", zIndex: 10, margin: "0 18px", borderRadius: 20, overflow: "hidden",
              height: 200, background: "#0a0018" }}
          >
            <img
              src={avatar}
              alt={name}
              onLoad={() => setImgLoaded(true)}
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              style={{ width: "100%", height: "100%", objectFit: "cover",
                opacity: imgLoaded ? 1 : 0, transition: "opacity 0.3s" }}
            />

            {/* Bottom gradient on image */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(4,0,16,0.9) 0%, transparent 55%)" }} />

            {/* Name + location on image */}
            <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff" }}>{name}{age}</p>
              {city && (
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.6)",
                  display: "flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={10} /> {city}
                </p>
              )}
            </div>

            {/* Compatibility badge */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
              style={{ position: "absolute", top: 10, right: 10,
                background: "linear-gradient(135deg, #e848c7, #c060ff)",
                borderRadius: 12, padding: "4px 10px", fontSize: 10, fontWeight: 800,
                color: "#fff", boxShadow: "0 2px 12px rgba(232,72,199,0.5)" }}
            >
              ✨ 94% Match
            </motion.div>
          </motion.div>

          {/* Bio */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ position: "relative", zIndex: 10,
              color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.55,
              margin: "12px 24px 6px", fontStyle: "italic" }}
          >
            "{bio.length > 80 ? bio.slice(0, 80) + "…" : bio}"
          </motion.p>

          {/* Sentiment */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            style={{ position: "relative", zIndex: 10,
              color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: 700,
              margin: "8px 20px 18px", lineHeight: 1.5 }}
          >
            Connect while the feelings are{" "}
            <span style={{ color: "#e848c7" }}>fresh and energized</span> 💫
          </motion.p>

          {/* Pulsing heart divider */}
          {pulse && (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 0.85, ease: "easeInOut" }}
              style={{ position: "relative", zIndex: 10, marginBottom: 16,
                display: "flex", justifyContent: "center" }}
            >
              <Heart size={22} style={{ color: "#e848c7" }} fill="#e848c7" />
            </motion.div>
          )}

          {/* Buttons */}
          <div style={{ position: "relative", zIndex: 10, display: "flex", gap: 10, padding: "0 20px" }}>
            <button
              onClick={onDismiss}
              style={{ flex: 1, padding: "11px 0", borderRadius: 18, fontSize: 12, fontWeight: 700,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
            >
              Skip Today
            </button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onConnect(profile)}
              style={{ flex: 2, padding: "11px 0", borderRadius: 18, fontSize: 13, fontWeight: 900,
                background: "linear-gradient(135deg, #e848c7, #c060ff)",
                border: "none", color: "#fff", cursor: "pointer",
                boxShadow: "0 4px 20px rgba(232,72,199,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Heart size={14} fill="currentColor" /> Connect Now
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
