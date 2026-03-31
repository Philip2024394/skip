import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fallback env-var price IDs (used before regional prices are set up)
const FALLBACK_PRICE_IDS: Record<string, string> = {
  vip:          Deno.env.get("STRIPE_PRICE_VIP")          || "",
  global_dating:Deno.env.get("STRIPE_PRICE_GLOBAL_DATING")|| "",
  teddy_room:   Deno.env.get("STRIPE_PRICE_TEDDY_ROOM")   || "",
  plusone:      Deno.env.get("STRIPE_PRICE_PLUSONE")       || "",
  boost:        Deno.env.get("STRIPE_PRICE_BOOST")         || "",
  superlike:    Deno.env.get("STRIPE_PRICE_SUPERLIKE")     || "",
  verified:     Deno.env.get("STRIPE_PRICE_VERIFIED")      || "",
  incognito:    Deno.env.get("STRIPE_PRICE_INCOGNITO")     || "",
  spotlight:    Deno.env.get("STRIPE_PRICE_SPOTLIGHT")     || "",
};

// Subscription feature IDs
const SUBSCRIPTION_FEATURES = new Set(["vip", "global_dating", "teddy_room"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    let legacyPriceId: string | undefined; // sent by old clients
    let featureId: string | undefined;
    let userRegion: string | undefined;    // asia | au | us | uk | eu
    let targetUserId: string | undefined;
    try {
      const body = await req.json();
      legacyPriceId = body?.priceId;
      featureId = body?.featureId;
      userRegion = body?.region;
      targetUserId = body?.targetUserId;
    } catch {
      return new Response(JSON.stringify({ error: "Missing or invalid request body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!featureId) {
      return new Response(JSON.stringify({ error: "Missing featureId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // ── Resolve price ID: regional table → fallback env → legacy client value ─
    let resolvedPriceId: string | undefined;

    if (userRegion) {
      const { data: regionalRow } = await supabaseAdmin
        .from("regional_prices")
        .select("price_id")
        .eq("product_key", featureId)
        .eq("region", userRegion)
        .maybeSingle();
      resolvedPriceId = regionalRow?.price_id ?? undefined;
    }

    if (!resolvedPriceId) {
      resolvedPriceId = FALLBACK_PRICE_IDS[featureId] || legacyPriceId;
    }

    if (!resolvedPriceId) {
      return new Response(JSON.stringify({ error: "No price found for this feature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const isSubscription = SUBSCRIPTION_FEATURES.has(featureId);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-11-20.acacia",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const sessionMetadata: Record<string, string> = {
      user_id: user.id,
      feature_id: featureId,
      region: userRegion || "us",
    };
    if (targetUserId) sessionMetadata.target_user_id = targetUserId;

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&feature=${featureId}`,
      cancel_url: `${req.headers.get("origin")}/dashboard`,
      metadata: sessionMetadata,
    };

    if (isSubscription) {
      (sessionParams as any).subscription_data = {
        metadata: { user_id: user.id, feature_id: featureId },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
