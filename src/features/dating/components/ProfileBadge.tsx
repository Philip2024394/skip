import { getPrimaryBadgeKey } from "@/shared/utils/profileBadges";

interface ProfileBadgeProps {
  profile: any;
  t?: (key: string) => string;
  isProfilePage?: boolean;
}

const BADGE_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  is_visiting:       { icon: "✈️", color: "#60a5fa", bg: "rgba(96,165,250,0.15)",  border: "rgba(96,165,250,0.4)"  },
  available_tonight: { icon: "🌙", color: "#fbbf24", bg: "rgba(251,191,36,0.15)",  border: "rgba(251,191,36,0.4)"  },
  is_plusone:        { icon: "✚",  color: "#a78bfa", bg: "rgba(167,139,250,0.15)", border: "rgba(167,139,250,0.4)" },
  weekend_plans:     { icon: "📅", color: "#34d399", bg: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.4)"  },
  meet_now_active:   { icon: "⚡", color: "#fbbf24", bg: "rgba(251,191,36,0.18)",  border: "rgba(251,191,36,0.5)"  },
};

export default function ProfileBadge({ profile, t }: ProfileBadgeProps) {
  // Out Now takes highest priority
  const isOutNow = profile?.meet_now_active && profile?.meet_now_expires_at && new Date(profile.meet_now_expires_at) > new Date();
  const key = isOutNow ? "meet_now_active" : getPrimaryBadgeKey(profile);
  if (!key) return null;

  const cfg = BADGE_CONFIG[key];
  if (!cfg) return null;

  const label =
    key === "meet_now_active"   ? "Out Now" :
    key === "available_tonight" ? (t?.("popup.freeTonight") ?? "Free Tonight") :
    key === "is_plusone"        ? "Plus One" :
    key === "weekend_plans"     ? "Weekend" :
    key === "is_visiting"       ? (profile?.visiting_city || "Visiting") :
    "";

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 20,
      padding: "4px 10px 4px 6px",
      fontSize: 11, fontWeight: 700,
      color: cfg.color,
      backdropFilter: "blur(8px)",
      boxShadow: `0 0 8px ${cfg.border}`,
      flexShrink: 0,
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: "50%",
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11,
      }}>
        {cfg.icon}
      </span>
      {label}
    </span>
  );
}
