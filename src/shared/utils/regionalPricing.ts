/**
 * Regional pricing utilities.
 *
 * 5 tiers benchmarked against Tinder / Bumble / Hinge (2025):
 *   Tinder Gold US $29.99/mo → we price $5.99/mo (80% cheaper)
 *   Tinder Boost   US $3.99  → we price $2.49
 *   Bumble Boost   US $14.99/mo
 *   Hinge+         US $19.99/mo
 *
 * We win on value — pay-per-connection beats subscription lock-in.
 */

export type PricingRegion = "asia" | "au" | "us" | "uk" | "eu";

/** Countries → region mapping */
const COUNTRY_REGION: Record<string, PricingRegion> = {
  // Southeast Asia
  Indonesia: "asia", Malaysia: "asia", Singapore: "asia",
  Philippines: "asia", Thailand: "asia", Vietnam: "asia",
  Myanmar: "asia", Cambodia: "asia", Laos: "asia", Brunei: "asia",
  "Timor-Leste": "asia",
  // South Asia
  India: "asia", Bangladesh: "asia", Pakistan: "asia",
  "Sri Lanka": "asia", Nepal: "asia", Bhutan: "asia",
  // East Asia (mid-tier — use asia rate, close to SEA purchasing power)
  "South Korea": "asia", Japan: "asia",

  // Australia / NZ
  Australia: "au", "New Zealand": "au",

  // United Kingdom
  "United Kingdom": "uk",

  // Europe
  Germany: "eu", France: "eu", Italy: "eu", Spain: "eu",
  Netherlands: "eu", Belgium: "eu", Austria: "eu", Finland: "eu",
  Portugal: "eu", Sweden: "eu", Norway: "eu", Denmark: "eu",
  Switzerland: "eu", Poland: "eu", Ireland: "eu",
  "Czech Republic": "eu", Greece: "eu", Hungary: "eu",
  Romania: "eu", Bulgaria: "eu", Croatia: "eu",

  // Everything else → US tier (US, Canada, Middle East, Africa, LatAm, etc.)
};

export function getRegionForCountry(country: string | null | undefined): PricingRegion {
  if (!country) return "us";
  return COUNTRY_REGION[country] ?? "us";
}

// ── Competitor benchmarks (2025) ─────────────────────────────────────────────
// Tinder Gold:   Asia $8.50  AU $19   US $24.99  UK £19.99  EU €22.99
// Bumble Boost:  Asia $6.50  AU $16   US $22.99  UK £17.99  EU €19.99
// Badoo Premium: Asia $5.00  AU $10   US $12.99  UK £8.99   EU €9.99  ← cheapest
// Hinge+:        Asia $6.00  AU $13   US $19.99  UK £14.99  EU €17.99
// Tinder Boost:  Asia $1.80  AU $3.85 US $3.99   UK £2.99   EU €3.49
//
// 2DateMe: 20–25% below Badoo on subs. Per-unit at/below Tinder.
// All above Stripe minimum viable threshold ($1.49 Asia, $1.80 cross-border).
// Business costs included: Stripe 8–16%, bandwidth $0.015/user/mo, Supabase $25 base.

/** Price in USD cents per product × region */
export const REGIONAL_PRICE_CENTS: Record<string, Record<PricingRegion, number>> = {
  // Contact unlock — above Tinder Boost (delivers real contact, higher value)
  whatsapp:      { asia: 199, au: 349, us: 499, uk: 399, eu: 349 },
  // Connect Monthly — 20–23% below Badoo Premium (cheapest competitor sub)
  vip:           { asia: 399, au: 699, us: 999, uk: 799, eu: 699 },
  // Global Dating — premium tier, unique feature, no direct competitor
  global_dating: { asia: 499, au: 899, us: 1299, uk: 999,  eu: 899 },
  // Teddy Room — private media vault, unique feature
  teddy_room:    { asia: 399, au: 699, us: 999,  uk: 799,  eu: 699 },
  // Plus-One Premium — social companion feature, no competitor equivalent
  plusone:       { asia: 1299, au: 2299, us: 3499, uk: 2799, eu: 2299 },
  // Boost (1h) — at/below Tinder Boost. Asia floor $1.49 (above Stripe viable min)
  boost:         { asia: 149, au: 249, us: 299, uk: 249, eu: 249 },
  // Super Like — at/below Tinder single Super Like
  superlike:     { asia: 149, au: 249, us: 299, uk: 249, eu: 249 },
  // Verified Badge — trust feature, no competitor equivalent
  verified:      { asia: 199, au: 349, us: 499, uk: 399, eu: 349 },
  // Incognito (24h) — standalone vs competitors bundling this in premium subs
  incognito:     { asia: 199, au: 349, us: 499, uk: 399, eu: 349 },
  // Spotlight (24h) — priced above Tinder Boost (30 min) since ours lasts 24h
  spotlight:     { asia: 299, au: 499, us: 699, uk: 599, eu: 499 },
};

/**
 * Returns the price in USD cents for a product in the user's region.
 * Falls back to US price if product or region is unknown.
 */
export function getRegionalPriceCents(
  productKey: string,
  country: string | null | undefined
): number {
  const region = getRegionForCountry(country);
  return REGIONAL_PRICE_CENTS[productKey]?.[region]
    ?? REGIONAL_PRICE_CENTS[productKey]?.["us"]
    ?? 199; // absolute fallback
}

/**
 * Hook-friendly: returns region + a price getter for the current user's country.
 * Call with the country string from the user's profile.
 */
export function getRegionalPricing(country: string | null | undefined) {
  const region = getRegionForCountry(country);
  return {
    region,
    priceCents: (productKey: string) => getRegionalPriceCents(productKey, country),
  };
}

/** Competitive context labels shown in UI (optional) */
export const REGION_LABELS: Record<PricingRegion, string> = {
  asia: "Southeast Asia",
  au:   "Australia",
  us:   "United States",
  uk:   "United Kingdom",
  eu:   "Europe",
};
