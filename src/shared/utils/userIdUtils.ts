/** Generate a deterministic 2D-XXXXX app user ID from any seed string (profile id, user id, etc.) */
export function generateAppUserId(seed: string): string {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) ^ seed.charCodeAt(i);
    hash |= 0;
  }
  const num = (Math.abs(hash) % 90000) + 10000; // always 5 digits: 10000–99999
  return `2D-${num}`;
}

/** Format an app user ID for display — adds a dash if missing */
export function formatAppUserId(id: string): string {
  if (!id) return "";
  if (id.startsWith("2D-")) return id;
  return `2D-${id}`;
}
