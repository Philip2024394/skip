// Run: node scripts/generateSeedSQL.js
// Writes: supabase/migrations/seed_mock_data.sql
// Then paste that SQL file into Supabase Dashboard -> SQL Editor

const fs = require("fs");
const path = require("path");

const FEMALE_NAMES = [
  "Putri","Dewi","Sari","Ayu","Rina","Wulan","Indah","Ratna","Mega","Dian",
  "Lestari","Anisa","Fitri","Nurul","Sinta","Kartika","Melati","Citra","Bunga","Kirana",
  "Dinda","Nadia","Laras","Tari","Widya","Ariani","Bella","Cahya","Devi","Eka",
  "Farah","Gita","Hasna","Intan","Jasmine","Kezia","Lila","Maya","Nova","Olivia",
  "Puspita","Rara","Salma","Tiara","Ulfa","Vina","Widi","Yasmin","Zahra","Amira",
  "Diana","Elsa","Grace","Hana","Ines","Jihan","Lana","Mira","Nayla","Reni",
  "Sela","Tria","Vera","Wenny","Adinda","Calista","Dahlia","Elina","Firda","Ghina",
];
const MALE_NAMES = [
  "Budi","Rizky","Dimas","Arief","Bayu","Dwi","Eko","Gilang",
  "Hendra","Irfan","Joko","Kevin","Made","Naufal","Oka","Teguh",
  "Umar","Vito","Wahyu","Yusuf",
];
const FEMALE_BIOS = [
  "Marketing exec by day, home chef by night. Love trying new warungs around the city.",
  "Freelance designer based in Bali. Looking for someone to watch sunsets with.",
  "Med student, coffee addict. Let's grab nasi goreng sometime?",
  "Teaching English to kids. Weekend hiker, love Bromo and Rinjani.",
  "Working in fintech. Obsessed with matcha lattes and bookstores.",
  "Fashion buyer. Always planning my next trip, love Komodo Island.",
  "Nurse at RS Siloam. Enjoy cooking for friends and karaoke nights.",
  "Content creator. Cat mom to 3 rescue babies.",
  "Accountant who dreams of opening a bakery. Swipe right if you love dessert.",
  "Environmental scientist. Beach cleanups on weekends.",
  "Graphic designer and part-time DJ. Always discovering new music.",
  "Hotel management graduate. Love meeting people from different cultures.",
  "Psychology student. Good listener, better cook.",
  "Software engineer. Yoga every morning, gaming every night.",
  "Dance teacher. Salsa, contemporary, traditional, I do it all.",
];
const MALE_BIOS = [
  "Software developer. Weekend surfer in Kuta, coffee snob.",
  "Running a small coffee roastery in Bandung. Let's talk beans.",
  "Civil engineer building bridges. Love hiking on weekends.",
  "Photographer. Chasing golden hours across Java.",
  "Chef at a fusion restaurant. I'll cook you something amazing.",
  "Startup founder in edtech. Passionate about education access.",
  "Music producer. Guitar player, vinyl collector.",
  "Doctor at a community clinic. Believe in giving back.",
  "Architect designing sustainable homes. Nature lover.",
  "Marine tour guide in Raja Ampat. Best job in the world.",
];
const FEMALE_IMAGES = [
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1514315384763-ba401779410f?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1530785602389-07594beb8b73?w=400&h=500&fit=crop",
];
const MALE_IMAGES = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop",
];
const CITIES  = ["Jakarta","Bali","Bandung","Surabaya","Yogyakarta","Medan","Semarang","Makassar","Malang","Solo","Palembang","Balikpapan","Manado","Pontianak","Lombok"];
const LATS    = [-6.2088,-8.3405,-6.9175,-7.2575,-7.7956,3.5952,-6.9666,-5.1477,-7.9666,-7.5755,-2.9761,-1.2654,1.4748,-0.0263,-8.5833];
const LNGS    = [106.8456,115.092,107.6191,112.7521,110.3695,98.6722,110.4196,119.4327,112.6326,110.8243,104.7754,116.8312,124.8421,109.3425,116.1167];

