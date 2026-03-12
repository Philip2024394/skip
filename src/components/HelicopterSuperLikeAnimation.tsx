import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

const HELI_URL = "https://ik.imagekit.io/7grri5v7d/helicopter-transparent.png";
const HELI_WIDTH = 120;
const HELI_HEIGHT = 72;

const FLY_IN_DURATION = 3.5;
const HOVER_DURATION = 4.0;
const DROP_DURATION = 2.0;
const EXIT_DURATION = 2.5;

// ── SVG Components ────────────────────────────────────────────────────────────────
// ── Rotor SVG ────────────────────────────────────────────────────────────────
const RotorSvg = () => (
  <svg
    width="120"
    height="8"
    viewBox="0 0 120 8"
    className="rotor-blade"
    style={{ filter: "blur(0.3px)" }}
  >
    {/* Main horizontal blade - side view */}
    <rect x="2" y="3" width="116" height="2" rx="1"
      fill="rgba(30,30,30,0.9)"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="0.3"
    />
    {/* Blade tips for more realistic look */}
    <ellipse cx="60" cy="4" rx="58" ry="1.5"
      fill="rgba(40,40,40,0.8)"
      stroke="rgba(255,255,255,0.1)"
      strokeWidth="0.2"
    />
    {/* Center hub */}
    <circle cx="60" cy="4" r="2"
      fill="rgba(50,50,50,0.95)"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="0.3"
    />
  </svg>
);

// ── Star SVG ─────────────────────────────────────────────────────────────────
const StarSvg = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 50 50"
    style={{ filter: "drop-shadow(0 2px 8px rgba(255,215,0,0.8))" }}
  >
    <defs>
      <radialGradient id="starGrad" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FFF176"/>
        <stop offset="50%" stopColor="#FFD700"/>
        <stop offset="100%" stopColor="#FFA000"/>
      </radialGradient>
    </defs>
    <polygon
      points="25,4 30,18 45,18 33,27 38,42 25,33 12,42 17,27 5,18 20,18"
      fill="url(#starGrad)"
      stroke="#FF8F00"
      strokeWidth="1"
    />
    <polygon
      points="25,8 28,16 36,16 30,21 32,30 25,25 18,30 20,21 14,16 22,16"
      fill="rgba(255,255,255,0.25)"
    />
    <text
      x="25"
      y="24"
      textAnchor="middle"
      fontSize="6"
      fontWeight="bold"
      fill="white"
      style={{ fontFamily: "sans-serif" }}
    >
      SUPER
    </text>
    <text
      x="25"
      y="31"
      textAnchor="middle"
      fontSize="5.5"
      fontWeight="bold"
      fill="white"
      style={{ fontFamily: "sans-serif" }}
    >
      LIKE
    </text>
  </svg>
);

interface HelicopterSuperLikeAnimationProps {
  libraryRef: React.RefObject<HTMLElement | null>;
  targetProfileId: string;
  onReachLibrary: () => void;
  onComplete: () => void;
}

