import { motion } from "framer-motion";
import { CSSProperties } from "react";

interface BorderBeamProps {
  /** Duration of one full rotation in seconds */
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
  /** Border thickness in px */
  size?: number;
  /** Must match parent's border-radius */
  borderRadius?: string | number;
  style?: CSSProperties;
  className?: string;
}

/**
 * Magic UI — BorderBeam
 * Adds a rotating neon border to any `position: relative` parent.
 * Place as the last child; parent must have `overflow: hidden`.
 */
export function BorderBeam({
  duration = 4,
  colorFrom = "#ec4899",
  colorTo = "#a855f7",
  size = 1.5,
  borderRadius = "1.25rem",
  style,
  className,
}: BorderBeamProps) {
  const radius = typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius;

  return (
    <div
      aria-hidden
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
        ...style,
      }}
    >
      {/* Rotating conic gradient */}
      <motion.div
        style={{
          position: "absolute",
          inset: -size * 4,
          background: `conic-gradient(from 0deg, transparent 0deg, ${colorFrom} 50deg, ${colorTo} 100deg, transparent 140deg)`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      />
      {/* Inner mask — hides center, shows only ring */}
      <div
        style={{
          position: "absolute",
          inset: size,
          borderRadius: `calc(${radius} - ${size}px)`,
          background: "transparent",
        }}
      />
    </div>
  );
}
