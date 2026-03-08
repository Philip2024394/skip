import { useMemo } from "react";
import logoHeart from "@/assets/logo-heart.png";

const FLOATING_HEARTS_COUNT = 8;
const FLOAT_DURATION_MS = 2800;

interface AppLogoProps {
  /** Image alt text */
  alt?: string;
  /** Tailwind classes for the logo img (e.g. w-10 h-10, w-12 h-12) */
  className?: string;
  /** Optional inline style for the img (e.g. filter for drop-shadow) */
  style?: React.CSSProperties;
}

/**
 * App logo with animated hearts floating up from behind the image.
 * Use everywhere the app logo is shown for consistent branding.
 */
const AppLogo = ({ alt = "2DateMe", className = "w-12 h-12 object-contain drop-shadow-xl flex-shrink-0", style }: AppLogoProps) => {
  const hearts = useMemo(
    () =>
      Array.from({ length: FLOATING_HEARTS_COUNT }, (_, i) => ({
        id: i,
        left: 15 + Math.random() * 70,
        delay: (i / FLOATING_HEARTS_COUNT) * (FLOAT_DURATION_MS * 0.6),
        duration: FLOAT_DURATION_MS + Math.random() * 800,
        size: 8 + Math.random() * 10,
      })),
    []
  );

  return (
    <div className="relative inline-flex items-center justify-center overflow-visible" aria-hidden="true">
      {/* Floating hearts — behind the logo, rise up and fade */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
        {hearts.map((h) => (
          <span
            key={h.id}
            className="absolute opacity-0 text-primary"
            style={{
              left: `${h.left}%`,
              bottom: "-10%",
              width: h.size,
              height: h.size,
              transform: "translateX(-50%)",
              animation: `logoHeartsFloat ${h.duration}ms ease-out ${h.delay}ms infinite`,
            }}
          >
            ❤️
          </span>
        ))}
      </div>
      {/* Logo on top */}
      <img
        src={logoHeart}
        alt={alt}
        className={`relative block ${className}`}
        style={{ zIndex: 1, ...style }}
      />
    </div>
  );
};

export default AppLogo;
