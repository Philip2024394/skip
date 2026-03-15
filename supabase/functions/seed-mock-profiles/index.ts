import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Data pools ────────────────────────────────────────────────────────────────

const FEMALE_NAMES = [
  "Putri","Dewi","Sari","Ayu","Rina","Wulan","Indah","Ratna","Mega","Dian",
  "Lestari","Anisa","Fitri","Nurul","Sinta","Kartika","Melati","Citra","Bunga","Kirana",
  "Dinda","Nadia","Laras","Tari","Widya","Ariani","Bella","Cahya","Devi","Eka",
  "Farah","Gita","Hasna","Intan","Jasmine","Kezia","Lila","Maya","Nova","Olivia",
  "Puspita","Qanita","Rara","Salma","Tiara","Ulfa","Vina","Widi","Xena","Yola",
  "Zahra","Amira","Binta","Celine","Diana","Elsa","Fanny","Grace","Hana","Ines",
  "Jihan","Krisna","Lana","Mira","Nayla","Ophi","Qisti","Reni","Sela",
  "Tria","Uma","Vera","Wenny","Yasmin","Zelia","Adinda","Brena","Calista","Dahlia",
  "Elina","Firda","Ghina","Hesti","Ira","Julita","Katya","Lidya","Mala","Nisa",
];

const MALE_NAMES = [
  "Budi","Rizky","Dimas","Arief","Bayu","Dwi","Eko","Gilang",
  "Hendra","Irfan","Joko","Kevin","Made","Naufal","Oka",
  "Teguh","Umar","Vito","Wahyu","Xander","Yusuf","Zaki",
  "Adrian","Bima","Chandra","Daffa","Evan","Fajar","Guntur","Hanif",
];

const CITIES = [
  "Jakarta","Bali","Bandung","Surabaya","Yogyakarta",
  "Medan","Semarang","Makassar","Malang","Solo",
  "Palembang","Balikpapan","Manado","Pontianak","Lombok",
];

const COORDS: [number, number][] = [
  [-6.2088, 106.8456], [-8.3405, 115.092],  [-6.9175, 107.6191],
  [-7.2575, 112.7521], [-7.7956, 110.3695], [ 3.5952,  98.6722],
  [-6.9666, 110.4196], [-5.1477, 119.4327], [-7.9666, 112.6326],
  [-7.5755, 110.8243], [-2.9761, 104.7754], [-1.2654, 116.8312],
  [ 1.4748, 124.8421], [-0.0263, 109.3425], [-8.5833, 116.1167],
];

const FEMALE_IMAGES = [
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1514315384763-ba401779410f?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1530785602389-07594beb8b73?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1506956191951-7a88da4435e5?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1474978528675-4a50a4508dc6?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1483181957632-8bda974cbc91?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1546961342-ea5f62d5a27b?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400&h=500&fit=crop&face",
];

const MALE_IMAGES = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1541271696563-3be2f555fc4e?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=500&fit=crop&face",
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
  "Environmental scientist 🌿 Beach cleanups on weekends, let's make a difference",
  "Graphic designer & part-time DJ 🎧 Always discovering new music",
  "Hotel management graduate 🏨 Love meeting people from different cultures",
  "Psychology student 🧠 Good listener, better cook. Try me!",
  "Software engineer 💻 Yoga every morning, gaming every night",
  "Dance teacher 💃 Salsa, contemporary, traditional — I do it all",
  "Pharmacist by profession, traveler by heart ✈️ 15 countries and counting",
  "Interior designer 🏠 Can rearrange your living room and your life priorities",
  "Marine biologist 🐠 If you love the ocean as much as I do, let's talk",
  "Journalist 📝 Always chasing stories and good street food",
  "Pilates instructor 🧘‍♀️ Believe in balance — work hard, rest harder",
  "Architect student 📐 Love old buildings and new conversations",
  "Barista at a specialty coffee shop ☕ I'll make you the perfect cup",
  "Digital marketer 📊 Weekend painter, terrible singer but enthusiastic",
  "Law student ⚖️ Debate me over dinner?",
  "Veterinarian 🐾 My golden retriever approves all my dates first",
  "Flight attendant ✈️ Based in Jakarta but my heart belongs everywhere",
  "Beauty influencer 💄 Honest reviews, real opinions — and I bake on weekends",
  "Product manager at a startup 🚀 Weekend runner and trail hiker",
  "Event organiser 🎉 If there's a party, I probably planned it",
  "Culinary arts student 🍱 Specialising in Javanese cuisine with a modern twist",
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
  "Pilot trainee ✈️ Head in the clouds, feet on the ground",
  "Marine biologist studying coral reefs 🐙 Ocean conservation is my thing",
  "Rice farmer's son turned tech entrepreneur 🌾➡️💻",
  "Surf instructor in Canggu 🏄 Chill vibes only",
  "Dentist with a sweet tooth 🦷🍫 Ironic, I know",
];