const pick = (arr, n) => arr[n % arr.length];
const bool = v => v ? "true" : "false";
const sq = s => s.replace(/'/g, "''");

const FEMALE_COUNT = 70, MALE_COUNT = 20, TOTAL = 90;

const rows = [];
for (let i = 0; i < TOTAL; i++) {
  const isFemale = i < FEMALE_COUNT;
  const gi = isFemale ? i : i - FEMALE_COUNT;
  const gender = isFemale ? "Female" : "Male";
  const name = isFemale ? pick(FEMALE_NAMES, gi) : pick(MALE_NAMES, gi);
  const bio  = isFemale ? pick(FEMALE_BIOS,  gi) : pick(MALE_BIOS,  gi);
  const ci   = i % 15;
  const city = CITIES[ci];
  const lat  = (LATS[ci] + ((i*17+3) % 100 - 50) / 100 * 0.4).toFixed(6);
  const lng  = (LNGS[ci] + ((i*13+7) % 100 - 50) / 100 * 0.4).toFixed(6);
  const img1 = isFemale ? pick(FEMALE_IMAGES, gi)     : pick(MALE_IMAGES, gi);
  const img2 = isFemale ? pick(FEMALE_IMAGES, gi+5)   : pick(MALE_IMAGES, gi+2);
  const lf   = isFemale
    ? ["Dating","Relationship","Dating","Friendship","Relationship"][gi%5]
    : ["Dating","Relationship","Friendship","Dating"][gi%4];
  const hours = 6 + (i % 9);
  const age   = 19 + (i % 16);
  const langs = i%5===0 ? '["Indonesian","English"]' : i%7===0 ? '["Indonesian","English","Arabic"]' : '["Indonesian"]';
  const height = isFemale ? `${155 + gi%15}cm` : `${168 + gi%17}cm`;
  const bodyTypes = ["Slim","Athletic","Average","Curvy","Petite"];
  const bodyType  = bodyTypes[gi%5];
  const edus      = ["Bachelor's Degree","Master's Degree","Diploma","High School","Bachelor's Degree"];
  const edu       = edus[i%5];
  const smokes    = ["Non-smoker","Social smoker","Non-smoker","Non-smoker"][i%4];
  const drinks    = ["Non-drinker","Social drinker","Non-drinker","Non-drinker"][i%4];
  const exercises = ["Daily","2-3x/week","Weekly","Occasionally"][i%4];
  const loveLangs = ["Quality time","Acts of service","Words of affirmation","Physical touch","Gift giving"];
  const loveLang  = loveLangs[i%5];
  const timelines = ["Ready when it feels right","Within 1 year","1-2 years","Not rushing"];
  const timeline  = timelines[i%4];
  const religion  = i%6===5 ? "Christian" : i%6===4 ? "Hindu" : "Muslim";
  const uuid_seed = `mock_profile_${i}`;

  // Build JSON strings for JSONB columns
  const basic_info = `{"height":"${height}","body_type":"${bodyType}","education":"${edu}","languages":${langs}}`;
  const lifestyle  = `{"smoking":"${smokes}","drinking":"${drinks}","exercise":"${exercises}","love_language":"${loveLang}"}`;
  const rel_goals  = `{"looking_for":"${lf}","timeline":"${timeline}","religion":"${religion}","marital_status":"Never married"}`;

  const onlineMin  = i%3!==0;
  const lastSeenOffset = onlineMin ? `${(i%5)*30} seconds` : `${15+i%90} minutes`;

  rows.push({
    i, uuid_seed, name, bio, gender, age, city, lat, lng, img1, img2, lf, hours,
    langs, basic_info, lifestyle, rel_goals, lastSeenOffset,
    available_tonight: i%7===1, is_plusone: i%7===2,
    generous_lifestyle: i%7===3, weekend_plans: i%7===4,
    late_night_chat: i%7===5, no_drama: i%7===6, is_verified: i%10<7,
  });
}

const lines = [];

lines.push("-- Step 1: Create auth users (idempotent)");
lines.push("INSERT INTO auth.users");
lines.push("  (id, instance_id, aud, role, email, encrypted_password,");
lines.push("   email_confirmed_at, created_at, updated_at,");
lines.push("   raw_user_meta_data, raw_app_meta_data,");
lines.push("   is_super_admin, confirmation_token, recovery_token,");
lines.push("   email_change_token_current, email_change_token_new, is_sso_user)");
lines.push("VALUES");
rows.forEach((r, idx) => {
  const meta = `{"name":"${sq(r.name)}","gender":"${r.gender}","is_mock":true}`;
  const comma = idx < rows.length - 1 ? "," : "";
  lines.push(
    `  (uuid_generate_v5('00000000-0000-0000-0000-000000000000', '${r.uuid_seed}'),` +
    `'00000000-0000-0000-0000-000000000000','authenticated','authenticated',` +
    `'mock.profile.${r.i}@skiptheapp.internal','',now(),now(),now(),` +
    `'${meta}','{"provider":"email","providers":["email"]}',` +
    `false,'','','','',false)${comma}`
  );
});
lines.push("ON CONFLICT DO NOTHING;");
lines.push("");

lines.push("-- Step 2: Upsert profiles");
lines.push("INSERT INTO public.profiles");
lines.push("  (id, name, age, gender, looking_for, country, city, bio, whatsapp,");
lines.push("   avatar_url, images, image_positions, latitude, longitude,");
lines.push("   available_tonight, is_plusone, generous_lifestyle, weekend_plans,");
lines.push("   late_night_chat, no_drama, is_verified, is_active, is_banned,");
lines.push("   is_mock, mock_online_hours, last_seen_at, languages,");
lines.push("   basic_info, lifestyle_info, relationship_goals, orientation)");
lines.push("SELECT");
lines.push("  uuid_generate_v5('00000000-0000-0000-0000-000000000000', d.uuid_seed),");
lines.push("  d.name, d.age::integer, d.gender, d.lf, 'Indonesia', d.city, d.bio, '',");
lines.push("  d.img1, ARRAY[d.img1, d.img2], '[]'::jsonb,");
lines.push("  d.lat::double precision, d.lng::double precision,");
lines.push("  d.available_tonight, d.is_plusone, d.generous_lifestyle, d.weekend_plans,");
lines.push("  d.late_night_chat, d.no_drama, d.is_verified, true, false,");
lines.push("  true, d.hours::integer,");
lines.push("  now() - d.last_seen_offset::interval,");
lines.push("  d.langs::jsonb, d.basic_info::jsonb, d.lifestyle::jsonb, d.rel_goals::jsonb, 'Straight'");
lines.push("FROM (VALUES");
rows.forEach((r, idx) => {
  const comma = idx < rows.length - 1 ? "," : "";
  lines.push(
    `  ('${r.uuid_seed}','${sq(r.name)}',${r.age},'${r.gender}','${r.lf}','${sq(r.city)}','${sq(r.bio)}',` +
    `'${r.img1}','${r.img2}',${r.available_tonight},${r.is_plusone},${r.generous_lifestyle},` +
    `${r.weekend_plans},${r.late_night_chat},${r.no_drama},${r.is_verified},${r.hours},` +
    `'${r.lastSeenOffset}','${r.lat}','${r.lng}','${r.langs.replace(/'/g,"''")}',` +
    `'${r.basic_info.replace(/'/g,"''")}','${r.lifestyle.replace(/'/g,"''")}','${r.rel_goals.replace(/'/g,"''")}')${comma}`
  );
});
lines.push(") AS d(uuid_seed, name, age, gender, lf, city, bio,");
lines.push("       img1, img2, available_tonight, is_plusone, generous_lifestyle,");
lines.push("       weekend_plans, late_night_chat, no_drama, is_verified, hours,");
lines.push("       last_seen_offset, lat, lng, langs, basic_info, lifestyle, rel_goals)");
lines.push("ON CONFLICT (id) DO UPDATE SET");
lines.push("  name = EXCLUDED.name, bio = EXCLUDED.bio, city = EXCLUDED.city,");
lines.push("  avatar_url = EXCLUDED.avatar_url, images = EXCLUDED.images,");
lines.push("  is_mock = true, mock_online_hours = EXCLUDED.mock_online_hours,");
lines.push("  last_seen_at = EXCLUDED.last_seen_at,");
lines.push("  basic_info = EXCLUDED.basic_info, lifestyle_info = EXCLUDED.lifestyle_info,");
lines.push("  relationship_goals = EXCLUDED.relationship_goals, updated_at = now();");
lines.push("");
lines.push("SELECT count(*) AS mock_profiles_seeded FROM public.profiles WHERE is_mock = true;");

const outPath = path.join(__dirname, "..", "supabase", "migrations", "seed_mock_data.sql");
fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log("Generated: " + outPath);
console.log("Paste the contents of that file into Supabase SQL Editor and run it.");
