export type ContactPreference = 'whatsapp' | 'video' | 'both';

export const CONTACT_PREFERENCE_OPTIONS: {
  value: ContactPreference;
  icon: string;
  label: string;
  description: string;
}[] = [
  {
    value: 'whatsapp',
    icon: '📱',
    label: 'WhatsApp Only',
    description: 'Connect via WhatsApp messaging',
  },
  {
    value: 'video',
    icon: '📹',
    label: 'Video Call Only',
    description: 'Connect via live video call',
  },
  {
    value: 'both',
    icon: '📱📹',
    label: "Both — I'm flexible",
    description: 'Open to WhatsApp or Video Call',
  },
];

/**
 * Resolves the connection type when two users match based on their preferences.
 *
 * Rules:
 *  Both WhatsApp          → whatsapp
 *  Both Video             → video
 *  Both flexible          → both
 *  One WhatsApp + flexible → whatsapp
 *  One Video + flexible   → video
 *  WhatsApp vs Video      → whatsapp (default winner)
 */
export function resolveConnectionType(
  pref1: string,
  pref2: string,
): ContactPreference {
  const a = (pref1 || 'whatsapp') as ContactPreference;
  const b = (pref2 || 'whatsapp') as ContactPreference;

  if (a === 'both' && b === 'both') return 'both';
  if (a === 'both') return b;
  if (b === 'both') return a;
  if (a === b) return a;
  // Mismatch — WhatsApp wins as default
  return 'whatsapp';
}

export function getPreferenceLabel(pref: string): string {
  const opt = CONTACT_PREFERENCE_OPTIONS.find((o) => o.value === pref);
  return opt?.label ?? 'WhatsApp Only';
}

export function getPreferenceIcon(pref: string): string {
  const opt = CONTACT_PREFERENCE_OPTIONS.find((o) => o.value === pref);
  return opt?.icon ?? '📱';
}
