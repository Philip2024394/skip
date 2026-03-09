export type PrimaryBadgeKey =
  | "is_plusone"
  | "available_tonight"
  | "generous_lifestyle"
  | "weekend_plans"
  | "late_night_chat"
  | "no_drama"
  | null;

export type BadgeLike = {
  is_plusone?: boolean | null;
  available_tonight?: boolean | null;
  generous_lifestyle?: boolean | null;
  weekend_plans?: boolean | null;
  late_night_chat?: boolean | null;
  no_drama?: boolean | null;
};

export function getPrimaryBadgeKey(p: BadgeLike | null | undefined): PrimaryBadgeKey {
  if (!p) return null;
  if (p.is_plusone) return "is_plusone";
  if (p.available_tonight) return "available_tonight";
  if (p.generous_lifestyle) return "generous_lifestyle";
  if (p.weekend_plans) return "weekend_plans";
  if (p.late_night_chat) return "late_night_chat";
  if (p.no_drama) return "no_drama";
  return null;
}
