import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, ChevronLeft, Video, Phone } from "lucide-react";
import { resolveConnectionType, getPreferenceIcon, getPreferenceLabel } from "@/utils/contactPreference";

interface MatchCelebrationOverlayProps {
  matchedProfile: any;
  currentUser: any;
  onConnect: (packageKey: string, connectionType?: string) => void;
  onDismiss: () => void;
}

// ─── Floating hearts ────────────────────────────────────────────────────────
const HEART_COUNT = 22;
function HeartParticles() {
  const particles = useRef(
    Array.from({ length: HEART_COUNT }, (_, i) => ({
      id: i,
      left: 4 + Math.random() * 92,
      delay: Math.random() * 2.2,
      duration: 2.4 + Math.random() * 2,
      size: 10 + Math.random() * 18,
      drift: (Math.random() - 0.5) * 60,
      emoji: Math.random() > 0.5 ? "❤️" : Math.random() > 0.5 ? "💕" : "💖",
    }))
  ).current;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: "105%", x: 0, opacity: 0.9, scale: 0.8 }}
          animate={{ y: "-10%", x: p.drift, opacity: 0, scale: 1.3 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut", repeat: Infinity, repeatDelay: Math.random() * 1.5 }}
          style={{ position: "absolute", left: `${p.left}%`, bottom: 0, fontSize: p.size, lineHeight: 1, display: "block" }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ─── Sparkle burst ──────────────────────────────────────────────────────────
function SparkleRing() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 360;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, delay: 0.1 + i * 0.07, repeat: Infinity, repeatDelay: 2.5 }}
            style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: 8, height: 8,
              borderRadius: "50%",
              background: i % 2 === 0 ? "#ec4899" : "#a855f7",
              transform: `rotate(${angle}deg) translateX(${100 + Math.random() * 40}px) translateY(-50%)`,
              boxShadow: `0 0 8px 2px ${i % 2 === 0 ? "#ec4899" : "#a855f7"}`,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── 10-second countdown ring ───────────────────────────────────────────────
function CountdownRing({ duration }: { duration: number }) {
  const [progress, setProgress] = useState(1);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      setProgress(Math.max(0, 1 - elapsed / duration));
    }, 50);
    return () => clearInterval(id);
  }, [duration]);

  const r = 22;
  const circ = 2 * Math.PI * r;

  return (
    <svg width={54} height={54} style={{ position: "absolute", top: 14, right: 14, zIndex: 20 }}>
      <circle cx={27} cy={27} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={3} />
      <circle
        cx={27} cy={27} r={r}
        fill="none"
        stroke="#ec4899"
        strokeWidth={3}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - progress)}
        strokeLinecap="round"
        transform="rotate(-90 27 27)"
        style={{ transition: "stroke-dashoffset 0.05s linear" }}
      />
      <text x={27} y={32} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={11} fontWeight={700}>
        {Math.ceil(progress * duration)}s
      </text>
    </svg>
  );
}

// ─── Connection type icons ──────────────────────────────────────────────────
function ConnectionIcon({ type }: { type: string }) {
  if (type === "video") return <Video size={16} />;
  if (type === "both") return <><Phone size={14} /><Video size={14} /></>;
  return <MessageCircle size={16} />;
}

function connectionLabel(type: string): string {
  if (type === "video") return "Video Call";
  if (type === "both") return "WhatsApp + Video";
  return "WhatsApp";
}

// ─── WhatsApp package options (kept for fallback) ────────────────────────────
const PACKAGES = [
  {
    key: "unlock:single",
    emoji: "💬",
    name: "1 Unlock",
    price: "$1.99",
    desc: "Unlock this match's WhatsApp now",
    badge: "Quick",
    badgeColor: "rgba(236,72,153,0.9)",
  },
  {
    key: "unlock:pack3",
    emoji: "🔓",
    name: "3 Unlock Pack",
    price: "$4.99",
    desc: "Save vs singles — great for active users",
    badge: "Popular",
    badgeColor: "rgba(168,85,247,0.9)",
  },
  {
    key: "unlock:pack10",
    emoji: "🚀",
    name: "10 Unlock Pack",
    price: "$12.99",
    desc: "Best value — never expire",
    badge: "Best Value",
    badgeColor: "rgba(245,158,11,0.9)",
  },
];

