import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { generateIndonesianProfiles } from "@/data/indonesianProfiles";
import { useCoinBalance } from "@/shared/hooks/useCoinBalance";
import CoinShop from "@/shared/components/CoinShop";

// ── Constants ──────────────────────────────────────────────────────────────────

const BLUR_START       = 22;   // px — fully blurred
const BLUR_CORRECT     = 7;    // px removed on correct answer
const BLUR_WRONG       = 2;    // px removed on wrong answer
const BLUR_FLOOR       = 5;    // px — minimum without paying; final reveal needs coins
const COINS_INSTANT    = 30;   // bypass quiz entirely (swipe up)
const COINS_FAIL       = 50;   // unlock after failing quiz
const COINS_PASS_FULL  = 15;   // remove last blur after passing quiz

// ── Types ──────────────────────────────────────────────────────────────────────

interface BlindProfile {
  id: string;
  name: string;
  age: number;
  city: string | null;
  country: string;
  gender: string | null;
  looking_for: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  blind_date_story_age:      string | null;
  blind_date_story_location: string | null;
  blind_date_story_intent:   string | null;
  is_boosted?:               boolean;
  latitude?:                 number | null;
  longitude?:                number | null;
}

interface ProfileQuestion {
  text: string;
  subtitle: string; // shown as italic clue above the question
  field: string;    // profile field this answer fills
  emoji: string;
  options: Array<{ label: string; value: string }>;
}

// ── Profile-building question bank ────────────────────────────────────────────

const PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    text: "What's your ideal first date?",
    subtitle: "Your answer will be shared with them — help them picture you before they say yes.",
    field: "date_style",
    emoji: "🌙",
    options: [
      { label: "Cosy café, just talking for hours", value: "Cosy café conversation" },
      { label: "Walk somewhere with a view", value: "Scenic walk" },
      { label: "Something spontaneous — surprise me", value: "Spontaneous adventure" },
      { label: "Dinner, good wine, no rush", value: "Dinner date" },
    ],
  },
  {
    text: "How would your best friend describe you?",
    subtitle: "They'll see this. Make it honest — real beats polished every time.",
    field: "personality_type",
    emoji: "✨",
    options: [
      { label: "The one who plans everything", value: "The planner" },
      { label: "Loyal to the core, deep friendships", value: "Deeply loyal" },
      { label: "Chaotic, hilarious, unpredictable", value: "Chaotic fun energy" },
      { label: "Calm, steady, always there", value: "Calm and reliable" },
    ],
  },
  {
    text: "What are you actually looking for right now?",
    subtitle: "Be honest — they'll respect you more for it, and it'll save you both time.",
    field: "looking_for",
    emoji: "💭",
    options: [
      { label: "Something real, not just talking", value: "Serious relationship" },
      { label: "Easy, fun, see where it goes", value: "Casual dating" },
      { label: "A genuine connection, no pressure", value: "New friends" },
      { label: "Honestly still figuring it out", value: "Not sure yet" },
    ],
  },
];

// ── Viewer answer record ───────────────────────────────────────────────────────

interface ViewerAnswer {
  field: string;
  question: string;
  answer: string;
}

// ── DEV mock data ──────────────────────────────────────────────────────────────

