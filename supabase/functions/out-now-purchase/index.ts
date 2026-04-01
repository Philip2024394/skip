import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.0.0?target=deno";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OUT_NOW_PRICE_CENTS = 299; // $2.99 USD
const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    let targetUserId: string;
    let buyerId: string;

    try {
      const body = await req.json();
      targetUserId = body?.targetUserId;
      buyerId = body?.buyerId;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!targetUserId || !buyerId) {
      return new Response(JSON.stringify({ error: "targetUserId and buyerId are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // ── Fetch target profile ──────────────────────────────────────────────────
    const { data: target, error: targetErr } = await supabaseAdmin
      .from("profiles")
      .select(
        "meet_now_active, meet_now_expires_at, meet_now_locked_by, meet_now_lock_expires_at, whatsapp, name"
      )
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetErr || !target) {
      return new Response(JSON.stringify({ error: "Target profile not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const now = new Date();

    // Validate session is still active
    if (!target.meet_now_active) {
      return new Response(JSON.stringify({ error: "This Out Now session is no longer active" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 409,
      });
    }

    if (!target.meet_now_expires_at || new Date(target.meet_now_expires_at) <= now) {
      return new Response(JSON.stringify({ error: "This Out Now session has expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 409,
      });
    }

    // ── Check if slot is locked by someone else ───────────────────────────────
    const lockExpiresAt = target.meet_now_lock_expires_at
      ? new Date(target.meet_now_lock_expires_at)
      : null;
    const isLockedByOther =
      target.meet_now_locked_by != null &&
      target.meet_now_locked_by !== buyerId &&
      lockExpiresAt != null &&
      lockExpiresAt > now;

    if (isLockedByOther) {
      return new Response(
        JSON.stringify({ locked: true, lockExpiresAt: target.meet_now_lock_expires_at }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── Fetch buyer profile ───────────────────────────────────────────────────
    const { data: buyer, error: buyerErr } = await supabaseAdmin
      .from("profiles")
      .select("connect_monthly_active, email")
      .eq("id", buyerId)
      .maybeSingle();

    if (buyerErr || !buyer) {
      return new Response(JSON.stringify({ error: "Buyer profile not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const newLockExpiresAt = new Date(now.getTime() + LOCK_DURATION_MS).toISOString();

    // ── Free path for Connect Monthly subscribers ─────────────────────────────
    if ((buyer as any).connect_monthly_active === true) {
      // Lock the slot immediately
      await supabaseAdmin
        .from("profiles")
        .update({
          meet_now_locked_by: buyerId,
          meet_now_lock_expires_at: newLockExpiresAt,
        })
        .eq("id", targetUserId);

      // Notify the Out Now activator that someone is on the way
      const buyerName = (buyer as any).name ?? "Someone";
      await supabaseAdmin.functions.invoke("send-push", {
        body: {
          user_id: targetUserId,
          title: "⚡ Someone is on the way!",
          body: `${buyerName} is coming to meet you. You have 10 minutes!`,
          data: { type: "out_now_locked", buyerId },
        },
      });

      return new Response(
        JSON.stringify({
          free: true,
          contactNumber: target.whatsapp ?? null,
          lockExpiresAt: newLockExpiresAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── Paid path via Stripe ──────────────────────────────────────────────────
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2022-11-15",
    });

    const origin = req.headers.get("origin") || "";
    const buyerEmail = (buyer as any).email ?? "";

    // Find or create Stripe customer
    let customerId: string | undefined;
    if (buyerEmail) {
      const customers = await stripe.customers.list({ email: buyerEmail, limit: 1 });
      customerId = customers.data[0]?.id;
    }

    // Get or create a price for $2.99 out-now purchase
    // Use env var if set, otherwise create an inline price
    let priceId = Deno.env.get("STRIPE_PRICE_OUT_NOW");
    if (!priceId) {
      // Create an inline price on the fly (requires a product)
      priceId = undefined as any;
    }

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      customer: customerId,
      customer_email: customerId ? undefined : (buyerEmail || undefined),
      line_items: priceId
        ? [{ price: priceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "usd",
                unit_amount: OUT_NOW_PRICE_CENTS,
                product_data: {
                  name: `Meet ${target.name ?? "Someone"} — Out Now`,
                  description: "Unlock contact details for a 10-minute meetup window",
                },
              },
              quantity: 1,
            },
          ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=out_now&target=${targetUserId}&buyer=${buyerId}`,
      cancel_url: `${origin}/`,
      metadata: {
        user_id: buyerId,
        target_user_id: targetUserId,
        purchase_type: "out_now",
      },
    };

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
