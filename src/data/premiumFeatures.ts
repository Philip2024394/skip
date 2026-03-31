import { Rocket, Star, ShieldCheck, EyeOff, Crown, Calendar, type LucideIcon } from "lucide-react";
import { REGIONAL_PRICE_CENTS, getRegionForCountry, type PricingRegion } from "@/shared/utils/regionalPricing";
import { getUserCountry } from "@/shared/hooks/useUserCurrency";

/**
 * Returns the price in USD cents for a feature in the current user's region.
 * Uses REGIONAL_PRICE_CENTS when available, falls back to the feature's base priceCents.
 */
export function getFeaturePriceCents(featureId: string, country?: string | null): number {
  const c = country ?? getUserCountry();
  const table = REGIONAL_PRICE_CENTS[featureId];
  if (table) return table[getRegionForCountry(c)];
  // Resolved at call time (after PREMIUM_FEATURES is defined below)
  return PREMIUM_FEATURES.find(f => f.id === featureId)?.priceCents ?? 199;
}

export function getCurrentRegion(): PricingRegion {
  return getRegionForCountry(getUserCountry());
}

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
    id: "teddy_room",
    name: "Teddy Room",
    emoji: "🧸",
    description: "Private PIN-protected media vault. Share personal photos & videos only with connections you trust.",
    price: "$9.99/mo",
    priceCents: 999,
    priceId: import.meta.env.VITE_STRIPE_PRICE_TEDDY_ROOM ?? "price_teddy_room_monthly",
    productId: import.meta.env.VITE_STRIPE_PRODUCT_TEDDY_ROOM ?? "prod_teddy_room",
    color: "vip",
    icon: "crown",
    isSubscription: true,
    perks: [
      "🧸 Private PIN-protected media vault",
      "📸 Unlimited photo & video uploads",
      "🔐 Grant access only to chosen matches",
      "👁️ See who has viewed your vault",
      "🚫 Revoke access anytime",
    ],
  },
  {
    // ⚠️ BEFORE LAUNCH: Create a Global Dating recurring price at $6.99/month in Stripe dashboard
    // and replace the priceId and productId below with the real values.
    id: "global_dating",
    name: "Global Dating",
    emoji: "🌍",
    description: "Like and match with anyone worldwide — not just your country. Perfect for expats, travellers, and international connections.",
    price: "$12.99/mo",
    priceCents: 1299,
    priceId: import.meta.env.VITE_STRIPE_PRICE_GLOBAL_DATING ?? "price_global_dating_monthly",
    productId: import.meta.env.VITE_STRIPE_PRODUCT_GLOBAL_DATING ?? "prod_global_dating",
    color: "vip",
    icon: "rocket",
    isSubscription: true,
    perks: [
      "🌍 Like & match with profiles from any country",
      "💬 Unlock contacts worldwide after matching",
      "✈️ Perfect for expats, travellers & international love",
      "📍 Local feed still works normally",
      "🔄 Cancel anytime — no commitment",
    ],
  },
  {
    // ⚠️ BEFORE LAUNCH: Create a Connect Monthly recurring price at $4.99 in Stripe dashboard
    // and replace the priceId and productId below with the real values.
    id: "vip",
    name: "Connect Monthly",
    emoji: "⚡",
    description: "Unlimited contact unlocks for all your matches. Less than a coffee — cancel anytime.",
    price: "$9.99/mo",
    priceCents: 999,
    priceId: import.meta.env.VITE_STRIPE_PRICE_VIP ?? "price_vip_monthly",
    productId: import.meta.env.VITE_STRIPE_PRODUCT_VIP ?? "prod_vip_monthly",
    color: "vip",
    icon: "crown",
    isSubscription: true,
    perks: [
      "💬 Unlimited contact unlocks — no limits",
      "👑 Connect badge on your profile",
      "🔝 Priority in New Profiles list",
      "⭐ 3 Super Likes per month included",
      "💰 Vs $1.99/unlock — breaks even at 3 unlocks",
    ],
  },
  {
    // ⚠️ BEFORE LAUNCH: Create a Plus-One Premium one-time price in Stripe dashboard
    // and replace the priceId and productId below with the real values.
    id: "plusone",
    name: "Plus-One Premium",
    emoji: "🎫",
    description: "Your trusted companion for events & outings. Connect via WhatsApp to coordinate plans and enjoy experiences together.",
    price: "$34.99",
    priceCents: 3499,
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
    price: "$2.99",
    priceCents: 299,
    priceId: import.meta.env.VITE_STRIPE_PRICE_BOOST ?? "price_1T8NbHBChzWuxQIpeGY4LLYQ",
    productId: import.meta.env.VITE_STRIPE_PRODUCT_BOOST ?? "prod_U6amf4mWJWevjl",
    color: "love",
    icon: "rocket",
    perks: [
      "⏱ Lasts 1 hour",
      "👀 5–10× more profile views",
      "📊 See views & matches after",
      "🔝 Jump to the top of the swipe stack",
    ],
  },
  {
    id: "superlike",
    name: "Super Like",
    emoji: "⭐",
    description: "Flash in their library first! They get notified.",
    price: "$2.99",
    priceCents: 299,
    priceId: import.meta.env.VITE_STRIPE_PRICE_SUPERLIKE ?? "price_1T8NbHBChzWuxQIpeGY4LLYQ",
    productId: import.meta.env.VITE_STRIPE_PRODUCT_SUPERLIKE ?? "prod_U6amf4mWJWevjl",
    color: "gold",
    icon: "star",
    perks: [
      "⭐ Appears first in their library",
      "🔔 They get a notification",
      "💫 Highlighted with a star badge",
      "💘 3× more likely to match",
    ],
  },
  {
    id: "verified",
    name: "Verified Badge",
    emoji: "✅",
    description: "Get verified. Submit your ID for admin approval. Rank higher & build trust.",
    price: "$4.99",
    priceCents: 499,
    priceId: import.meta.env.VITE_STRIPE_PRICE_VERIFIED ?? "price_1T8NbHBChzWuxQIpeGY4LLYQ",
    productId: import.meta.env.VITE_STRIPE_PRODUCT_VERIFIED ?? "prod_U6amf4mWJWevjl",
    color: "fresh",
    icon: "shield",
    perks: [
      "✅ Verified badge on your profile",
      "📈 Rank higher in search results",
      "🛡️ Show others you're real",
      "💎 Stand out from the crowd",
    ],
  },
  {
    id: "incognito",
    name: "Incognito Mode",
    emoji: "👻",
    description: "Browse profiles invisibly for 24 hours. Nobody sees you!",
    price: "$4.99",
    priceCents: 499,
    priceId: import.meta.env.VITE_STRIPE_PRICE_INCOGNITO ?? "price_1T8O2lBChzWuxQIpGqRgVknt",
    productId: import.meta.env.VITE_STRIPE_PRODUCT_INCOGNITO ?? "prod_U6bFm7PAeDlwEp",
    color: "stealth",
    icon: "eye-off",
    perks: [
      "👻 Invisible for 24 hours",
      "🔍 Browse profiles privately",
      "🛡️ No trace left behind",
      "🔒 Your profile hidden from everyone",
    ],
  },
  {
    id: "spotlight",
    name: "Spotlight",
    emoji: "🌟",
    description: "Featured at top of everyone's stack for 24 hours!",
    price: "$6.99",
    priceCents: 699,
    priceId: import.meta.env.VITE_STRIPE_PRICE_SPOTLIGHT ?? "price_1T8O3pBChzWuxQIpA14Ci1J3",
    productId: import.meta.env.VITE_STRIPE_PRODUCT_SPOTLIGHT ?? "prod_U6bGbiKxJQ6G9D",
    color: "gold",
    icon: "star",
    perks: [
      "🌟 Featured at top of everyone's stack",
      "⏰ Lasts a full 24 hours",
      "📊 10–20× more views",
      "🎯 Maximum visibility guaranteed",
    ],
  },
];
