/** Maps country name → display currency. Rates are indicative (USD base). */
interface CurrencyInfo {
  code: string;
  symbol: string;
  /** How many local currency units = 1 USD (approximate) */
  rate: number;
  /** Decimals shown in formatted price */
  decimals: number;
}

const EUR: CurrencyInfo = { code: "EUR", symbol: "€",  rate: 0.92,  decimals: 2 };

export const COUNTRY_CURRENCY: Record<string, CurrencyInfo> = {
  // Southeast Asia
  "Indonesia":        { code: "IDR", symbol: "Rp",  rate: 15800, decimals: 0 },
  "Malaysia":         { code: "MYR", symbol: "RM",  rate: 4.7,   decimals: 2 },
  "Singapore":        { code: "SGD", symbol: "S$",  rate: 1.35,  decimals: 2 },
  "Philippines":      { code: "PHP", symbol: "₱",   rate: 58,    decimals: 0 },
  "Thailand":         { code: "THB", symbol: "฿",   rate: 35,    decimals: 0 },
  "Vietnam":          { code: "VND", symbol: "₫",   rate: 25000, decimals: 0 },

  // South Asia
  "India":            { code: "INR", symbol: "₹",   rate: 84,    decimals: 0 },

  // East Asia
  "Japan":            { code: "JPY", symbol: "¥",   rate: 153,   decimals: 0 },
  "South Korea":      { code: "KRW", symbol: "₩",   rate: 1340,  decimals: 0 },
  "China":            { code: "CNY", symbol: "¥",   rate: 7.2,   decimals: 2 },

  // Europe (EUR zone)
  "Germany":          EUR,
  "France":           EUR,
  "Italy":            EUR,
  "Spain":            EUR,
  "Netherlands":      EUR,
  "Belgium":          EUR,
  "Austria":          EUR,
  "Finland":          EUR,
  "Portugal":         EUR,

  // Europe (non-EUR)
  "United Kingdom":   { code: "GBP", symbol: "£",   rate: 0.79,  decimals: 2 },
  "Sweden":           { code: "SEK", symbol: "kr",  rate: 10.5,  decimals: 2 },
  "Norway":           { code: "NOK", symbol: "kr",  rate: 10.8,  decimals: 2 },
  "Denmark":          { code: "DKK", symbol: "kr",  rate: 6.9,   decimals: 2 },
  "Switzerland":      { code: "CHF", symbol: "Fr",  rate: 0.9,   decimals: 2 },
  "Poland":           { code: "PLN", symbol: "zł",  rate: 4.0,   decimals: 2 },
  "Russia":           { code: "RUB", symbol: "₽",   rate: 89,    decimals: 0 },
  "Turkey":           { code: "TRY", symbol: "₺",   rate: 32,    decimals: 0 },
  "Israel":           { code: "ILS", symbol: "₪",   rate: 3.7,   decimals: 2 },

  // Americas
  "Canada":           { code: "CAD", symbol: "C$",  rate: 1.37,  decimals: 2 },
  "Australia":        { code: "AUD", symbol: "A$",  rate: 1.56,  decimals: 2 },
  "Brazil":           { code: "BRL", symbol: "R$",  rate: 5.2,   decimals: 2 },
  "Mexico":           { code: "MXN", symbol: "MX$", rate: 17.5,  decimals: 0 },
  "Argentina":        { code: "ARS", symbol: "AR$", rate: 950,   decimals: 0 },

  // Middle East & Africa
  "United Arab Emirates": { code: "AED", symbol: "د.إ", rate: 3.67, decimals: 2 },
  "Saudi Arabia":     { code: "SAR", symbol: "﷼",   rate: 3.75,  decimals: 2 },
  "Egypt":            { code: "EGP", symbol: "E£",  rate: 31,    decimals: 0 },
  "Nigeria":          { code: "NGN", symbol: "₦",   rate: 1600,  decimals: 0 },
  "South Africa":     { code: "ZAR", symbol: "R",   rate: 18.5,  decimals: 0 },
  "Kenya":            { code: "KES", symbol: "KSh", rate: 130,   decimals: 0 },
};

const USD: CurrencyInfo = { code: "USD", symbol: "$", rate: 1, decimals: 2 };

export function getCurrencyForCountry(country: string | null | undefined): CurrencyInfo {
  if (!country) return USD;
  return COUNTRY_CURRENCY[country] ?? USD;
}

/**
 * Format a USD price (in cents) for display in the user's local currency.
 * Passes through the "/mo" suffix for subscription prices.
 */
export function formatPrice(cents: number, country: string | null | undefined, suffix = ""): string {
  const cur = getCurrencyForCountry(country);
  const local = (cents / 100) * cur.rate;

  const formatted = cur.decimals === 0
    ? Math.round(local).toLocaleString("en-US")
    : local.toFixed(cur.decimals);

  return `${cur.symbol}${formatted}${suffix}`;
}