export default function HelicopterSuperLikeAnimation({
  libraryRef,
  targetProfileId,
  onReachLibrary,
  onComplete,
}: HelicopterSuperLikeAnimationProps) {
  const [targetCenter, setTargetCenter] = useState<{ x: number; y: number } | null>(null);
  const [phase, setPhase] = useState<
    "fly-in" | "hover" | "drop" | "exit" | "done"
  >("fly-in");
  const [showStar, setShowStar] = useState(false);
  const [starDropped, setStarDropped] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const tilt = useMotionValue(-8);
  const opacity = useMotionValue(1);

  // Find target profile position
  useEffect(() => {
    const compute = () => {
      const root = libraryRef.current;
      if (!root) return;
      const el = root.querySelector(
        `[data-likes-library-profile-id="${targetProfileId}"]`
      ) as HTMLElement | null;
      const rect = el?.getBoundingClientRect() ?? root.getBoundingClientRect();
      setTargetCenter({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, { passive: true });
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute);
    };
  }, [libraryRef, targetProfileId]);

  // Start position — top right corner
  const startX = useMemo(() =>
    typeof window !== "undefined" ? window.innerWidth + 160 : 700, []);
  const startY = useMemo(() =>
    typeof window !== "undefined" ? -80 : -80, []);

  useEffect(() => {
    if (!targetCenter) return;
    let cancelled = false;

    const run = async () => {
      // Reset state
      x.set(startX);
      y.set(startY);
      tilt.set(-8);
      opacity.set(1);
      setPhase("fly-in");
      setShowStar(false);
      setStarDropped(false);

      // Hover position — above target profile
      const hoverX = targetCenter.x;
      const hoverY = targetCenter.y - 110;

      // FLY IN — fast diagonal from top right
      const xIn = animate(x, hoverX, {
        duration: FLY_IN_DURATION,
        ease: [0.2, 0.8, 0.4, 1],
      });
      const yIn = animate(y, hoverY, {
        duration: FLY_IN_DURATION,
        ease: [0.2, 0.8, 0.4, 1],
      });
      // Tilt forward while flying in
      animate(tilt, -12, { duration: 0.3 });

      await Promise.all([xIn.finished, yIn.finished]);
      if (cancelled) return;

      // Level out when hovering
      animate(tilt, 0, { duration: 0.4, ease: "easeOut" });

      // HOVER — slight bob
      setPhase("hover");
      setShowStar(true);

      // Enhanced hover bob with more movement and gentle rotation
      const bobAnim = animate(y, [hoverY, hoverY - 12, hoverY, hoverY - 8, hoverY, hoverY - 10, hoverY], {
        duration: HOVER_DURATION,
        times: [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1],
        ease: [0.4, 0.0, 0.2, 0.0, 0.2, 0.0, 0.4],
      });
      
      // Add gentle rotation during hover
      const rotationAnim = animate(tilt, [0, 2, -1, 1, -2, 0], {
        duration: HOVER_DURATION,
        times: [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1],
        ease: [0.4, 0.0, 0.2, 0.0, 0.2, 0.0, 0.4],
      });
      
      await Promise.all([bobAnim.finished, rotationAnim.finished]);
      if (cancelled) return;

      // DROP — drop star directly without rope
      setPhase("drop");
      onReachLibrary();

      // Drop star directly
      setStarDropped(true);
      
      // Small pause
      await new Promise((r) => setTimeout(r, 600));
      if (cancelled) return;

      setShowStar(false);
      if (cancelled) return;

      // EXIT — fast bank left and up
      setPhase("exit");
      animate(tilt, 15, { duration: 0.3 });
      animate(opacity, 0, {
        duration: EXIT_DURATION * 0.5,
        delay: EXIT_DURATION * 0.5,
        ease: "easeIn",
      });

      const exitX = animate(x, -200, {
        duration: EXIT_DURATION,
        ease: [0.4, 0, 0.8, 1],
      });
      const exitY = animate(y, hoverY - 80, {
        duration: EXIT_DURATION,
        ease: [0.4, 0, 0.8, 1],
      });

      await Promise.all([exitX.finished, exitY.finished]);
      if (cancelled) return;

      setPhase("done");
      onComplete();
    };

    run();
    return () => { cancelled = true; };
  }, [targetCenter]);

  if (phase === "done") return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 99999 }}
      aria-hidden="true"
    >
      {/* Star - positioned below helicopter */}
      {showStar && !starDropped && (
        <motion.div
          style={{
            position: "fixed",
            left: x,
            top: y,
            marginLeft: -14,
            marginTop: HELI_HEIGHT * 0.6, // Directly below helicopter
            zIndex: 99998,
          }}
          animate={{
            rotate: [-5, 5, -5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <StarSvg size={28} />
        </motion.div>
      )}

      {/* Star dropped — falls to profile */}
      {starDropped && targetCenter && (
        <motion.div
          style={{
            position: "fixed",
            left: targetCenter.x - 20,
            top: targetCenter.y - 110,
            zIndex: 99999,
          }}
          initial={{ y: 0, opacity: 1, scale: 0.8, rotate: -20 }}
          animate={{
            y: 95,
            opacity: [1, 1, 1, 0.8, 0],
            scale: [0.8, 1.3, 1.1, 1, 0.9],
            rotate: [-20, 10, -5, 0, 0],
          }}
          transition={{
            duration: DROP_DURATION,
            ease: "easeIn",
            times: [0, 0.3, 0.6, 0.8, 1],
          }}
        >
          {/* Gold glow */}
          <div style={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,215,0,0.6), transparent 70%)",
            filter: "blur(6px)",
          }} />
          <StarSvg size={40} />
        </motion.div>
      )}

      {/* Helicopter body */}
      <motion.div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          x,
          y,
          rotate: tilt,
          opacity,
          width: HELI_WIDTH,
          height: HELI_HEIGHT,
          marginLeft: -HELI_WIDTH / 2,
          marginTop: -HELI_HEIGHT / 2,
          willChange: "transform",
          backgroundColor: "transparent",
        }}
      >
        {/* Helicopter image */}
        <img
          src={HELI_URL}
          alt="Helicopter"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.5))",
            backgroundColor: "transparent",
            mixBlendMode: "normal",
          }}
        />

        {/* Rotor overlay — spins on top */}
        <div
          style={{
            position: "absolute",
            top: -8,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
          }}
        >
          <RotorSvg />
        </div>
      </motion.div>

      <style>{`
        @keyframes rotorSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotor-blade {
          animation: rotorSpin 0.12s linear infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}
