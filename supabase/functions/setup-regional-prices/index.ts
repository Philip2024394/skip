/**
 * ONE-TIME SETUP: Creates regional Stripe prices for all 5 tiers
 * (asia, au, us, uk, eu) and stores price IDs in the regional_prices table.
 *
 * Run once:
 *   supabase functions invoke setup-regional-prices --no-verify-jwt
 *
 * This is idempotent — re-running skips already-created prices.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REGIONS = ["asia", "au", "us", "uk", "eu"] as const;
type Region = typeof REGIONS[number];

interface ProductSpec {
  key: string;           // product_key used in regional_prices table
  name: string;
  description: string;
  mode: "subscription" | "payment";
  interval?: "month";
  // price_cents per region
  prices: Record<Region, number>;
}

// ── Pricing — benchmarked against Tinder / Bumble / Badoo / Hinge (2025) ─────
//
//  Tinder Gold:   Asia $8.50  AU $19   US $24.99  UK £19.99  EU €22.99
//  Bumble Boost:  Asia $6.50  AU $16   US $22.99  UK £17.99  EU €19.99
//  Badoo Premium: Asia $5.00  AU $10   US $12.99  UK £8.99   EU €9.99   ← cheapest competitor
//  Hinge+:        Asia $6.00  AU $13   US $19.99  UK £14.99  EU €17.99
//
//  Cost model:
//    Stripe fees:     8–16% (cross-border +1.5% for non-US cards + FX +1%)
//    Bandwidth CDN:   $0.015/active user/month (Supabase + Cloudflare cache)
//    Supabase Pro:    $25/mo base
//    Break-even:      ~800 active users (mixed regions)
//    Min viable charge: $1.80 after cross-border fees → set Asia floor at $1.49
//
//  Strategy: 20–25% below Badoo on subscriptions. Per-unit at/below Tinder.
const PRODUCTS: ProductSpec[] = [
  {
    key: "whatsapp",
    name: "Contact Unlock",
    description: "Unlock off-app contact (WhatsApp / phone) for a matched connection.",
    mode: "payment",
    // No direct competitor equivalent. Priced above Tinder Boost (Asia $1.80, US $3.99)
    // since it delivers actual contact details — a higher-value action.
    prices: { asia: 199, au: 349, us: 499, uk: 399, eu: 349 },
  },
  {
    key: "vip",
    name: "Connect Monthly",
    description: "Unlimited contact unlocks for all your matches. Cancel anytime.",
    mode: "subscription",
    interval: "month",
    // vs Badoo Premium (cheapest sub competitor): Asia $5→$3.99 (-20%), US $12.99→$9.99 (-23%)
    prices: { asia: 399, au: 699, us: 999, uk: 799, eu: 699 },
  },
  {
    key: "global_dating",
    name: "Global Dating",
    description: "Like and match with anyone worldwide. Perfect for expats and travellers.",
    mode: "subscription",
    interval: "month",
    // Premium tier, no direct competitor equivalent. Priced above Connect Monthly.
    prices: { asia: 499, au: 899, us: 1299, uk: 999, eu: 899 },
  },
  {
    key: "teddy_room",
    name: "Teddy Room",
    description: "Private PIN-protected media vault for personal photos & videos shared with trusted connections.",
    mode: "subscription",
    interval: "month",
    // Unique feature. Priced same as Connect Monthly.
    prices: { asia: 399, au: 699, us: 999, uk: 799, eu: 699 },
  },
  {
    key: "plusone",
    name: "Plus-One Premium",
    description: "Trusted companion badge for events, dinners & social outings.",
    mode: "payment",
    // Premium social feature, no competitor equivalent. Higher price justified.
    prices: { asia: 1299, au: 2299, us: 3499, uk: 2799, eu: 2299 },
  },
  {
    key: "boost",
    name: "Profile Boost",
    description: "Top of swipe stack for 1 hour. 5-10x more views.",
    mode: "payment",
    // vs Tinder Boost: Asia $1.80, AU $3.85, US $3.99, UK £2.99, EU €3.49
    // Priced at or below Tinder. Asia floor $1.49 (above Stripe viable minimum).
    prices: { asia: 149, au: 249, us: 299, uk: 249, eu: 249 },
  },
  {
    key: "superlike",
    name: "Super Like",
    description: "Flash first in their library. They get notified.",
    mode: "payment",
    // vs Tinder single Super Like: Asia $1.80, US $3.99
    prices: { asia: 149, au: 249, us: 299, uk: 249, eu: 249 },
  },
  {
    key: "verified",
    name: "Verified Badge",
    description: "Submit your ID for admin approval. Rank higher and build trust.",
    mode: "payment",
    // Unique feature (competitors don't sell verified). Priced as trust premium.
    prices: { asia: 199, au: 349, us: 499, uk: 399, eu: 349 },
  },
  {
    key: "incognito",
    name: "Incognito Mode",
    description: "Browse profiles invisibly for 24 hours.",
    mode: "payment",
    // Bumble equivalent is included in Premium sub. We sell standalone.
    prices: { asia: 199, au: 349, us: 499, uk: 399, eu: 349 },
  },
  {
    key: "spotlight",
    name: "Spotlight",
    description: "Featured at the top of everyone's stack for 24 hours.",
    mode: "payment",
    // vs Tinder Boost (30 min): Asia $1.80, US $3.99. Ours lasts 24h = better value,
    // so priced above Tinder Boost but below Tinder Super Boost ($14.99).
    prices: { asia: 299, au: 499, us: 699, uk: 599, eu: 499 },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2024-11-20.acacia",
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const results: Array<{
    product_key: string;
    region: Region;
    price_id: string;
    price_cents: number;
    status: "created" | "existing" | "skipped";
  }> = [];

  const errors: string[] = [];

  for (const spec of PRODUCTS) {
    // Find or create the Stripe product (one per key)
    let stripeProductId: string;
    try {
      const existing = await stripe.products.search({
        query: `metadata['2dateme_key']:'${spec.key}'`,
        limit: 1,
      });

      if (existing.data.length > 0) {
        stripeProductId = existing.data[0].id;
      } else {
        const product = await stripe.products.create({
          name: `2DateMe — ${spec.name}`,
          description: spec.description,
          metadata: { "2dateme_key": spec.key },
        });
        stripeProductId = product.id;
      }
    } catch (err) {
      errors.push(`Product ${spec.key}: ${err.message}`);
      continue;
    }

    for (const region of REGIONS) {
      const priceCents = spec.prices[region];

      // Check if we already have a price for this product+region
      const { data: existingRow } = await supabase
        .from("regional_prices")
        .select("price_id")
        .eq("product_key", spec.key)
        .eq("region", region)
        .maybeSingle();

      if (existingRow?.price_id) {
        results.push({
          product_key: spec.key, region, price_id: existingRow.price_id,
          price_cents: priceCents, status: "existing",
        });
        continue;
      }

      // Create Stripe price
      try {
        const priceParams: Stripe.PriceCreateParams = {
          product: stripeProductId,
          unit_amount: priceCents,
          currency: "usd",
          nickname: `2dateme_${spec.key}_${region}`,
          metadata: { "2dateme_key": spec.key, "2dateme_region": region },
        };

        if (spec.mode === "subscription" && spec.interval) {
          priceParams.recurring = { interval: spec.interval };
        }

        const price = await stripe.prices.create(priceParams);

        // Store in Supabase
        await supabase.from("regional_prices").upsert({
          product_key: spec.key,
          region,
          price_id: price.id,
          price_cents: priceCents,
          is_subscription: spec.mode === "subscription",
        }, { onConflict: "product_key,region" });

        results.push({
          product_key: spec.key, region, price_id: price.id,
          price_cents: priceCents, status: "created",
        });
      } catch (err) {
        errors.push(`${spec.key}/${region}: ${err.message}`);
      }
    }
  }

  // Build a summary table for output
  const summary: Record<string, Record<string, string>> = {};
  for (const r of results) {
    if (!summary[r.product_key]) summary[r.product_key] = {};
    summary[r.product_key][r.region] =
      `$${(r.price_cents / 100).toFixed(2)} → ${r.price_id} [${r.status}]`;
  }

  return new Response(
    JSON.stringify({ ok: true, summary, errors, total: results.length }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
  );
});
