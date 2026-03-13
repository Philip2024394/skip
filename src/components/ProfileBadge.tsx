/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LOCKED COMPONENT — DO NOT EDIT WITHOUT ADMIN APPROVAL      ║
 * ║                                                              ║
 * ║  Rules enforced here (permanent, non-negotiable):           ║
 * ║  • Badge position: top-3 left-3 (absolute, top left only)   ║
 * ║  • Badge color:    YELLOW (#FFD700 / yellow-400)            ║
 * ║  • ONE badge per card, rendered at top-left                 ║
 * ║  • No badge duplicate in name / bottom area                 ║
 * ║                                                             ║
 * ║  Any change to position or color MUST be approved by admin. ║
 * ╚═════════════════════════════════════════════════════════════╝
 */

import { getPrimaryBadgeKey } from "@/utils/profileBadges";

// ── Locked style constants ────────────────────────────────────────────────
// ADMIN-LOCKED: do not change these without explicit admin approval
const BADGE_POSITION = "absolute top-3 left-3 z-20" as const;
const BADGE_BASE =
  "flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-yellow-400/70 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.45)]" as const;
const BADGE_ICON_COLOR = "text-yellow-400" as const;

interface ProfileBadgeProps {
  profile: any;
  /** Pass a translation function if you have one; otherwise badge shows English label */
  t?: (key: string) => string;
}

/**
 * Renders the single primary profile badge — always top-left, always yellow.
 * This is the ONLY place badge styling is defined. Import this component
 * wherever a badge needs to appear on a profile card.
 */
export default function ProfileBadge({ profile, t }: ProfileBadgeProps) {
  const key = getPrimaryBadgeKey(profile);
  if (!key) return null;

  const labels: Record<string, { icon: string; label: string }> = {
    available_tonight: { icon: "🌙", label: t?.("popup.freeTonight") ?? "Free Tonight" },
    is_plusone:        { icon: "✚", label: "+1 Plus One" },
    generous_lifestyle:{ icon: "🎁", label: "Generous" },
    weekend_plans:     { icon: "📅", label: "Weekend Plans" },
    late_night_chat:   { icon: "🌙", label: "Late Night" },
    no_drama:          { icon: "✨", label: "No Drama" },
  };

  const entry = labels[key];
  if (!entry) return null;

  return (
    <div className={`${BADGE_POSITION} ${BADGE_BASE}`}>
      <span className={BADGE_ICON_COLOR}>{entry.icon}</span>
      {entry.label}
    </div>
  );
}
