/**
 * create-teddy-invite
 * Called by the room owner to send a Teddy Room invite to a matched user.
 * Creates the invite record (pending) and returns a Stripe checkout URL
 * for the invited user to pay $2.99/mo.
 *
 * Body: { invitedUserId: string }
 * Returns: { inviteId, checkoutUrl } | { error }
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { invitedUserId } = await req.json();
    if (!invitedUserId) return json({ error: "invitedUserId is required" }, 400);

    // ── Verify owner has active Teddy Room subscription ───────────────────────
    const { data: ownerProfile } = await supabaseAdmin
      .from("profiles")
      .select("teddy_room_active, teddy_room_expires_at, name")
      .eq("id", user.id)
      .maybeSingle();

    if (!ownerProfile?.teddy_room_active) {
      return json({ error: "You need an active Teddy Room subscription to send invites." }, 403);
    }

    // ── Verify mutual match ───────────────────────────────────────────────────
    const nowIso = new Date().toISOString();
    const [{ data: iLike }, { data: theyLike }] = await Promise.all([
      supabaseAdmin.from("likes").select("id")
        .eq("liker_id", user.id).eq("liked_id", invitedUserId).gte("expires_at", nowIso).maybeSingle(),
      supabaseAdmin.from("likes").select("id")
        .eq("liker_id", invitedUserId).eq("liked_id", user.id).gte("expires_at", nowIso).maybeSingle(),
    ]);
    if (!iLike?.id || !theyLike?.id) {
      return json({ error: "You can only invite mutual matches." }, 403);
    }

    // ── Upsert invite record (idempotent) ─────────────────────────────────────
    const { data: invite, error: inviteErr } = await supabaseAdmin
      .from("teddy_room_invites")
      .upsert({
        room_owner_id: user.id,
        invited_user_id: invitedUserId,
        status: "pending",
      }, { onConflict: "room_owner_id,invited_user_id", ignoreDuplicates: false })
      .select()
      .single();

    if (inviteErr) return json({ error: inviteErr.message }, 500);

    // ── Get invited user's email for Stripe ───────────────────────────────────
    const { data: invitedProfile } = await supabaseAdmin
      .from("profiles").select("name").eq("id", invitedUserId).maybeSingle();

    // Fetch email via auth admin
    const { data: { user: invitedAuthUser } } = await supabaseAdmin.auth.admin.getUserById(invitedUserId);
    const invitedEmail = invitedAuthUser?.email ?? "";

    // ── Stripe checkout for the invited user ──────────────────────────────────
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-11-20.acacia",
    });
    const priceId = Deno.env.get("STRIPE_PRICE_TEDDY_INVITE") || "";
    const origin = req.headers.get("origin") || "";

    const customers = await stripe.customers.list({ email: invitedEmail, limit: 1 });
    const customerId = customers.data[0]?.id;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : invitedEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&teddy_invite=${invite.id}`,
      cancel_url: `${origin}/`,
      subscription_data: {
        metadata: {
          user_id: invitedUserId,
          feature_id: "teddy_room_invite",
          room_owner_id: user.id,
          invite_id: invite.id,
        },
      },
      metadata: {
        user_id: invitedUserId,
        feature_id: "teddy_room_invite",
        room_owner_id: user.id,
        invite_id: invite.id,
      },
    });

    // Store session ID on the invite
    await supabaseAdmin
      .from("teddy_room_invites")
      .update({ stripe_session_id: session.id })
      .eq("id", invite.id);

    return json({
      inviteId: invite.id,
      checkoutUrl: session.url,
      ownerName: ownerProfile.name,
      invitedName: invitedProfile?.name ?? "your match",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
