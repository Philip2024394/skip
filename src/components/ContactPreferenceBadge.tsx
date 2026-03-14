import { getPreferenceIcon } from "@/utils/contactPreference";

interface ContactPreferenceBadgeProps {
  preference?: string | null;
}

const LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  video: "Video Call",
  both: "Flexible",
};

/**
 * Small pill badge showing the user's first-contact preference.
 * Designed to sit near the name/location area — does NOT conflict
 * with the locked yellow ProfileBadge (top-left).
 */
export default function ContactPreferenceBadge({ preference }: ContactPreferenceBadgeProps) {
  if (!preference) return null;

  const icon = getPreferenceIcon(preference);
  const label = LABELS[preference] ?? "WhatsApp";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "rgba(255,255,255,0.10)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 20,
        padding: "2px 8px 2px 6px",
        fontSize: 10,
        fontWeight: 700,
        color: "rgba(255,255,255,0.85)",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 11 }}>{icon}</span>
      {label}
    </span>
  );
}
