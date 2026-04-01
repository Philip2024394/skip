export type PrimaryBadgeKey =
  | "is_visiting"
  | "is_plusone"
  | "available_tonight"
  | "weekend_plans"
  | null;

export type BadgeLike = {
  is_visiting?: boolean | null;
  visiting_badge_expires_at?: string | null;
  is_plusone?: boolean | null;
  available_tonight?: boolean | null;
  weekend_plans?: boolean | null;
};

/** Returns true if the visiting badge has not yet expired (or has no expiry set). */
export function isVisitingBadgeLive(p: BadgeLike | null | undefined): boolean {
  if (!p?.is_visiting) return false;
  if (!p.visiting_badge_expires_at) return true; // no expiry = always live
  return new Date(p.visiting_badge_expires_at) > new Date();
}

export function getPrimaryBadgeKey(p: BadgeLike | null | undefined): PrimaryBadgeKey {
  if (!p) return null;
  if (isVisitingBadgeLive(p)) return "is_visiting";
  if (p.is_plusone) return "is_plusone";
  if (p.available_tonight) return "available_tonight";
  if (p.weekend_plans) return "weekend_plans";
  return null;
}
