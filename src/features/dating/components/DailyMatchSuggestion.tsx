import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, Sparkles } from "lucide-react";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import { isMockCurrentlyOnline } from "@/shared/utils/mockOnlineSchedule";

function checkOnline(profile: any): boolean {
  if (!profile) return false;
  if (profile.is_mock && profile.mock_online_hours > 0)
    return isMockCurrentlyOnline(profile.id, profile.country ?? "Indonesia", profile.mock_online_hours, profile.mock_offline_days);
  return isOnline(profile.last_seen_at);
}

interface DailyMatchSuggestionProps {
  profile: any;
  onConnect: (profile: any) => void;
  onDismiss: () => void;
}

const DAILY_KEY = "2dateme_daily_match_date";

export function shouldShowDailyMatch(): boolean {
  try {
    const stored = localStorage.getItem(DAILY_KEY);
    const today = new Date().toDateString();
    return stored !== today;
  } catch {
    return false;
  }
}

export function markDailyMatchShown(): void {
  try {
    localStorage.setItem(DAILY_KEY, new Date().toDateString());
  } catch {}
}

// ─── Generate deterministic "why" reasons from profile data ─────────────────
function generateMatchReasons(profile: any): string[] {
  const rg = profile?.relationship_goals || {};
  const li = profile?.lifestyle_info || {};
  const bi = profile?.basic_info || {};
  const reasons: string[] = [];

  if (rg.looking_for)
    reasons.push(`Both looking for ${rg.looking_for} — strong alignment`);
  if (li.hobbies?.length >= 2)
    reasons.push(`Shares your interest in ${li.hobbies.slice(0, 2).join(" & ")}`);
  if (rg.religion)
    reasons.push(`Matching values around ${rg.religion} lifestyle`);
  if (bi.languages?.length > 1)
    reasons.push(`Speaks ${bi.languages.slice(0, 2).join(" & ")} like you`);
  if (profile?.no_drama)
    reasons.push("Values honest, drama-free connection — just like you");
  if (profile?.available_tonight)
    reasons.push("Active and available — perfect timing to connect");
  if (rg.date_type)
    reasons.push(`Prefers ${rg.date_type} — matches your ideal date style`);
  if (rg.timeline)
    reasons.push(`Same relationship timeline: ${rg.timeline}`);
  if (li.love_language)
    reasons.push(`Love language: ${li.love_language} — compatible with yours`);
  if (profile?.is_verified)
    reasons.push("Verified profile — genuine and trusted member");

  const fallbacks = [
    "High compatibility score based on your profile",
    "Active member genuinely looking to connect",
    "Handpicked by the 2DateMe algorithm today",
    "Similar lifestyle and relationship goals",
    "Strong values alignment detected",
  ];

  const seen = new Set(reasons);
  for (const fb of fallbacks) {
    if (reasons.length >= 3) break;
    if (!seen.has(fb)) { reasons.push(fb); seen.add(fb); }
  }

  return reasons.slice(0, 3);
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

// ─── Main Component ──────────────────────────────────────────────────────────
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
  const city = profile?.city || profile?.location || "Indonesia";
  const bio = profile?.bio || "Looking for a genuine connection 💫";
  const reasons = generateMatchReasons(profile);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          position: "fixed", inset: 0, zIndex: 295,
          background: "rgba(0,0,0,0.52)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 20px",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
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
            background: "rgba(12,12,18,0.72)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            border: "1px solid rgba(255,255,255,0.10)",
            paddingBottom: 22,
          }}
        >
          {/* Pink top accent bar */}
          <div style={{ height: 3, width: "100%", background: "linear-gradient(90deg, #ec4899, #f472b6, #ec4899)" }} />

          {/* Header */}
          <div style={{ position: "relative", zIndex: 10, padding: "16px 20px 0", textAlign: "center" }}>
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}
            >
              <Sparkles size={13} style={{ color: "#e848c7" }} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(236,72,153,0.9)" }}>
                Daily Match
              </span>
              <Sparkles size={13} style={{ color: "#e848c7" }} />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 900, color: "#fff" }}
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
              borderRadius: 16, overflow: "hidden", height: 190,
              border: "1px solid rgba(236,72,153,0.2)",
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

            <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#fff" }}>{name}{age}</p>
                {checkOnline(profile) && (
                  <span style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 8px rgba(34,197,94,0.9)",
                    animation: "heartbeat 1.4s ease-in-out infinite",
                    display: "inline-block", flexShrink: 0,
                  }} />
                )}
              </div>
              {city && (
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={10} /> {city}
                </p>
              )}
            </div>

            <div style={{
              position: "absolute", top: 10, right: 10,
              background: "linear-gradient(135deg, #ec4899, #f472b6)",
              borderRadius: 10, padding: "3px 9px", fontSize: 9, fontWeight: 800,
              color: "#fff", boxShadow: "0 2px 10px rgba(236,72,199,0.45)",
            }}>
              🌟 Today's Pick
            </div>
          </motion.div>

          {/* Why this match — bullet points */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            style={{
              position: "relative", zIndex: 10,
              margin: "12px 18px 0",
              background: "rgba(236,72,153,0.06)",
              border: "1px solid rgba(236,72,153,0.18)",
              borderRadius: 12, padding: "10px 12px",
            }}
          >
            <p style={{ color: "rgba(236,72,153,0.9)", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 7px" }}>
              ✦ Why you match
            </p>
            {reasons.map((reason, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: i < reasons.length - 1 ? 5 : 0 }}>
                <span style={{ color: "#ec4899", fontSize: 10, lineHeight: "16px", flexShrink: 0 }}>•</span>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, lineHeight: 1.45, fontWeight: 500 }}>{reason}</span>
              </div>
            ))}
          </motion.div>

          {/* Bio */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.34 }}
            style={{
              position: "relative", zIndex: 10,
              color: "rgba(255,255,255,0.45)", fontSize: 11, lineHeight: 1.5,
              margin: "10px 20px 6px", fontStyle: "italic",
            }}
          >
            "{bio.length > 75 ? bio.slice(0, 75) + "…" : bio}"
          </motion.p>

          {/* Pulsing heart */}
          {pulse && (
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
              style={{ position: "relative", zIndex: 10, marginBottom: 12, display: "flex", justifyContent: "center" }}
            >
              <Heart size={18} style={{ color: "#e848c7" }} fill="#e848c7" />
            </motion.div>
          )}

          {/* Buttons */}
          <div style={{ position: "relative", zIndex: 10, display: "flex", gap: 10, padding: "0 16px" }}>
            <button
              onClick={onDismiss}
              style={{
                flex: 1, padding: "11px 0", borderRadius: 16, fontSize: 12, fontWeight: 700,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
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
                background: "linear-gradient(135deg, #ec4899, #f472b6)",
                border: "none", color: "#fff", cursor: "pointer",
                boxShadow: "0 4px 18px rgba(236,72,199,0.45)",
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
