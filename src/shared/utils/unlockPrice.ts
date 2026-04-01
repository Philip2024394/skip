/**
 * Unlock pricing: profiles with any badge cost $2.99; others $1.99.
 * Same features and flow for both.
 */

export type ProfileLike = {
  available_tonight?: boolean;
  is_plusone?: boolean;
  weekend_plans?: boolean;
};

export const UNLOCK_CENTS_DEFAULT = 199;
export const UNLOCK_CENTS_BADGES = 299;

export function hasUnlockBadges(p: ProfileLike | null | undefined): boolean {
  if (!p) return false;
  return !!(
    p.available_tonight ||
    p.is_plusone ||
    p.weekend_plans
  );
}

export function getUnlockPriceCents(p: ProfileLike | null | undefined): number {
  return hasUnlockBadges(p) ? UNLOCK_CENTS_BADGES : UNLOCK_CENTS_DEFAULT;
}

export function getUnlockPriceLabel(p: ProfileLike | null | undefined): string {
  return hasUnlockBadges(p) ? "$2.99" : "$1.99";
}
