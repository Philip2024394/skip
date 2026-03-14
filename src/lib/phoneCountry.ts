import { COUNTRIES_WITH_CODES } from "@/data/countries";

// Build reverse map: digits-only prefix → country name
// Sorted longest-first so "+1-242" (Bahamas) matches before "+1" (USA/Canada)
const PREFIX_TO_COUNTRY: Array<[string, string]> = Object.entries(COUNTRIES_WITH_CODES)
  .map(([country, code]) => [code.replace(/\D/g, ""), country])
  .sort((a, b) => b[0].length - a[0].length);

/**
 * Given a WhatsApp number string (e.g. "+62 812 3456 789"),
 * returns the matching country name or null if unrecognised.
 */
export function detectCountryFromPhone(phone: string): string | null {
  const digits = phone.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  if (!digits || digits.length < 3) return null;
  for (const [prefix, country] of PREFIX_TO_COUNTRY) {
    if (digits.startsWith(prefix)) return country;
  }
  return null;
}

/**
 * Returns the dial code for a country, e.g. "Indonesia" → "+62"
 */
export function getDialCode(country: string): string {
  return COUNTRIES_WITH_CODES[country] ?? "";
}
