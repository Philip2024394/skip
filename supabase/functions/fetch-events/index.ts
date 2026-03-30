import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVENTBRITE_TOKEN = Deno.env.get("EVENTBRITE_API_KEY") ?? "";
const SUPABASE_URL     = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface EventbriteVenue { name?: string; address?: { localized_address_display?: string } }
interface EventbriteEvent {
  id: string;
  name: { text: string };
  description?: { text?: string };
  start: { utc: string };
  end?: { utc: string };
  url: string;
  logo?: { url?: string };
  venue?: EventbriteVenue;
  category_id?: string;
}

const EB_CATEGORY_MAP: Record<string, string> = {
  "103": "music",
  "110": "dining",
  "105": "arts",
  "104": "outdoor",
  "113": "sports",
  "115": "wellness",
  "109": "travel",
  "111": "social",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { city, country = "", mode = "fetch" } = await req.json().catch(() => ({}));

    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

    // ── 1. Load user-posted events from DB ────────────────────────────────────
    const { data: dbEvents } = await sb
      .from("local_events")
      .select("*, profiles(name, avatar_url)")
      .gte("starts_at", new Date().toISOString())
      .ilike("city", `%${city || ""}%`)
      .order("is_pinned", { ascending: false })
      .order("starts_at", { ascending: true })
      .limit(30);

    // ── 2. Fetch live events from Eventbrite ──────────────────────────────────
    let liveEvents: object[] = [];
    if (EVENTBRITE_TOKEN && city && mode !== "db_only") {
      try {
        const params = new URLSearchParams({
          "location.address": city + (country ? `, ${country}` : ""),
          "location.within": "50km",
          "start_date.range_start": new Date().toISOString(),
          "expand": "venue",
          "page_size": "20",
          "sort_by": "date",
        });
        const resp = await fetch(
          `https://www.eventbriteapi.com/v3/events/search/?${params}`,
          { headers: { Authorization: `Bearer ${EVENTBRITE_TOKEN}` } }
        );
        if (resp.ok) {
          const json = await resp.json();
          liveEvents = (json.events as EventbriteEvent[] || []).map((e) => ({
            id: `eb_${e.id}`,
            title: e.name?.text ?? "Event",
            description: e.description?.text?.slice(0, 300) ?? null,
            venue_name: e.venue?.name ?? "TBA",
            address: e.venue?.address?.localized_address_display ?? null,
            city: city,
            country: country,
            category: EB_CATEGORY_MAP[e.category_id ?? ""] ?? "social",
            starts_at: e.start.utc,
            ends_at: e.end?.utc ?? null,
            image_url: e.logo?.url ?? null,
            external_url: e.url,
            source: "eventbrite",
            is_pinned: false,
            is_admin_post: false,
            attendees_count: 0,
          }));
        }
      } catch (ebErr) {
        console.warn("Eventbrite fetch failed:", ebErr);
      }
    }

    // ── 3. Cache fresh Eventbrite results in DB (upsert by external_url) ──────
    if (liveEvents.length && mode === "sync") {
      for (const ev of liveEvents as any[]) {
        await sb.from("local_events").upsert(
          { ...ev, id: undefined },   // let DB generate id
          { onConflict: "external_url", ignoreDuplicates: true }
        ).select();
      }
    }

    return new Response(
      JSON.stringify({ db: dbEvents ?? [], live: liveEvents }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
