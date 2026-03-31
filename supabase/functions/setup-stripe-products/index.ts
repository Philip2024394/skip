/**
 * ONE-TIME SETUP: Creates all 2DateMe products + prices in Stripe.
 * Call once via: supabase functions invoke setup-stripe-products --no-verify-jwt
 * Returns the price/product IDs to paste into .env + Supabase secrets.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProductSpec {
  key: string;           // env var key prefix, e.g. STRIPE_PRICE_VIP
  name: string;
  description: string;
  mode: "subscription" | "payment";
  amount: number;        // cents
  currency: string;
  interval?: "month";
}

const PRODUCTS: ProductSpec[] = [
  {
    key: "VIP",
    name: "Connect Monthly",
    description: "Unlimited contact unlocks for all your matches. Cancel anytime.",
    mode: "subscription",
    amount: 499,
    currency: "usd",
    interval: "month",
  },
  {
    key: "GLOBAL_DATING",
    name: "Global Dating",
    description: "Like and match with anyone worldwide. Perfect for expats and travellers.",
    mode: "subscription",
    amount: 699,
    currency: "usd",
    interval: "month",
  },
  {
    key: "TEDDY_ROOM",
    name: "Teddy Room",
    description: "Private PIN-protected media vault for personal photos & videos shared with trusted connections.",
    mode: "subscription",
    amount: 499,
    currency: "usd",
    interval: "month",
  },
  {
    key: "PLUSONE",
    name: "Plus-One Premium",
    description: "Trusted companion badge for events & outings.",
    mode: "payment",
    amount: 1999,
    currency: "usd",
  },
  {
    key: "BOOST",
    name: "Profile Boost",
    description: "Top of swipe stack for 1 hour — 5–10× more views.",
    mode: "payment",
    amount: 199,
    currency: "usd",
  },
  {
    key: "SUPERLIKE",
    name: "Super Like",
    description: "Flash in their library first — they get notified instantly.",
    mode: "payment",
    amount: 199,
    currency: "usd",
  },
  {
    key: "VERIFIED",
    name: "Verified Badge",
    description: "Photo-verified badge — rank higher and build trust.",
    mode: "payment",
    amount: 299,
    currency: "usd",
  },
  {
    key: "INCOGNITO",
    name: "Incognito Mode",
    description: "Browse profiles invisibly for 24 hours.",
    mode: "payment",
    amount: 299,
    currency: "usd",
  },
  {
    key: "SPOTLIGHT",
    name: "Spotlight",
    description: "Featured at top of everyone's stack for 24 hours.",
    mode: "payment",
    amount: 499,
    currency: "usd",
  },
  {
    key: "WHATSAPP",
    name: "WhatsApp Unlock",
    description: "Unlock WhatsApp contact for a matched profile.",
    mode: "payment",
    amount: 199,
    currency: "usd",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not set in Supabase secrets" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2024-11-20.acacia" });
  const results: Record<string, { priceId: string; productId: string; amount: number; mode: string }> = {};
  const errors: string[] = [];

  for (const spec of PRODUCTS) {
    try {
      // Check if product already exists (idempotent by name search)
      const existingProducts = await stripe.products.search({
        query: `name:"${spec.name}"`,
        limit: 1,
      });

      let product: Stripe.Product;
      if (existingProducts.data.length > 0) {
        product = existingProducts.data[0];
      } else {
        product = await stripe.products.create({
          name: spec.name,
          description: spec.description,
          metadata: { app: "2dateme", key: spec.key.toLowerCase() },
        });
      }

      // Check for existing active price for this product
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 10,
      });

      const matchingPrice = existingPrices.data.find(p => {
        if (p.unit_amount !== spec.amount) return false;
        if (spec.mode === "subscription") return p.recurring?.interval === "month";
        return p.type === "one_time";
      });

      let price: Stripe.Price;
      if (matchingPrice) {
        price = matchingPrice;
      } else {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: spec.amount,
          currency: spec.currency,
          ...(spec.mode === "subscription"
            ? { recurring: { interval: "month" } }
            : {}),
          metadata: { app: "2dateme", key: spec.key.toLowerCase() },
        });
      }

      results[spec.key] = {
        priceId: price.id,
        productId: product.id,
        amount: spec.amount,
        mode: spec.mode,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${spec.key}: ${msg}`);
    }
  }

  // Build .env snippet
  const envLines = Object.entries(results).map(([key, val]) =>
    `VITE_STRIPE_PRICE_${key}=${val.priceId}\nVITE_STRIPE_PRODUCT_${key}=${val.productId}`
  ).join("\n");

  // Build Supabase secrets snippet
  const secretLines = Object.entries(results).map(([key, val]) =>
    `STRIPE_PRICE_${key}=${val.priceId}\nSTRIPE_PRODUCT_${key}=${val.productId}`
  ).join("\n");

  return new Response(
    JSON.stringify({
      success: errors.length === 0,
      results,
      errors,
      env_snippet: envLines,
      supabase_secrets_snippet: secretLines,
    }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
  );
});