const LOOKING_FOR_FEMALE = [
  "Dating","Relationship","Dating","Relationship","Dating",
  "Friendship","Relationship","Dating","Relationship","Dating",
  "Friendship","Dating","Relationship","Dating","Relationship",
  "Dating","Friendship","Relationship","Dating","Relationship",
  "Dating","Relationship","Dating","Friendship","Relationship",
  "Dating","Relationship","Dating","Relationship","Friendship",
];

const LOOKING_FOR_MALE = [
  "Dating","Relationship","Dating","Friendship","Dating",
  "Relationship","Dating","Dating","Relationship","Friendship",
  "Dating","Networking","Relationship","Dating","Friendship",
  "Relationship","Dating","Dating","Friendship","Relationship",
];

const EXTRA_LANGS_POOL: (string[] | undefined)[] = [
  ["English"],["English","Arabic"],["English"],undefined,["English"],
  ["Arabic"],["English"],["English"],undefined,["English","Arabic"],
  ["English"],undefined,["Arabic"],["English"],["English"],
  undefined,["English","Arabic"],["English"],["Arabic"],["English"],
];

// ── Basic / lifestyle / relationship pools ────────────────────────────────────

const FEMALE_HEIGHTS = ["155cm","157cm","158cm","160cm","162cm","163cm","165cm","167cm","168cm","170cm"];
const MALE_HEIGHTS   = ["168cm","170cm","172cm","174cm","175cm","177cm","178cm","180cm","182cm","185cm"];
const FEMALE_BODY    = ["Slim","Petite","Athletic","Curvy","Average"];
const MALE_BODY      = ["Slim","Athletic","Muscular","Average","Lean"];
const ETHNICITIES_F  = ["Javanese","Sundanese","Balinese","Minangkabau","Betawi","Bugis","Madurese","Chinese-Indonesian","Mixed","Batak"];
const ETHNICITIES_M  = ["Javanese","Sundanese","Balinese","Minangkabau","Betawi","Bugis","Makassarese","Chinese-Indonesian","Mixed","Malay"];
const EDUCATIONS     = ["High School","Diploma","Bachelor's Degree","Bachelor's Degree","Bachelor's Degree","Master's Degree","Master's Degree","Doctorate","Vocational","Professional Degree"];
const INCOMES        = ["< Rp 5M/mo","Rp 5–10M/mo","Rp 10–20M/mo","Rp 20–40M/mo","Rp 40M+/mo","Prefer not to say"];
const LIVES_WITH     = ["Lives alone","With family","With housemates","With partner","Own home"];
const CHILDREN       = ["No children","1 child","2 children","3+ children","No children, open to having","No children, not planning to"];
const SMOKING        = ["Non-smoker","Non-smoker","Social smoker","Light smoker","Non-smoker","Quit smoking"];
const DRINKING       = ["Non-drinker","Social drinker","Non-drinker","Light drinker","Rarely drinks","Non-drinker","Social drinker"];
const EXERCISE       = ["Daily","4–5×/week","2–3×/week","Occasionally","Rarely","Weekly gym","Yoga & pilates","Running & cycling"];
const DIET           = ["No preference","Halal only","Vegetarian","Mostly healthy","Loves street food","Home-cooked meals"];
const SLEEP          = ["Night owl","Early bird","Flexible","Late sleeper","Varies by week","Usually by midnight"];
const SOCIAL         = ["Introvert","Ambivert","Extrovert","Social but selective","Homebody","Outgoing"];
const LOVE_LANG      = ["Quality time","Words of affirmation","Acts of service","Physical touch","Gift giving","Quality time","Words of affirmation"];
const PETS           = ["Cat lover","Dog person","Has cats","Has a dog","No pets","Animal lover","Allergic to pets","Open to pets"];
const HOBBIES: string[][] = [
  ["Cooking","Hiking","Reading"],["Travel","Photography","Yoga"],["Music","Dancing","Cooking"],
  ["Gaming","Movies","Gym"],["Painting","Cycling","Coffee"],["Surfing","Swimming","Food tours"],
  ["Badminton","Running","Karaoke"],["Gardening","Baking","Journaling"],
  ["Diving","Motorbike trips","Street photography"],["Crafts","Watching K-dramas","Board games"],
];
const RELIGIONS_F    = ["Muslim","Muslim","Muslim","Muslim","Muslim","Christian","Hindu","Buddhist","Catholic","Muslim"];
const RELIGIONS_M    = ["Muslim","Muslim","Muslim","Muslim","Muslim","Christian","Hindu","Buddhist","Catholic","Muslim"];
const PRAYER_OPTS    = ["5× daily","Regularly","Occasionally","Fridays only","Trying to improve","Not practicing"];
const HIJAB_OPTS     = ["Yes, full hijab","Yes, sometimes","No","Syari","Prefer not to say"];
const DATE_TYPES     = ["Traditional courtship","Modern casual dating","Getting to know first","Halal approach","Open to both"];
const TIMELINES      = ["Ready when it feels right","Within 1 year","1–2 years","Not rushing","Serious about marriage"];
const MARITAL_OPTS   = ["Never married","Divorced","Widowed","Prefer not to say"];
const DOWRY_OPTS     = ["Open to discussion","Important to my family","Flexible","Symbolic amount","Not required"];
const FAMILY_OPTS    = ["Very important","Somewhat involved","Independent decision","Meet the family first"];
const ABOUT_PARTNER  = [
  "Someone who is honest, kind, and values family. I appreciate a person who communicates openly.",
  "Looking for someone with a good sense of humour and a warm heart. Ambition is attractive.",
  "Loyalty and faith are most important to me. I want someone who is ready to grow together.",
  "I'd love someone who enjoys simple pleasures — a walk, good food, and real conversations.",
  "Someone grounded, caring, and who isn't afraid of commitment. Maturity matters more than age.",
  "I'm looking for a partner who respects my independence while building something beautiful together.",
  "Faith, family, and kindness. If those are your priorities too, let's talk.",
  "An emotionally available person who makes time for the people they love.",
  "Someone who shares my curiosity about the world and isn't afraid to be vulnerable.",
  "Genuine, patient, and supportive. I want a partner, not just a companion.",
];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

