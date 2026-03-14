import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { receiverId, matchId } = await req.json();
    if (!receiverId || !matchId) {
      return new Response(JSON.stringify({ error: "receiverId and matchId required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verify there's an active connection/unlock between these users
    const { data: unlock } = await supabaseAdmin
      .from("contact_unlocks")
      .select("id, connection_type")
      .or(
        `and(user1_id.eq.${user.id},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${user.id})`
      )
      .limit(1)
      .maybeSingle();

    if (!unlock) {
      return new Response(JSON.stringify({ error: "No active connection" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Verify connection type allows video
    if (unlock.connection_type !== "video" && unlock.connection_type !== "both") {
      return new Response(JSON.stringify({ error: "Video calls not enabled for this connection" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Create video call record
    const { data: call, error: callError } = await supabaseAdmin
      .from("video_calls")
      .insert({
        match_id: matchId,
        caller_id: user.id,
        receiver_id: receiverId,
        status: "pending",
      })
      .select()
      .single();

    if (callError) throw callError;

    // Send realtime notification to receiver
    const channel = supabaseAdmin.channel(`user_${receiverId}`);
    await channel.send({
      type: "broadcast",
      event: "incoming-call",
      payload: {
        callId: call.id,
        matchId,
        callerId: user.id,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        callId: call.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
