export interface ValuesQuiz {
  values_religion?: number;       // 1–5: how important is religion in daily life
  values_family?: number;         // 1–5: how close/involved is family
  values_children?: "yes" | "no" | "maybe";
  values_finances?: "saver" | "balanced" | "spender";
  values_location?: "my_city" | "flexible" | "abroad";
}

// Adjacency maps for enum fields (partial matches score 0.5)
const CHILDREN_ADJACENT: Record<string, string[]> = {
  yes: ["maybe"],
  no: ["maybe"],
  maybe: ["yes", "no"],
};
const FINANCES_ADJACENT: Record<string, string[]> = {
  saver: ["balanced"],
  balanced: ["saver", "spender"],
  spender: ["balanced"],
};
const LOCATION_ADJACENT: Record<string, string[]> = {
  my_city: ["flexible"],
  flexible: ["my_city", "abroad"],
  abroad: ["flexible"],
};

function enumScore(a: string, b: string, adjacent: Record<string, string[]>): number {
  if (a === b) return 1;
  if (adjacent[a]?.includes(b)) return 0.5;
  return 0;
}

/**
 * Returns 0–100 compatibility score, or null if fewer than 2 fields are shared.
 */
export function calcValuesMatch(a: ValuesQuiz | null | undefined, b: ValuesQuiz | null | undefined): number | null {
  if (!a || !b) return null;

  const scores: number[] = [];

  if (a.values_religion != null && b.values_religion != null) {
    scores.push(1 - Math.abs(a.values_religion - b.values_religion) / 4);
  }
  if (a.values_family != null && b.values_family != null) {
    scores.push(1 - Math.abs(a.values_family - b.values_family) / 4);
  }
  if (a.values_children && b.values_children) {
    scores.push(enumScore(a.values_children, b.values_children, CHILDREN_ADJACENT));
  }
  if (a.values_finances && b.values_finances) {
    scores.push(enumScore(a.values_finances, b.values_finances, FINANCES_ADJACENT));
  }
  if (a.values_location && b.values_location) {
    scores.push(enumScore(a.values_location, b.values_location, LOCATION_ADJACENT));
  }

  if (scores.length < 2) return null;
  return Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100);
}
