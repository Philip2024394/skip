import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    let targetUserId: string | undefined;
    let targetHasBadges: boolean | undefined;
    let connectionType: string | undefined;
    try {
      const body = await req.json();
      targetUserId = body?.targetUserId;
      targetHasBadges = body?.targetHasBadges === true;
      connectionType = body?.connectionType; // 'whatsapp' | 'video' | 'both'
    } catch {
      return new Response(JSON.stringify({ error: "Missing or invalid request body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "targetUserId is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const isUuid = (v: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

    if (isUuid(targetUserId)) {
      const nowIso = new Date().toISOString();
      const [{ data: iLike, error: iLikeErr }, { data: theyLike, error: theyLikeErr }] = await Promise.all([
        supabaseAdmin
          .from("likes")
          .select("id")
          .eq("liker_id", user.id)
          .eq("liked_id", targetUserId)
          .gte("expires_at", nowIso)
          .maybeSingle(),
        supabaseAdmin
          .from("likes")
          .select("id")
          .eq("liker_id", targetUserId)
          .eq("liked_id", user.id)
          .gte("expires_at", nowIso)
          .maybeSingle(),
      ]);

      if (iLikeErr || theyLikeErr) {
        const msg = (iLikeErr || theyLikeErr)?.message || "Failed to verify match";
        return new Response(JSON.stringify({ error: msg }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      if (!iLike?.id || !theyLike?.id) {
        return new Response(JSON.stringify({ error: "WhatsApp unlock requires a mutual match" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
    }

    // ── Check buyer profile for free unlocks + subscription ─────────────────
    const { data: buyerProfile } = await supabaseAdmin
      .from("profiles")
      .select("vip_subscription_status, name, free_unlocks_remaining")
      .eq("id", user.id)
      .maybeSingle();

    // Free welcome unlock (2 gifted on signup)
    const freeRemaining = (buyerProfile as any)?.free_unlocks_remaining ?? 0;
    if (freeRemaining > 0) {
      const existing = await supabaseAdmin
        .from("connections")
        .select("id")
        .eq("user_a", user.id)
        .eq("user_b", targetUserId)
        .maybeSingle();

      if (!existing.data) {
        const { data: connection } = await supabaseAdmin
          .from("connections")
          .insert({ user_a: user.id, user_b: targetUserId, amount_cents: 0 })
          .select().single();

        await supabaseAdmin.from("contact_unlocks").insert({
          user1_id: user.id, user2_id: targetUserId,
          connection_type: connectionType || "whatsapp", amount: 0,
        });
        await supabaseAdmin.from("payments").insert({
          user_id: user.id, amount_cents: 0, currency: "usd",
          status: "free_welcome", connection_id: connection?.id, target_user_id: targetUserId,
        });
        // Decrement free unlocks
        await supabaseAdmin.from("profiles")
          .update({ free_unlocks_remaining: freeRemaining - 1 })
          .eq("id", user.id);
      }

      const { data: targetProfile } = await supabaseAdmin
        .from("profiles").select("whatsapp, name, contact_provider").eq("id", targetUserId).maybeSingle();

      return new Response(JSON.stringify({
        free: true,
        name: targetProfile?.name ?? null,
        whatsapp: targetProfile?.whatsapp ?? null,
        contactProvider: (targetProfile as any)?.contact_provider ?? "WhatsApp",
        connectionType: connectionType || "whatsapp",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    if (buyerProfile?.vip_subscription_status === "active") {
      // Subscriber gets free unlocks — create connection directly
      const existing = await supabaseAdmin
        .from("connections")
        .select("id")
        .eq("user_a", user.id)
        .eq("user_b", targetUserId)
        .maybeSingle();

      if (!existing.data) {
        const { data: connection } = await supabaseAdmin
          .from("connections")
          .insert({
            user_a: user.id,
            user_b: targetUserId,
            amount_cents: 0,
          })
          .select()
          .single();

        await supabaseAdmin.from("contact_unlocks").insert({
          user1_id: user.id,
          user2_id: targetUserId,
          connection_type: connectionType || "whatsapp",
          amount: 0,
        });

        await supabaseAdmin.from("payments").insert({
          user_id: user.id,
          amount_cents: 0,
          currency: "usd",
          status: "free_vip",
          connection_id: connection?.id,
          target_user_id: targetUserId,
        });
      }

      // Fetch target contact details
      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("whatsapp, name, contact_provider")
        .eq("id", targetUserId)
        .maybeSingle();

      return new Response(JSON.stringify({
        free: true,
        name: targetProfile?.name ?? null,
        whatsapp: targetProfile?.whatsapp ?? null,
        contactProvider: (targetProfile as any)?.contact_provider ?? "WhatsApp",
        connectionType: connectionType || "whatsapp",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const priceId = targetHasBadges
      ? (Deno.env.get("STRIPE_PRICE_WHATSAPP_BADGES") || Deno.env.get("STRIPE_PRICE_WHATSAPP") || "price_1T8NbHBChzWuxQIpeGY4LLYQ")
      : (Deno.env.get("STRIPE_PRICE_WHATSAPP") || "price_1T8NbHBChzWuxQIpeGY4LLYQ");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-11-20.acacia",
    });

    // Check/create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&target=${targetUserId}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        user_id: user.id,
        target_user_id: targetUserId,
        connection_type: connectionType || "whatsapp",
      },
    });

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
