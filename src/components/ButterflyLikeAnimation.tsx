import { useEffect, useState, useMemo } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

const BUTTERFLY_SIZE = 40;
const FLY_DURATION_TO_LIBRARY = 5.5;
const FLY_OFF_DURATION = 3;

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
      <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffb3d9" />
        <stop offset="100%" stopColor="#ff69b4" />
      </linearGradient>
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
  const [libraryCenter, setLibraryCenter] = useState<{ x: number; y: number } | null>(null);
  const [phase, setPhase] = useState<"to-library" | "drop-heart" | "fly-off" | "done">("to-library");
  const [heartDropped, setHeartDropped] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    if (!libraryRef.current) return;
    const rect = libraryRef.current.getBoundingClientRect();
    setLibraryCenter({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }, [libraryRef]);

  const startX = useMemo(() => {
    const side = Math.random() > 0.5 ? 1 : -1;
    return typeof window !== "undefined" ? window.innerWidth * 0.5 + side * (window.innerWidth * 0.4 + Math.random() * 80) : 400;
  }, []);
  const startY = useMemo(() => (typeof window !== "undefined" ? -40 - Math.random() * 60 : -60), []);

  useEffect(() => {
    if (libraryCenter === null) return;

    const endOffX = Math.random() > 0.5 ? window.innerWidth + 60 : -60;
    const endOffY = window.innerHeight * 0.5 + (Math.random() - 0.5) * 200;

    const waypointsToLibrary: { x: number; y: number }[] = [];
    const steps = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const wobble = 30 + Math.random() * 40;
      waypointsToLibrary.push({
        x: startX + (libraryCenter.x - startX) * t + (Math.random() - 0.5) * wobble,
        y: startY + (libraryCenter.y - startY) * t + (Math.random() - 0.5) * wobble,
      });
    }
    waypointsToLibrary.push({ x: libraryCenter.x, y: libraryCenter.y });

    let cancelled = false;

    const runToLibrary = async () => {
      x.set(startX);
      y.set(startY);
      for (let i = 1; i < waypointsToLibrary.length; i++) {
        if (cancelled) return;
        const to = waypointsToLibrary[i];
        const segDuration = (FLY_DURATION_TO_LIBRARY / (waypointsToLibrary.length - 1)) * (0.8 + Math.random() * 0.4);
        await new Promise<void>((resolve) => {
          animate(x, to.x, { duration: segDuration, ease: "easeInOut" });
          animate(y, to.y, { duration: segDuration, ease: "easeInOut" }).on("complete", resolve);
        });
      }
      if (cancelled) return;
      setPhase("drop-heart");
      setHeartDropped(true);
      onReachLibrary();
      await new Promise((r) => setTimeout(r, 600));
      if (cancelled) return;
      await runFlyOff();
    };

    const runFlyOff = async () => {
      const waypointsOff: { x: number; y: number }[] = [];
      const steps = 3;
      const fromX = libraryCenter.x;
      const fromY = libraryCenter.y;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        waypointsOff.push({
          x: fromX + (endOffX - fromX) * t + (Math.random() - 0.5) * 50,
          y: fromY + (endOffY - fromY) * t + (Math.random() - 0.5) * 30,
        });
      }
      waypointsOff.push({ x: endOffX, y: endOffY });
      for (let i = 1; i < waypointsOff.length; i++) {
        if (cancelled) return;
        const to = waypointsOff[i];
        const segDuration = FLY_OFF_DURATION / (waypointsOff.length - 1);
        await new Promise<void>((resolve) => {
          animate(x, to.x, { duration: segDuration, ease: "easeInOut" });
          animate(y, to.y, { duration: segDuration, ease: "easeInOut" }).on("complete", resolve);
        });
      }
      if (!cancelled) {
        setPhase("done");
        onComplete();
      }
    };

    runToLibrary();

    return () => {
      cancelled = true;
    };
  }, [libraryCenter]);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[55]" aria-hidden="true">
      <motion.div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          x,
          y,
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
          animation: wingFlapLeft 0.15s ease-in-out infinite;
        }
        .butterfly-container .wing-flap-right {
          animation: wingFlapRight 0.15s ease-in-out infinite;
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
