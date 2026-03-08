/**
 * create-test-user.ts
 *
 * Creates a test user in Supabase Auth so you can sign in and test the app
 * (e.g. butterfly / likes flow).
 *
 * Usage:
 *   npx tsx scripts/create-test-user.ts
 *
 * Uses VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from .env or .env.local.
 * If the user already exists, the script will tell you to just sign in.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
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
const env = { ...loadEnvFile(resolve(root, ".env")), ...loadEnvFile(resolve(root, ".env.local")) };

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

const TEST_EMAIL = process.env.TEST_EMAIL || env.TEST_EMAIL || "test@2dateme.demo";
const TEST_PASSWORD = process.env.TEST_PASSWORD || env.TEST_PASSWORD || "TestPass123";

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("\n❌ Missing credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env or .env.local\n");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    options: { emailRedirectTo: undefined },
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("already exists")) {
      console.log("\n✅ Test user already exists. Use these credentials to sign in:\n");
    } else {
      console.error("\n❌ Error:", error.message, "\n");
      process.exit(1);
    }
  } else if (data?.user) {
    console.log("\n✅ Test user created successfully.\n");
  }

  console.log("   Email:    ", TEST_EMAIL);
  console.log("   Password: ", TEST_PASSWORD);
  console.log("\nOpen the app → Sign in (or /auth?signin=1) and use the above.");
  console.log("In dev, the Auth page has a 'Sign in as test@2dateme.demo' button.");
  console.log("\nIf Supabase requires email confirmation, disable it in:");
  console.log("  Dashboard → Authentication → Providers → Email → Confirm email off\n");
}

main();
