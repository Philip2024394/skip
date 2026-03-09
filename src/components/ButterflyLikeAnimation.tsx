import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { Heart } from "lucide-react";

const BUTTERFLY_SIZE = 44;
const FLY_DURATION_TO_TARGET = 4.8;
const HOVER_DURATION = 0.7;
const EXIT_DURATION = 2.6;

interface ButterflyLikeAnimationProps {
  libraryRef: React.RefObject<HTMLElement | null>;
  targetProfileId: string;
  onReachLibrary: () => void;
  onComplete: () => void;
}

// Simple butterfly SVG with flapping wings
const ButterflySvg = () => (
  <svg
    viewBox="0 0 64 48"
    className="w-full h-full"
    style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))" }}
  >
    <defs>
      <radialGradient id="wingGrad" cx="30%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#ffe0ef" stopOpacity="1" />
        <stop offset="45%" stopColor="#ff8ac7" stopOpacity="0.98" />
        <stop offset="100%" stopColor="#ff4aa7" stopOpacity="0.96" />
      </radialGradient>
      <radialGradient id="wingGlow" cx="50%" cy="50%" r="65%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Left wing */}
    <ellipse
      cx="18"
      cy="24"
      rx="18"
      ry="14"
      fill="url(#wingGrad)"
      opacity="0.95"
      className="origin-right center wing-flap-left"
      style={{ transformOrigin: "32px 24px" }}
    />
    <ellipse cx="18" cy="24" rx="18" ry="14" fill="url(#wingGlow)" opacity="0.35" />
    {/* Right wing */}
    <ellipse
      cx="46"
      cy="24"
      rx="18"
      ry="14"
      fill="url(#wingGrad)"
      opacity="0.95"
      className="origin-left center wing-flap-right"
      style={{ transformOrigin: "32px 24px" }}
    />
    <ellipse cx="46" cy="24" rx="18" ry="14" fill="url(#wingGlow)" opacity="0.35" />
    {/* Body */}
    <ellipse cx="32" cy="24" rx="3" ry="14" fill="#2d1b2d" />
    <circle cx="32" cy="10" r="4" fill="#2d1b2d" />
  </svg>
);

