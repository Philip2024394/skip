import { Payment } from "./types";

export const DEFAULT_IMG_POS = { x: 50, y: 50, zoom: 100 };

export const getDateIdeaCategory = (idea: string): string => {
  if (idea.includes("☕") || idea.includes("🍵") || idea.includes("🧋") || idea.includes("🥤")) return "Café & Drinks";
  if (idea.includes("🍝") || idea.includes("🍽️") || idea.includes("🍣") || idea.includes("🍕") || idea.includes("🥐") || idea.includes("🍰") || idea.includes("🍦") || idea.includes("🍜") || idea.includes("🍱") || idea.includes("🔥") || idea.includes("🧑‍🍳")) return "Food & Dining";
  if (idea.includes("🌳") || idea.includes("🧺") || idea.includes("🌅") || idea.includes("🏖️") || idea.includes("⛰️") || idea.includes("🌺") || idea.includes("🌿") || idea.includes("🦆") || idea.includes("🦢")) return "Outdoors & Nature";
  if (idea.includes("🚣") || idea.includes("🌊") || idea.includes("🤿") || idea.includes("🏄") || idea.includes("🪂") || idea.includes("🚤")) return "Water & Beach";
  if (idea.includes("🎬") || idea.includes("🎵") || idea.includes("🎷") || idea.includes("😂") || idea.includes("🎤") || idea.includes("🎨") || idea.includes("🏛️") || idea.includes("💃") || idea.includes("📷") || idea.includes("⚽")) return "Entertainment & Culture";
  if (idea.includes("🎳") || idea.includes("🎯") || idea.includes("🔐") || idea.includes("⛸️") || idea.includes("🏎️") || idea.includes("🎢") || idea.includes("🎱") || idea.includes("🏓") || idea.includes("🏸") || idea.includes("🏐") || idea.includes("🧗") || idea.includes("🧘")) return "Active & Fun";
  if (idea.includes("🌃") || idea.includes("⭐") || idea.includes("✨") || idea.includes("🎶") || idea.includes("🛋️") || idea.includes("🕯️")) return "Romantic & Relaxed";
  if (idea.includes("🎣") || idea.includes("⛺") || idea.includes("🚗") || idea.includes("🏘️")) return "Outdoor Lifestyle";
  if (idea.includes("🛍️") || idea.includes("🍵") || idea.includes("📚") || idea.includes("🌙")) return "Simple & Modest";
  if (idea.includes("🕺") || idea.includes("🎧") || idea.includes("🍸") || idea.includes("🍹") || idea.includes("🍺") || idea.includes("🍾")) return "Nightlife & Party";
  if (idea.includes("🐶") || idea.includes("🐱") || idea.includes("🎲") || idea.includes("🍪") || idea.includes("🪁")) return "Cute & Playful";
  return "Other";
};

export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", "Bangladesh", "Belgium",
  "Bolivia", "Brazil", "Bulgaria", "Cambodia", "Canada", "Chile", "China", "Colombia", "Croatia",
  "Czech Republic", "Denmark", "Ecuador", "Egypt", "Ethiopia", "Finland", "France", "Germany",
  "Ghana", "Greece", "Guatemala", "Honduras", "Hungary", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Japan", "Jordan", "Kenya", "Malaysia", "Mexico", "Morocco",
  "Myanmar", "Nepal", "Netherlands", "New Zealand", "Nigeria", "Norway", "Pakistan", "Peru",
  "Philippines", "Poland", "Portugal", "Romania", "Russia", "Saudi Arabia", "Senegal",
  "Singapore", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Sweden",
  "Switzerland", "Taiwan", "Tanzania", "Thailand", "Tunisia", "Turkey", "Uganda", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Venezuela", "Vietnam", "Zimbabwe",
] as const;

// Interests pill options for admin Details tab
export const OPT = {
  interests: ["Travel", "Cooking", "Fitness", "Music", "Art", "Gaming", "Reading", "Movies", "Nature", "Fashion", "Tech", "Food", "Coffee", "Beach", "Hiking", "Yoga", "Photography", "Dancing", "Pets", "Spirituality"],
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────────
export const startOf = (unit: "day" | "week" | "month") => {
  const d = new Date();
  if (unit === "day") { d.setHours(0, 0, 0, 0); }
  if (unit === "week") { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); }
  if (unit === "month") { d.setDate(1); d.setHours(0, 0, 0, 0); }
  return d;
};

export const rev = (payments: Payment[], since?: Date) =>
  payments
    .filter(p => p.status === "paid" && (!since || new Date(p.created_at) >= since))
    .reduce((s, p) => s + p.amount_cents, 0) / 100;

export const fmtRev = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(2)}`;

export const isOnlineNow = (last_seen_at: string | null) => {
  if (!last_seen_at) return false;
  return Date.now() - new Date(last_seen_at).getTime() < 5 * 60 * 1000;
};

export const isNewToday = (created_at: string) =>
  new Date(created_at) >= startOf("day");