function buildBasicInfo(i: number, gender: string, languages: string[]) {
  return {
    height:    gender === "Female" ? pick(FEMALE_HEIGHTS, i) : pick(MALE_HEIGHTS, i),
    body_type: gender === "Female" ? pick(FEMALE_BODY, i)    : pick(MALE_BODY, i),
    ethnicity: gender === "Female" ? pick(ETHNICITIES_F, i)  : pick(ETHNICITIES_M, i),
    education: pick(EDUCATIONS, i),
    income:    pick(INCOMES, i),
    lives_with: pick(LIVES_WITH, i),
    children:  pick(CHILDREN, i),
    languages,
  };
}

function buildLifestyleInfo(i: number) {
  return {
    smoking:      pick(SMOKING, i),
    drinking:     pick(DRINKING, i),
    exercise:     pick(EXERCISE, i),
    diet:         pick(DIET, i),
    sleep:        pick(SLEEP, i),
    social_style: pick(SOCIAL, i),
    love_language: pick(LOVE_LANG, i),
    pets:         pick(PETS, i),
    hobbies:      pick(HOBBIES, i),
  };
}

function buildRelationshipGoals(i: number, gender: string, lookingFor: string) {
  return {
    looking_for:        lookingFor,
    timeline:           pick(TIMELINES, i),
    date_type:          pick(DATE_TYPES, i),
    marital_status:     pick(MARITAL_OPTS, i),
    religion:           gender === "Female" ? pick(RELIGIONS_F, i) : pick(RELIGIONS_M, i),
    prayer:             pick(PRAYER_OPTS, i),
    ...(gender === "Female" ? { hijab: pick(HIJAB_OPTS, i) } : {}),
    dowry:              pick(DOWRY_OPTS, i),
    family_involvement: pick(FAMILY_OPTS, i),
    about_partner:      pick(ABOUT_PARTNER, i),
  };
}