function PackagePicker({ theirName, connectionType, onSelect, onBack }: {
  theirName: string;
  connectionType: string;
  onSelect: (key: string) => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      key="packages"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      style={{ position: "relative", zIndex: 10, padding: "22px 20px 20px" }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: "absolute", top: 16, left: 16, background: "none", border: "none",
          color: "rgba(255,255,255,0.45)", cursor: "pointer", display: "flex", alignItems: "center",
          gap: 4, fontSize: 12, fontWeight: 600, padding: 0,
        }}
      >
        <ChevronLeft size={15} /> Back
      </button>

      <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: "0 0 2px", textAlign: "center" }}>
        Connect with {theirName}
      </p>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "0 0 6px", textAlign: "center" }}>
        via {connectionLabel(connectionType)}
      </p>

      {/* Single connect button — $1.99 */}
      <button
        onClick={() => onSelect("unlock:single")}
        style={{
          width: "100%",
          background: "linear-gradient(135deg, #ec4899, #a855f7)",
          border: "none",
          borderRadius: 16,
          padding: "16px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: 12,
          boxShadow: "0 4px 22px rgba(236,72,153,0.5)",
        }}
      >
        <ConnectionIcon type={connectionType} />
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>
          Connect Now — $1.99
        </span>
      </button>

      {/* Bundle options */}
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px", textAlign: "center" }}>
        Or save with bundles
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {PACKAGES.slice(1).map((pkg) => (
          <button
            key={pkg.key}
            onClick={() => onSelect(pkg.key)}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.05)",
              border: "1.5px solid rgba(236,72,153,0.3)",
              borderRadius: 14,
              padding: "10px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              textAlign: "left",
              transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(236,72,153,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{pkg.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>{pkg.name}</span>
                <span style={{
                  background: pkg.badgeColor,
                  borderRadius: 20, padding: "1px 7px",
                  fontSize: 8, fontWeight: 800, color: "#fff",
                }}>{pkg.badge}</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: 0 }}>{pkg.desc}</p>
            </div>
            <span style={{
              color: "#fff", fontWeight: 900, fontSize: 14,
              background: "linear-gradient(135deg,#ec4899,#a855f7)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text", flexShrink: 0,
            }}>{pkg.price}</span>
          </button>
        ))}
      </div>

      <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, textAlign: "center", marginTop: 10 }}>
        One-time payment — connection shared instantly
      </p>
    </motion.div>
  );
}

