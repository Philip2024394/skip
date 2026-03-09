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
import { readFileSync, existsSync, readdirSync } from "fs";
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
    const key = trimmed.slice(0, eqIdx).trim().replace(/^\uFEFF/, "");
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

const root = resolve(__dirname, "..");
const prodEnvPath = resolve(root, ".env.production");
const scriptEnvPath = resolve(root, "scripts", ".env.script");
const scriptEnvExamplePath = resolve(root, "scripts", ".env.script.example");

const prodEnv = loadEnvFile(prodEnvPath);
const scriptEnv = {
  ...loadEnvFile(scriptEnvExamplePath),
  ...loadEnvFile(scriptEnvPath),
};

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
  console.error("\nChecked env files:");
  console.error(`  ${prodEnvPath} ${existsSync(prodEnvPath) ? "(found)" : "(missing)"}`);
  console.error(`  ${scriptEnvPath} ${existsSync(scriptEnvPath) ? "(found)" : "(missing)"}`);
  console.error(`  ${scriptEnvExamplePath} ${existsSync(scriptEnvExamplePath) ? "(found)" : "(missing)"}`);
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

const MOCK_FEMALE_DIR = process.env.MOCK_FEMALE_DIR || scriptEnv.MOCK_FEMALE_DIR || "";
const MOCK_MALE_DIR = process.env.MOCK_MALE_DIR || scriptEnv.MOCK_MALE_DIR || "";

// ── 2. Mock profile data (Unsplash URLs — no bundler needed) ──────────────────

const FEMALE_NAMES = [
  "Aulia",
  "Ayu",
  "Putri",
  "Sari",
  "Nisa",
  "Rani",
  "Dwi",
  "Indah",
  "Intan",
  "Fitri",
  "Rina",
  "Wulan",
  "Cahya",
  "Devi",
  "Lestari",
  "Kartika",
  "Nadya",
  "Fitria",
  "Dian",
  "Maya",
  "Anggun",
  "Anisa",
  "Ratna",
  "Shinta",
  "Eka",
  "Vina",
  "Tiara",
  "Melati",
  "Citra",
  "Fadila",
  "Putriani",
  "Arum",
  "Febri",
  "Ayuningtyas",
  "Restu",
  "Amara",
  "Pratiwi",
  "Nurul",
  "Sekar",
  "Yuni",
  "Alifa",
  "Hana",
  "Nadine",
  "Sabrina",
  "Safira",
  "Laras",
  "Nabila",
  "Shafira",
  "Kirana",
  "Dinda",
  "Hesti",
  "Rahayu",
  "Melinda",
  "Nindya",
  "Syifa",
  "Aisyah",
  "Rima",
  "Ika",
  "Indri",
  "Tika",
  "Dewi",
  "Anjani",
  "Ayunda",
  "Lintang",
  "Arini",
  "Zahra",
  "Intania",
  "Nadira",
  "Rara",
  "Safira",
  "Adelia",
  "Naila",
  "Qonita",
  "Aurelia",
  "Laila",
  "Fani",
  "Virna",
  "Putriella",
  "Shakila",
  "Kiranti",
];

