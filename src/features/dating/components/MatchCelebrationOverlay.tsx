import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Video, Phone, Timer } from "lucide-react";
import { resolveConnectionType, getPreferenceLabel } from "@/shared/utils/contactPreference";

const MATCH_VIDEO = "https://ik.imagekit.io/7grri5v7d/teddy%20excted%20match.mp4";
const MATCH_FALLBACK = "https://ik.imagekit.io/7grri5v7d/UntitledfsdfsdfsdfsdfDSFSDFSdssdfdasdasdfgsdfgdfssdfssasdasdsdfasd.png";

interface MatchCelebrationOverlayProps {
  matchedProfile: any;
  currentUser: any;
  onConnect: (packageKey: string, connectionType?: string) => void;
  onDismiss: () => void;
}

// ── Countdown ring ─────────────────────────────────────────────────────────────
function CountdownRing({ duration, onDone }: { duration: number; onDone: () => void }) {
  const [progress, setProgress] = useState(1);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const p = Math.max(0, 1 - elapsed / duration);
      setProgress(p);
      if (p === 0) { clearInterval(id); onDone(); }
    }, 50);
    return () => clearInterval(id);
  }, [duration, onDone]);

  const r = 18;
  const circ = 2 * Math.PI * r;

  return (
    <svg width={44} height={44}>
      <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={2.5} />
      <circle
        cx={22} cy={22} r={r}
        fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2.5}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - progress)}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        style={{ transition: "stroke-dashoffset 0.05s linear" }}
      />
      <text x={22} y={27} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={10} fontWeight={700}>
        {Math.ceil(progress * duration)}s
      </text>
    </svg>
  );
}

