import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Profile } from "@/shared/types/profile";

const BURN_DURATION_MS = 1800;
const GLITTER_DURATION_MS = 3000;
const GLITTER_COUNT = 80;

interface SuperLikeRevealModalProps {
  profile: Profile;
  onComplete: () => void;
}

const DynamiteSvg = ({ burning }: { burning: boolean }) => (
  <svg viewBox="0 0 60 120" className="w-16 h-32 drop-shadow-xl" aria-hidden>
    <defs>
      <linearGradient id="dynamiteBody" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#4a3728" />
        <stop offset="30%" stopColor="#5d4a3a" />
        <stop offset="70%" stopColor="#5d4a3a" />
        <stop offset="100%" stopColor="#4a3728" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <motion.path
      d="M 30 8 L 30 0"
      stroke="#2d2d2d"
      strokeWidth="4"
      strokeLinecap="round"
      initial={{ pathLength: 1 }}
      animate={burning ? { pathLength: 0 } : {}}
      transition={{ duration: BURN_DURATION_MS / 1000, ease: "linear" }}
    />
    {burning && (
      <motion.circle
        r="5"
        cx="30"
        cy="4"
        fill="#ffaa00"
        filter="url(#glow)"
        animate={{ cy: [4, 0], opacity: [1, 0.8] }}
        transition={{ duration: BURN_DURATION_MS / 1000, ease: "linear" }}
      />
    )}
    <rect x="10" y="8" width="40" height="100" rx="6" fill="url(#dynamiteBody)" />
    <rect x="14" y="12" width="32" height="92" rx="4" fill="#3d2e22" opacity="0.6" />
    <rect x="10" y="50" width="40" height="12" rx="2" fill="#c41e3a" />
  </svg>
);

export default function SuperLikeRevealModal({ profile, onComplete }: SuperLikeRevealModalProps) {
  const [phase, setPhase] = useState<"profile" | "burn" | "glitter">("profile");
  const [glitterKey, setGlitterKey] = useState(0);

  const glitterParticles = useMemo(() => {
    const colors = ["#ffd700", "#ffaa00", "#ffec8b", "#fffacd", "#ffeb3b", "#fdd835"];
    return Array.from({ length: GLITTER_COUNT }, (_, i) => {
      const angle = (i / GLITTER_COUNT) * 360 + (i * 7) % 60;
      const dist = 80 + (i * 11) % 120;
      const x = 50 + (Math.cos((angle * Math.PI) / 180) * dist * 0.5);
      const y = 50 + (Math.sin((angle * Math.PI) / 180) * dist * 0.4);
      return {
        x,
        y,
        size: 4 + (i * 3) % 8,
        delay: (i % 10) * 0.03,
        duration: 1.2 + (i % 5) * 0.3,
        color: colors[i % colors.length],
      };
    });
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("burn"), 400);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== "burn") return;
    const t = setTimeout(() => {
      setPhase("glitter");
      setGlitterKey((k) => k + 1);
    }, BURN_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "glitter") return;
    const t = setTimeout(() => onComplete(), GLITTER_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md pointer-events-auto">
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <motion.div
          className="relative rounded-2xl overflow-hidden bg-black/60 border-2 border-amber-400/50 shadow-[0_0_40px_rgba(251,191,36,0.25)] p-4 flex flex-col items-center"
          animate={phase === "glitter" ? { scale: [1, 0.92], opacity: [1, 0.7] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-amber-400/60 ring-4 ring-amber-400/20">
            <img
              src={profile.avatar_url || profile.image}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-white font-display font-bold text-xl mt-3">{profile.name}</p>
          <p className="text-amber-300/90 text-sm">Super Liked you! ⭐</p>
        </motion.div>

        <AnimatePresence>
          {(phase === "burn" || phase === "glitter") && (
            <motion.div
              className="absolute bottom-[20%]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DynamiteSvg burning={phase === "burn"} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {phase === "glitter" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" key={glitterKey}>
            {glitterParticles.map((p, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  boxShadow: "0 0 6px currentColor",
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [1, 0.9, 0],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <p className="absolute bottom-8 left-0 right-0 text-center text-white/40 text-xs">
        Someone super liked you…
      </p>
    </div>
  );
}