export default function ButterflyLikeAnimation({
  libraryRef,
  targetProfileId,
  onReachLibrary,
  onComplete,
}: ButterflyLikeAnimationProps) {
  const [targetCenter, setTargetCenter] = useState<{ x: number; y: number } | null>(null);
  const [phase, setPhase] = useState<"to-target" | "hover" | "drop-heart" | "exit" | "done">("to-target");
  const [heartDrop, setHeartDrop] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const scale = useMotionValue(1);

  const prevPosRef = useRef<{ x: number; y: number } | null>(null);

  const updateRotationFromVelocity = (nx: number, ny: number) => {
    const prev = prevPosRef.current;
    prevPosRef.current = { x: nx, y: ny };
    if (!prev) return;
    const dx = nx - prev.x;
    const dy = ny - prev.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    // Butterfly faces direction of travel; clamp so it doesn't spin wildly.
    const clamped = Math.max(-40, Math.min(40, angle * 0.6));
    rotate.set(clamped);
  };

  useEffect(() => {
    const compute = () => {
      const root = libraryRef.current;
      if (!root) return;

      const el = root.querySelector(`[data-likes-library-profile-id="${targetProfileId}"]`) as HTMLElement | null;
      const rect = el?.getBoundingClientRect() ?? root.getBoundingClientRect();
      setTargetCenter({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    };

    compute();
    window.addEventListener("resize", compute);
    // Likes library scrolls horizontally, and the page can scroll vertically.
    window.addEventListener("scroll", compute, { passive: true });
    libraryRef.current?.addEventListener("scroll", compute, { passive: true } as any);

    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute);
      libraryRef.current?.removeEventListener("scroll", compute as any);
    };
  }, [libraryRef, targetProfileId]);

  const startX = useMemo(() => (typeof window !== "undefined" ? window.innerWidth + 80 + Math.random() * 140 : 520), []);
  const startY = useMemo(() => (typeof window !== "undefined" ? 60 + Math.random() * (window.innerHeight * 0.35) : 100), []);

  const buildNaturalPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const pts: Array<{ x: number; y: number }> = [];
    const steps = 10;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    const nx = dist === 0 ? 0 : dx / dist;
    const ny = dist === 0 ? 0 : dy / dist;
    // Perpendicular vector for organic side-to-side drift.
    const px = -ny;
    const py = nx;

    const baseWobble = Math.min(90, 26 + dist * 0.12);
    const freq = 2 + Math.floor(Math.random() * 2);
    const phase0 = Math.random() * Math.PI * 2;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Ease-in-out on the base line, then add sinusoidal + random micro-jitter.
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const jitter = (Math.random() - 0.5) * 10;
      const wobble = Math.sin(phase0 + t * Math.PI * 2 * freq) * baseWobble * (0.6 + Math.random() * 0.25);
      const bob = Math.sin(phase0 * 0.7 + t * Math.PI * 3) * 18;
      pts.push({
        x: from.x + dx * ease + px * wobble + jitter,
        y: from.y + dy * ease + py * wobble * 0.35 + bob,
      });
    }

    // Final micro-hover spiral around target.
    const hoverR = 22 + Math.random() * 14;
    const hoverTurns = 1;
    for (let j = 1; j <= 6; j++) {
      const t = j / 6;
      const ang = t * Math.PI * 2 * hoverTurns;
      pts.push({
        x: to.x + Math.cos(ang) * hoverR * (1 - t * 0.35),
        y: to.y + Math.sin(ang) * hoverR * (1 - t * 0.35) - 10,
      });
    }

    pts.push({ x: to.x, y: to.y - 10 });
    return pts;
  };

  useEffect(() => {
    if (targetCenter === null) return;

    let cancelled = false;

    const run = async () => {
      prevPosRef.current = null;
      x.set(startX);
      y.set(startY);
      rotate.set(-12);
      scale.set(0.95);
      setPhase("to-target");

      const to = { x: targetCenter.x, y: targetCenter.y };
      const path = buildNaturalPath({ x: startX, y: startY }, to);
      const xs = path.map((p) => p.x);
      const ys = path.map((p) => p.y);
      const times = path.map((_, i) => i / (path.length - 1));

      // Animate main flight.
      const xAnim = animate(x, xs, {
        duration: FLY_DURATION_TO_TARGET,
        times,
        ease: "easeInOut",
        onUpdate: (latest) => updateRotationFromVelocity(latest, y.get()),
      });
      const yAnim = animate(y, ys, {
        duration: FLY_DURATION_TO_TARGET,
        times,
        ease: "easeInOut",
        onUpdate: (latest) => updateRotationFromVelocity(x.get(), latest),
      });
      await Promise.all([xAnim.finished, yAnim.finished]);
      if (cancelled) return;

      setPhase("hover");
      scale.set(1.02);
      await new Promise((r) => setTimeout(r, HOVER_DURATION * 1000));
      if (cancelled) return;

      // Drop heart: start at butterfly, end at the target card.
      setPhase("drop-heart");
      const start = { x: x.get(), y: y.get() + 8 };
      const end = { x: targetCenter.x, y: targetCenter.y + 10 };
      setHeartDrop({ start, end });
      onReachLibrary();

      await new Promise((r) => setTimeout(r, 850));
      if (cancelled) return;

      // Exit: always fly off-screen to the left.
      setPhase("exit");
      scale.set(0.92);
      const exitX = -90;
      const exitY = Math.max(60, Math.min(window.innerHeight - 60, targetCenter.y + (Math.random() - 0.5) * 280));
      const exitPath = buildNaturalPath({ x: x.get(), y: y.get() }, { x: exitX, y: exitY });
      const exs = exitPath.map((p) => p.x);
      const eys = exitPath.map((p) => p.y);
      const etimes = exitPath.map((_, i) => i / (exitPath.length - 1));

      const exAnim = animate(x, exs, {
        duration: EXIT_DURATION,
        times: etimes,
        ease: "easeInOut",
        onUpdate: (latest) => updateRotationFromVelocity(latest, y.get()),
      });
      const eyAnim = animate(y, eys, {
        duration: EXIT_DURATION,
        times: etimes,
        ease: "easeInOut",
        onUpdate: (latest) => updateRotationFromVelocity(x.get(), latest),
      });
      await Promise.all([exAnim.finished, eyAnim.finished]);
      if (cancelled) return;

      setPhase("done");
      onComplete();
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [targetCenter]);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[55]" aria-hidden="true">
      {heartDrop && (
        <motion.div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            x: heartDrop.start.x,
            y: heartDrop.start.y,
            marginLeft: -10,
            marginTop: -10,
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: [0, 1, 1, 0.85, 0],
            scale: [0.6, 1.05, 1, 0.95, 0.8],
            x: [heartDrop.start.x, heartDrop.end.x + 10, heartDrop.end.x - 6, heartDrop.end.x],
            y: [heartDrop.start.y, heartDrop.end.y - 10, heartDrop.end.y + 18, heartDrop.end.y + 10],
          }}
          transition={{
            duration: 1.1,
            ease: "easeOut",
            times: [0, 0.1, 0.55, 0.85, 1],
          }}
          onAnimationComplete={() => setHeartDrop(null)}
        >
          <div className="relative">
            <div className="absolute inset-0 blur-[6px] opacity-40">
              <Heart className="w-7 h-7 text-primary" fill="currentColor" strokeWidth={0} />
            </div>
            <Heart className="w-7 h-7 text-primary drop-shadow-lg" fill="currentColor" strokeWidth={0} />
          </div>
        </motion.div>
      )}

      <motion.div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          x,
          y,
          rotate,
          scale,
          width: BUTTERFLY_SIZE,
          height: BUTTERFLY_SIZE * 0.75,
          marginLeft: -BUTTERFLY_SIZE / 2,
          marginTop: -BUTTERFLY_SIZE * 0.375,
        }}
        className="butterfly-container"
      >
        <ButterflySvg />
      </motion.div>
      <style>{`
        .butterfly-container .wing-flap-left {
          animation: wingFlapLeft 0.12s ease-in-out infinite;
        }
        .butterfly-container .wing-flap-right {
          animation: wingFlapRight 0.12s ease-in-out infinite;
        }
        .butterfly-container {
          will-change: transform;
          filter: drop-shadow(0 10px 18px rgba(0,0,0,0.22));
        }
        @keyframes wingFlapLeft {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-25deg); }
        }
        @keyframes wingFlapRight {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(25deg); }
        }
      `}</style>
    </div>
  );
}
