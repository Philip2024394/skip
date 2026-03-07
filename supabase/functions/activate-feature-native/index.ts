import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Not authenticated");

    const { featureId, targetUserId } = await req.json();
    const userId = user.id;

    switch (featureId) {
      case "plusone":
        await supabaseAdmin.from("profiles").update({ is_plusone: true }).eq("id", userId);
        break;
      case "vip":
        await supabaseAdmin.from("profiles").update({
          is_spotlight: true,
          spotlight_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
          const { data: existing } = await supabaseAdmin.from("likes")
            .select("id").eq("liker_id", userId).eq("liked_id", targetUserId).maybeSingle();
          if (existing) {
            await supabaseAdmin.from("likes").update({ is_rose: true }).eq("id", existing.id);
          } else {
            await supabaseAdmin.from("likes").insert({ liker_id: userId, liked_id: targetUserId, is_rose: true });
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
      default:
        throw new Error(`Unknown feature: ${featureId}`);
    }

    await supabaseAdmin.from("payments").insert({
      user_id: userId,
      amount_cents: 0,
      currency: "usd",
      status: "paid",
      feature_id: featureId,
      stripe_session_id: `native_${Date.now()}`,
    }).then(() => {});

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
