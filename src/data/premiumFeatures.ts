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
    // ⚠️ BEFORE LAUNCH: Create a VIP Monthly recurring price in Stripe dashboard
    // and replace the priceId and productId below with the real values.
    id: "vip",
    name: "VIP Monthly",
    emoji: "✨",
    description: "Everything you need — unlocks, super likes & a VIP crown badge. Best value!",
    price: "$10.99/mo",
    priceCents: 1099,
    priceId: import.meta.env.VITE_STRIPE_PRICE_VIP ?? "price_vip_monthly",
    productId: import.meta.env.VITE_STRIPE_PRODUCT_VIP ?? "prod_vip_monthly",
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
    // ⚠️ BEFORE LAUNCH: Create a Plus-One Premium one-time price in Stripe dashboard
    // and replace the priceId and productId below with the real values.
    id: "plusone",
    name: "Plus-One Premium",
    emoji: "🎫",
    description: "Your trusted companion for events & outings. Connect via WhatsApp to coordinate plans and enjoy experiences together.",
    price: "$19.99",
    priceCents: 1999,
    priceId: import.meta.env.VITE_STRIPE_PRICE_PLUSONE ?? "price_plusone_premium",
    productId: import.meta.env.VITE_STRIPE_PRODUCT_PLUSONE ?? "prod_plusone_premium",
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
    id: "boost",
    name: "Profile Boost",
    emoji: "🚀",
    description: "Top of swipe stack for 1 hour. 5–10× more views!",
    price: "$1.99",
    priceCents: 199,
    priceId: import.meta.env.VITE_STRIPE_PRICE_WHATSAPP ?? "price_1T8NbHBChzWuxQIpeGY4LLYQ",
    productId: "prod_U6amf4mWJWevjl",
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
    priceId: import.meta.env.VITE_STRIPE_PRICE_WHATSAPP ?? "price_1T8NbHBChzWuxQIpeGY4LLYQ",
    productId: "prod_U6amf4mWJWevjl",
    color: "gold",
    icon: "star",
  },
  {
    id: "verified",
    name: "Verified Badge",
    emoji: "✅",
    description: "Get verified. Submit your ID for admin approval. Rank higher & build trust.",
    price: "$2.99",
    priceCents: 299,
    priceId: import.meta.env.VITE_STRIPE_PRICE_WHATSAPP ?? "price_1T8NbHBChzWuxQIpeGY4LLYQ",
    productId: "prod_U6amf4mWJWevjl",
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
    priceId: "price_1T8O2lBChzWuxQIpGqRgVknt",
    productId: "prod_U6bFm7PAeDlwEp",
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
    priceId: "price_1T8O3pBChzWuxQIpA14Ci1J3",
    productId: "prod_U6bGbiKxJQ6G9D",
    color: "gold",
    icon: "star",
  },
];
