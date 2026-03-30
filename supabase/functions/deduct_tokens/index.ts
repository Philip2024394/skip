import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify caller
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401,
      });
    }

    const { p_tokens, p_reason } = await req.json();
    if (!p_tokens || p_tokens <= 0) {
      return new Response(JSON.stringify({ error: "Invalid token amount" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    // Use spend_coins RPC for atomicity — writes coin_transactions + updates profiles.coins_balance
    const { data: newBalance, error: rpcError } = await supabaseAdmin.rpc("spend_coins" as any, {
      p_user_id: user.id,
      p_amount: p_tokens,
      p_reason: p_reason ?? "spend",
    });

    if (rpcError) throw rpcError;
    if (newBalance === -1) {
      return new Response(JSON.stringify({ error: "Insufficient coins" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true, new_balance: newBalance }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