const MALE_NAMES = [
  "Aditya",
  "Bayu",
  "Rizky",
  "Dawn",
  "Andi",
  "Dimas",
  "Arief",
  "Period",
  "Nugroho",
  "Revelation",
  "Budi",
  "Iqbal",
  "Hendra",
  "Yoga",
  "Rian",
  "On",
  "Akbar",
  "Jaya",
  "Rafli",
  "Taufik",
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
  "Always looking for happiness in simple things while enjoying coffee and sunset on the beach.",
  "Lover of books and music, likes to take leisurely walks to calm his mind.",
  "Live a simple but colorful life, always trying new experiences.",
  "Laughter is my best medicine, accompanied by a cup of tea and my favorite song.",
  "Dare to try new things, learn from mistakes, keep smiling.",
  "Love sharing stories, enjoying little moments, always being grateful.",
  "Nature and travel lover, always want to explore beautiful places.",
  "Life is about dreams, music, and friends who make me happy.",
  "Likes sweet things, but the heart remains strong and does not give up easily.",
  "Enjoy every second of life, learn from experience, always be optimistic.",
  "Coffee and sunset lover, always looking for simple happiness.",
  "Life is short, so I choose to smile and chase my dreams.",
  "Always want to learn new things, meet new people, discover new stories.",
  "Laughing, walking, and dreaming — the way I live my life.",
  "Live a life full of curiosity, try new things, share happiness.",
  "Enjoying simple moments, from morning coffee to sunset on the beach.",
  "Warm heart, creative mind, always looking for inspiration around.",
  "Enjoy talking, listening, finding little things that make you happy.",
  "Life is a mix of dreams, adventures, and laughter with friends.",
  "Love challenges, love nature, believe every day has miracles.",
  "Enjoying music and travel, while learning to appreciate the little moments.",
  "Lover of coffee, sunsets, and books that can make me lose myself in the story.",
  "My life is about big dreams and simple happiness every day.",
  "Dare to take risks, keep smiling even when facing challenges.",
  "Enjoying laughter, travel, and being with good people.",
  "Love photography and nature, always want to capture beautiful moments.",
  "Live a simple but colorful life, always learn from experience.",
  "Always look for inspiration, try new things, and stay optimistic.",
  "Enjoy every second, from morning coffee to beautiful sunset.",
  "Lover of nature and new cities, love to meet new friends.",
  "Love to laugh and share stories, live with gratitude.",
  "Life is full of curiosity, always looking for new experiences.",
  "Enjoying the little moments, while learning from life experiences.",
  "Lover of music, coffee, and sunsets that soothe the heart.",
  "My life is about dreams, laughter, and people who make me happy.",
  "Enjoy sharing stories, learning new things, and chasing dreams.",
  "Love traveling, exploring new places, and trying local food.",
  "Life is simple but always colored with laughter and happiness.",
  "Lover of coffee, books, and a soothing afternoon atmosphere.",
  "Enjoying music, travel, and memorable little experiences.",
  "Life is full of adventures, dreams, and laughter with friends.",
  "Always try new things, learn from experience, and keep smiling.",
  "Lover of nature and new cities, always looking for things that make her happy.",
  "My life is about dreams, music, laughter, and simple happiness.",
  "Likes reading, listening to music, and sharing stories with friends.",
  "Enjoying the little moments, while pursuing big dreams in life.",
  "Lovers of coffee, sunsets, and an atmosphere that calms the heart.",
  "Life is simple but full of colors and new adventures every day.",
  "Always looking for inspiration, trying new things, and sharing happiness.",
  "Enjoy the journey, meet new people, and learn from the experience.",
  "Life is about dreams, laughter, and happiness in simple things.",
  "Enjoys walking, enjoying music, and collecting beautiful stories.",
  "Lover of coffee, books, and an atmosphere that makes the heart peaceful.",
  "Enjoy every second of life, learn, and stay optimistic.",
  "My life is a mix of dreams, adventures, and laughter from friends.",
  "Always want to learn new things, meet friends, and try new experiences.",
  "Lover of nature and new cities, loves to capture beautiful moments.",
  "Life is simple but always colorful, full of laughter and happiness.",
  "Love music, coffee, and a comfortable atmosphere.",
  "Enjoying trips and small memorable experiences.",
  "Life is full of dreams, laughter, and happiness from simple things.",
  "Always looking for new things, trying new experiences, keep smiling.",
  "Lover of nature, new cities, and precious little moments.",
  "My life is about dreams, music, and simple everyday happiness.",
  "Loves reading, coffee, and sharing stories with close friends.",
  "Enjoy every second of life, learn, and pursue dreams.",
  "Life is a mix of dreams, laughter, and new adventures.",
  "Always want to learn new things and meet inspiring people.",
  "Nature and travel lover, always looking to discover new things.",
  "Live a simple but colorful life, always smile every day.",
  "Enjoying music, coffee, and small moments that soothe the heart.",
  "My life is about dreams, happiness, and valuable experiences.",
  "Loves traveling, trying new things, and collecting beautiful stories.",
  "Lover of nature, books, and simple things that make me happy.",
  "Enjoy every second of life, laughter, and small joys.",
  "Life is full of adventures, dreams, and laughter with friends.",
  "Always try new things, learn from experience, stay optimistic.",
  "Lover of coffee, new cities, and little moments that make you happy.",
  "My life is about dreams, music, laughter, and beautiful simple things.",
  "Enjoy the journey, the experiences, and the people who make you happy.",
];

