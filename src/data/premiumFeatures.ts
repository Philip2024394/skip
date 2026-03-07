import { Rocket, Star, ShieldCheck, EyeOff, Crown, Calendar, type LucideIcon } from "lucide-react";

export const FEATURE_ICON_MAP: Record<string, LucideIcon> = {
  rocket: Rocket,
  star: Star,
  shield: ShieldCheck,
  "eye-off": EyeOff,
  crown: Crown,
  calendar: Calendar,
};

export const FEATURE_GRADIENT_MAP: Record<string, string> = {
  love: "gradient-love",
  gold: "gradient-gold",
  fresh: "gradient-fresh",
  stealth: "gradient-stealth",
  vip: "gradient-vip",
};

export const getFeatureIcon = (icon: string): LucideIcon => FEATURE_ICON_MAP[icon] ?? Rocket;
export const getFeatureGradient = (color: string): string => FEATURE_GRADIENT_MAP[color] ?? "gradient-love";

export interface PremiumFeature {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: string;
  priceCents: number;
  priceId: string;
  productId: string;
  color: "love" | "gold" | "fresh" | "stealth" | "vip";
  icon: "rocket" | "star" | "shield" | "eye-off" | "crown" | "calendar";
  isSubscription?: boolean;
  perks?: string[];
}

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: "vip",
    name: "VIP Monthly",
    emoji: "👑",
    description: "Everything you need — unlocks, super likes & a VIP crown badge. Best value!",
    price: "$10.99/mo",
    priceCents: 1099,
    priceId: "price_vip_monthly",
    productId: "prod_vip_monthly",
    color: "vip",
    icon: "crown",
    isSubscription: true,
    perks: [
      "💬 7 WhatsApp unlocks (worth $13.93)",
      "⭐ 5 Super Likes (worth $9.95)",
      "👑 VIP crown badge on your profile",
      "🔝 Priority in New Profiles list",
      "💰 Save 54% vs buying separately",
    ],
  },
  {
    id: "plusone",
    name: "Plus-One Premium",
    emoji: "🎫",
    description: "Your trusted companion for events & outings. Connect via WhatsApp to coordinate plans and enjoy experiences together.",
    price: "$19.99",
    priceCents: 1999,
    priceId: "price_plusone_premium",
    productId: "prod_plusone_premium",
    color: "fresh",
    icon: "calendar",
    perks: [
      "🎫 Plus-One badge on your profile",
      "💬 WhatsApp connection for fast coordination",
      "🍽 Dinners, weddings, concerts & more",
      "✈️ Travel outings & social gatherings",
      "🤝 Great company, no pressure — events & experiences",
    ],
  },
  {
    name: "Profile Boost",
    emoji: "🚀",
    description: "Top of swipe stack for 1 hour. 5–10× more views!",
    price: "$1.99",
    priceCents: 199,
    priceId: "price_1T7uTvCziCJ7fHo6QGPM0Sbe",
    productId: "prod_U66hQQ12Kx9DDY",
    color: "love",
    icon: "rocket",
  },
  {
    id: "superlike",
    name: "Super Like",
    emoji: "⭐",
    description: "Flash in their library first! They get notified.",
    price: "$1.99",
    priceCents: 199,
    priceId: "price_1T7uUDCziCJ7fHo66Y25YpR8",
    productId: "prod_U66hD6NFSYvktZ",
    color: "gold",
    icon: "star",
  },
  {
    id: "verified",
    name: "Verified Badge",
    emoji: "✅",
    description: "Get verified. Rank higher & build trust.",
    price: "$1.99",
    priceCents: 199,
    priceId: "price_1T7uUbCziCJ7fHo6I0yFB1LE",
    productId: "prod_U66i8xESPCM6zQ",
    color: "fresh",
    icon: "shield",
  },
  {
    id: "incognito",
    name: "Incognito Mode",
    emoji: "👻",
    description: "Browse profiles invisibly for 24 hours. Nobody sees you!",
    price: "$2.99",
    priceCents: 299,
    priceId: "price_1T7v58CziCJ7fHo6NxmFNW5i",
    productId: "prod_U67JujahvpqT9r",
    color: "stealth",
    icon: "eye-off",
  },
  {
    id: "spotlight",
    name: "Spotlight",
    emoji: "🌟",
    description: "Featured at top of everyone's stack for 24 hours!",
    price: "$4.99",
    priceCents: 499,
    priceId: "price_1T7v84CziCJ7fHo6jLqFWDwi",
    productId: "prod_U67MFLT34mU8zm",
    color: "gold",
    icon: "star",
  },
];
