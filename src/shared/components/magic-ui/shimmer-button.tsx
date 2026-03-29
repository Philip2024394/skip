import { motion } from "framer-motion";
import { cn } from "@/shared/services/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  gradient?: string;
  shimmerColor?: string;
  glowColor?: string;
  icon?: ReactNode;
  label: string;
  sublabel?: string;
}

/**
 * Magic UI — ShimmerButton
 * Full-width drawer / card button with animated shimmer sweep,
 * pulsing icon glow, and a soft drop-shadow halo.
 */
export function ShimmerButton({
  gradient = "linear-gradient(135deg, rgba(233,30,140,0.22), rgba(156,39,176,0.22))",
  shimmerColor = "rgba(255,255,255,0.14)",
  glowColor = "rgba(233,30,140,0.35)",
  icon,
  label,
  sublabel,
  className,
  onClick,
  ...props
}: ShimmerButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={cn("relative overflow-hidden w-full text-left cursor-pointer", className)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "15px 17px",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.16)",
        background: gradient,
        boxShadow: `0 4px 28px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.07)`,
      }}
      {...(props as any)}
    >
      {/* ── Shimmer sweep ── */}
      <motion.div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          width: "50%",
          background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
          transform: "skewX(-12deg)",
        }}
        animate={{ left: ["-55%", "165%"] }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          repeatDelay: 2.2,
          ease: "easeInOut",
        }}
      />

      {/* ── Icon with pulse glow ── */}
      {icon && (
        <motion.span
          animate={{
            filter: [
              `drop-shadow(0 0 5px ${glowColor})`,
              `drop-shadow(0 0 14px ${glowColor})`,
              `drop-shadow(0 0 5px ${glowColor})`,
            ],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: 26, flexShrink: 0, lineHeight: 1, position: "relative", zIndex: 1 }}
        >
          {icon}
        </motion.span>
      )}

      {/* ── Labels ── */}
      <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
        <p style={{ color: "#fff", fontWeight: 800, fontSize: 15, margin: 0, lineHeight: 1.3 }}>
          {label}
        </p>
        {sublabel && (
          <p style={{ color: "rgba(255,255,255,0.52)", fontSize: 12, margin: "2px 0 0", lineHeight: 1 }}>
            {sublabel}
          </p>
        )}
      </div>

      {/* ── Chevron arrow ── */}
      <svg
        width="16" height="16" viewBox="0 0 16 16" fill="none"
        style={{ flexShrink: 0, opacity: 0.45, position: "relative", zIndex: 1 }}
      >
        <path d="M6 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.button>
  );
}