const MALE_BIOS = [
  "I am a coffee and nature lover, love exploring new places, trying local food, and learning from every experience to make life more colorful every day.",
  "My life is about chasing big dreams, meeting new people, laughing with friends, and enjoying every moment that makes me grateful and continues to grow.",
  "I like traveling, reading books, listening to music.",
  "Enjoying simple moments like sunset on the beach, warm morning coffee, and laughter with those closest to you always makes your heart calm and happy.",
  "I love to travel, seek inspiration, share stories, and learn from every experience that broadens my horizons and makes life more meaningful.",
  "My life is a mix of dreams, laughter, and new experiences, I always try to be the best version of myself.",
  "I am a nature and sports lover, always trying new things, appreciating small moments, and trying to make every day more meaningful.",
  "Enjoy every journey, meet new people, try unique foods, and gather valuable experiences.",
  "Hidupku tentang mimpi, musik, dan tawa, aku selalu belajar dari pengalaman, menghadapi tantangan, dan tetap optimis sambil menikmati setiap momen kecil.",
  "I like reading, listening to music, and enjoying the calming afternoon atmosphere while thinking about things.",
  "Selalu ingin belajar hal baru, mencoba pengalaman yang menantang, dan bertemu orang-orang inspiratif yang membuat hidup lebih berwarna dan penuh cerita.",
  "I love coffee, new cities, and simple things that make me happy, while constantly seeking new experiences.",
  "My life is simple but full of adventure, I love sharing laughter with friends, trying new things, and making every day a memorable moment.",
  "I enjoy music, sports, and challenging activities, while always learning from every mistake and life experience.",
  "Menikmati perjalanan, mencoba hal baru, bertemu orang baru, dan menghargai setiap momen kecil yang memberi kebahagiaan dan inspirasi setiap hari.",
  "My life is about big dreams, valuable experiences, and laughter with the people closest to me.",
  "I am a lover of nature, traveling, and local food, always trying to find beautiful things that make life more meaningful and colorful every day.",
  "Always looking for inspiration, trying new things, learning from experience, and sharing stories that can encourage others to explore life with curiosity.",
  "My life is a mix of dreams, music, travel, and meaningful conversations — I enjoy new places and small moments that make each day feel special.",
  "I enjoy every second of life, learn from experience, meet new people, and keep moving forward with optimism and gratitude.",
];

const LOOKING_FOR = ["Dating", "Relationship", "Friendship", "Dating", "Relationship"];

function randOffset() { return (Math.random() - 0.5) * 0.6; }

interface MockProfile {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: "Female" | "Male";
  looking_for: string;
  country: string;
  city: string;
  bio: string;
  whatsapp: string;
  avatar_url: string;
  images: string[];
  first_date_idea?: string | null;
  first_date_places?: any[];
  generous_lifestyle?: boolean;
  weekend_plans?: boolean;
  late_night_chat?: boolean;
  no_drama?: boolean;
  latitude: number;
  longitude: number;
  available_tonight: boolean;
  last_seen_at: string;
  languages: string[];
  is_active: boolean;
}