const DEV_BLIND_PROFILES: BlindProfile[] = generateIndonesianProfiles(20).map(p => ({
  id: p.id,
  name: p.name,
  age: p.age,
  city: p.city ?? null,
  country: p.country,
  gender: p.gender ?? null,
  looking_for: (p as any).looking_for ?? null,
  bio: p.bio ?? null,
  avatar_url: p.image ?? (p.images?.[0] ?? null),
  created_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
  blind_date_story_age: null,
  blind_date_story_location: null,
  blind_date_story_intent: null,
  // Jakarta area spread ~50km
  latitude:  -6.2 + (Math.random() - 0.5) * 0.9,
  longitude: 106.8 + (Math.random() - 0.5) * 0.9,
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return "< 1 km";
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// ── Age story clues ────────────────────────────────────────────────────────────

function ageClue(age: number): { label: string; clue: string } {
  if (age <= 22) return {
    label: "18 – 22",
    clue: "My first serious crush and I used to send each other BeReal notifications at the same time every day for three months. We never actually met. Last year someone sent me a TikTok of him and I didn't recognise him for a full ten seconds. That felt like a summary of my whole generation.",
  };
  if (age <= 26) return {
    label: "23 – 26",
    clue: "I defended my thesis on a Zoom call. The examiner's cat walked across the keyboard twice. My mum stood outside the door holding a handwritten sign that said GO! I passed, but my graduation ceremony was cancelled — we took a photo in the garden instead. That's the photo on my parents' wall.",
  };
  if (age <= 30) return {
    label: "27 – 30",
    clue: "I remember my dad sitting very still in front of the news for a long time in 2008. He didn't want to explain it to me. That year we stopped going on holiday and my parents spoke in quieter voices about things I wasn't supposed to hear. I didn't connect all of it until years later.",
  };
  if (age <= 35) return {
    label: "31 – 35",
    clue: "I made a Facebook profile the week it opened up outside university emails. I spent four hours choosing my profile photo. I posted a cryptic song lyric and waited to see who noticed. Now I log in maybe once a year to check if someone I went to school with got married.",
  };
  if (age <= 40) return {
    label: "36 – 40",
    clue: "My first phone had a pull-out antenna and a ringtone I changed every week. I remember the exact screech of a dial-up connection and the specific disappointment when someone picked up the landline and killed the internet. We had one family computer in the hallway and took turns.",
  };
  return {
    label: "40+",
    clue: "I had a pen pal. A real one — letters, stamps, two weeks to get a reply. She lived in another city and we wrote to each other for three years before we actually met. When I finally saw her I already knew everything important about her. I've never felt that kind of anticipation from a notification.",
  };
}

// ── Location story clues ───────────────────────────────────────────────────────

function locationClue(_city: string | null, country: string): { clue: string; label: string; options: string[] } {
  const countryMap: Record<string, { clue: string; label: string; options: string[] }> = {
    Indonesia: {
      label: "Indonesia",
      clue: "Every year during Lebaran our whole street fills with the smell of ketupat and the sound of takbiran echoing from the mosque until dawn. The day after, we go door-to-door visiting every elder in the neighbourhood — it takes most of the morning. I always end up eating the same rendang at six different houses.",
      options: ["Indonesia","Malaysia","Philippines","Thailand"],
    },
    Malaysia: {
      label: "Malaysia",
      clue: "We have a saying here: eat first, talk later. During Hari Raya the table never empties — someone is always refilling the kuih and the lemang. My aunts still argue about whose rendang is better every single year, and the argument is never resolved because everyone secretly agrees it is my grandmother's.",
      options: ["Malaysia","Indonesia","Singapore","Brunei"],
    },
    Philippines: {
      label: "Philippines",
      clue: "Fiestas here run for days. Our town patron saint's feast means lechon, brass bands, and every distant relative you haven't seen since childhood suddenly appearing at your door. I spent one whole Sinulog dancing in the street in a costume my lola made by hand. My ears rang for three days.",
      options: ["Philippines","Indonesia","Vietnam","Thailand"],
    },
    Thailand: {
      label: "Thailand",
      clue: "The first day of our new year everyone is outside with water. It starts as a gentle sprinkle on elders' hands and ends as an all-out war — motorbikes, buckets, strangers. I once got completely soaked at 7 in the morning on the way to buy breakfast. The seller just handed me a plastic bag for my phone.",
      options: ["Thailand","Cambodia","Laos","Myanmar"],
    },
    Vietnam: {
      label: "Vietnam",
      clue: "Tet means the whole city turns red and gold overnight. My family makes bánh chưng together — wrapping the sticky rice takes hours and my grandmother has the technique so precise she can do it blindfolded. The first morning of the new year nobody sweeps the floor because you'd sweep the luck out with the dust.",
      options: ["Vietnam","Thailand","Cambodia","Philippines"],
    },
    Singapore: {
      label: "Singapore",
      clue: "I grew up a ten-minute walk from a hawker centre that has been in the same spot for forty years. The uncle at the char kway teow stall knows my order. Sometimes a queue forms before dawn for laksa because the aunty who makes it is 74 and only cooks until the pot is empty — never more.",
      options: ["Singapore","Malaysia","Indonesia","Brunei"],
    },
    India: {
      label: "India",
      clue: "During Diwali our building becomes a competition without anyone agreeing to compete. Each floor tries to out-decorate the one above. My mother starts buying diyas in September. The smell of mithai and gunpowder and marigold is the smell of the best week of the year without question.",
      options: ["India","Pakistan","Sri Lanka","Bangladesh"],
    },
    Pakistan: {
      label: "Pakistan",
      clue: "Chand Raat is chaos in the best way. Every girl in the neighbourhood is out with her mother getting mehndi done until two in the morning, bangles clicking in the streets. My cousin and I stayed up the whole night once — we were too excited to sleep, too full of sewaiyan, too happy to sit still.",
      options: ["Pakistan","India","Bangladesh","Afghanistan"],
    },
    "United Kingdom": {
      label: "United Kingdom",
      clue: "There is a specific kind of British optimism that says twenty degrees is a heatwave and justifies a barbecue. We drag a disposable grill to the park, sit on coats because the grass is damp, and pretend it is summer. It rains by four o'clock. Everyone agrees it was a brilliant day out.",
      options: ["United Kingdom","Ireland","Australia","Canada"],
    },
    Australia: {
      label: "Australia",
      clue: "Christmas dinner here is prawns and cold ham in forty degree heat, everyone slightly sunburned, the ceiling fans on full blast. We eat outside under a fly net. My nana still makes brandy custard even though nobody wants a hot pudding in December. She says tradition doesn't care about weather.",
      options: ["Australia","New Zealand","United Kingdom","Canada"],
    },
    "United States": {
      label: "United States",
      clue: "Thanksgiving in our house means my dad starts the turkey argument at 6am and dinner isn't ready until 4pm. We watch the parade on a TV that's too loud, someone falls asleep on the couch before dessert, and we eat leftover pie for breakfast the next day. It is the same every year and I would change nothing.",
      options: ["United States","Canada","Australia","United Kingdom"],
    },
    Canada: {
      label: "Canada",
      clue: "Winter here means starting your car ten minutes before you need it and still scraping ice off the windshield with a credit card because you can't find the proper scraper. The first real snow of the year still makes everyone go outside and look at it. We know what's coming but we always look.",
      options: ["Canada","United States","United Kingdom","Australia"],
    },
    Brazil: {
      label: "Brazil",
      clue: "Carnival in my city means four days where nobody sleeps. The blocos start at dawn and go until the streets empty out near midnight, then start again. My grandmother used to say the city only has two real seasons: Carnival and waiting for Carnival. I didn't understand until I moved away and missed it.",
      options: ["Brazil","Argentina","Colombia","Peru"],
    },
    Nigeria: {
      label: "Nigeria",
      clue: "Every celebration in my family ends the same way: Afrobeats turned up too loud, someone's aunty dancing in the middle of the room, jollof rice being disputed over which family made it better. My cousin flew from London for our grandmother's 70th birthday specifically to argue about the rice. She had a point.",
      options: ["Nigeria","Ghana","Kenya","South Africa"],
    },
    "South Africa": {
      label: "South Africa",
      clue: "Braai is not a barbecue — if you call it a barbecue someone will correct you. It's a whole afternoon: the fire lit early, someone always convinced theirs is the superior method of stacking the wood, boerewors splitting over the coals, conversations that drift from sport to politics and back to food.",
      options: ["South Africa","Nigeria","Kenya","Zimbabwe"],
    },
    Japan: {
      label: "Japan",
      clue: "Hanami only lasts about a week if the weather cooperates. My coworkers book spots under the cherry trees days in advance with a tarpaulin and a cooler. By the time everyone arrives the blossoms are at their absolute peak and we all sit under a pink ceiling eating convenience store snacks like it is the finest restaurant in the world.",
      options: ["Japan","South Korea","China","Taiwan"],
    },
    "South Korea": {
      label: "South Korea",
      clue: "Chuseok means the entire country is on the road at the same time. What is normally a two hour drive becomes six. But arriving means my grandmother's jeon and tteok already on the table and relatives I only see twice a year all talking over each other at once. The traffic is worth it every time.",
      options: ["South Korea","Japan","China","Taiwan"],
    },
    Turkey: {
      label: "Turkey",
      clue: "In my neighbourhood the tea house has been open since before my father was born. Men who have known each other forty years sit at the same table every morning drinking çay from tulip glasses. My grandfather took me when I was small. I had a glass of water and felt very important. That table is still there.",
      options: ["Turkey","Iran","Egypt","Greece"],
    },
    Egypt: {
      label: "Egypt",
      clue: "Ramadan nights here are social. The street outside our building fills after iftar — families sitting on chairs outside their doors, kids playing until midnight, the smell of atar and tea from the cafe on the corner. During the day the city quiets. After dark it comes fully alive.",
      options: ["Egypt","Turkey","Jordan","Lebanon"],
    },
    Mexico: {
      label: "Mexico",
      clue: "Día de Muertos in my family means marigolds from the market piled on the ofrenda the night before, my grandmother's photo surrounded by her favourite tamales. We light candles and tell stories about her all evening. It doesn't feel sad. It feels like she is still at the table and we are just updating her on what she missed.",
      options: ["Mexico","Colombia","Argentina","Brazil"],
    },
  };

  const entry = countryMap[country];
  if (entry) return entry;

  // Fallback for unlisted countries
  return {
    label: country,
    clue: `There's a food here that visitors always underestimate. They see it on the menu, order it because it's cheap, and then spend the rest of the trip ordering it again. My grandmother made the version I still compare everything else to. I've never found one that matches. I've stopped telling people that because they don't believe me until they try hers.`,
    options: shuffle(["Asia","Europe","South America","Africa","Oceania","North America"]).slice(0, 3).concat([country]),
  };
}

// ── Intent story clues ─────────────────────────────────────────────────────────

function intentClue(lookingFor: string | null): { clue: string; label: string; options: string[] } {
  const lf = (lookingFor || "").toLowerCase();

  if (lf.includes("marr") || lf.includes("serious") || lf.includes("long")) return {
    label: lookingFor!,
    clue: "I've stopped going on dates where I already know within ten minutes it won't go anywhere. Not because I am impatient — I just know what I want now. I want someone I'll still be learning things about in year five. I want someone whose name I want in my phone as an emergency contact. That's the version of this I'm here for.",
    options: shuffle(["Long-term partner","Casual dating","New friends","Not sure yet"]) as string[],
  };

  if (lf.includes("casual") || lf.includes("fun") || lf.includes("date")) return {
    label: lookingFor!,
    clue: "I had a really good Saturday last month. Walked to a market I'd never been to, tried three things I couldn't name, talked to a stranger for twenty minutes about something I still think about. I want more Saturdays like that. I'm not planning far ahead right now and I think that's fine.",
    options: shuffle(["Something casual","Long-term","Not sure","Friendship"]) as string[],
  };

  if (lf.includes("friend")) return {
    label: lookingFor!,
    clue: "My best friend and I met because we both showed up twenty minutes early to the same event and had nothing to do but talk. We've been close for six years. I think the best people you'll know come from situations like that — unplanned, slightly awkward, completely genuine. I'm here for more of that.",
    options: shuffle(["New friends","Dating","Long-term","Just looking"]) as string[],
  };

  // Default
  return {
    label: lookingFor || "Undecided",
    clue: "I deleted every dating app I had last year. Then I reinstalled one because a friend dared me to and I was curious. I'm still working out what I'm looking for but I know what a real conversation feels like versus a performance, and I'm only interested in the real kind.",
    options: shuffle(["Still figuring it out","Serious relationship","Casual dates","New friends"]) as string[],
  };
}

// ── Profile question picker ────────────────────────────────────────────────────
// Returns all 3 profile questions — no randomisation needed, always the same set.
function buildQuestions(_p: BlindProfile): ProfileQuestion[] {
  return PROFILE_QUESTIONS;
}

// ══════════════════════════════════════════════════════════════════════════════
// BlindDateQAModal — photo + progressive blur + quiz
// ══════════════════════════════════════════════════════════════════════════════

interface QAModalProps {
  profile: BlindProfile;
  userId: string;
  onClose: () => void;
  onPassedAndReady: (id: string, finalBlur: number) => void;
  onUnlockedWithCoins: (id: string) => void;
  onStartChat: () => void;
}

function BlindDateQAModal({ profile, userId, onClose, onPassedAndReady, onUnlockedWithCoins, onStartChat }: QAModalProps) {
  const { balance, deductCoins } = useCoinBalance(userId);

  const [blurLevel, setBlurLevel]           = useState(BLUR_START);
  const [step, setStep]                     = useState(0);
  const [selected, setSelected]             = useState<number | null>(null);
  const [viewerAnswers, setViewerAnswers]   = useState<ViewerAnswer[]>([]);
  const [phase, setPhase]                   = useState<"quiz" | "passed" | "ask" | "asked" | "unlocked">("quiz");
  const [unlocking, setUnlocking]           = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [revealFlash, setRevealFlash]       = useState(false);
  const [question, setQuestion]             = useState("");
  const [sendingQ, setSendingQ]             = useState(false);
  const [questionTier, setQuestionTier]     = useState<"preset" | "custom" | null>(null);

  // Questions are static profile-building prompts
  const questions = useMemo(() => buildQuestions(profile), [profile.id]);

  const current = questions[step];

  const handleSelect = (idx: number) => {
    if (selected !== null || phase !== "quiz") return;
    setSelected(idx);
    // Every answer always clears blur — no wrong answers when talking about yourself
    setBlurLevel(prev => Math.max(BLUR_FLOOR, prev - BLUR_CORRECT));
    setRevealFlash(true);
    setTimeout(() => setRevealFlash(false), 350);
  };

  const handleNext = async () => {
    if (selected === null || submitting) return;
    const chosenOption = current.options[selected];
    const newAnswers: ViewerAnswer[] = [
      ...viewerAnswers,
      { field: current.field, question: current.text, answer: chosenOption.value },
    ];
    setViewerAnswers(newAnswers);

    // Save answer to viewer's own profile in background (non-blocking)
    if (userId !== "guest-user" && !import.meta.env.DEV) {
      supabase.from("profiles")
        .update({ [current.field]: chosenOption.value })
        .eq("id", userId)
        .then(() => {/* silent */});
    }

    if (step < questions.length - 1) {
      setSelected(null);
      setStep(s => s + 1);
      return;
    }

    // All questions answered → always pass
    setSubmitting(true);
    setSubmitting(false);
    setBlurLevel(BLUR_FLOOR);
    setPhase("passed");
    onPassedAndReady(profile.id, BLUR_FLOOR);
  };

  const handleCoinUnlock = async (cost: number) => {
    if (unlocking || balance < cost) return;
    setUnlocking(true);
    const ok = await deductCoins(cost, "blind_date_unlock");
    if (ok) {
      setBlurLevel(0);
      setPhase("unlocked");
      onUnlockedWithCoins(profile.id);
    }
    setUnlocking(false);
  };

  const coinCost = questionTier === "custom" ? 15 : 5;

  const handleSendQuestion = async () => {
    if (!question.trim() || sendingQ) return;
    if (balance < coinCost) return;
    setSendingQ(true);
    const ok = await deductCoins(coinCost, "blind_date_question");
    if (!ok) { setSendingQ(false); return; }
    try {
      const { data: pushToken } = await supabase.rpc("send_blind_date_question" as any, {
        p_asker_id:      userId,
        p_target_id:     profile.id,
        p_question:      question.trim(),
        p_coins_spent:   coinCost,
        p_is_preset:     questionTier === "preset",
        p_viewer_answers: JSON.stringify(viewerAnswers),
      });
      if (pushToken) {
        const askerRow = await supabase.from("profiles").select("name").eq("id", userId).single();
        const askerName = (askerRow.data as any)?.name?.split(" ")[0] ?? "Someone";
        await supabase.functions.invoke("send-push-notification", {
          body: {
            push_token: pushToken,
            title: "💘 Blind Date — someone's curious about you!",
            body:  `${askerName} answered your profile questions and wants to ask you something…`,
          },
        }).catch(() => { /* push is enhancement only */ });
      }
    } catch { /* silent */ }
    setSendingQ(false);
    setPhase("asked");
  };

  // Button colour helper (selected = highlight, unselected = dim after pick)
  const btnColor = (idx: number): string => {
    if (selected === null) return "rgba(255,255,255,0.08)";
    if (idx === selected) return "rgba(194,24,91,0.35)";
    return "rgba(255,255,255,0.04)";
  };
  const btnBorder = (idx: number): string => {
    if (selected === null) return "1px solid rgba(255,255,255,0.12)";
    if (idx === selected) return "1px solid rgba(194,24,91,0.7)";
    return "1px solid rgba(255,255,255,0.06)";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 24 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        style={{
          width: "100%", maxWidth: 400,
          background: "rgba(10,10,18,0.97)",
          border: "1.5px solid rgba(194,24,91,0.4)",
          borderRadius: 24,
          boxShadow: "0 0 60px rgba(194,24,91,0.25), 0 24px 48px rgba(0,0,0,0.7)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          maxHeight: "92vh",
        }}
      >
        {/* ── Photo section ──────────────────────────────────────────────── */}
        <div style={{ position: "relative", width: "100%", height: 200, flexShrink: 0, overflow: "hidden" }}>
          {profile.avatar_url ? (
            <div
              style={{
                position: "absolute", inset: 0,
                backgroundImage: `url(${profile.avatar_url})`,
                backgroundSize: "cover", backgroundPosition: "center",
                filter: `blur(${blurLevel}px)`,
                transform: "scale(1.12)", // prevents blur edge artefacts
                transition: "filter 0.7s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#1a0a1e,#2d0a1e)" }} />
          )}

          {/* Reveal flash overlay */}
          <AnimatePresence>
            {revealFlash && (
              <motion.div
                key="flash"
                initial={{ opacity: 0.35 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                style={{ position: "absolute", inset: 0, background: "white", pointerEvents: "none" }}
              />
            )}
          </AnimatePresence>

          {/* Bottom gradient */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(10,10,18,1) 0%, rgba(10,10,18,0.3) 50%, rgba(0,0,0,0.15) 100%)",
          }} />

          {/* Blur level pill */}
          <div style={{
            position: "absolute", top: 12, left: 12,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
            borderRadius: 20, padding: "4px 10px",
            fontSize: 11, color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            {blurLevel <= BLUR_FLOOR
              ? `🔒 ${COINS_PASS_FULL} coins to fully reveal`
              : `🌫️ Answer correctly to clear the blur`}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 12, right: 12,
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.7)", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >×</button>

          {/* Name + intent */}
          <div style={{ position: "absolute", bottom: 12, left: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "white", lineHeight: 1 }}>
              {profile.name.split(" ")[0]}
            </div>
            {profile.looking_for && (
              <div style={{
                marginTop: 5, display: "inline-block",
                background: "rgba(194,24,91,0.75)", borderRadius: 20,
                padding: "3px 10px", fontSize: 11, color: "white", fontWeight: 600,
              }}>
                {profile.looking_for}
              </div>
            )}
          </div>
        </div>

        {/* ── Quiz ───────────────────────────────────────────────────────── */}
        {phase === "quiz" && (
          <div style={{ padding: "16px 18px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
            {/* Progress dots */}
            <div style={{ display: "flex", gap: 5 }}>
              {questions.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 3,
                  background: i < step ? "#c2185b" : i === step ? "rgba(194,24,91,0.55)" : "rgba(255,255,255,0.1)",
                  transition: "background 0.3s",
                }} />
              ))}
            </div>

            {/* Header: emoji + step label */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>{current.emoji}</span>
              <div>
                <div style={{ fontSize: 11, color: "rgba(194,24,91,0.9)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  About you — {step + 1}/{questions.length}
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
                  {profile.name.split(" ")[0]} will see your answers
                </div>
              </div>
            </div>

            {/* Subtitle hint */}
            <div style={{
              fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6,
              padding: "10px 13px",
              background: "rgba(194,24,91,0.07)",
              border: "1px solid rgba(194,24,91,0.18)",
              borderRadius: 12,
              fontStyle: "italic",
            }}>
              {current.subtitle}
            </div>

            {/* Question */}
            <div style={{ fontSize: 16, fontWeight: 800, color: "white", lineHeight: 1.3 }}>
              {current.text}
            </div>

            {/* 2×2 answer buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {current.options.map((opt, i) => (
                <motion.button
                  key={i}
                  whileTap={selected === null ? { scale: 0.96 } : {}}
                  onClick={() => handleSelect(i)}
                  style={{
                    padding: "11px 8px",
                    borderRadius: 14,
                    background: btnColor(i),
                    border: btnBorder(i),
                    color: selected === i ? "rgba(255,180,200,1)" : "rgba(255,255,255,0.80)",
                    fontSize: 12, fontWeight: 600,
                    cursor: selected === null ? "pointer" : "default",
                    transition: "background 0.25s, border-color 0.25s, color 0.25s",
                    textAlign: "center", lineHeight: 1.35,
                  }}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>

            {/* Next / Continue */}
            <motion.button
              whileTap={selected !== null ? { scale: 0.97 } : {}}
              onClick={handleNext}
              disabled={selected === null || submitting}
              style={{
                width: "100%", padding: "13px",
                borderRadius: 50,
                background: selected !== null ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "rgba(194,24,91,0.15)",
                border: "none", color: "white",
                fontSize: 14, fontWeight: 700,
                cursor: selected !== null ? "pointer" : "not-allowed",
                transition: "background 0.25s",
                boxShadow: selected !== null ? "0 4px 20px rgba(194,24,91,0.4)" : "none",
              }}
            >
              {step < questions.length - 1 ? "Next →" : "See the reveal ✨"}
            </motion.button>
          </div>
        )}

        {/* ── Passed ─────────────────────────────────────────────────────── */}
        {phase === "passed" && (
          <div style={{ padding: "20px 18px 24px", display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
            <div style={{ fontSize: 36 }}>🥳</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "white", textAlign: "center" }}>
              Your answers are on the way!
            </div>
            {/* Viewer answers summary */}
            <div style={{
              width: "100%", background: "rgba(194,24,91,0.08)", border: "1px solid rgba(194,24,91,0.22)",
              borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{ fontSize: 10, color: "rgba(194,24,91,0.8)", fontWeight: 800, letterSpacing: "0.06em", marginBottom: 2 }}>
                {profile.name.split(" ")[0]} will see this about you
              </div>
              {viewerAnswers.map((a, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{a.question}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>→ {a.answer}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 1.5 }}>
              Now send them a question — they get your answers and your question together.
            </div>

            {/* ── Ask a question CTA ── */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setPhase("ask")}
              style={{
                width: "100%", padding: "14px", borderRadius: 50,
                background: "linear-gradient(135deg,#c2185b,#e91e8c)",
                border: "none", color: "white", fontSize: 15, fontWeight: 800,
                cursor: "pointer", boxShadow: "0 4px 20px rgba(194,24,91,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <span>💬</span> Ask {profile.name.split(" ")[0]} a question
            </motion.button>

            {/* Full reveal coin option */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleCoinUnlock(COINS_PASS_FULL)}
              disabled={balance < COINS_PASS_FULL || unlocking}
              style={{
                width: "100%", padding: "11px", borderRadius: 50,
                background: balance >= COINS_PASS_FULL ? "linear-gradient(135deg,#f59e0b,#f97316)" : "rgba(245,158,11,0.15)",
                border: "none", color: "white", fontSize: 12, fontWeight: 700,
                cursor: balance >= COINS_PASS_FULL ? "pointer" : "not-allowed",
                boxShadow: balance >= COINS_PASS_FULL ? "0 4px 16px rgba(245,158,11,0.35)" : "none",
              }}
            >
              {unlocking ? "Unlocking…" : `🔓 Full photo reveal instead — ${COINS_PASS_FULL} coins`}
            </motion.button>

            <button
              onClick={onStartChat}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer" }}
            >
              Skip — go straight to chat →
            </button>
          </div>
        )}

        {/* ── Ask a question — tier selection ────────────────────────────── */}
        {phase === "ask" && (() => {
          const firstName = profile.name.split(" ")[0];
          const PRESET_QUESTIONS = [
            "What's your idea of a perfect Sunday?",
            "What's something you're really proud of?",
            "What makes you laugh most?",
            "Best place you've ever been?",
            "One thing on your bucket list?",
          ];

          if (!questionTier) {
            // Tier picker
            return (
              <div style={{ padding: "20px 18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>💌</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "white" }}>Ask {firstName} something</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, lineHeight: 1.5 }}>
                    They'll receive your profile answers + your question together.
                  </div>
                </div>

                {/* Preset tier */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setQuestionTier("preset"); setQuestion(""); }}
                  style={{
                    width: "100%", padding: "16px 18px", borderRadius: 16,
                    background: "rgba(194,24,91,0.12)", border: "1.5px solid rgba(194,24,91,0.35)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                    textAlign: "left",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>Pick a question</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>Choose from curated icebreakers</div>
                  </div>
                  <div style={{
                    padding: "5px 12px", borderRadius: 50,
                    background: "linear-gradient(135deg,#c2185b,#e91e8c)",
                    fontSize: 12, fontWeight: 800, color: "white",
                    boxShadow: "0 2px 12px rgba(194,24,91,0.4)",
                  }}>🪙 5</div>
                </motion.button>

                {/* Custom tier */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setQuestionTier("custom"); setQuestion(""); }}
                  style={{
                    width: "100%", padding: "16px 18px", borderRadius: 16,
                    background: "rgba(139,92,246,0.1)", border: "1.5px solid rgba(139,92,246,0.3)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                    textAlign: "left",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>Write your own</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>Send any question you want</div>
                  </div>
                  <div style={{
                    padding: "5px 12px", borderRadius: 50,
                    background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                    fontSize: 12, fontWeight: 800, color: "white",
                    boxShadow: "0 2px 12px rgba(139,92,246,0.4)",
                  }}>🪙 15</div>
                </motion.button>

                <button
                  onClick={() => setPhase("passed")}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer" }}
                >
                  ← Back
                </button>
              </div>
            );
          }

          if (questionTier === "preset") {
            return (
              <div style={{ padding: "20px 18px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => setQuestionTier(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer", padding: 0 }}>←</button>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>Pick a question</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>5 coins • {firstName} will see it with your answers</div>
                  </div>
                </div>

                {PRESET_QUESTIONS.map(q => (
                  <motion.button
                    key={q}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setQuestion(q)}
                    style={{
                      width: "100%", padding: "13px 16px", borderRadius: 14, textAlign: "left",
                      background: question === q ? "rgba(194,24,91,0.22)" : "rgba(255,255,255,0.05)",
                      border: `1.5px solid ${question === q ? "rgba(194,24,91,0.65)" : "rgba(255,255,255,0.09)"}`,
                      color: question === q ? "rgba(255,180,200,1)" : "rgba(255,255,255,0.75)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s",
                    }}
                  >
                    {q}
                  </motion.button>
                ))}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSendQuestion}
                  disabled={!question || sendingQ || balance < 5}
                  style={{
                    marginTop: 4, width: "100%", padding: "14px", borderRadius: 50,
                    background: question && balance >= 5 ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "rgba(194,24,91,0.15)",
                    border: "none", color: "white", fontSize: 14, fontWeight: 800,
                    cursor: question && balance >= 5 ? "pointer" : "not-allowed",
                    boxShadow: question && balance >= 5 ? "0 4px 20px rgba(194,24,91,0.4)" : "none",
                    opacity: sendingQ ? 0.7 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  {sendingQ ? "Sending…" : balance < 5 ? "Not enough coins" : `💌 Send for 5 coins`}
                </motion.button>
              </div>
            );
          }

          // Custom question
          return (
            <div style={{ padding: "20px 18px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setQuestionTier(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer", padding: 0 }}>←</button>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>Write your question</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>15 coins • {firstName} will see it with your answers</div>
                </div>
              </div>

              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value.slice(0, 120))}
                placeholder={`Ask ${firstName} anything…`}
                rows={4}
                style={{
                  width: "100%", padding: "13px 15px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14, color: "white", fontSize: 13,
                  resize: "none", outline: "none",
                  fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box",
                }}
              />
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "right", marginTop: -6 }}>
                {question.length}/120
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSendQuestion}
                disabled={!question.trim() || sendingQ || balance < 15}
                style={{
                  width: "100%", padding: "14px", borderRadius: 50,
                  background: question.trim() && balance >= 15 ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "rgba(139,92,246,0.15)",
                  border: "none", color: "white", fontSize: 14, fontWeight: 800,
                  cursor: question.trim() && balance >= 15 ? "pointer" : "not-allowed",
                  boxShadow: question.trim() && balance >= 15 ? "0 4px 20px rgba(139,92,246,0.4)" : "none",
                  opacity: sendingQ ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {sendingQ ? "Sending…" : balance < 15 ? "Not enough coins" : `💌 Send for 15 coins`}
              </motion.button>
            </div>
          );
        })()}

        {/* ── Question sent confirmation ──────────────────────────────────── */}
        {phase === "asked" && (
          <div style={{ padding: "24px 18px 28px", display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ fontSize: 48 }}
            >
              💌
            </motion.div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "white", textAlign: "center" }}>
              Sent!
            </div>
            <div style={{
              width: "100%", background: "rgba(194,24,91,0.08)",
              border: "1px solid rgba(194,24,91,0.22)",
              borderRadius: 14, padding: "13px 15px",
              fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.65,
            }}>
              <strong style={{ color: "white" }}>{profile.name.split(" ")[0]}</strong> will receive your profile answers <em>and</em> your question together — they'll know exactly who's asking before they reply.
            </div>
            <div style={{
              width: "100%",
              fontSize: 13, color: "rgba(255,255,255,0.75)",
              fontStyle: "italic", textAlign: "center",
              background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "11px 14px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              "{question}"
            </div>
            <button
              onClick={onClose}
              style={{
                width: "100%", padding: "13px", borderRadius: 50, marginTop: 4,
                background: "linear-gradient(135deg,#c2185b,#e91e8c)",
                border: "none", color: "white", fontSize: 14, fontWeight: 700,
                cursor: "pointer", boxShadow: "0 4px 20px rgba(194,24,91,0.4)",
              }}
            >
              Done — keep swiping
            </button>
          </div>
        )}

        {/* ── Fully unlocked ─────────────────────────────────────────────── */}
        {phase === "unlocked" && (
          <div style={{ padding: "20px 18px 24px", display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
            <div style={{ fontSize: 36 }}>✨</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "white", textAlign: "center" }}>Unlocked!</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
              {profile.name.split(" ")[0]}'s photo is fully revealed. Start the conversation!
            </div>
            <button
              onClick={onStartChat}
              style={{
                width: "100%", padding: "13px", borderRadius: 50,
                background: "linear-gradient(135deg,#c2185b,#e91e8c)",
                border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 20px rgba(194,24,91,0.4)",
              }}
            >
              💬 Start Chat
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BlindDateCard — single swipeable card in the stack
// ══════════════════════════════════════════════════════════════════════════════

interface CardProps {
  profile: BlindProfile;
  stackIndex: number; // 0 = top, 1 = second, 2 = third
  revealedBlur: number | null;
  unlocked: boolean;
  isFeatured?: boolean; // Blind Date of the Day
  distanceKm: number | null;
  onTap: () => void;
  onSkip: () => void;
  onSwipeUp: () => void;
}

function BlindDateCard({ profile, stackIndex, revealedBlur, unlocked, isFeatured, distanceKm, onTap, onSkip, onSwipeUp }: CardProps) {
  const isTop = stackIndex === 0;
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  const rotate = useTransform(cardX, [-280, 0, 280], [-18, 0, 18]);
  const [showSwipeHint, setShowSwipeHint] = useState(isFeatured ?? false);

  // Stack depth visuals
  const scaleVal  = [1, 0.95, 0.91][stackIndex] ?? 0.88;
  const yOffsetVal = [0, 14, 26][stackIndex] ?? 36;

  const displayBlur = unlocked ? 0 : revealedBlur !== null ? revealedBlur : BLUR_START;

  const handleDragEnd = (_: PointerEvent, info: PanInfo) => {
    setShowSwipeHint(false);
    const totalMove = Math.hypot(info.offset.x, info.offset.y);

    // Tap
    if (totalMove < 8) {
      animate(cardX, 0, { type: "spring", stiffness: 500, damping: 40 });
      animate(cardY, 0, { type: "spring", stiffness: 500, damping: 40 });
      onTap();
      return;
    }

    // Swipe up (strong vertical component, little horizontal)
    if (info.offset.y < -110 && Math.abs(info.offset.x) < Math.abs(info.offset.y) * 0.7) {
      animate(cardY, -window.innerHeight * 1.2, { duration: 0.38, ease: "easeIn" });
      onSwipeUp();
      return;
    }

    // Swipe left or right → skip
    const swipeX = Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 450;
    if (swipeX) {
      const dir = info.offset.x > 0 || info.velocity.x > 0 ? 1 : -1;
      animate(cardX, dir * window.innerWidth * 1.6, { duration: 0.38, ease: "easeIn" });
      animate(cardY, 50, { duration: 0.38 });
      setTimeout(onSkip, 340);
      return;
    }

    // Snap back
    animate(cardX, 0, { type: "spring", stiffness: 380, damping: 28 });
    animate(cardY, 0, { type: "spring", stiffness: 380, damping: 28 });
  };

  // Directional labels opacity
  const skipOpacity  = useTransform(cardX, [-120, -40, 0, 40, 120], [1, 0.4, 0, 0.4, 1]);
  const unlockOpacity = useTransform(cardY, [-140, -60, 0], [1, 0.3, 0]);

  return (
    <motion.div
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.65}
      onDragEnd={handleDragEnd}
      style={{
        x: isTop ? cardX : 0,
        y: isTop ? cardY : yOffsetVal,
        rotate: isTop ? rotate : 0,
        scale: scaleVal,
        position: "absolute",
        inset: 0,
        zIndex: 10 - stackIndex,
        borderRadius: 24,
        overflow: "hidden",
        cursor: isTop ? "grab" : "default",
        touchAction: "none",
        willChange: "transform",
        border: unlocked
          ? "2px solid rgba(34,197,94,0.7)"
          : "1.5px solid rgba(194,24,91,0.3)",
        boxShadow: `0 ${8 + stackIndex * 4}px ${24 + stackIndex * 8}px rgba(0,0,0,${0.5 - stackIndex * 0.1})`,
      }}
    >
      {/* Background photo */}
      {profile.avatar_url ? (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${profile.avatar_url})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: `blur(${displayBlur}px)`,
          transform: "scale(1.1)",
          transition: "filter 0.7s cubic-bezier(0.4,0,0.2,1)",
        }} />
      ) : (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg,#1a0a1e 0%,#2d0a1e 50%,#1a0818 100%)",
        }} />
      )}

      {/* Dark gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.1) 100%)",
      }} />

      {/* Top hint: swipe up */}
      {isTop && (
        <motion.div
          style={{ opacity: unlockOpacity, position: "absolute", top: 16, left: 0, right: 0, display: "flex", justifyContent: "center" }}
        >
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)",
            borderRadius: 20, padding: "5px 14px 5px 8px",
            border: "1px solid rgba(255,255,255,0.15)",
          }}>
            <img
              src="https://ik.imagekit.io/dateme/Tap%20gesture%20icon%20in%20monochrome.png"
              alt="tap"
              style={{ width: 22, height: 22, objectFit: "contain" }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>
              UNLOCK — {COINS_INSTANT} COINS
            </span>
          </div>
        </motion.div>
      )}

      {/* Skip label (left/right drag) */}
      {isTop && (
        <motion.div style={{ opacity: skipOpacity, position: "absolute", top: "42%", left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{
            background: "rgba(100,100,120,0.65)", backdropFilter: "blur(6px)",
            borderRadius: 20, padding: "5px 16px",
            fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.05em",
          }}>
            SKIP
          </div>
        </motion.div>
      )}

      {/* Swipe gesture hint — first card only */}
      <AnimatePresence>
        {showSwipeHint && isTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.35 }}
            style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none", zIndex: 5,
            }}
          >
            <motion.img
              src="https://ik.imagekit.io/dateme/Swipe%20up%20icon%20with%20hand%20gesture.png"
              alt="Swipe hint"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 120, height: "auto", filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.6))" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Distance badge — top right */}
      {distanceKm !== null && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "rgba(255,255,255,0.85)",
          fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span style={{ fontSize: 9 }}>📍</span>
          {formatDistance(distanceKm)}
        </div>
      )}

      {/* Unlocked badge */}
      {unlocked && (
        <div style={{
          position: "absolute", top: distanceKm !== null ? 40 : 12, right: 12,
          background: "rgba(34,197,94,0.85)", color: "white",
          fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, letterSpacing: "0.05em",
        }}>
          UNLOCKED ✓
        </div>
      )}

      {/* BDOTD / boost / NEW badges */}
      {isFeatured ? (
        <div style={{
          position: "absolute", top: 12, left: 12,
          background: "linear-gradient(135deg,#f59e0b,#f97316)",
          color: "white", fontSize: 10, fontWeight: 800,
          padding: "4px 10px", borderRadius: 20, letterSpacing: "0.05em",
          display: "flex", alignItems: "center", gap: 4,
          boxShadow: "0 0 14px rgba(245,158,11,0.5)",
        }}>
          ⭐ TODAY
        </div>
      ) : profile.is_boosted ? (
        <div style={{
          position: "absolute", top: 12, left: 12,
          background: "rgba(245,158,11,0.85)", color: "white",
          fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, letterSpacing: "0.05em",
          display: "flex", alignItems: "center", gap: 3,
        }}>
          🚀 BOOSTED
        </div>
      ) : (() => {
        const days = (Date.now() - new Date(profile.created_at).getTime()) / 86400000;
        return days <= 3 && !unlocked ? (
          <div style={{
            position: "absolute", top: 12, left: 12,
            background: "#f59e0b", color: "white",
            fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, letterSpacing: "0.05em",
          }}>
            NEW
          </div>
        ) : null;
      })()}

      {/* Bottom info */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + age */}
            <div style={{ fontSize: 24, fontWeight: 800, color: "white", lineHeight: 1.1 }}>
              {profile.name.split(" ")[0]}<span style={{ fontWeight: 400, fontSize: 20, color: "rgba(255,255,255,0.75)" }}>, {profile.age}</span>
            </div>
            {/* City */}
            {profile.city && (
              <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 10 }}>📍</span>
                {profile.city}
              </div>
            )}
            {/* Interest pill */}
            {profile.looking_for && (
              <div style={{
                marginTop: 7, display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(194,24,91,0.8)", borderRadius: 20,
                padding: "3px 12px", fontSize: 12, color: "white", fontWeight: 600,
              }}>
                <span style={{ fontSize: 11 }}>
                  {profile.looking_for === "Marriage" ? "💍" :
                   profile.looking_for === "Relationship" ? "💑" :
                   profile.looking_for === "Friendship" ? "🤝" :
                   profile.looking_for === "Casual" ? "☀️" : "💘"}
                </span>
                {profile.looking_for}
              </div>
            )}
            {isTop && unlocked && (
              <div style={{ marginTop: 8, fontSize: 12, color: "rgba(134,239,172,0.8)", display: "flex", alignItems: "center", gap: 5 }}>
                <span>✓</span>
                <span>Tap to start chatting</span>
              </div>
            )}
          </div>

          {/* Tap to answer Q&A button — bottom right */}
          {isTop && !unlocked && (
            <div style={{ position: "relative", flexShrink: 0, marginLeft: 12, width: 93, height: 93 }}>
              {/* White glow beat ring */}
              <motion.div
                animate={{ scale: [1, 1.55, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "2.5px solid rgba(255,255,255,0.85)",
                  boxShadow: "0 0 18px 4px rgba(255,255,255,0.5)",
                  pointerEvents: "none",
                }}
              />
              {/* Second delayed ring */}
              <motion.div
                animate={{ scale: [1, 1.55, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.55)",
                  pointerEvents: "none",
                }}
              />
              <motion.button
                whileTap={{ scale: 0.88 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                onClick={(e) => { e.stopPropagation(); onTap(); }}
                style={{
                  width: 93, height: 93, borderRadius: "50%",
                  background: "transparent", border: "none", padding: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  filter: "drop-shadow(0 0 14px rgba(255,255,255,0.7))",
                }}
              >
                <img
                  src="https://ik.imagekit.io/dateme/Tapping%20gesture%20on%20a%20glossy%20button.png"
                  alt="Tap to answer"
                  style={{ width: 93, height: 93, objectFit: "contain" }}
                />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BlindDateGrid — main export (swipe view)
// ══════════════════════════════════════════════════════════════════════════════

const COINS_BOOST = 40;

export default function BlindDateGrid({ userId, onClose, onStartChat }: { userId: string; onClose: () => void; onStartChat?: (profile: BlindProfile) => void }) {
  const { balance } = useCoinBalance(userId);
  const [profiles, setProfiles]   = useState<BlindProfile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [index, setIndex]         = useState(0);
  const [qaProfile, setQaProfile] = useState<BlindProfile | null>(null);
  const [swipeUpProfile, setSwipeUpProfile] = useState<BlindProfile | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const { deductCoins }           = useCoinBalance(userId);
  const [showCoinShop, setShowCoinShop] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [boosting, setBoosting]     = useState(false);
  const [boostActive, setBoostActive]   = useState(false);
  const [boostExpiresAt, setBoostExpiresAt] = useState<Date | null>(null);

  // Track per-profile state
  const [revealedBlurs, setRevealedBlurs] = useState<Record<string, number>>({});
  const [unlockedIds, setUnlockedIds]     = useState<Set<string>>(new Set());

  // Viewer's own coordinates for distance calculation
  const [viewerLat, setViewerLat] = useState<number | null>(null);
  const [viewerLon, setViewerLon] = useState<number | null>(null);

  // Load user's own boost status + coordinates
  // Priority: browser geolocation → profile-stored → DEV fallback (Jakarta)
  useEffect(() => {
    supabase.from("profiles").select("blind_date_boosted_until, latitude, longitude").eq("id", userId).single()
      .then(({ data }) => {
        if ((data as any)?.blind_date_boosted_until) {
          const exp = new Date((data as any).blind_date_boosted_until);
          if (exp > new Date()) { setBoostActive(true); setBoostExpiresAt(exp); }
        }
        // Try live browser location first
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setViewerLat(pos.coords.latitude);
              setViewerLon(pos.coords.longitude);
            },
            () => {
              // Denied/unavailable — use profile-stored coords or DEV fallback
              const lat = (data as any)?.latitude;
              const lon = (data as any)?.longitude;
              if (lat != null && lon != null) {
                setViewerLat(lat);
                setViewerLon(lon);
              } else if (import.meta.env.DEV) {
                setViewerLat(-6.2088);   // Jakarta centre
                setViewerLon(106.8456);
              }
            },
            { timeout: 5000, maximumAge: 60_000 },
          );
        } else {
          const lat = (data as any)?.latitude;
          const lon = (data as any)?.longitude;
          if (lat != null && lon != null) {
            setViewerLat(lat);
            setViewerLon(lon);
          } else if (import.meta.env.DEV) {
            setViewerLat(-6.2088);
            setViewerLon(106.8456);
          }
        }
      });
  }, [userId]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("get_blind_date_profiles" as any, { p_user_id: userId });
    const live = (data as BlindProfile[]) || [];
    setProfiles(live.length > 0 ? live : import.meta.env.DEV ? DEV_BLIND_PROFILES : []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const visibleProfiles = profiles.slice(index, index + 3);

  const skip = useCallback(() => {
    setIndex(i => Math.min(i + 1, profiles.length));
  }, [profiles.length]);

  const handleSwipeUp = useCallback((p: BlindProfile) => {
    setSwipeUpProfile(p);
  }, []);

  const handleInstantUnlock = async () => {
    if (!swipeUpProfile || unlocking || balance < COINS_INSTANT) return;
    setUnlocking(true);
    const ok = await deductCoins(COINS_INSTANT, "blind_date_instant_unlock");
    if (ok) {
      if (!import.meta.env.DEV) {
        await supabase.rpc("submit_blind_date_attempt" as any, {
          p_guesser_id: userId,
          p_target_id:  swipeUpProfile.id,
          p_score:      3,
        });
      }
      setUnlockedIds(prev => new Set([...prev, swipeUpProfile.id]));
    }
    setUnlocking(false);
    setSwipeUpProfile(null);
    setIndex(i => i + 1);
  };

  const handleBoost = async () => {
    if (boosting || balance < COINS_BOOST) return;
    setBoosting(true);
    const { data } = await supabase.rpc("boost_blind_date" as any, { p_user_id: userId });
    if (data) {
      const exp = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setBoostActive(true);
      setBoostExpiresAt(exp);
    }
    setBoosting(false);
    setShowBoostModal(false);
  };

  const boostHoursLeft = boostExpiresAt
    ? Math.max(0, Math.ceil((boostExpiresAt.getTime() - Date.now()) / 3600000))
    : 0;

  const handleQAPassed = (id: string, finalBlur: number) => {
    setRevealedBlurs(prev => ({ ...prev, [id]: finalBlur }));
  };

  const handleQAUnlockedWithCoins = (id: string) => {
    setUnlockedIds(prev => new Set([...prev, id]));
  };

  const isEmpty = !loading && profiles.length === 0;
  const exhausted = !loading && profiles.length > 0 && index >= profiles.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.28 }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        backgroundImage: "url('/images/app-background.png')",
        backgroundSize: "cover", backgroundPosition: "center",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 10,
        padding: `max(14px, env(safe-area-inset-top, 14px)) 14px 10px`,
        flexShrink: 0, zIndex: 2,
      }}>
        <img
          src="https://ik.imagekit.io/dateme/Untitleddasdasdasd-removebg-preview.png"
          alt="Blind Date"
          style={{ height: 56, width: "auto", filter: "drop-shadow(0 0 8px rgba(194,24,91,0.5))" }}
        />

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "white", letterSpacing: "0.01em" }}>Blind Date</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 500, letterSpacing: "0.04em", marginTop: 2 }}>Discrete Dating Members</div>
        </div>

        {/* Right: coin badge + home button */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {/* Coin badge */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setShowCoinShop(true)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(0,0,0,0.50)", backdropFilter: "blur(10px)",
              borderRadius: 20, padding: "6px 12px",
              border: "1px solid rgba(245,158,11,0.35)",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 15 }}>🪙</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b" }}>{balance}</span>
          </motion.button>

          {/* Home button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "rgba(0,0,0,0.50)", backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >🏠</motion.button>
        </div>
      </div>

      {/* ── Card area ──────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, position: "relative",
        margin: "0 14px",
        minHeight: 0,
      }}>
        {loading ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(194,24,91,0.2)", borderTopColor: "#c2185b" }}
            />
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Finding blind dates…</div>
          </div>
        ) : isEmpty ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
            <div style={{ fontSize: 48 }}>👁️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "white", textAlign: "center" }}>No blind dates right now</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>New profiles join every day — check back soon.</div>
          </div>
        ) : exhausted ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
            <div style={{ fontSize: 48 }}>✨</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "white", textAlign: "center" }}>You've seen everyone</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>New profiles appear daily.</div>
            <button
              onClick={() => setIndex(0)}
              style={{
                marginTop: 8, padding: "11px 24px", borderRadius: 50,
                background: "linear-gradient(135deg,#c2185b,#e91e8c)",
                border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 20px rgba(194,24,91,0.4)",
              }}
            >
              Start over
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {[...visibleProfiles].reverse().map((p, ri) => {
              const si = visibleProfiles.length - 1 - ri; // 0=top
              return (
                <BlindDateCard
                  key={p.id}
                  profile={p}
                  stackIndex={si}
                  revealedBlur={revealedBlurs[p.id] ?? null}
                  unlocked={unlockedIds.has(p.id)}
                  isFeatured={si === 0 && index === 0}
                  distanceKm={
                    viewerLat != null && viewerLon != null &&
                    p.latitude != null && p.longitude != null
                      ? haversineKm(viewerLat, viewerLon, p.latitude, p.longitude)
                      : null
                  }
                  onTap={() => si === 0 && setQaProfile(p)}
                  onSkip={() => si === 0 && skip()}
                  onSwipeUp={() => si === 0 && handleSwipeUp(p)}
                />
              );
            })}
          </AnimatePresence>
        )}

      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        padding: `8px 16px max(20px, env(safe-area-inset-bottom, 20px))`,
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {/* Close + coin balance row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onClose}
            style={{
              width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(14px)",
              border: "1.5px solid rgba(255,255,255,0.13)",
              color: "rgba(255,255,255,0.7)", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            }}
          >✕</motion.button>

          {/* Matches this month stat */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(14px)",
            borderRadius: 50, padding: "11px 20px",
            border: "1.5px solid rgba(194,24,91,0.30)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>💘</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1 }}>3,782</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.50)", letterSpacing: "0.04em", marginTop: 1 }}>MATCHES THIS MONTH</div>
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 10, fontWeight: 800, color: "#4ade80",
              background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.30)",
              borderRadius: 20, padding: "3px 10px", letterSpacing: "0.04em",
            }}>
              <motion.div
                animate={{ opacity: [1, 0.2, 1], scale: [1, 0.75, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e",
                  boxShadow: "0 0 6px #22c55e" }}
              />
              LIVE
            </div>
          </div>
        </div>
      </div>

      {/* ── Q&A Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {qaProfile && (
          <BlindDateQAModal
            key={qaProfile.id}
            profile={qaProfile}
            userId={userId}
            onClose={() => { setQaProfile(null); skip(); }}
            onPassedAndReady={handleQAPassed}
            onUnlockedWithCoins={handleQAUnlockedWithCoins}
            onStartChat={() => {
              const p = qaProfile;
              setQaProfile(null);
              onClose();
              onStartChat?.(p);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Swipe-up instant unlock confirmation ───────────────────────── */}
      <AnimatePresence>
        {swipeUpProfile && (
          <motion.div
            key="swipe-up-unlock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              padding: `0 16px max(24px, env(safe-area-inset-bottom, 24px))`,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) { setSwipeUpProfile(null); skip(); } }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              style={{
                width: "100%", maxWidth: 400,
                background: "rgba(10,10,18,0.97)",
                border: "1.5px solid rgba(245,158,11,0.4)",
                borderRadius: 24,
                padding: "24px 20px",
                display: "flex", flexDirection: "column", gap: 14, alignItems: "center",
                boxShadow: "0 0 40px rgba(245,158,11,0.2)",
              }}
            >
              <div style={{ fontSize: 32 }}>🔓</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "white", textAlign: "center" }}>
                Instant Unlock
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.5 }}>
                Skip the quiz and instantly see <strong style={{ color: "white" }}>{swipeUpProfile.name.split(" ")[0]}</strong>'s full profile and photo for{" "}
                <strong style={{ color: "#f59e0b" }}>{COINS_INSTANT} coins</strong>.
              </div>
              <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700 }}>
                Your balance: 🪙 {balance}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleInstantUnlock}
                disabled={balance < COINS_INSTANT || unlocking}
                style={{
                  width: "100%", padding: "13px", borderRadius: 50,
                  background: balance >= COINS_INSTANT
                    ? "linear-gradient(135deg,#f59e0b,#f97316)"
                    : "rgba(245,158,11,0.2)",
                  border: "none", color: "white", fontSize: 14, fontWeight: 700,
                  cursor: balance >= COINS_INSTANT ? "pointer" : "not-allowed",
                  boxShadow: balance >= COINS_INSTANT ? "0 4px 20px rgba(245,158,11,0.4)" : "none",
                }}
              >
                {unlocking ? "Unlocking…" : `🪙 Unlock for ${COINS_INSTANT} coins`}
              </motion.button>
              <button
                onClick={() => { setSwipeUpProfile(null); skip(); }}
                style={{
                  width: "100%", padding: "11px", borderRadius: 50,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer",
                }}
              >
                Skip this profile
              </button>
              {balance < COINS_INSTANT && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                  You need {COINS_INSTANT - balance} more coins
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Boost modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBoostModal && (
          <motion.div
            key="boost-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              padding: `0 16px max(24px, env(safe-area-inset-bottom, 24px))`,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowBoostModal(false); }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              style={{
                width: "100%", maxWidth: 400,
                background: "rgba(10,10,18,0.98)",
                border: "1.5px solid rgba(245,158,11,0.4)",
                borderRadius: 24, padding: "24px 20px",
                display: "flex", flexDirection: "column", gap: 14, alignItems: "center",
                boxShadow: "0 0 40px rgba(245,158,11,0.2)",
              }}
            >
              {boostActive ? (
                <>
                  <div style={{ fontSize: 36 }}>🚀</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b", textAlign: "center" }}>
                    Boost Active — {boostHoursLeft}h left
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.5 }}>
                    Your profile is shown first to everyone browsing Blind Date. You're at the top of the stack right now.
                  </div>
                  <button
                    onClick={() => setShowBoostModal(false)}
                    style={{
                      width: "100%", padding: "13px", borderRadius: 50,
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer",
                    }}
                  >
                    Got it
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 36 }}>🚀</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "white", textAlign: "center" }}>
                    Boost Your Profile
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.5 }}>
                    Jump to the top of everyone's Blind Date stack for <strong style={{ color: "#f59e0b" }}>24 hours</strong>. Get seen first — more taps, more matches.
                  </div>
                  <div style={{
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    borderRadius: 14, padding: "12px 18px",
                    fontSize: 13, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 1.5,
                    width: "100%",
                  }}>
                    Cost: <strong style={{ color: "#f59e0b" }}>🪙 {COINS_BOOST} coins</strong>
                    <br />
                    <span style={{ fontSize: 11 }}>Your balance: {balance} coins</span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBoost}
                    disabled={balance < COINS_BOOST || boosting}
                    style={{
                      width: "100%", padding: "13px", borderRadius: 50,
                      background: balance >= COINS_BOOST
                        ? "linear-gradient(135deg,#f59e0b,#f97316)"
                        : "rgba(245,158,11,0.2)",
                      border: "none", color: "white", fontSize: 14, fontWeight: 700,
                      cursor: balance >= COINS_BOOST ? "pointer" : "not-allowed",
                      boxShadow: balance >= COINS_BOOST ? "0 4px 20px rgba(245,158,11,0.4)" : "none",
                    }}
                  >
                    {boosting ? "Activating…" : `🚀 Boost for ${COINS_BOOST} coins`}
                  </motion.button>
                  {balance < COINS_BOOST && (
                    <button
                      onClick={() => { setShowBoostModal(false); setShowCoinShop(true); }}
                      style={{
                        width: "100%", padding: "11px", borderRadius: 50,
                        background: "rgba(245,158,11,0.12)",
                        border: "1px solid rgba(245,158,11,0.3)",
                        color: "#f59e0b", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      🪙 Top up coins
                    </button>
                  )}
                  <button
                    onClick={() => setShowBoostModal(false)}
                    style={{
                      background: "none", border: "none",
                      color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer",
                    }}
                  >
                    Maybe later
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Coin shop ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCoinShop && (
          <CoinShop userId={userId} onClose={() => setShowCoinShop(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
