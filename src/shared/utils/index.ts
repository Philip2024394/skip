// Shared utils exports

/** Returns only the first word of a name — strips last names and special chars */
export const firstName = (name: string): string =>
  (name || "").trim().split(/\s+/)[0].replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, "") || name;
