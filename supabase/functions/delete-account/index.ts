import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");

    const { data: { user }, error: authErr } = await supabaseClient.auth.getUser(token);
    if (authErr || !user) throw new Error("Not authenticated");

    const userId = user.id;

    // Delete all related data in correct order (FK cascade handles most,
    // but we explicitly clean storage files first)
    // 1. Remove avatar/images from storage
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("images, voice_intro_url")
      .eq("id", userId)
      .single();

    if (profile?.images?.length) {
      const paths = profile.images
        .filter(Boolean)
        .map((url: string) => {
          const parts = url.split("/storage/v1/object/public/avatars/");
          return parts[1] ?? null;
        })
        .filter(Boolean);
      if (paths.length) {
        await supabaseAdmin.storage.from("avatars").remove(paths);
      }
    }

    if (profile?.voice_intro_url) {
      const parts = profile.voice_intro_url.split("/storage/v1/object/public/voice-intros/");
      if (parts[1]) {
        await supabaseAdmin.storage.from("voice-intros").remove([parts[1]]);
      }
    }

    // 2. Delete the profile row (cascades to likes, connections, payments, reports, blocked_users)
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // 3. Permanently delete the auth user
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteErr) throw deleteErr;

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
