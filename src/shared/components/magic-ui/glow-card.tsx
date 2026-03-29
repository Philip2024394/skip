import { motion } from "framer-motion";
import { CSSProperties, ReactNode, useRef } from "react";
import { cn } from "@/shared/services/utils";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  style?: CSSProperties;
}

/**
 * Magic UI — GlowCard
 * A card that pulses a soft glow halo. Drop-in replacement for any
 * div/card that needs a premium feel without mouse tracking.
 */
export function GlowCard({
  children,
  className,
  glowColor = "rgba(236,72,153,0.25)",
  style,
}: GlowCardProps) {
  return (
    <motion.div
      className={cn("relative overflow-hidden", className)}
      animate={{
        boxShadow: [
          `0 0 20px 0px ${glowColor}`,
          `0 0 40px 4px ${glowColor}`,
          `0 0 20px 0px ${glowColor}`,
        ],
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/**
 * Magic UI — MagicCard
 * Card that tracks mouse/touch position and renders a radial spotlight
 * under the cursor. Great for interactive cards and drawer panels.
 */
export function MagicCard({
  children,
  className,
  glowColor = "rgba(236,72,153,0.15)",
  style,
}: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = "touches" in e
      ? (e as React.TouchEvent).touches[0].clientX - rect.left
      : (e as React.MouseEvent).clientX - rect.left;
    const y = "touches" in e
      ? (e as React.TouchEvent).touches[0].clientY - rect.top
      : (e as React.MouseEvent).clientY - rect.top;
    ref.current.style.setProperty("--mx", `${x}px`);
    ref.current.style.setProperty("--my", `${y}px`);
  };

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      style={{
        "--glow": glowColor,
        ...style,
      } as CSSProperties}
    >
      {/* Spotlight */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), var(--glow), transparent 60%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
