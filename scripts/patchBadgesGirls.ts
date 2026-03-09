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
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function buildBadgeMix(idx: number) {
  const generous_lifestyle = idx % 2 === 0;
  const weekend_plans = idx % 3 === 0;
  const late_night_chat = idx % 4 === 0;
  const no_drama = idx % 5 === 0;

  if (generous_lifestyle || weekend_plans || late_night_chat || no_drama) {
    return { generous_lifestyle, weekend_plans, late_night_chat, no_drama };
  }
  return { generous_lifestyle: false, weekend_plans: true, late_night_chat: false, no_drama: true };
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
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < 80; i++) {
    const email = `demo.profile.${i}@skiptheapp.internal`;
    const userId = await findUserIdByEmail(email);
    if (!userId) {
      skipped++;
      continue;
    }

    const isIn20Percent = i % 5 === 0;
    const badges = isIn20Percent
      ? buildBadgeMix(i)
      : { generous_lifestyle: false, weekend_plans: false, late_night_chat: false, no_drama: false };

    const { error } = await supabase
      .from("profiles")
      .update({
        generous_lifestyle: badges.generous_lifestyle,
        weekend_plans: badges.weekend_plans,
        late_night_chat: badges.late_night_chat,
        no_drama: badges.no_drama,
      })
      .eq("id", userId);

    if (error) throw error;
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
