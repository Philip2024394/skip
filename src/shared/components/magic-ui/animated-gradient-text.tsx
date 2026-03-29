import { CSSProperties, ReactNode } from "react";
import { cn } from "@/shared/services/utils";

interface AnimatedGradientTextProps {
  children: ReactNode;
  className?: string;
  /** Tailwind or inline gradient string, e.g. "from-pink-400 via-purple-400 to-pink-400" */
  gradient?: string;
  /** Animation duration (CSS value) */
  duration?: string;
  style?: CSSProperties;
}

/**
 * Magic UI — AnimatedGradientText
 * Text with a slowly moving gradient. Uses background-clip: text.
 *
 * Usage:
 *   <AnimatedGradientText>Quick Access</AnimatedGradientText>
 */
export function AnimatedGradientText({
  children,
  className,
  gradient = "linear-gradient(90deg, #ec4899, #a855f7, #ec4899, #f97316, #ec4899)",
  duration = "5s",
  style,
}: AnimatedGradientTextProps) {
  return (
    <span
      className={cn("inline-block font-black", className)}
      style={{
        background: gradient,
        backgroundSize: "300% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: `magic-gradient-x ${duration} linear infinite`,
        ...style,
      }}
    >
      {children}
      <style>{`
        @keyframes magic-gradient-x {
          0%   { background-position: 0%   50% }
          50%  { background-position: 100% 50% }
          100% { background-position: 0%   50% }
        }
      `}</style>
    </span>
  );
}