// ─── Main Overlay ───────────────────────────────────────────────────────────
export default function MatchCelebrationOverlay({
  matchedProfile,
  currentUser,
  onConnect,
  onDismiss,
}: MatchCelebrationOverlayProps) {
  const AUTO_DISMISS_S = 10;
  const [showPackages, setShowPackages] = useState(false);

  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_S * 1000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const myAvatar = currentUser?.user_metadata?.avatar_url || currentUser?.avatar_url || "/placeholder.svg";
  const theirAvatar = matchedProfile?.avatar_url || matchedProfile?.image || "/placeholder.svg";
  const theirName = matchedProfile?.name || "Someone";

  // Contact preference resolution
  const myPref = currentUser?.contact_preference || currentUser?.user_metadata?.contact_preference || "whatsapp";
  const theirPref = matchedProfile?.contact_preference || "whatsapp";
  const resolvedType = resolveConnectionType(myPref, theirPref);

  // Preference display for match screen
  const theirPrefLabel = getPreferenceLabel(theirPref);
  const theirPrefIcon = getPreferenceIcon(theirPref);
  const theirGender = matchedProfile?.gender;
  const pronoun = theirGender === "Female" ? "She" : theirGender === "Male" ? "He" : "They";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(4,0,16,0.9)",
          backdropFilter: "blur(18px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 20px",
        }}
      >
        <HeartParticles />

        <motion.div
          initial={{ scale: 0.72, opacity: 0, y: 44 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: -16 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          style={{
            position: "relative",
            width: "100%", maxWidth: 340,
            borderRadius: 30,
            overflow: "hidden",
            background: "linear-gradient(145deg, rgba(10,0,24,0.98) 0%, rgba(22,4,44,0.98) 100%)",
            border: "1.5px solid rgba(236,72,153,0.4)",
            boxShadow: "0 0 0 1px rgba(168,85,247,0.15), 0 8px 40px rgba(236,72,153,0.28), 0 0 80px rgba(168,85,247,0.12)",
            padding: "0 0 6px",
            textAlign: "center",
          }}
        >
          {/* App theme radial glow */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            background: "radial-gradient(ellipse at 50% 10%, rgba(236,72,153,0.16) 0%, rgba(168,85,247,0.08) 45%, transparent 70%)",
          }} />

          {/* Top accent bar */}
          <div style={{
            height: 3, width: "100%",
            background: "linear-gradient(90deg, #ec4899, #a855f7, #ec4899)",
          }} />

          <SparkleRing />
          {!showPackages && <CountdownRing duration={AUTO_DISMISS_S} />}

          <AnimatePresence mode="wait">
            {!showPackages ? (
              <motion.div
                key="match"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.22 }}
                style={{ position: "relative", zIndex: 10, padding: "28px 26px 20px" }}
              >
                {/* Emoji */}
                <motion.div
                  initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.1 }}
                  style={{ fontSize: 50, lineHeight: 1, marginBottom: 6 }}
                >
                  💞
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.18, duration: 0.35 }}
                  style={{
                    margin: 0,
                    fontSize: 28, fontWeight: 900, lineHeight: 1.1,
                    background: "linear-gradient(135deg, #f472b6 0%, #ec4899 45%, #a855f7 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  It's a Match!
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.28 }}
                  style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "6px 0 10px", lineHeight: 1.5 }}
                >
                  You and <strong style={{ color: "#ec4899" }}>{theirName}</strong> liked each other!
                </motion.p>

                {/* Their preference badge */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 20, padding: "5px 14px 5px 10px",
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{theirPrefIcon}</span>
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700 }}>
                    {pronoun} prefers {theirPrefLabel}
                  </span>
                </motion.div>

                {/* Avatars */}
                <motion.div
                  initial={{ scale: 0.82, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 18 }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}
                >
                  <div style={{ position: "relative" }}>
                    <img src={myAvatar} alt="You"
                      style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover",
                        border: "3px solid rgba(236,72,153,0.7)",
                        boxShadow: "0 0 22px rgba(236,72,153,0.5)" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                    <div style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20,
                      borderRadius: "50%", background: "#ec4899", border: "2px solid #0a0018",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✓</div>
                  </div>

                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
                    style={{ width: 40, height: 40, borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(236,72,153,0.22), rgba(168,85,247,0.22))",
                      border: "1.5px solid rgba(236,72,153,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 0 18px rgba(236,72,153,0.4)" }}
                  >
                    <Heart size={18} style={{ color: "#ec4899" }} fill="#ec4899" />
                  </motion.div>

                  <div style={{ position: "relative" }}>
                    <img src={theirAvatar} alt={theirName}
                      style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover",
                        border: "3px solid rgba(168,85,247,0.7)",
                        boxShadow: "0 0 22px rgba(168,85,247,0.5)" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                    <div style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20,
                      borderRadius: "50%", background: "#a855f7", border: "2px solid #0a0018",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✓</div>
                  </div>
                </motion.div>

                {/* Connect button — single $1.99 */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowPackages(true)}
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: 20,
                    fontSize: 14, fontWeight: 900,
                    background: "linear-gradient(135deg, #ec4899, #a855f7)",
                    border: "none", color: "#fff", cursor: "pointer",
                    boxShadow: "0 4px 22px rgba(236,72,153,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <ConnectionIcon type={resolvedType} /> Connect Now — $1.99
                </motion.button>

                {/* Connection type indicator */}
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: "8px 0 0", fontWeight: 600 }}>
                  via {connectionLabel(resolvedType)}
                </p>

                <button
                  onClick={onDismiss}
                  style={{
                    background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                    fontSize: 11, cursor: "pointer", marginTop: 8, width: "100%",
                  }}
                >
                  Maybe later
                </button>
              </motion.div>
            ) : (
              <PackagePicker
                theirName={theirName}
                connectionType={resolvedType}
                onSelect={(key) => onConnect(key, resolvedType)}
                onBack={() => setShowPackages(false)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