function randOffsetFor(seed: number): number {
  return ((seed * 1664525 + 1013904223) & 0x7fffffff) % 100 / 100 * 0.6 - 0.3;
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

    // ── Build email → existing UUID map ──────────────────────────────
    const existingMap = new Map<string, string>();
    let page = 1;
    while (true) {
      const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
        page, perPage: 1000,
      });
      if (listErr || !users || users.length === 0) break;
      for (const u of users) {
        if (u.email) existingMap.set(u.email, u.id);
      }
      if (users.length < 1000) break;
      page++;
    }

    // ── Seed profiles ─────────────────────────────────────────────────
    const FEMALE_COUNT = 70;
    const MALE_COUNT   = 20;
    const total        = FEMALE_COUNT + MALE_COUNT;

    let created = 0, updated = 0, failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < total; i++) {
      const isFemale   = i < FEMALE_COUNT;
      const genderIdx  = isFemale ? i : i - FEMALE_COUNT;
      const gender     = isFemale ? "Female" : "Male";
      const nameList   = isFemale ? FEMALE_NAMES : MALE_NAMES;
      const bioList    = isFemale ? FEMALE_BIOS  : MALE_BIOS;
      const imgList    = isFemale ? FEMALE_IMAGES : MALE_IMAGES;
      const lookingFor = isFemale
        ? pick(LOOKING_FOR_FEMALE, genderIdx)
        : pick(LOOKING_FOR_MALE, genderIdx);
      const extraLangs = EXTRA_LANGS_POOL[i % EXTRA_LANGS_POOL.length] ?? [];
      const languages  = ["Indonesian", ...extraLangs];
      const name       = pick(nameList, genderIdx);
      const cityIdx    = i % CITIES.length;
      const [baseLat, baseLng] = COORDS[cityIdx];
      const lat        = baseLat  + randOffsetFor(i * 17 + 3);
      const lng        = baseLng  + randOffsetFor(i * 13 + 7);
      const email      = `mock.profile.${i}@skiptheapp.internal`;
      const img1       = imgList[genderIdx % imgList.length];
      const img2       = imgList[(genderIdx + 5) % imgList.length];
      const isOnline   = i % 3 !== 0;
      const now        = Date.now();
      const last_seen_at = isOnline
        ? new Date(now - Math.floor((i % 5) * 30000)).toISOString()
        : new Date(now - (15 + (i % 90)) * 60000).toISOString();
      const mockHours  = 6 + (i % 9);  // 6–14 hours online per day

      // Resolve UUID
      let uid = existingMap.get(email);
      if (!uid) {
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          password: "mock-account-not-for-login-" + i,
          user_metadata: { name, gender, is_mock: true },
        });
        if (createErr) {
          failed++;
          errors.push(`[${i}] auth: ${createErr.message}`);
          continue;
        }
        uid = newUser.user?.id;
      }
      if (!uid) { failed++; errors.push(`[${i}] no uid`); continue; }

      const profileRow = {
        id:                   uid,
        name,
        age:                  19 + (i % 16),
        gender,
        looking_for:          lookingFor,
        country:              "Indonesia",
        city:                 CITIES[cityIdx],
        bio:                  pick(bioList, genderIdx),
        whatsapp:             "",
        avatar_url:           img1,
        images:               [img1, img2],
        image_positions:      { "0": "50% 20%", "1": "50% 20%" },
        latitude:             lat,
        longitude:            lng,
        available_tonight:    i % 3 === 0,
        last_seen_at,
        languages,
        is_active:            true,
        is_banned:            false,
        is_mock:              true,
        mock_online_hours:    mockHours,
        mock_offline_days:    null,
        is_plusone:           i % 5 === 1,
        generous_lifestyle:   i % 6 === 2,
        weekend_plans:        i % 7 === 1,
        late_night_chat:      i % 8 === 3,
        no_drama:             i % 9 === 0,
        is_verified:          i % 10 < 7,
        basic_info:           buildBasicInfo(genderIdx, gender, languages),
        lifestyle_info:       buildLifestyleInfo(genderIdx),
        relationship_goals:   buildRelationshipGoals(genderIdx, gender, lookingFor),
        orientation:          "Straight",
        interests:            pick(HOBBIES, genderIdx),
      };

      const { error: upsertErr } = await supabaseAdmin
        .from("profiles")
        .upsert(profileRow as any, { onConflict: "id" });

      if (upsertErr) {
        failed++;
        errors.push(`[${i}] ${name}: ${upsertErr.message}`);
      } else {
        if (existingMap.has(email)) updated++; else created++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, total, created, updated, failed, errors: errors.slice(0, 20) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
