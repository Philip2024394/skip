import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Replicated mock schedule logic (mirrors mockOnlineSchedule.ts) ────────────

const UTC_OFFSET: Record<string, number> = {
  Indonesia: 7, Malaysia: 8, Philippines: 8, Singapore: 8,
  Thailand: 7, Vietnam: 7, India: 5.5, Pakistan: 5,
  "United Arab Emirates": 4, UAE: 4, "Saudi Arabia": 3,
  Egypt: 2, Nigeria: 1, "United Kingdom": 0, "United States": -5,
  Germany: 1, France: 1, Australia: 10,
};

const ACTIVITY_WINDOWS: [number, number, number][] = [
  [7.25, 9.5,  0.7],
  [9.5,  11.75, 1.0],
  [13.0, 14.75, 0.8],
  [15.0, 17.5,  1.0],
  [17.5, 19.0,  0.6],
  [19.5, 21.5,  1.0],
  [21.5, 22.75, 0.7],
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function getMockOnlineWindows(
  profileId: string,
  country: string,
  hoursPerDay: number,
  dateStr: string,
): { start: number; end: number }[] {
  if (!hoursPerDay || hoursPerDay <= 0) return [];
  const rand   = mulberry32(hashStr(profileId + "|" + dateStr));
  const utcOff = (UTC_OFFSET[country] ?? 7) * 60;
  let remaining = Math.round(hoursPerDay * 60);
  const windows = ACTIVITY_WINDOWS.map(w => ({ w, sort: rand() / w[2] }));
  windows.sort((a, b) => a.sort - b.sort);
  const sessions: { start: number; end: number }[] = [];

  for (const { w: [localStart, localEnd] } of windows) {
    if (remaining < 25) break;
    const winMins = (localEnd - localStart) * 60;
    const maxLen  = Math.min(110, winMins, remaining);
    if (maxLen < 25) continue;
    const sessionLen = Math.round(25 + rand() * (maxLen - 25));
    const maxOffset  = Math.max(0, winMins - sessionLen);
    const startOff   = Math.round(rand() * maxOffset);
    const localStartMin = localStart * 60 + startOff;
    const utcStart = localStartMin - utcOff;
    const utcEnd   = utcStart + sessionLen;
    const tooClose = sessions.some(
      s => utcStart < s.end + 30 && utcEnd > s.start - 30,
    );
    if (tooClose) continue;
    sessions.push({ start: utcStart, end: utcEnd });
    remaining -= sessionLen;
  }
  return sessions.sort((a, b) => a.start - b.start);
}

function isMockCurrentlyOnline(
  profileId: string,
  country: string,
  hoursPerDay: number,
  offlineDays?: number[] | null,
): boolean {
  if (!hoursPerDay || hoursPerDay <= 0) return false;
  if (offlineDays && offlineDays.length > 0) {
    const utcOff = (UTC_OFFSET[country] ?? 7) * 60;
    const now = new Date();
    const localMin = now.getUTCHours() * 60 + now.getUTCMinutes() + utcOff;
    const dayOff   = Math.floor(localMin / 1440);
    const localDay = ((now.getUTCDay() + dayOff) % 7 + 7) % 7;
    if (offlineDays.includes(localDay)) return false;
  }
  const now  = new Date();
  const date = now.toISOString().slice(0, 10);
  const yest = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const todayW = getMockOnlineWindows(profileId, country, hoursPerDay, date);
  const yesterW = getMockOnlineWindows(profileId, country, hoursPerDay, yest)
    .map(w => ({ start: w.start - 1440, end: w.end - 1440 }));
  return [...yesterW, ...todayW].some(w => nowMin >= w.start && nowMin < w.end);
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseUrl  = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey      = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const supabaseAnon  = createClient(supabaseUrl, anonKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // ── Auth: verify caller is admin ───────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authErr } = await supabaseAnon.auth.getUser(token);
    if (authErr || !authData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", authData.user.id);
    if (!roles?.some((r: { role: string }) => r.role === "admin")) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Fetch all mock profiles with a schedule ────────────────────
    const { data: mockProfiles, error: fetchErr } = await supabaseAdmin
      .from("profiles")
      .select("id, country, mock_online_hours, mock_offline_days")
      .eq("is_mock", true)
      .gt("mock_online_hours", 0);

    if (fetchErr) throw fetchErr;
    if (!mockProfiles || mockProfiles.length === 0) {
      return new Response(JSON.stringify({ success: true, updated: 0, message: "No mock profiles with schedule found" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Compute and update last_seen_at for each profile ──────────
    const now = Date.now();
    let updated = 0;
    let failed  = 0;

    // Batch updates — 20 at a time
    const BATCH = 20;
    for (let b = 0; b < mockProfiles.length; b += BATCH) {
      const chunk = mockProfiles.slice(b, b + BATCH);
      await Promise.all(chunk.map(async (p: { id: string; country: string; mock_online_hours: number; mock_offline_days: number[] | null }) => {
        const online = isMockCurrentlyOnline(
          p.id, p.country, p.mock_online_hours, p.mock_offline_days,
        );
        // Realistic last_seen: if online, 1-4 min ago; if offline, 15-180 min ago
        const hashSeed = hashStr(p.id) % 1000;
        const last_seen_at = online
          ? new Date(now - 60000 - hashSeed * 3600).toISOString()
          : new Date(now - 15 * 60000 - hashSeed * 100000).toISOString();

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ last_seen_at } as any)
          .eq("id", p.id);
        if (error) failed++; else updated++;
      }));
    }

    return new Response(
      JSON.stringify({ success: true, total: mockProfiles.length, updated, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