function buildBadgeMix(idx: number): { generous_lifestyle: boolean; weekend_plans: boolean; late_night_chat: boolean; no_drama: boolean } {
  const generous_lifestyle = idx % 2 === 0;
  const weekend_plans = idx % 3 === 0;
  const late_night_chat = idx % 4 === 0;
  const no_drama = idx % 5 === 0;

  if (generous_lifestyle || weekend_plans || late_night_chat || no_drama) {
    return { generous_lifestyle, weekend_plans, late_night_chat, no_drama };
  }
  return { generous_lifestyle: false, weekend_plans: true, late_night_chat: false, no_drama: true };
}

function buildFirstDatePlaces(
  city: string,
  latitude: number,
  longitude: number
): Array<{ idea: string; url: string; image_url: null; title: string }> {
  const maps = (q: string) => {
    const query = `${q} near ${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const cityTag = city.toLowerCase().replace(/\s+/g, "");
  const instagramTagUrl = (tag: string) => `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`;

  const candidates: Array<{ idea: string; title: string; url: string }> = [
    { idea: "Coffee At A Cozy Café ☕", title: `Cafés in ${city}`, url: maps("cafe") },
    { idea: "Dinner At A Nice Restaurant 🍝", title: `Restaurants in ${city}`, url: maps("restaurant") },
    { idea: "Walk In The Park 🌳", title: `Parks in ${city}`, url: maps("park") },
    { idea: "Drinks At A Rooftop Bar �", title: `Rooftop bars in ${city}`, url: maps("rooftop bar") },
    { idea: "Ice Cream And A Stroll 🍦", title: `Dessert & ice cream in ${city}`, url: maps("ice cream") },
    { idea: "Art Gallery Visit �", title: `Galleries & museums in ${city}`, url: maps("museum") },
  ];

  if (Math.random() > 0.55) {
    const tag = Math.random() > 0.5 ? `${cityTag}cafe` : `kuliner${cityTag}`;
    candidates.push({
      idea: "Street Food Adventure 🌮",
      title: `Instagram: #${tag}`,
      url: instagramTagUrl(tag),
    });
  }

  const desiredCount = 3;
  const picks: Array<{ idea: string; title: string; url: string }> = [];
  const used = new Set<number>();
  while (picks.length < desiredCount && used.size < candidates.length) {
    const idx = Math.floor(Math.random() * candidates.length);
    if (used.has(idx)) continue;
    used.add(idx);
    picks.push(candidates[idx]);
  }

  return picks.map((p) => ({
    idea: p.idea,
    title: p.title,
    url: p.url,
    image_url: null,
  }));
}

function listImages(dir: string): string[] {
  if (!dir) return [];
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir)
    .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .map((f) => resolve(dir, f));
  return files;
}

