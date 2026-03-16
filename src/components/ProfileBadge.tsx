/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  PROFILE PAGE BADGE MODIFICATION APPROVED BY ADMIN           ║
 * ║                                                              ║
 * ║  Changes approved:                                           ║
 * ║  • Show badges on profile pages (over name)                 ║
 * ║  • Remove yellow container for profile page badges          ║
 * ║  • Position: over profile name (not top-left)              ║
 * ║  • Style: text only, no background, no icon                  ║
 * ║                                                             ║
 * ║  Home page badges remain locked: top-left, yellow, icon     ║
 * ╚═════════════════════════════════════════════════════════════╝
 */

import { getPrimaryBadgeKey } from "@/utils/profileBadges";

// ── Locked style constants for HOME PAGE (admin-locked) ─────────────────────
// ADMIN-LOCKED: do not change these without explicit admin approval
const BADGE_POSITION = "absolute top-3 left-3 z-20" as const;
const BADGE_BASE =
  "flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-yellow-400/70 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.45)]" as const;
const BADGE_ICON_COLOR = "text-yellow-400" as const;

// ── Profile page badge style (approved modification) ───────────────────────
const PROFILE_PAGE_BADGE_STYLE = "text-yellow-400 font-bold text-xs" as const;

interface ProfileBadgeProps {
  profile: any;
  /** Pass a translation function if you have one; otherwise badge shows English label */
  t?: (key: string) => string;
  /** Whether this is on a profile page (shows badge over name) vs home page (shows yellow badge) */
  isProfilePage?: boolean;
}

/**
 * Renders the single primary profile badge.
 * - Home page: top-left, yellow with icon (locked style)
 * - Profile page: over name, text only (approved modification)
 */
export default function ProfileBadge({ profile, t, isProfilePage = false }: ProfileBadgeProps) {
  const key = getPrimaryBadgeKey(profile);
  if (!key) return null;

  const labels: Record<string, { icon: string; label: string }> = {
    available_tonight: { icon: "🌙", label: t?.("popup.freeTonight") ?? "Free Tonight" },
    is_plusone: { icon: "✚", label: "+1 Plus One" },
    generous_lifestyle: { icon: "🎁", label: "Generous" },
    weekend_plans: { icon: "📅", label: "Weekend Plans" },
    late_night_chat: { icon: "🌙", label: "Late Night" },
    no_drama: { icon: "✨", label: "No Drama" },
  };

  const entry = labels[key];
  if (!entry) return null;

  // Profile page: show text-only badge over name
  if (isProfilePage) {
    return (
      <span className={PROFILE_PAGE_BADGE_STYLE}>
        {entry.label}
      </span>
    );
  }

  // Home page: show locked yellow badge with icon at top-left
  return (
    <div className={`${BADGE_POSITION} ${BADGE_BASE}`}>
      <span className={BADGE_ICON_COLOR}>{entry.icon}</span>
      {entry.label}
    </div>
  );
}
