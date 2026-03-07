/**
 * Platform-aware payment utility.
 *
 * - Android (Capacitor native): routes through RevenueCat → Google Play Billing
 * - Web / iOS: routes through Stripe Checkout (existing flow)
 *
 * Google Play Billing Policy requires that digital in-app purchases
 * on Android use Google Play Billing and NOT an external payment processor.
 */

import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import type { PremiumFeature } from "@/data/premiumFeatures";

/** Map our feature IDs to RevenueCat/Google Play product IDs */
const GOOGLE_PLAY_PRODUCT_IDS: Record<string, string> = {
  superlike: "skiptheapp_superlike_199",
  boost: "skiptheapp_boost_199",
  verified: "skiptheapp_verified_199",
  incognito: "skiptheapp_incognito_299",
  spotlight: "skiptheapp_spotlight_499",
  vip: "skiptheapp_vip_monthly_1099",
  plusone: "skiptheapp_plusone_1999",
};

/** True when running as a native Android/iOS Capacitor app */
export const isNativePlatform = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

/**
 * Purchase a feature.
 *
 * On Android → triggers Google Play Billing via RevenueCat.
 * On Web    → opens Stripe Checkout in a new tab (existing flow).
 *
 * @returns `{ url }` for web (open in browser) or `void` for native (handled internally)
 */
export async function purchaseFeature(
  feature: PremiumFeature,
  options?: { targetUserId?: string }
): Promise<{ url?: string; error?: string }> {
  if (isNativePlatform()) {
    return purchaseNative(feature, options);
  }
  return purchaseWeb(feature, options);
}

// ─── WEB: Stripe Checkout ────────────────────────────────────────────────────

async function purchaseWeb(
  feature: PremiumFeature,
  options?: { targetUserId?: string }
): Promise<{ url?: string; error?: string }> {
  try {
    const fnName = feature.id === "vip" ? "purchase-subscription" : "purchase-feature";
    const { data, error } = await supabase.functions.invoke(fnName, {
      body: {
        priceId: feature.priceId,
        featureId: feature.id,
        ...(options?.targetUserId ? { targetUserId: options.targetUserId } : {}),
      },
    });
    if (error) throw error;
    if (!data?.url) throw new Error("No checkout URL returned");
    return { url: data.url };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Purchase failed";
    return { error: msg };
  }
}

// ─── ANDROID: Google Play Billing via RevenueCat ──────────────────────────────

async function purchaseNative(
  feature: PremiumFeature,
  _options?: { targetUserId?: string }
): Promise<{ url?: string; error?: string }> {
  const productId = GOOGLE_PLAY_PRODUCT_IDS[feature.id];
  if (!productId) {
    return { error: `No Google Play product configured for feature: ${feature.id}` };
  }

  try {
    // Dynamically import so web builds don't fail if the plugin isn't installed
    const { Purchases } = await import("@revenuecat/purchases-capacitor");

    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      (p) => p.product.identifier === productId
    );

    if (!pkg) {
      return {
        error: `Product "${productId}" not found in RevenueCat offerings. Check your RevenueCat dashboard.`,
      };
    }

    await Purchases.purchasePackage({ aPackage: pkg });

    // After successful purchase, activate server-side via our edge function
    const { error: activateErr } = await supabase.functions.invoke("activate-feature-native", {
      body: { featureId: feature.id },
    });
    if (activateErr) throw activateErr;

    return {};
  } catch (err: unknown) {
    // RevenueCat throws a specific error when user cancels — don't show as error
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UserCancelled") || msg.includes("PURCHASE_CANCELLED")) {
      return { error: "Purchase cancelled" };
    }
    return { error: msg };
  }
}