// ── Floating sparkles ──────────────────────────────────────────────────────────
function Fireworks() {
  const sparks = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: 2 + Math.random() * 96,
      delay: Math.random() * 3,
      dur: 1.6 + Math.random() * 1.8,
      emoji: ["✨", "🎉", "🎊", "💫", "⭐", "🌟"][Math.floor(Math.random() * 6)],
      size: 12 + Math.random() * 14,
    }))
  ).current;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      {sparks.map((s) => (
        <motion.span
          key={s.id}
          initial={{ y: "110%", opacity: 1 }}
          animate={{ y: "-10%", opacity: [1, 1, 0] }}
          transition={{ duration: s.dur, delay: s.delay, ease: "easeOut", repeat: Infinity, repeatDelay: Math.random() * 2 }}
          style={{ position: "absolute", left: `${s.left}%`, bottom: 0, fontSize: s.size, lineHeight: 1 }}
        >
          {s.emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ── Connection helpers ──────────────────────────────────────────────────────────
function ConnectIcon({ type }: { type: string }) {
  if (type === "video") return <Video size={18} />;
  if (type === "both") return <><Phone size={15} /><Video size={15} /></>;
  return <MessageCircle size={18} />;
}

function connectLabel(type: string) {
  if (type === "video") return "Video Call";
  if (type === "both") return "WhatsApp + Video";
  return "WhatsApp";
}

// ── Main ────────────────────────────────────────────────────────────────────────
export default function MatchCelebrationOverlay({
  matchedProfile,
  currentUser,
  onConnect,
  onDismiss,
}: MatchCelebrationOverlayProps) {
  const AUTO_DISMISS_S = 12;
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => setVideoError(true));
  }, []);

  const myAvatar = currentUser?.user_metadata?.avatar_url || currentUser?.avatar_url || "/placeholder.svg";
  const theirAvatar = matchedProfile?.avatar_url || matchedProfile?.image || "/placeholder.svg";
  const theirName = (matchedProfile?.name || "Someone").split(" ")[0];
  const theirGender = matchedProfile?.gender;
  const pronoun = theirGender === "Female" ? "She" : theirGender === "Male" ? "He" : "They";

  const myPref = currentUser?.contact_preference || currentUser?.user_metadata?.contact_preference || "whatsapp";
  const theirPref = matchedProfile?.contact_preference || "whatsapp";
  const resolvedType = resolveConnectionType(myPref, theirPref);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ position: "fixed", inset: 0, zIndex: 300 }}
        onClick={onDismiss}
      >
        {/* ── Video / image background ── */}
        {!videoError ? (
          <video
            ref={videoRef}
            src={MATCH_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <img
            src={MATCH_FALLBACK}
            alt="match celebration"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}

        {/* Dark overlay — stronger at top and bottom */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 38%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.82) 80%, rgba(0,0,0,0.96) 100%)",
        }} />

        <Fireworks />

        {/* ── Countdown top-right ── */}
        <div
          style={{ position: "absolute", top: 16, right: 16, zIndex: 20 }}
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        >
          <CountdownRing duration={AUTO_DISMISS_S} onDone={onDismiss} />
        </div>

        {/* ── Slide-up card ── */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            background: "linear-gradient(180deg, rgba(8,8,16,0.82) 0%, rgba(8,8,16,0.98) 100%)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "28px 28px 0 0",
            padding: "8px 0 0",
          }}
        >
          {/* Drag handle */}
          <div style={{ width: 38, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 20px" }} />

          {/* ── "It's a Match!" headline ── */}
          <div style={{ textAlign: "center", padding: "0 24px" }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 380, damping: 16 }}
              style={{ fontSize: 42, lineHeight: 1, marginBottom: 8 }}
            >
              🎉
            </motion.div>

            <motion.h1
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.38 }}
              style={{
                margin: 0,
                fontSize: 34, fontWeight: 900, lineHeight: 1.05,
                background: "linear-gradient(135deg, #f472b6 0%, #ec4899 55%, #f43f8e 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              It's a Match!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.46 }}
              style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: "8px 0 0", lineHeight: 1.5 }}
            >
              You and <strong style={{ color: "#f472b6" }}>{theirName}</strong> liked each other 💕
            </motion.p>
          </div>

          {/* ── Avatars ── */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.28, type: "spring", stiffness: 260, damping: 18 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, margin: "18px 0 16px" }}
          >
            {/* My avatar */}
            <div style={{ position: "relative" }}>
              <img src={myAvatar} alt="You"
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                style={{
                  width: 72, height: 72, borderRadius: "50%", objectFit: "cover",
                  border: "3px solid rgba(236,72,153,0.85)",
                  boxShadow: "0 0 24px rgba(236,72,153,0.55)",
                }}
              />
              <div style={{
                position: "absolute", bottom: -2, right: -2, width: 21, height: 21,
                borderRadius: "50%", background: "#ec4899", border: "2px solid #080810",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff",
              }}>✓</div>
            </div>

            {/* Pulsing heart */}
            <motion.div
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 0.85, ease: "easeInOut" }}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(236,72,153,0.18)",
                border: "1.5px solid rgba(236,72,153,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 20px rgba(236,72,153,0.45)",
              }}
            >
              <Heart size={20} style={{ color: "#ec4899" }} fill="#ec4899" />
            </motion.div>

            {/* Their avatar */}
            <div style={{ position: "relative" }}>
              <img src={theirAvatar} alt={theirName}
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                style={{
                  width: 72, height: 72, borderRadius: "50%", objectFit: "cover",
                  border: "3px solid rgba(236,72,153,0.6)",
                  boxShadow: "0 0 24px rgba(236,72,153,0.4)",
                }}
              />
              <div style={{
                position: "absolute", bottom: -2, right: -2, width: 21, height: 21,
                borderRadius: "50%", background: "#ec4899", border: "2px solid #080810",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff",
              }}>✓</div>
            </div>
          </motion.div>

          {/* ── Preference badge ── */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ textAlign: "center", marginBottom: 16 }}
          >
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20, padding: "4px 12px",
              color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600,
            }}>
              <ConnectIcon type={resolvedType} />
              {pronoun} prefers {getPreferenceLabel(theirPref)} · via {connectLabel(resolvedType)}
            </span>
          </motion.div>

          {/* ── Match expiry notice ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            style={{
              margin: "0 20px 16px",
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.25)",
              borderRadius: 14,
              padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <Timer size={16} style={{ color: "rgba(251,191,36,0.9)", flexShrink: 0 }} />
            <div>
              <p style={{ color: "rgba(251,191,36,0.9)", fontWeight: 700, fontSize: 12, margin: 0 }}>
                Match valid for 3 days
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "2px 0 0", lineHeight: 1.4 }}>
                Unlock before it expires — profile view locks after 3 days. Reactivate anytime from your dashboard.
              </p>
            </div>
          </motion.div>

          {/* ── CTA buttons ── */}
          <div style={{ padding: "0 20px 32px" }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58 }}
            >
              {/* Primary unlock button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onConnect("unlock:single", resolvedType)}
                style={{
                  width: "100%", padding: "16px 0", borderRadius: 22,
                  fontSize: 16, fontWeight: 900, color: "#fff",
                  background: "linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #a855f7 100%)",
                  border: "none", cursor: "pointer",
                  boxShadow: "0 6px 28px rgba(236,72,153,0.55)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  marginBottom: 10,
                }}
              >
                <ConnectIcon type={resolvedType} />
                Unlock Now — $1.99
              </motion.button>

              {/* Connect Monthly note */}
              <p style={{
                color: "rgba(255,255,255,0.35)", fontSize: 11,
                textAlign: "center", margin: "0 0 12px", lineHeight: 1.4,
              }}>
                💎 Free with <strong style={{ color: "rgba(255,255,255,0.5)" }}>Connect Monthly</strong> — unlimited unlocks
              </p>

              {/* Maybe later */}
              <button
                onClick={onDismiss}
                style={{
                  width: "100%", background: "none", border: "none",
                  color: "rgba(255,255,255,0.28)", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", padding: "6px 0",
                }}
              >
                Maybe later — I'll unlock within 3 days
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
