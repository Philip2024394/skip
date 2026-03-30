import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Claude Haiku call ─────────────────────────────────────────────────────────

async function generateStories(age: number, city: string | null, country: string, lookingFor: string | null) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const location = city ? `${city}, ${country}` : country;
  const intent = lookingFor || "a genuine connection";

  const prompt = `You are writing for a "Mystery Story Dating" app feature called Blind Date Mode.

Generate exactly 3 short personal stories for a real person with these details:
- Age: ${age}
- Location: ${location}
- Looking for: ${intent}

RULES — follow these exactly:
- Each story is 3–5 sentences, written in first person, past or present tense
- The stories must feel like real personal memories a real human would share
- Story 1 (age clue): A specific personal memory that hints at their approximate age. Reference a real cultural moment, world event, technology trend, or social phenomenon they experienced at a particular life stage. Never state any age or number.
- Story 2 (location clue): A vivid specific scene from their daily life or a named local tradition, festival, food, landscape, or weather in ${location}. Use real names of local events or foods. Never directly name the city or country.
- Story 3 (intent clue): A personal anecdote or honest reflection that reveals what they want from a relationship — without ever using the words marriage, relationship, casual, friendship, or travel.

Respond with valid JSON only, no markdown, no extra text:
{"story_age":"...","story_location":"...","story_intent":"..."}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${err}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";

  // Strip any accidental markdown fences
  const clean = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  return JSON.parse(clean) as { story_age: string; story_location: string; story_intent: string };
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { profile_id, age, city, country, looking_for } = await req.json();

    if (!profile_id || !age || !country) {
      return new Response(
        JSON.stringify({ error: "profile_id, age, and country are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stories = await generateStories(Number(age), city ?? null, country, looking_for ?? null);

    // Persist to profiles table
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        blind_date_story_age:      stories.story_age,
        blind_date_story_location: stories.story_location,
        blind_date_story_intent:   stories.story_intent,
      })
      .eq("id", profile_id);

    if (error) throw error;

    return new Response(JSON.stringify(stories), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("generate-blind-date-stories error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