async function uploadImageIfLocal(localPathOrUrl: string, userId: string): Promise<string> {
  if (!localPathOrUrl) return localPathOrUrl;
  const isRemote = /^https?:\/\//i.test(localPathOrUrl);
  if (isRemote) return localPathOrUrl;

  const bytes = readFileSync(localPathOrUrl);
  const extMatch = localPathOrUrl.match(/\.(png|jpg|jpeg|webp)$/i);
  const ext = (extMatch?.[1] || "png").toLowerCase();
  const contentType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";

  const objectPath = `mock-profiles/${userId}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from("profile-images")
    .upload(objectPath, bytes, { upsert: true, contentType });
  if (uploadErr) throw uploadErr;

  const { data } = supabase.storage.from("profile-images").getPublicUrl(objectPath);
  return data.publicUrl;
}

function buildProfiles(opts: { femaleCount: number; maleCount: number }): MockProfile[] {
  const { femaleCount, maleCount } = opts;
  const profiles: MockProfile[] = [];

  const femaleLocalImages = listImages(MOCK_FEMALE_DIR);
  const maleLocalImages = listImages(MOCK_MALE_DIR);

  const total = femaleCount + maleCount;
  for (let i = 0; i < total; i++) {
    const isFemale = i < femaleCount;
    const nameList = isFemale ? FEMALE_NAMES : MALE_NAMES;
    const imageList = isFemale ? FEMALE_IMAGES : MALE_IMAGES;
    const name = nameList[i % nameList.length];
    const cityIdx = i % CITIES.length;
    const [lat, lng] = COORDS[cityIdx];
    const bioList = isFemale ? FEMALE_BIOS : MALE_BIOS;

    const genderIdx = isFemale ? i : i - femaleCount;
    const profileIdx = genderIdx;

    const shouldHaveBadges = isFemale && profileIdx % 5 === 0;
    const badges = shouldHaveBadges
      ? buildBadgeMix(profileIdx)
      : { generous_lifestyle: false, weekend_plans: false, late_night_chat: false, no_drama: false };

    const localList = isFemale ? femaleLocalImages : maleLocalImages;

    const imageCount = 2;
    const images: string[] = [];
    for (let j = 0; j < imageCount; j++) {
      const baseIdx = profileIdx * imageCount;
      const local = localList.length > 0 ? localList[(baseIdx + j) % localList.length] : "";
      images.push(local || imageList[(baseIdx + j) % imageList.length]);
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
      first_date_idea: null,
      first_date_places: buildFirstDatePlaces(CITIES[cityIdx], lat + randOffset(), lng + randOffset()),
      generous_lifestyle: badges.generous_lifestyle,
      weekend_plans: badges.weekend_plans,
      late_night_chat: badges.late_night_chat,
      no_drama: badges.no_drama,
      latitude: lat + randOffset(),
      longitude: lng + randOffset(),
      available_tonight: Math.random() > 0.65,
      last_seen_at,
      languages: ["Indonesian", ...extraLangs],
      is_active: true,
    });
  }
  return profiles;
}

// ── 3. Main upload logic ──────────────────────────────────────────────────────

async function main() {
  const profiles = buildProfiles({ femaleCount: 80, maleCount: 20 });
  console.log(`\n📦  Preparing to upload ${profiles.length} mock profiles to production Supabase...\n`);
  console.log(`    URL: ${SUPABASE_URL}\n`);
  if (MOCK_FEMALE_DIR || MOCK_MALE_DIR) {
    console.log(`    Local female images dir: ${MOCK_FEMALE_DIR || "(not set)"}`);
    console.log(`    Local male images dir:   ${MOCK_MALE_DIR || "(not set)"}`);
    console.log("    Images will be uploaded into Supabase Storage bucket: profile-images\n");
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of profiles) {
    try {
      // Step A: Try to create the auth user
      const { data: createData, error: authErr } = await supabase.auth.admin.createUser({
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

      // Step B: Use the created user's UUID (required for profiles.id FK)
      // If the user already exists and the API didn't return the user object,
      // we can't reliably determine the UUID without listing users. In that case,
      // skip updating this profile to avoid mismatched IDs.
      const resolvedId = createData?.user?.id;
      if (!resolvedId) {
        console.log(`  ♻️   Skipped   ${p.name} (auth user already exists)`);
        skipped++;
        continue;
      }

      // Step C: Upsert the profile row using the resolved UUID
      const uploadedImages = await Promise.all(p.images.map((img) => uploadImageIfLocal(img, resolvedId)));
      const avatarUrl = uploadedImages[0] || p.avatar_url;
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
          avatar_url: avatarUrl,
          images: uploadedImages,
          first_date_idea: p.first_date_idea ?? null,
          first_date_places: p.first_date_places ?? [],
          generous_lifestyle: p.generous_lifestyle ?? false,
          weekend_plans: p.weekend_plans ?? false,
          late_night_chat: p.late_night_chat ?? false,
          no_drama: p.no_drama ?? false,
          latitude: p.latitude,
          longitude: p.longitude,
          available_tonight: p.available_tonight,
          last_seen_at: p.last_seen_at,
          languages: p.languages,
          is_active: true,
          is_banned: false,
        },
        { onConflict: "id" }
      );

      if (profileErr) {
        console.error(`  ❌  [profile] ${p.name}: ${profileErr.message}`);
        failed++;
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
