/**
 * Real compatibility scoring between two profiles.
 * Returns a 0–100 score and an array of human-readable "why you match" reasons.
 */

export interface CompatibilityResult {
  score: number;           // 0–100
  reasons: string[];       // "You both…" sentences shown on card
  grade: "low" | "medium" | "high" | "excellent";
}

// ── Weight table (must sum to 100) ────────────────────────────────────────────
const WEIGHTS = {
  intent:        20,   // marriage/dating/unsure alignment
  religion:      18,   // relationship_goals.religion
  children:      10,   // relationship_goals.timeline or basic_info children
  lifestyle:     12,   // smoking + drinking + fitness
  language:       8,   // shared languages
  location:       8,   // same city / country
  interests:      9,   // overlap in interests array
  looking_for:    8,   // looking_for field match
  age_range:      7,   // age proximity (±5 = full, ±10 = half)
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function intentScore(a: string | undefined, b: string | undefined): number {
  if (!a || !b) return 0.5;
  if (a === b) return 1;
  // marriage + unsure = ok; dating + unsure = ok; marriage + dating = poor
  if ((a === "marriage" && b === "unsure") || (a === "unsure" && b === "marriage")) return 0.7;
  if ((a === "dating" && b === "unsure") || (a === "unsure" && b === "dating")) return 0.8;
  return 0.1; // marriage vs dating
}

function religionScore(a: string | undefined, b: string | undefined): number {
  if (!a || !b) return 0.5;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  if (norm(a) === norm(b)) return 1;
  // both abrahamic = partial
  const abrahamic = ["islam", "muslim", "christian", "christianity", "jewish", "judaism"];
  if (abrahamic.some(r => norm(a).includes(r)) && abrahamic.some(r => norm(b).includes(r))) return 0.5;
  return 0.2;
}

function lifestyleScore(
  smoking_a: string | null | undefined, smoking_b: string | null | undefined,
  drinking_a: string | null | undefined, drinking_b: string | null | undefined,
  fitness_a: string | null | undefined, fitness_b: string | null | undefined,
): number {
  const scores: number[] = [];
  const boolLike = (a?: string | null, b?: string | null) => {
    if (!a || !b) return null;
    const n = (s: string) => s.toLowerCase();
    if (n(a) === n(b)) return 1;
    const noWords = ["no", "never", "non", "none"];
    const aNo = noWords.some(w => n(a).includes(w));
    const bNo = noWords.some(w => n(b).includes(w));
    if (aNo && bNo) return 1;
    if (aNo !== bNo) return 0.1; // one smokes, one doesn't
    return 0.6;
  };
  const s = boolLike(smoking_a, smoking_b);
  const d = boolLike(drinking_a, drinking_b);
  const f = fitness_a && fitness_b ? (fitness_a.toLowerCase() === fitness_b.toLowerCase() ? 1 : 0.5) : null;
  if (s != null) scores.push(s);
  if (d != null) scores.push(d);
  if (f != null) scores.push(f);
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.5;
}

function languageScore(a: string[] | undefined, b: string[] | undefined): number {
  if (!a?.length || !b?.length) return 0.5;
  const norm = (s: string) => s.toLowerCase().trim();
  const setA = new Set(a.map(norm));
  const shared = b.map(norm).filter(l => setA.has(l));
  return shared.length > 0 ? 1 : 0.2;
}

function locationScore(
  city_a: string | undefined, country_a: string | undefined,
  city_b: string | undefined, country_b: string | undefined,
): number {
  if (city_a && city_b && city_a.toLowerCase() === city_b.toLowerCase()) return 1;
  if (country_a && country_b && country_a.toLowerCase() === country_b.toLowerCase()) return 0.7;
  return 0.3;
}

function interestsScore(a: string[] | undefined, b: string[] | undefined): number {
  if (!a?.length || !b?.length) return 0.4;
  const norm = (s: string) => s.toLowerCase().trim();
  const setA = new Set(a.map(norm));
  const shared = b.map(norm).filter(i => setA.has(i));
  return Math.min(1, shared.length / 3); // 3+ shared = full score
}

function lookingForScore(a: string | undefined, b: string | undefined): number {
  if (!a || !b) return 0.5;
  const n = (s: string) => s.toLowerCase();
  if (n(a) === n(b)) return 1;
  return 0.4;
}

function ageRangeScore(age_a: number | undefined, age_b: number | undefined): number {
  if (!age_a || !age_b) return 0.5;
  const diff = Math.abs(age_a - age_b);
  if (diff <= 2) return 1;
  if (diff <= 5) return 0.85;
  if (diff <= 10) return 0.6;
  if (diff <= 15) return 0.35;
  return 0.1;
}

// ── Reason generator ──────────────────────────────────────────────────────────

function buildReasons(a: any, b: any): string[] {
  const reasons: string[] = [];

  // Intent
  if (a.intent && b.intent && a.intent === b.intent) {
    const labels: Record<string, string> = { marriage: "both want marriage", dating: "both want to date", unsure: "are both open-minded" };
    if (labels[a.intent]) reasons.push(`You ${labels[a.intent]}`);
  }

  // Religion
  const rel_a = a.relationship_goals?.religion || a.religion;
  const rel_b = b.relationship_goals?.religion || b.religion;
  if (rel_a && rel_b && rel_a.toLowerCase().includes(rel_b.toLowerCase().slice(0, 4))) {
    reasons.push(`Share the same faith`);
  }

  // Languages
  const langs_a: string[] = a.languages || a.basic_info?.languages || [];
  const langs_b: string[] = b.languages || b.basic_info?.languages || [];
  const sharedLangs = langs_a.filter(l => langs_b.some(lb => lb.toLowerCase() === l.toLowerCase()));
  if (sharedLangs.length) reasons.push(`Both speak ${sharedLangs[0]}`);

  // Interests
  const int_a: string[] = a.interests || [];
  const int_b: string[] = b.interests || [];
  const sharedInt = int_a.filter(i => int_b.some(ib => ib.toLowerCase() === i.toLowerCase()));
  if (sharedInt.length >= 2) reasons.push(`Share ${sharedInt.length} interests`);
  else if (sharedInt.length === 1) reasons.push(`Both enjoy ${sharedInt[0]}`);

  // Location
  if (a.city && b.city && a.city.toLowerCase() === b.city.toLowerCase()) {
    reasons.push(`Both in ${a.city}`);
  } else if (a.country && b.country && a.country.toLowerCase() === b.country.toLowerCase()) {
    reasons.push(`Both in ${a.country}`);
  }

  // Lifestyle
  const smk_a = a.smoking || a.lifestyle_info?.smoking;
  const smk_b = b.smoking || b.lifestyle_info?.smoking;
  if (smk_a && smk_b) {
    const noSmoke = ["no", "never", "non"];
    if (noSmoke.some(w => smk_a.toLowerCase().includes(w)) && noSmoke.some(w => smk_b.toLowerCase().includes(w))) {
      reasons.push("Neither smokes");
    }
  }
  const drk_a = a.drinking || a.lifestyle_info?.drinking;
  const drk_b = b.drinking || b.lifestyle_info?.drinking;
  if (drk_a && drk_b) {
    const noAlc = ["no", "never", "non", "halal", "rarely"];
    if (noAlc.some(w => drk_a.toLowerCase().includes(w)) && noAlc.some(w => drk_b.toLowerCase().includes(w))) {
      reasons.push("Alcohol-free lifestyle");
    }
  }

  // Age proximity
  if (a.age && b.age && Math.abs(a.age - b.age) <= 3) {
    reasons.push(`Close in age`);
  }

  return reasons.slice(0, 4); // show max 4 reasons
}

// ── Main export ───────────────────────────────────────────────────────────────

export function calcCompatibilityScore(currentUser: any, profile: any): CompatibilityResult {
  if (!currentUser || !profile) {
    const s = 60;
    return { score: s, reasons: [], grade: "medium" };
  }

  const w = WEIGHTS;
  let total = 0;

  total += w.intent        * intentScore(currentUser.intent, profile.intent);
  total += w.religion      * religionScore(
    currentUser.relationship_goals?.religion || currentUser.religion,
    profile.relationship_goals?.religion || profile.religion,
  );
  total += w.lifestyle     * lifestyleScore(
    currentUser.smoking || currentUser.lifestyle_info?.smoking,
    profile.smoking || profile.lifestyle_info?.smoking,
    currentUser.drinking || currentUser.lifestyle_info?.drinking,
    profile.drinking || profile.lifestyle_info?.drinking,
    currentUser.fitness,
    profile.fitness,
  );
  total += w.language      * languageScore(
    currentUser.languages || currentUser.basic_info?.languages,
    profile.languages || profile.basic_info?.languages,
  );
  total += w.location      * locationScore(currentUser.city, currentUser.country, profile.city, profile.country);
  total += w.interests     * interestsScore(currentUser.interests, profile.interests);
  total += w.looking_for   * lookingForScore(currentUser.looking_for, profile.looking_for);
  total += w.age_range     * ageRangeScore(currentUser.age, profile.age);
  total += w.children      * 0.5; // neutral default (no children field on both yet)

  const score = Math.min(99, Math.max(30, Math.round(total)));
  const grade =
    score >= 85 ? "excellent" :
    score >= 70 ? "high" :
    score >= 55 ? "medium" : "low";

  const reasons = buildReasons(currentUser, profile);

  return { score, reasons, grade };
}

export function gradeColor(grade: CompatibilityResult["grade"]): string {
  switch (grade) {
    case "excellent": return "#a855f7"; // purple
    case "high":      return "#ec4899"; // pink
    case "medium":    return "#f59e0b"; // amber
    default:          return "#6b7280"; // gray
  }
}
