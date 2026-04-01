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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    let userId: string;
    let mutualMatchIds: string[];

    try {
      const body = await req.json();
      userId = body?.userId;
      mutualMatchIds = body?.mutualMatchIds ?? [];
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!Array.isArray(mutualMatchIds) || mutualMatchIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get the activating user's first name
    const { data: activator, error: activatorErr } = await supabaseAdmin
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .maybeSingle();

    if (activatorErr || !activator) {
      return new Response(JSON.stringify({ error: "Could not fetch activator profile" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const firstName = (activator.name as string).split(" ")[0] ?? activator.name;

    // Send push notification to each mutual match in parallel
    const pushPromises = mutualMatchIds.map((matchId: string) =>
      supabaseAdmin.functions.invoke("send-push", {
        body: {
          user_id: matchId,
          title: `⚡ ${firstName} is Out Now`,
          body: `${firstName} is free and nearby right now. Tap to connect!`,
          data: {
            type: "out_now",
            userId,
            name: firstName,
            url: `/out-now?highlight=${userId}`,
          },
        },
      })
    );

    const results = await Promise.allSettled(pushPromises);
    const notified = results.filter((r) => r.status === "fulfilled").length;

    return new Response(JSON.stringify({ ok: true, notified }), {
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
