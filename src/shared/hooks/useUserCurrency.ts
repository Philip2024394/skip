import { formatPrice } from "@/shared/utils/currency";

const COUNTRY_STORAGE_KEY = "userProfileCountry";

/** Returns the user's country (from localStorage, set after auth). */
export function getUserCountry(): string | null {
  try {
    return localStorage.getItem(COUNTRY_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Persist the user's country so useUserCurrency can read it. */
export function setUserCountry(country: string) {
  try {
    localStorage.setItem(COUNTRY_STORAGE_KEY, country);
  } catch {
    // ignore
  }
}

/**
 * Hook that returns a price formatter for the current user's country.
 *
 * Usage:
 *   const { fmt } = useUserCurrency();
 *   fmt(199)         // "$1.99" | "Rp28,422" | "€1.83" etc.
 *   fmt(1099, "/mo") // "$10.99/mo" | "Rp173,882/mo" etc.
 */
export function useUserCurrency() {
  const country = getUserCountry();
  return {
    country,
    fmt: (cents: number, suffix = "") => formatPrice(cents, country, suffix),
  };
}
