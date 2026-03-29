import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { recipientId } = await req.json();
    if (!recipientId) return new Response(JSON.stringify({ error: "recipientId required" }), { status: 400, headers: corsHeaders });

    const dailyApiKey = Deno.env.get("DAILY_API_KEY");
    if (!dailyApiKey) return new Response(JSON.stringify({ error: "Daily.co not configured" }), { status: 500, headers: corsHeaders });

    // Create a Daily.co room (expires in 2 hours)
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
    const roomRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${dailyApiKey}` },
      body: JSON.stringify({
        properties: {
          exp,
          max_participants: 2,
          enable_chat: false,
          enable_screenshare: false,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!roomRes.ok) {
      const err = await roomRes.text();
      throw new Error(`Daily.co error: ${err}`);
    }

    const room = await roomRes.json();
    const roomUrl = room.url as string;

    // Save call record
    await (supabaseAdmin.from("video_calls" as any).insert as any)({
      caller_id: user.id,
      receiver_id: recipientId,
      room_url: roomUrl,
      status: "active",
    });

    // Send push to recipient
    await supabaseAdmin.functions.invoke("send-push", { body: {
      recipientId,
      title: "📹 Incoming video call!",
      body: "Someone is calling you on 2DateMe",
      url: "/",
    }});

    // Realtime broadcast to recipient
    const channel = supabaseAdmin.channel(`user_${recipientId}`);
    await channel.send({
      type: "broadcast",
      event: "incoming-call",
      payload: { callerId: user.id, roomUrl },
    });

    return new Response(JSON.stringify({ roomUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
