import { useEffect, useMemo, useRef, useState } from "react";

// paste the complete CrowAnimation component here exactly as cut from LikesLibrary.tsx
const CrowAnimation = ({ containerWidth, containerHeight, onDone }: {
  containerWidth: number;
  containerHeight: number;
  onDone: () => void;
}) => {
  const [pos, setPos] = useState({ x: -80, y: 0 });
  const [angle, setAngle] = useState(0);
  const [flapPhase, setFlapPhase] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(1);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  useEffect(() => { return () => { isMountedRef.current = false; }; }, []);

  const flightConfig = useMemo(() => {
    const goingRight = Math.random() > 0.3;
    const pathType = Math.floor(Math.random() * 4);
    const yStart = 20 + Math.random() * (containerHeight * 0.55);
    const duration = 5500 + Math.random() * 3000;
    return { goingRight, pathType, yStart, duration };
  }, [containerHeight]);

  useEffect(() => {
    const { goingRight, pathType, yStart, duration } = flightConfig;
    const startX = goingRight ? -70 : containerWidth + 70;
    const endX = goingRight ? containerWidth + 70 : -70;

    const getY = (t: number, baseY: number) => {
      switch (pathType) {
        case 0: return baseY - Math.sin(t * Math.PI) * (containerHeight * 0.28);
        case 1: return baseY + Math.sin(t * Math.PI) * (containerHeight * 0.18);
        case 2: return baseY + Math.sin(t * Math.PI * 2) * (containerHeight * 0.15);
        case 3: return baseY + Math.sin(t * Math.PI * 0.8) * (containerHeight * 0.08);
        default: return baseY;
      }
    };

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const currentX = startX + (endX - startX) * eased;
      const currentY = getY(t, yStart);
      const fadeIn = Math.min(t / 0.08, 1);
      const fadeOut = Math.min((1 - t) / 0.08, 1);
      const currentOpacity = Math.min(fadeIn, fadeOut) * 0.92;
      const nextY = getY(Math.min(t + 0.02, 1), yStart);
      const dy = nextY - currentY;
      const tiltAngle = Math.max(-18, Math.min(18, dy * 0.8));
      const flipScale = goingRight ? 1 : -1;
      if (!isMountedRef.current) return;
      setPos({ x: currentX, y: currentY });
      setAngle(tiltAngle);
      setOpacity(currentOpacity);
      setScale(flipScale);
      const flapCycle = (elapsed / 820) % 1;
      setFlapPhase(flapCycle);
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        onDone();
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const getWingAngle = (phase: number, isLeft: boolean) => {
    let wingPos: number;
    if (phase < 0.55) {
      wingPos = Math.sin((phase / 0.55) * Math.PI) * 38;
    } else {
      wingPos = Math.sin(((phase - 0.55) / 0.45) * Math.PI) * 10;
    }
    return isLeft ? wingPos : -wingPos;
  };

  const leftWingAngle = getWingAngle(flapPhase, true);
  const rightWingAngle = getWingAngle(flapPhase, false);

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        opacity,
        transform: `rotate(${angle}deg) scaleX(${scale})`,
        transformOrigin: "center center",
        width: 64,
        height: 40,
        marginLeft: -32,
        marginTop: -20,
        pointerEvents: "none",
        zIndex: 15,
        willChange: "transform, opacity, left, top",
        filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.8))",
      }}
    >
      <svg viewBox="0 0 64 40" width="64" height="40" style={{ overflow: "visible" }}>
        <g style={{ transformOrigin: "32px 20px", transform: `rotate(${leftWingAngle}deg)` }}>
          <path d="M32,18 C26,14 14,8 4,10 C1,11 1,15 4,18 C10,22 22,22 32,21 Z" fill="#1a1a1a"/>
          <path d="M32,19 C26,15 16,10 7,11 C4,12 4,15 7,17 C14,20 24,21 32,20 Z" fill="#2a2a2a" opacity="0.7"/>
          <path d="M4,10 C2,8 0,9 1,11" stroke="#1a1a1a" strokeWidth="1.2" fill="none"/>
          <path d="M6,9 C5,7 3,8 4,10" stroke="#1a1a1a" strokeWidth="1" fill="none"/>
          <path d="M9,8 C8,6 6,7 7,9" stroke="#1a1a1a" strokeWidth="1" fill="none"/>
        </g>
        <g style={{ transformOrigin: "32px 20px", transform: `rotate(${rightWingAngle}deg)` }}>
          <path d="M32,18 C38,14 50,8 60,10 C63,11 63,15 60,18 C54,22 42,22 32,21 Z" fill="#1a1a1a"/>
          <path d="M32,19 C38,15 48,10 57,11 C60,12 60,15 57,17 C50,20 40,21 32,20 Z" fill="#2a2a2a" opacity="0.7"/>
          <path d="M60,10 C62,8 64,9 63,11" stroke="#1a1a1a" strokeWidth="1.2" fill="none"/>
          <path d="M58,9 C59,7 61,8 60,10" stroke="#1a1a1a" strokeWidth="1" fill="none"/>
          <path d="M55,8 C56,6 58,7 57,9" stroke="#1a1a1a" strokeWidth="1" fill="none"/>
        </g>
        <ellipse cx="32" cy="21" rx="5" ry="8" fill="#1a1a1a"/>
        <ellipse cx="32" cy="19" rx="3.5" ry="5" fill="#2a2a2a"/>
        <path d="M29,28 C30,31 32,33 32,33 C32,33 34,31 35,28 Z" fill="#1a1a1a"/>
        <path d="M31,29 L29,34" stroke="#1a1a1a" strokeWidth="1" fill="none"/>
        <path d="M32,29 L32,34" stroke="#1a1a1a" strokeWidth="1" fill="none"/>
        <path d="M33,29 L35,34" stroke="#1a1a1a" strokeWidth="1" fill="none"/>
        <circle cx="32" cy="13" r="5" fill="#1a1a1a"/>
        <path d="M37,12 C40,11.5 41,13 39,13.5 C38,14 37,13.5 37,13 Z" fill="#1a1a1a"/>
        <circle cx="35" cy="12" r="1.5" fill="#ff6b6b"/>
        <circle cx="35.5" cy="11.5" r="0.5" fill="rgba(255,255,255,0.8)"/>
      </svg>
    </div>
  );
};

export default CrowAnimation;
