import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ImagePayload = {
  base64: string;
  contentType: string;
  ext: string;
};

function decodeBase64(base64: string): Uint8Array {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const supabaseClient = createClient(supabaseUrl, anonKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authErr } = await supabaseClient.auth.getUser(token);
    if (authErr || !authData.user) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const callerId = authData.user.id;

    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    if (rolesErr) throw rolesErr;
    if (!roles?.some((r: { role: string }) => r.role === "admin")) {
      return new Response(JSON.stringify({ error: "Access denied — admin only" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const body = await req.json().catch(() => null);
    const targetUserId = body?.targetUserId as string | undefined;
    const images = body?.images as ImagePayload[] | undefined;

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "Missing targetUserId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!images || !Array.isArray(images) || images.length !== 2) {
      return new Response(JSON.stringify({ error: "Provide exactly 2 images" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const uploadedUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img?.base64 || !img?.contentType || !img?.ext) {
        return new Response(JSON.stringify({ error: "Invalid image payload" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const bytes = decodeBase64(img.base64);
      const objectPath = `admin/${targetUserId}/${Date.now()}-${i}.${img.ext}`;

      const { error: uploadErr } = await supabaseAdmin.storage
        .from("profile-images")
        .upload(objectPath, bytes, { contentType: img.contentType, upsert: true });

      if (uploadErr) throw uploadErr;

      const { data } = supabaseAdmin.storage.from("profile-images").getPublicUrl(objectPath);
      uploadedUrls.push(data.publicUrl);
    }

    const avatarUrl = uploadedUrls[0];
    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ images: uploadedUrls, avatar_url: avatarUrl })
      .eq("id", targetUserId);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true, images: uploadedUrls, avatar_url: avatarUrl }), {
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
