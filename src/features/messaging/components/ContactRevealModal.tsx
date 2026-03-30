import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ExternalLink, Check, X } from "lucide-react";

// ── Swap this URL for your animation video ────────────────────────────────────
const REVEAL_VIDEO_URL = ""; // e.g. "https://ik.imagekit.io/dateme/reveal-animation.mp4"

// ── Platform deep-link builders ───────────────────────────────────────────────
export const PLATFORMS_ALL = [
  { id: "whatsapp",  label: "WhatsApp",  emoji: "💬", color: "#25D366",
    open: (v: string) => `https://wa.me/${v.replace(/\D/g, "")}?text=${encodeURIComponent("Hi! I found your contact on 2DateMe 👋")}` },
  { id: "telegram",  label: "Telegram",  emoji: "✈️",  color: "#2AABEE",
    open: (v: string) => `https://t.me/${v.replace(/^@/, "")}` },
  { id: "instagram", label: "Instagram", emoji: "📸", color: "#E1306C",
    open: (v: string) => `https://instagram.com/${v.replace(/^@/, "")}` },
  { id: "tiktok",    label: "TikTok",    emoji: "🎵", color: "#FF0050",
    open: (v: string) => `https://tiktok.com/@${v.replace(/^@/, "")}` },
  { id: "snapchat",  label: "Snapchat",  emoji: "👻", color: "#FFFC00",
    open: (v: string) => `https://snapchat.com/add/${v.replace(/^@/, "")}` },
  { id: "phone",     label: "Phone",     emoji: "📞", color: "#a78bfa",
    open: (v: string) => `tel:${v}` },
  { id: "line",      label: "Line",      emoji: "🟢", color: "#06C755",
    open: (v: string) => `https://line.me/ti/p/${v}` },
  { id: "wechat",    label: "WeChat",    emoji: "💚", color: "#07C160",
    open: (_v: string) => "" },
  { id: "signal",    label: "Signal",    emoji: "🔵", color: "#3A76F0",
    open: (v: string) => `https://signal.me/#p/${v}` },
  { id: "facebook",  label: "Facebook",  emoji: "📘", color: "#1877F2",
    open: (v: string) => `https://facebook.com/${v}` },
] as const;

export type PlatformId = typeof PLATFORMS_ALL[number]["id"];

// ── Particles ─────────────────────────────────────────────────────────────────
const PARTICLE_COLORS = ["#ec4899", "#f59e0b", "#8b5cf6", "#34d399", "#60a5fa", "#fb7185"];

