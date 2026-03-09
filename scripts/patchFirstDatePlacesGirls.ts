import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvFile(filepath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!existsSync(filepath)) return result;
  const content = readFileSync(filepath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

const root = resolve(__dirname, "..");
const scriptEnv = loadEnvFile(resolve(root, "scripts", ".env.script"));

const SUPABASE_URL = process.env.SUPABASE_URL || scriptEnv.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || scriptEnv.SUPABASE_SERVICE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("\n❌  Missing credentials.\n");
  console.error("  SUPABASE_URL           =", SUPABASE_URL || "(not set)");
  console.error("  SUPABASE_SERVICE_KEY   =", SUPABASE_SERVICE_KEY ? "***set***" : "(not set)");
  console.error("\nCreate scripts/.env.script with:\n");
  console.error("  SUPABASE_URL=https://grxaajpzwsmtpuewquag.supabase.co");
  console.error("  SUPABASE_SERVICE_KEY=<your service_role key from Supabase dashboard>\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type DatePlace = {
  idea: string;
  url: string;
  image_url: null;
  title: string;
};

function buildFirstDatePlaces(city: string): DatePlace[] {
  const maps = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

  const byCity: Record<string, Array<{ idea: string; title: string; query: string }>> = {
    Jakarta: [
      { idea: "Coffee At A Cozy Café ☕", title: "Tugu Kunstkring Paleis", query: "Tugu Kunstkring Paleis Jakarta" },
      { idea: "Dinner At A Nice Restaurant 🍝", title: "Plataran Menteng", query: "Plataran Menteng Jakarta" },
      { idea: "Walk In The Park 🌳", title: "Taman Suropati", query: "Taman Suropati Jakarta" },
    ],
    Bali: [
      { idea: "Sunset Dinner By The Beach 🌅", title: "Jimbaran Bay Seafood", query: "Jimbaran Bay seafood dinner" },
      { idea: "Beach Sunset Walk 🌅", title: "Sanur Beach", query: "Sanur Beach Bali" },
      { idea: "Coffee At A Cozy Café ☕", title: "Revolver Espresso (Seminyak)", query: "Revolver Espresso Seminyak" },
    ],
    Bandung: [
      { idea: "Coffee And Deep Conversation ☕", title: "Two Hands Full", query: "Two Hands Full Bandung" },
      { idea: "Quiet Garden Stroll 🌸", title: "Taman Hutan Raya Ir. H. Djuanda", query: "Taman Hutan Raya Ir. H. Djuanda Bandung" },
      { idea: "Dinner With A View 🏙️", title: "The Valley Bistro Café", query: "The Valley Bistro Cafe Bandung" },
    ],
    Surabaya: [
      { idea: "Coffee At A Cozy Café ☕", title: "Titik Koma Coffee Surabaya", query: "Titik Koma Coffee Surabaya" },
      { idea: "Slow Walk Through The Old Town 🏛️", title: "Kota Tua Surabaya", query: "Kota Tua Surabaya" },
      { idea: "Dinner At A Nice Restaurant 🍝", title: "Layar Seafood", query: "Layar Seafood Surabaya" },
    ],
    Yogyakarta: [
      { idea: "Art Gallery Visit 🎨", title: "Affandi Museum", query: "Affandi Museum Yogyakarta" },
      { idea: "Coffee At A Cozy Café ☕", title: "Ekologi Desk & Coffee", query: "Ekologi Desk & Coffee Yogyakarta" },
      { idea: "Slow Walk Through The Old Town 🏛️", title: "Malioboro", query: "Malioboro Yogyakarta" },
    ],
  };

  const fallback: Array<{ idea: string; title: string; query: string }> = [
    { idea: "Coffee At A Cozy Café ☕", title: "Local Specialty Coffee", query: `Specialty coffee ${city} Indonesia` },
    { idea: "Dinner At A Nice Restaurant 🍝", title: "Popular Dinner Spot", query: `Best restaurant ${city} Indonesia` },
    { idea: "Walk In The Park 🌳", title: "City Park", query: `Park ${city} Indonesia` },
  ];

  const picks = (byCity[city] || fallback).slice(0, 3);
  return picks.map((p) => ({ idea: p.idea, title: p.title, url: maps(p.query), image_url: null }));
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const perPage = 1000;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (user) return user.id;
    if (data.users.length < perPage) break;
  }
  return null;
}

async function main() {
  const { data: femaleProfiles, error } = await supabase
    .from("profiles")
    .select("id, city, gender")
    .eq("country", "Indonesia")
    .eq("gender", "Female")
    .limit(200);

  if (error) throw error;

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < 80; i++) {
    const email = `demo.profile.${i}@skiptheapp.internal`;
    const userId = await findUserIdByEmail(email);
    if (!userId) {
      console.log(`  ♻️  Skip ${email} (auth user not found)`);
      skipped++;
      continue;
    }

    const profile = (femaleProfiles || []).find((p: any) => p.id === userId);
    const city = profile?.city || "Jakarta";

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ first_date_places: buildFirstDatePlaces(city) })
      .eq("id", userId);

    if (updateErr) throw updateErr;

    console.log(`  ✅  Updated first_date_places for ${email} (${city})`);
    updated++;
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`  ✅  Updated: ${updated}`);
  console.log(`  ♻️  Skipped: ${skipped}`);
  console.log("─────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
