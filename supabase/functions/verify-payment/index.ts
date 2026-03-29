import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// ─── Helper: activate features after a completed checkout ────────────────────
async function activateFeature(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const featureId = session.metadata?.feature_id;
  const targetUserId = session.metadata?.target_user_id;

  if (!userId) return;

  // WhatsApp / Video / Both connection payment (create-payment flow)
  if (targetUserId && !featureId) {
    const connectionType = session.metadata?.connection_type || "whatsapp";
    const hiddenUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const existing = await supabaseAdmin
      .from("connections")
      .select("id")
      .eq("user_a", userId)
      .eq("user_b", targetUserId)
      .maybeSingle();

    if (!existing.data) {
      const { data: connection } = await supabaseAdmin
        .from("connections")
        .insert({
          user_a: userId,
          user_b: targetUserId,
          stripe_session_id: session.id,
          amount_cents: session.amount_total ?? 199,
        })
        .select()
        .single();

      await supabaseAdmin.from("payments").insert({
        user_id: userId,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        amount_cents: session.amount_total ?? 199,
        currency: session.currency ?? "usd",
        status: "paid",
        connection_id: connection?.id,
        target_user_id: targetUserId,
      });

      // Save to contact_unlocks table
      await supabaseAdmin.from("contact_unlocks").insert({
        user1_id: userId,
        user2_id: targetUserId,
        connection_type: connectionType,
        amount: session.amount_total ?? 199,
      });

      await supabaseAdmin.from("profiles").update({ hidden_until: hiddenUntil }).eq("id", userId);
      await supabaseAdmin.from("profiles").update({ hidden_until: hiddenUntil }).eq("id", targetUserId);
    } else {
      // Repurchase: refresh window (used for review eligibility)
      await supabaseAdmin
        .from("connections")
        .update({ stripe_session_id: session.id, last_paid_at: new Date().toISOString() })
        .eq("id", existing.data.id);
    }
    return;
  }

  // Premium feature activation
  switch (featureId) {
    case "plusone":
      await supabaseAdmin.from("profiles").update({
        is_plusone: true,
        available_tonight: false,
        generous_lifestyle: false,
        weekend_plans: false,
        late_night_chat: false,
        no_drama: false,
      }).eq("id", userId);
      break;

    case "vip":
      await supabaseAdmin.from("profiles").update({
        is_spotlight: true,
        spotlight_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq("id", userId);
      break;

    case "global_dating":
      await supabaseAdmin.from("profiles").update({
        global_dating_active: true,
        global_dating_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq("id", userId);
      break;

    case "boost":
      await supabaseAdmin.from("profiles").update({
        is_spotlight: true,
        spotlight_until: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }).eq("id", userId);
      break;

    case "superlike":
      if (targetUserId) {
        const { data: existing } = await supabaseAdmin
          .from("likes")
          .select("id")
          .eq("liker_id", userId)
          .eq("liked_id", targetUserId)
          .maybeSingle();

        if (existing) {
          await supabaseAdmin.from("likes").update({ is_rose: true }).eq("id", existing.id);
        } else {
          await supabaseAdmin.from("likes").insert({
            liker_id: userId,
            liked_id: targetUserId,
            is_rose: true,
          });
        }
      }
      break;

    case "verified":
      await supabaseAdmin.from("profiles").update({ is_verified: true }).eq("id", userId);
      break;

    case "incognito":
      await supabaseAdmin.from("profiles").update({
        hidden_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }).eq("id", userId);
      break;

    case "spotlight":
      await supabaseAdmin.from("profiles").update({
        is_spotlight: true,
        spotlight_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }).eq("id", userId);
      break;

    case "teddy_room":
      await supabaseAdmin.from("profiles").update({
        teddy_room_active: true,
        teddy_room_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq("id", userId);
      break;
  }

  // Record payment for all feature purchases
  await supabaseAdmin.from("payments").insert({
    user_id: userId,
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent as string,
    amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    status: "paid",
    feature_id: featureId,
  }).then(() => {});
}

// ─── Main handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── STRIPE WEBHOOK PATH ──────────────────────────────────────────────────
  // Stripe sends a Stripe-Signature header; handle as webhook event
  const stripeSignature = req.headers.get("stripe-signature");
  if (stripeSignature) {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
    let event: Stripe.Event;

    try {
      const body = await req.text();
      event = await stripe.webhooks.constructEventAsync(body, stripeSignature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      try {
        await activateFeature(session);
      } catch (err) {
        console.error("Feature activation error:", err);
      }
    }

    // Subscription renewed (VIP or Global Dating)
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        const userId = sub.metadata?.user_id;
        const featureId = sub.metadata?.feature_id;
        if (userId) {
          const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          if (featureId === "global_dating") {
            await supabaseAdmin.from("profiles").update({
              global_dating_active: true,
              global_dating_expires_at: until,
              global_dating_subscription_id: subId,
              global_dating_subscription_status: "active",
            }).eq("id", userId);
          } else if (featureId === "teddy_room") {
            await supabaseAdmin.from("profiles").update({
              teddy_room_active: true,
              teddy_room_expires_at: until,
            }).eq("id", userId);
          } else {
            // VIP / Connect Monthly
            await supabaseAdmin.from("profiles").update({
              is_spotlight: true,
              spotlight_until: until,
              vip_subscription_id: subId,
              vip_subscription_status: "active",
            }).eq("id", userId);
          }
        }
      }
    }

    // Subscription cancelled / expired
    if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.paused") {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      const featureId = sub.metadata?.feature_id;
      if (userId) {
        if (featureId === "global_dating") {
          await supabaseAdmin.from("profiles").update({
            global_dating_active: false,
            global_dating_expires_at: null,
            global_dating_subscription_id: null,
            global_dating_subscription_status: "cancelled",
          }).eq("id", userId);
        } else if (featureId === "teddy_room") {
          await supabaseAdmin.from("profiles").update({
            teddy_room_active: false,
            teddy_room_expires_at: null,
          }).eq("id", userId);
        } else {
          // VIP / Connect Monthly
          await supabaseAdmin.from("profiles").update({
            is_spotlight: false,
            spotlight_until: null,
            vip_subscription_id: null,
            vip_subscription_status: "cancelled",
          }).eq("id", userId);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── CLIENT-SIDE VERIFICATION PATH ────────────────────────────────────────
  // Called from PaymentSuccess.tsx after a redirect, with the user's JWT
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("User not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    const { sessionId, featureId: clientFeatureId } = await req.json();
    if (!sessionId) throw new Error("sessionId is required");

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // For subscriptions (VIP), payment_status may be "no_payment_required" on first setup
    // Accept both "paid" and subscription sessions
    const isPaid = session.payment_status === "paid" || session.mode === "subscription";
    if (!isPaid) {
      return new Response(JSON.stringify({ success: false, error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const userId = session.metadata?.user_id;
    const targetUserId = session.metadata?.target_user_id;

    if (userId !== user.id) throw new Error("Unauthorized");

    // If featureId supplied by client, override session metadata for activation
    if (clientFeatureId && !session.metadata?.feature_id) {
      (session.metadata as Record<string, string>).feature_id = clientFeatureId;
    }

    // Activate server-side (idempotent — safe if webhook already fired)
    await activateFeature(session);

    // Return WhatsApp details for connection payments
    let whatsapp = null;
    let name = null;
    let contactProvider = "WhatsApp";
    const connectionType = session.metadata?.connection_type || "whatsapp";
    if (targetUserId) {
      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("whatsapp, name, contact_provider")
        .eq("id", targetUserId)
        .single();
      whatsapp = targetProfile?.whatsapp;
      name = targetProfile?.name;
      contactProvider = (targetProfile as any)?.contact_provider || "WhatsApp";
    }

    return new Response(
      JSON.stringify({ success: true, whatsapp, name, connectionType, contactProvider }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
