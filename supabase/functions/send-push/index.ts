import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Web Push using VAPID
// deno-lint-ignore no-explicit-any
declare const crypto: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendWebPush(subscription: any, payload: object, vapidPrivateKey: string, vapidPublicKey: string, subject: string) {
  // Use web-push compatible library via esm.sh
  const webpush = await import("npm:web-push@3.6.7");
  webpush.default.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);
  await webpush.default.sendNotification(subscription, JSON.stringify(payload));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { recipientId, title, body, url } = await req.json();
    if (!recipientId) return new Response(JSON.stringify({ error: "recipientId required" }), { status: 400, headers: corsHeaders });

    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    if (!vapidPrivate || !vapidPublic) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), { status: 500, headers: corsHeaders });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("push_token, push_enabled")
      .eq("id", recipientId)
      .single();

    if (!profile?.push_enabled || !profile?.push_token) {
      return new Response(JSON.stringify({ skipped: true, reason: "no push token" }), { headers: corsHeaders });
    }

    let subscription: any;
    try { subscription = JSON.parse(profile.push_token); } catch {
      return new Response(JSON.stringify({ skipped: true, reason: "invalid token" }), { headers: corsHeaders });
    }

    await sendWebPush(
      subscription,
      { title: title ?? "2DateMe", body: body ?? "You have a new notification", icon: "/icon-192.png", url: url ?? "/" },
      vapidPrivate,
      vapidPublic,
      "mailto:hello@2dateme.com"
    );

    return new Response(JSON.stringify({ sent: true }), { headers: corsHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Push failed";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders });
  }
});
