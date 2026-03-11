import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

const BUTTERFLY_SIZE = 56;
const FLY_DURATION_TO_TARGET = 5.2;
const HOVER_DURATION = 0.9;
const EXIT_DURATION = 3.0;

interface ButterflyLikeAnimationProps {
  libraryRef: React.RefObject<HTMLElement | null>;
  targetProfileId: string;
  onReachLibrary: () => void;
  onComplete: () => void;
}

// ── Realistic Monarch Butterfly SVG ──────────────────────────────────────────
const ButterflySvg = ({
  flapping,
  holdingHeart,
}: {
  flapping: "slow" | "fast";
  holdingHeart: boolean;
}) => {
  const flapDuration = flapping === "slow" ? "0.75s" : "0.22s";

  return (
    <svg
      viewBox="0 0 80 70"
      style={{
        width: "100%",
        height: "100%",
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.35))",
        overflow: "visible",
      }}
    >
      <defs>
        {/* Upper left wing gradient — orange monarch */}
        <radialGradient id="ulWing" cx="40%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="40%" stopColor="#FF8C00" />
          <stop offset="100%" stopColor="#E55A00" />
        </radialGradient>
        {/* Lower left wing gradient */}
        <radialGradient id="llWing" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FFA500" />
          <stop offset="50%" stopColor="#FF7000" />
          <stop offset="100%" stopColor="#CC4400" />
        </radialGradient>
        {/* Upper right wing gradient */}
        <radialGradient id="urWing" cx="60%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="40%" stopColor="#FF8C00" />
          <stop offset="100%" stopColor="#E55A00" />
        </radialGradient>
        {/* Lower right wing gradient */}
        <radialGradient id="lrWing" cx="65%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FFA500" />
          <stop offset="50%" stopColor="#FF7000" />
          <stop offset="100%" stopColor="#CC4400" />
        </radialGradient>

        <style>{`
          @keyframes flapLeft {
            0%, 100% { transform: scaleX(1) skewY(0deg); }
            50% { transform: scaleX(0.08) skewY(4deg); }
          }
          @keyframes flapRight {
            0%, 100% { transform: scaleX(1) skewY(0deg); }
            50% { transform: scaleX(0.08) skewY(-4deg); }
          }
          .left-wings {
            transform-origin: 40px 30px;
            animation: flapLeft ${flapDuration} ease-in-out infinite;
          }
          .right-wings {
            transform-origin: 40px 30px;
            animation: flapRight ${flapDuration} ease-in-out infinite;
          }
        `}</style>
      </defs>

      {/* ── LEFT WINGS GROUP ── */}
      <g className="left-wings">
        {/* Upper left wing */}
        <path
          d="M40,28 C35,18 20,8 8,12 C2,14 2,22 6,28 C10,34 22,36 40,34 Z"
          fill="url(#ulWing)"
          opacity="0.95"
        />
        {/* Upper left wing — black border */}
        <path
          d="M40,28 C35,18 20,8 8,12 C2,14 2,22 6,28 C10,34 22,36 40,34 Z"
          fill="none"
          stroke="#1a0a00"
          strokeWidth="1.2"
          opacity="0.8"
        />
        {/* Upper left wing — black veins */}
        <path d="M40,30 C30,24 18,16 10,14" stroke="#1a0a00" strokeWidth="0.7" fill="none" opacity="0.6" />
        <path d="M40,31 C28,28 16,26 8,22" stroke="#1a0a00" strokeWidth="0.7" fill="none" opacity="0.6" />
        {/* Upper left wing — white spots */}
        <circle cx="9" cy="14" r="1.4" fill="white" opacity="0.9" />
        <circle cx="6" cy="19" r="1.2" fill="white" opacity="0.9" />
        <circle cx="7" cy="25" r="1.0" fill="white" opacity="0.9" />
        <circle cx="14" cy="10" r="1.1" fill="white" opacity="0.8" />
        <circle cx="21" cy="9" r="1.0" fill="white" opacity="0.7" />

        {/* Lower left wing */}
        <path
          d="M40,34 C30,36 14,38 8,44 C4,48 8,56 16,54 C26,52 36,44 40,38 Z"
          fill="url(#llWing)"
          opacity="0.92"
        />
        {/* Lower left wing — black border */}
        <path
          d="M40,34 C30,36 14,38 8,44 C4,48 8,56 16,54 C26,52 36,44 40,38 Z"
          fill="none"
          stroke="#1a0a00"
          strokeWidth="1.2"
          opacity="0.8"
        />
        {/* Lower left wing — white spots */}
        <circle cx="10" cy="46" r="1.3" fill="white" opacity="0.9" />
        <circle cx="8" cy="51" r="1.1" fill="white" opacity="0.8" />
        <circle cx="14" cy="53" r="1.2" fill="white" opacity="0.8" />
        <circle cx="20" cy="54" r="1.0" fill="white" opacity="0.7" />
        {/* Lower left wing blue shimmer */}
        <path
          d="M40,36 C32,38 20,42 12,48 C10,50 12,54 16,53 C24,51 34,44 40,40 Z"
          fill="#4488FF"
          opacity="0.12"
        />
      </g>

      {/* ── RIGHT WINGS GROUP ── */}
      <g className="right-wings">
        {/* Upper right wing */}
        <path
          d="M40,28 C45,18 60,8 72,12 C78,14 78,22 74,28 C70,34 58,36 40,34 Z"
          fill="url(#urWing)"
          opacity="0.95"
        />
        {/* Upper right wing — black border */}
        <path
          d="M40,28 C45,18 60,8 72,12 C78,14 78,22 74,28 C70,34 58,36 40,34 Z"
          fill="none"
          stroke="#1a0a00"
          strokeWidth="1.2"
          opacity="0.8"
        />
        {/* Upper right wing — black veins */}
        <path d="M40,30 C50,24 62,16 70,14" stroke="#1a0a00" strokeWidth="0.7" fill="none" opacity="0.6" />
        <path d="M40,31 C52,28 64,26 72,22" stroke="#1a0a00" strokeWidth="0.7" fill="none" opacity="0.6" />
        {/* Upper right wing — white spots */}
        <circle cx="71" cy="14" r="1.4" fill="white" opacity="0.9" />
        <circle cx="74" cy="19" r="1.2" fill="white" opacity="0.9" />
        <circle cx="73" cy="25" r="1.0" fill="white" opacity="0.9" />
        <circle cx="66" cy="10" r="1.1" fill="white" opacity="0.8" />
        <circle cx="59" cy="9" r="1.0" fill="white" opacity="0.7" />

        {/* Lower right wing */}
        <path
          d="M40,34 C50,36 66,38 72,44 C76,48 72,56 64,54 C54,52 44,44 40,38 Z"
          fill="url(#lrWing)"
          opacity="0.92"
        />
        {/* Lower right wing — black border */}
        <path
          d="M40,34 C50,36 66,38 72,44 C76,48 72,56 64,54 C54,52 44,44 40,38 Z"
          fill="none"
          stroke="#1a0a00"
          strokeWidth="1.2"
          opacity="0.8"
        />
        {/* Lower right wing — white spots */}
        <circle cx="70" cy="46" r="1.3" fill="white" opacity="0.9" />
        <circle cx="72" cy="51" r="1.1" fill="white" opacity="0.8" />
        <circle cx="66" cy="53" r="1.2" fill="white" opacity="0.8" />
        <circle cx="60" cy="54" r="1.0" fill="white" opacity="0.7" />
        {/* Lower right wing blue shimmer */}
        <path
          d="M40,36 C48,38 60,42 68,48 C70,50 68,54 64,53 C56,51 46,44 40,40 Z"
          fill="#4488FF"
          opacity="0.12"
        />
      </g>

      {/* ── BODY ── */}
      {/* Abdomen */}
      <ellipse cx="40" cy="38" rx="2.8" ry="12" fill="#1a0a00" />
      {/* Thorax */}
      <ellipse cx="40" cy="26" rx="3.2" ry="5" fill="#2d1200" />
      {/* Head */}
      <circle cx="40" cy="20" r="3.5" fill="#1a0a00" />
      {/* Eyes */}
      <circle cx="38.2" cy="19" r="1" fill="#88FF44" opacity="0.9" />
      <circle cx="41.8" cy="19" r="1" fill="#88FF44" opacity="0.9" />
      {/* Antennae */}
      <path d="M40,17 C38,12 34,8 32,5" stroke="#1a0a00" strokeWidth="0.9" fill="none" />
      <circle cx="32" cy="5" r="1.5" fill="#1a0a00" />
      <path d="M40,17 C42,12 46,8 48,5" stroke="#1a0a00" strokeWidth="0.9" fill="none" />
      <circle cx="48" cy="5" r="1.5" fill="#1a0a00" />

      {/* ── HANGING HEART ── */}
      {holdingHeart && (
        <>
          {/* Thread */}
          <line x1="40" y1="50" x2="40" y2="60" stroke="#FF69B4" strokeWidth="0.8" opacity="0.7" />
          {/* Heart shape */}
          <path
            d="M40,67 C40,67 34,62 34,58 C34,55.5 36,54 38,55 C39,55.5 40,56.5 40,56.5 C40,56.5 41,55.5 42,55 C44,54 46,55.5 46,58 C46,62 40,67 40,67 Z"
            fill="#FF1493"
            opacity="0.95"
            style={{ filter: "drop-shadow(0 1px 3px rgba(255,20,147,0.6))" }}
          />
        </>
      )}
    </svg>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function ButterflyLikeAnimation({
  libraryRef,
  targetProfileId,
  onReachLibrary,
  onComplete,
}: ButterflyLikeAnimationProps) {
  const [targetCenter, setTargetCenter] = useState<{ x: number; y: number } | null>(null);
  const [phase, setPhase] = useState<"to-target" | "hover" | "drop-heart" | "exit" | "done">("to-target");
  const [heartDropped, setHeartDropped] = useState(false);
  const [heartPos, setHeartPos] = useState<{ x: number; y: number } | null>(null);
  const [flapSpeed, setFlapSpeed] = useState<"fast" | "slow">("fast");

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);

  const prevPosRef = useRef<{ x: number; y: number } | null>(null);

  const updateRotation = (nx: number, ny: number) => {
    const prev = prevPosRef.current;
    prevPosRef.current = { x: nx, y: ny };
    if (!prev) return;
    const dx = nx - prev.x;
    const dy = ny - prev.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    rotate.set(Math.max(-35, Math.min(35, angle * 0.5)));
  };

  // Find target profile card position
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
    window.addEventListener("scroll", compute, { passive: true });
    libraryRef.current?.addEventListener("scroll", compute, { passive: true } as any);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute);
      libraryRef.current?.removeEventListener("scroll", compute as any);
    };
  }, [libraryRef, targetProfileId]);

  // Entry position — always from right side
  const startX = useMemo(() => (typeof window !== "undefined" ? window.innerWidth + 100 : 600), []);
  const startY = useMemo(() => (typeof window !== "undefined" ? 80 + Math.random() * (window.innerHeight * 0.3) : 120), []);

  // Build 5 different random flight paths
  const buildFlightPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const pathType = Math.floor(Math.random() * 5);
    const pts: Array<{ x: number; y: number }> = [];
    const steps = 14;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;

      let ox = 0;
      let oy = 0;

      switch (pathType) {
        case 0: // High sweeping arc
          oy = -Math.sin(t * Math.PI) * 180;
          ox = Math.sin(t * Math.PI * 0.5) * 60;
          break;
        case 1: // S-curve weave
          ox = Math.sin(t * Math.PI * 2) * 120;
          oy = Math.cos(t * Math.PI) * 80;
          break;
        case 2: // Low rising approach
          oy = Math.sin(t * Math.PI) * 80;
          ox = -Math.sin(t * Math.PI * 1.5) * 80;
          break;
        case 3: // Wide loop
          ox = Math.sin(t * Math.PI * 2.5) * 100;
          oy = -Math.sin(t * Math.PI * 1.5) * 140;
          break;
        case 4: // Gentle flutter diagonal
          ox = Math.sin(t * Math.PI * 3) * 70;
          oy = Math.cos(t * Math.PI * 2) * 60 - Math.sin(t * Math.PI) * 100;
          break;
      }

      // Add natural micro-jitter
      const jitter = Math.sin(t * Math.PI * 8) * 8;

      pts.push({
        x: from.x + dx * ease + ox + jitter,
        y: from.y + dy * ease + oy,
      });
    }

    // Final hover spiral around target
    const hoverR = 18;
    for (let j = 1; j <= 5; j++) {
      const t = j / 5;
      const ang = t * Math.PI * 2;
      pts.push({
        x: to.x + Math.cos(ang) * hoverR * (1 - t * 0.4),
        y: to.y + Math.sin(ang) * hoverR * 0.4 - 12,
      });
    }
    pts.push({ x: to.x, y: to.y - 14 });
    return pts;
  };

  // Main animation sequence
  useEffect(() => {
    if (!targetCenter) return;
    let cancelled = false;

    const run = async () => {
      // Reset
      x.set(startX);
      y.set(startY);
      rotate.set(-15);
      scale.set(1);
      opacity.set(1);
      prevPosRef.current = null;
      setPhase("to-target");
      setFlapSpeed("fast");
      setHeartDropped(false);

      const path = buildFlightPath({ x: startX, y: startY }, { x: targetCenter.x, y: targetCenter.y });
      const xs = path.map((p) => p.x);
      const ys = path.map((p) => p.y);
      const times = path.map((_, i) => i / (path.length - 1));

      // Flight to target
      const xA = animate(x, xs, {
        duration: FLY_DURATION_TO_TARGET,
        times,
        ease: "easeInOut",
        onUpdate: (v) => updateRotation(v, y.get()),
      });
      const yA = animate(y, ys, {
        duration: FLY_DURATION_TO_TARGET,
        times,
        ease: "easeInOut",
        onUpdate: (v) => updateRotation(x.get(), v),
      });

      // Slow flap when approaching (70% through flight)
      setTimeout(() => {
        if (!cancelled) setFlapSpeed("slow");
      }, FLY_DURATION_TO_TARGET * 700);

      await Promise.all([xA.finished, yA.finished]);
      if (cancelled) return;

      // Hover above profile
      setPhase("hover");
      setFlapSpeed("slow");
      rotate.set(0);
      await new Promise((r) => setTimeout(r, HOVER_DURATION * 1000));
      if (cancelled) return;

      // Drop heart
      setPhase("drop-heart");
      setHeartDropped(true);
      setHeartPos({ x: x.get(), y: y.get() + 14 });
      onReachLibrary();

      // Rise slightly after dropping heart
      animate(y, y.get() - 20, { duration: 0.5, ease: "easeOut" });
      await new Promise((r) => setTimeout(r, 900));
      if (cancelled) return;

      // Exit left — slow graceful
      setPhase("exit");
      setFlapSpeed("slow");

      const exitTo = {
        x: -120,
        y: Math.max(80, Math.min(window.innerHeight - 80, targetCenter.y + (Math.random() - 0.5) * 200)),
      };

      const exitPath = buildFlightPath({ x: x.get(), y: y.get() }, exitTo);
      const exs = exitPath.map((p) => p.x);
      const eys = exitPath.map((p) => p.y);
      const etimes = exitPath.map((_, i) => i / (exitPath.length - 1));

      animate(opacity, 0, {
        duration: EXIT_DURATION * 0.6,
        delay: EXIT_DURATION * 0.4,
        ease: "easeIn",
      });

      const exA = animate(x, exs, {
        duration: EXIT_DURATION,
        times: etimes,
        ease: "easeInOut",
        onUpdate: (v) => updateRotation(v, y.get()),
      });
      const eyA = animate(y, eys, {
        duration: EXIT_DURATION,
        times: etimes,
        ease: "easeInOut",
        onUpdate: (v) => updateRotation(x.get(), v),
      });

      await Promise.all([exA.finished, eyA.finished]);
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
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 99999 }} aria-hidden="true">
      {/* Dropped heart on profile */}
      {heartDropped && heartPos && (
        <motion.div
          style={{
            position: "fixed",
            left: heartPos.x - 14,
            top: heartPos.y,
            zIndex: 99999,
          }}
          initial={{ opacity: 0, scale: 0.4, y: 0 }}
          animate={{
            opacity: [0, 1, 1, 1, 0],
            scale: [0.4, 1.2, 1, 1, 0.8],
            y: [0, 8, 18, 24, 28],
          }}
          transition={{
            duration: 1.4,
            times: [0, 0.15, 0.4, 0.7, 1],
            ease: "easeOut",
          }}
          onAnimationComplete={() => setHeartDropped(false)}
        >
          {/* Glow */}
          <div
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,20,147,0.4), transparent 70%)",
              filter: "blur(4px)",
            }}
          />
          {/* Heart SVG */}
          <svg width="28" height="26" viewBox="0 0 28 26">
            <path
              d="M14,23 C14,23 2,15 2,8 C2,4.5 4.5,2 8,2 C10.5,2 12.5,3.5 14,5 C15.5,3.5 17.5,2 20,2 C23.5,2 26,4.5 26,8 C26,15 14,23 14,23 Z"
              fill="#FF1493"
              style={{ filter: "drop-shadow(0 2px 6px rgba(255,20,147,0.7))" }}
            />
          </svg>
        </motion.div>
      )}

      {/* Butterfly */}
      <motion.div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          x,
          y,
          rotate,
          scale,
          opacity,
          width: BUTTERFLY_SIZE,
          height: BUTTERFLY_SIZE * 0.875,
          marginLeft: -BUTTERFLY_SIZE / 2,
          marginTop: -(BUTTERFLY_SIZE * 0.875) / 2,
          willChange: "transform",
        }}
      >
        <ButterflySvg flapping={flapSpeed} holdingHeart={phase === "to-target" || phase === "hover"} />
      </motion.div>
    </div>
  );
}