function Particles() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    delay: Math.random() * 0.8,
    size: 5 + Math.random() * 7,
    dur: 1.2 + Math.random() * 1.4,
    rot: Math.random() * 360,
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`, top: "45%",
            width: p.size, height: p.size * 0.55,
            backgroundColor: p.color, rotate: p.rot,
          }}
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: -(120 + Math.random() * 160), opacity: [1, 1, 0], rotate: p.rot + 360 }}
          transition={{ delay: p.delay, duration: p.dur, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
interface Props {
  platform: PlatformId;
  value: string;
  senderName: string;
  onClose: () => void;
}

type Phase = "animating" | "revealed";

export default function ContactRevealModal({ platform, value, senderName, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("animating");
  const [copied, setCopied] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const plat = PLATFORMS_ALL.find(p => p.id === platform) ?? PLATFORMS_ALL[0];

  useEffect(() => {
    if (REVEAL_VIDEO_URL && videoRef.current) {
      // Let the video play then advance
      videoRef.current.onended = () => {
        setShowParticles(true);
        setTimeout(() => setPhase("revealed"), 400);
      };
    } else {
      // Pure Framer Motion fallback — 2.2s animation then reveal
      const t = setTimeout(() => {
        setShowParticles(true);
        setTimeout(() => setPhase("revealed"), 500);
      }, 2200);
      return () => clearTimeout(t);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleOpen = () => {
    const url = plat.open(value);
    if (url) window.open(url, "_blank", "noopener");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
      style={{ background: "rgba(4,2,10,0.97)", backdropFilter: "blur(12px)" }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-12 right-5 w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <X className="w-4 h-4" />
      </button>

      {/* Particles burst */}
      <AnimatePresence>{showParticles && <Particles />}</AnimatePresence>

      {/* ── Phase: animating ── */}
      <AnimatePresence mode="wait">
        {phase === "animating" && (
          <motion.div
            key="animating"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center gap-6 px-8"
          >
            {REVEAL_VIDEO_URL ? (
              /* Video animation */
              <video
                ref={videoRef}
                src={REVEAL_VIDEO_URL}
                autoPlay
                playsInline
                muted={false}
                className="w-full max-w-xs rounded-2xl"
                style={{ maxHeight: "55dvh", objectFit: "contain" }}
              />
            ) : (
              /* Framer Motion fallback */
              <>
                {/* Outer ring pulse */}
                <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: 80 + i * 36, height: 80 + i * 36,
                        border: `2px solid ${plat.color}`,
                        opacity: 0.15 + i * 0.06,
                      }}
                      animate={{ scale: [1, 1.18, 1], opacity: [0.15 + i * 0.06, 0, 0.15 + i * 0.06] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.28, ease: "easeInOut" }}
                    />
                  ))}

                  {/* Icon core */}
                  <motion.div
                    className="relative z-10 flex items-center justify-center rounded-full"
                    style={{
                      width: 80, height: 80,
                      background: `radial-gradient(circle, ${plat.color}33, ${plat.color}11)`,
                      border: `2.5px solid ${plat.color}88`,
                      boxShadow: `0 0 48px ${plat.color}55`,
                    }}
                    animate={{ scale: [0.9, 1.08, 0.94, 1.04, 1], rotate: [0, -8, 8, -4, 0] }}
                    transition={{ duration: 1.6, ease: "easeInOut" }}
                  >
                    <span style={{ fontSize: 38 }}>{plat.emoji}</span>
                  </motion.div>
                </div>

                {/* Safe door SVG hint */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <p className="font-black text-white text-xl">Contact Unlocked!</p>
                  <p className="text-white/40 text-sm mt-1">
                    Revealing {senderName}'s {plat.label}…
                  </p>
                </motion.div>

                {/* Progress bar */}
                <motion.div
                  className="w-48 h-1 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${plat.color}, white)` }}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "easeIn" }}
                  />
                </motion.div>
              </>
            )}
          </motion.div>
        )}

        {/* ── Phase: revealed ── */}
        {phase === "revealed" && (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="flex flex-col items-center gap-6 px-6 w-full max-w-sm"
          >
            {/* Platform badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.08 }}
              className="flex items-center justify-center rounded-full"
              style={{
                width: 88, height: 88,
                background: `radial-gradient(circle, ${plat.color}25, ${plat.color}08)`,
                border: `3px solid ${plat.color}`,
                boxShadow: `0 0 52px ${plat.color}55, 0 0 100px ${plat.color}22`,
              }}
            >
              <span style={{ fontSize: 44 }}>{plat.emoji}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="text-center"
            >
              <p className="font-black text-white text-2xl">🎉 Connected!</p>
              <p className="text-white/45 text-sm mt-1">
                {senderName} shared their {plat.label}
              </p>
            </motion.div>

            {/* Contact card */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, type: "spring", stiffness: 260, damping: 24 }}
              className="w-full rounded-2xl px-5 py-4"
              style={{
                background: `linear-gradient(135deg, ${plat.color}18, ${plat.color}08)`,
                border: `1.5px solid ${plat.color}55`,
                boxShadow: `0 0 28px ${plat.color}18`,
              }}
            >
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                {plat.label}
              </p>
              <p
                className="font-mono font-black text-white break-all"
                style={{ fontSize: value.length > 20 ? 16 : 22 }}
              >
                {value}
              </p>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full flex flex-col gap-2.5"
            >
              {/* Primary: Open platform */}
              {plat.open(value) && (
                <button
                  onClick={handleOpen}
                  className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${plat.color}, ${plat.color}cc)`,
                    boxShadow: `0 0 28px ${plat.color}50`,
                  }}
                >
                  <ExternalLink className="w-5 h-5" />
                  Open {plat.label}
                </button>
              )}

              {/* Copy */}
              <button
                onClick={handleCopy}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)",
                  border: copied ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  color: copied ? "#4ade80" : "rgba(255,255,255,0.65)",
                }}
              >
                {copied
                  ? <><Check className="w-4 h-4" /> Copied!</>
                  : <><Copy className="w-4 h-4" /> Copy {plat.label}</>
                }
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 text-white/30 text-sm font-medium hover:text-white/55 transition-colors"
              >
                Back to chat
              </button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/20 text-[10px] text-center"
            >
              2DateMe.com · Be respectful, take your time 💕
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
