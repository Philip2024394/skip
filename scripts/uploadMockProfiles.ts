/**
 * uploadMockProfiles.ts
 *
 * Uploads mock Indonesian profiles to the production Supabase database.
 *
 * Requirements:
 *   - SUPABASE_URL        from .env.production  (or set as env var)
 *   - SUPABASE_ANON_KEY   from .env.production  (VITE_SUPABASE_PUBLISHABLE_KEY)
 *   - SUPABASE_SERVICE_KEY  set as env var or in scripts/.env.script
 *
 * Usage:
 *   npx tsx scripts/uploadMockProfiles.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── 1. Load env values ────────────────────────────────────────────────────────

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
const prodEnv = loadEnvFile(resolve(root, ".env.production"));
const scriptEnv = loadEnvFile(resolve(root, "scripts", ".env.script"));

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  scriptEnv.SUPABASE_URL ||
  prodEnv.VITE_SUPABASE_URL ||
  "";

const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  scriptEnv.SUPABASE_SERVICE_KEY ||
  "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("\n❌  Missing credentials.\n");
  console.error("  SUPABASE_URL     =", SUPABASE_URL || "(not set)");
  console.error("  SUPABASE_SERVICE_KEY =", SUPABASE_SERVICE_KEY ? "***set***" : "(not set)");
  console.error("\nCreate  scripts/.env.script  with:");
  console.error("  SUPABASE_URL=https://grxaajpzwsmtpuewquag.supabase.co");
  console.error("  SUPABASE_SERVICE_KEY=<your service_role key from Supabase dashboard>");
  console.error("\nFind service_role key at:");
  console.error("  https://supabase.com/dashboard/project/grxaajpzwsmtpuewquag/settings/api\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── 2. Mock profile data (Unsplash URLs — no bundler needed) ──────────────────

const FEMALE_NAMES = [
  "Putri", "Dewi", "Sari", "Ayu", "Rina", "Wulan", "Indah", "Ratna", "Mega", "Dian",
  "Lestari", "Anisa", "Fitri", "Nurul", "Sinta", "Kartika", "Melati", "Citra", "Bunga", "Kirana",
  "Dinda", "Nadia", "Laras", "Tari", "Widya",
];

const MALE_NAMES = [
  "Budi", "Rizky", "Dimas", "Arief", "Bayu", "Dwi", "Eko", "Gilang",
  "Hendra", "Irfan", "Joko", "Kevin", "Made", "Naufal", "Oka",
  "Teguh", "Umar",
];

const CITIES = [
  "Jakarta", "Bali", "Bandung", "Surabaya", "Yogyakarta",
  "Medan", "Semarang", "Makassar", "Malang", "Solo",
  "Palembang", "Balikpapan", "Manado", "Pontianak", "Lombok",
];

const COORDS: [number, number][] = [
  [-6.2088, 106.8456], [-8.3405, 115.092],  [-6.9175, 107.6191],
  [-7.2575, 112.7521], [-7.7956, 110.3695], [3.5952, 98.6722],
  [-6.9666, 110.4196], [-5.1477, 119.4327], [-7.9666, 112.6326],
  [-7.5755, 110.8243], [-2.9761, 104.7754], [-1.2654, 116.8312],
  [1.4748, 124.8421],  [-0.0263, 109.3425], [-8.5833, 116.1167],
];

const FEMALE_IMAGES = [
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop",
];

const MALE_IMAGES = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=500&fit=crop",
];

const FEMALE_BIOS = [
  "Marketing exec by day, home chef by night 🍳 Love trying new warungs around the city",
  "Freelance designer based in Bali 🎨 Looking for someone to watch sunsets with",
  "Med student, coffee addict ☕ Let's grab nasi goreng sometime?",
  "Teaching English to kids 📚 Weekend hiker, love Bromo & Rinjani",
  "Working in fintech 💼 Obsessed with matcha lattes and bookstores",
  "Fashion buyer ✨ Always planning my next trip, love Komodo Island",
  "Nurse at RS Siloam 🏥 Enjoy cooking for friends and karaoke nights",
  "Content creator 📱 Cat mom to 3 rescue babies 🐱",
  "Accountant who dreams of opening a bakery 🧁 Swipe right if you love dessert",
  "Environmental scientist 🌿 Beach cleanups on weekends",
  "Graphic designer & part-time DJ 🎧 Always discovering new music",
  "Hotel management graduate 🏨 Love meeting people from different cultures",
  "Psychology student 🧠 Good listener, better cook. Try me!",
  "Software engineer 💻 Yoga every morning, gaming every night",
  "Dance teacher 💃 Salsa, contemporary, traditional — I do it all",
];

const MALE_BIOS = [
  "Software developer 💻 Weekend surfer in Kuta, coffee snob",
  "Running a small coffee roastery in Bandung ☕ Let's talk beans",
  "Civil engineer building bridges — literally 🌉 Love hiking on weekends",
  "Photographer 📸 Chasing golden hours across Java",
  "Chef at a fusion restaurant 🍜 I'll cook you something amazing",
  "Startup founder in edtech 🚀 Passionate about education access",
  "Music producer 🎵 Guitar player, vinyl collector",
  "Doctor at a community clinic 🩺 Believe in giving back",
  "Architect designing sustainable homes 🏡 Nature lover",
  "Marine tour guide in Raja Ampat 🤿 Best job in the world",
  "Teacher and part-time soccer coach ⚽ Kids call me Pak Cool",
  "Import-export business 📦 Traveled to 20+ countries for work",
  "Mechanical engineer 🔧 Weekend motorbike adventures",
  "Graphic designer & street art enthusiast 🎨 Know every mural in Jogja",
  "Personal trainer 💪 Help you get fit, one rep at a time",
];

const LOOKING_FOR = ["Dating", "Relationship", "Friendship", "Dating", "Relationship"];

function randOffset() { return (Math.random() - 0.5) * 0.6; }

interface MockProfile {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: string;
  looking_for: string;
  country: string;
  city: string;
  bio: string;
  whatsapp: string;
  avatar_url: string;
  images: string[];
  latitude: number;
  longitude: number;
  available_tonight: boolean;
  last_seen_at: string;
  languages: string[];
  is_plusone: boolean;
  is_active: boolean;
}

function buildProfiles(count = 50): MockProfile[] {
  const profiles: MockProfile[] = [];
  for (let i = 0; i < count; i++) {
    const isFemale = i % 2 === 0;
    const nameList = isFemale ? FEMALE_NAMES : MALE_NAMES;
    const imageList = isFemale ? FEMALE_IMAGES : MALE_IMAGES;
    const name = nameList[i % nameList.length];
    const cityIdx = i % CITIES.length;
    const [lat, lng] = COORDS[cityIdx];
    const bioList = isFemale ? FEMALE_BIOS : MALE_BIOS;
    const profileIdx = Math.floor(i / 2);
    const imageCount = 2 + (i % 2);
    const images: string[] = [];
    for (let j = 0; j < imageCount; j++) {
      images.push(imageList[(profileIdx + j) % imageList.length]);
    }
    const now = Date.now();
    const isOnline = Math.random() > 0.4;
    const last_seen_at = isOnline
      ? new Date(now - Math.random() * 3 * 60 * 1000).toISOString()
      : new Date(now - (10 + Math.random() * 120) * 60 * 1000).toISOString();

    const extraLangs = i % 3 === 0 ? ["English"] : i % 5 === 0 ? ["English", "Arabic"] : [];
    profiles.push({
      id: `00000000-0000-0000-${String(i).padStart(4, "0")}-${String(i * 7).padStart(12, "0")}`,
      email: `demo.profile.${i}@skiptheapp.internal`,
      name,
      age: 19 + (i % 18),
      gender: isFemale ? "Female" : "Male",
      looking_for: LOOKING_FOR[profileIdx % LOOKING_FOR.length],
      country: "Indonesia",
      city: CITIES[cityIdx],
      bio: bioList[profileIdx % bioList.length],
      whatsapp: "",  // demo profiles don't expose real WhatsApp
      avatar_url: images[0],
      images,
      latitude: lat + randOffset(),
      longitude: lng + randOffset(),
      available_tonight: Math.random() > 0.65,
      last_seen_at,
      languages: ["Indonesian", ...extraLangs],
      is_plusone: i % 4 === 1,
      is_active: true,
    });
  }
  return profiles;
}

// ── 3. Main upload logic ──────────────────────────────────────────────────────

async function main() {
  const profiles = buildProfiles(50);
  console.log(`\n📦  Preparing to upload ${profiles.length} mock profiles to production Supabase...\n`);
  console.log(`    URL: ${SUPABASE_URL}\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of profiles) {
    try {
      // Step A: Try to create the auth user
      const { data: createData, error: authErr } = await supabase.auth.admin.createUser({
        user_id: p.id,
        email: p.email,
        email_confirm: true,
        password: "demo-account-not-for-login",
        user_metadata: {
          name: p.name,
          age: p.age,
          gender: p.gender,
          looking_for: p.looking_for,
          country: p.country,
          is_demo: true,
        },
      });

      const alreadyExists =
        !authErr ||
        (authErr.message?.includes("already been registered")) ||
        (authErr.message?.includes("already exists")) ||
        (authErr.status === 422);

      if (authErr && !alreadyExists) {
        console.error(`  ❌  [auth] ${p.name}: ${authErr.message}`);
        failed++;
        continue;
      }

      // Step B: Resolve the actual UUID Supabase assigned
      // (may differ from our requested id if it was ignored)
      let resolvedId = p.id;
      if (createData?.user?.id) {
        resolvedId = createData.user.id;
      } else {
        // Look up by email to get the real UUID
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const match = users.find((u) => u.email === p.email);
        if (match) resolvedId = match.id;
      }

      // Step C: Upsert the profile row using the resolved UUID
      const { error: profileErr } = await supabase.from("profiles").upsert(
        {
          id: resolvedId,
          name: p.name,
          age: p.age,
          gender: p.gender,
          looking_for: p.looking_for,
          country: p.country,
          city: p.city,
          bio: p.bio,
          whatsapp: p.whatsapp,
          avatar_url: p.avatar_url,
          images: p.images,
          latitude: p.latitude,
          longitude: p.longitude,
          available_tonight: p.available_tonight,
          last_seen_at: p.last_seen_at,
          languages: p.languages,
          is_plusone: p.is_plusone,
          is_active: true,
          is_banned: false,
        },
        { onConflict: "id" }
      );

      if (profileErr) {
        console.error(`  ❌  [profile] ${p.name}: ${profileErr.message}`);
        failed++;
      } else if (alreadyExists && authErr) {
        console.log(`  ♻️   Upserted  ${p.name} (${p.city})`);
        skipped++;
      } else {
        console.log(`  ✅  Created   ${p.name} (${p.city})`);
        created++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌  ${p.name}: ${msg}`);
      failed++;
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`  ✅  Created : ${created}`);
  console.log(`  ♻️   Upserted: ${skipped}`);
  console.log(`  ❌  Failed  : ${failed}`);
  console.log(`  📊  Total   : ${profiles.length}`);
  console.log("─────────────────────────────────────────");

  if (failed === 0) {
    console.log("\n🎉  All mock profiles are now live in production!\n");
  } else {
    console.log(`\n⚠️   ${failed} profile(s) failed — check errors above.\n`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
