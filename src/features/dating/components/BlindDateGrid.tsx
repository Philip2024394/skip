import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { generateIndonesianProfiles } from "@/data/indonesianProfiles";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  // AI-generated stories — null until first blind-date view
  blind_date_story_age:      string | null;
  blind_date_story_location: string | null;
  blind_date_story_intent:   string | null;
}

// DEV-only mock blind profiles — mapped from the existing mock profile generator
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
}));

interface Question {
  text: string;
  options: string[];
  correct: number; // index into options
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Mystery card generator ────────────────────────────────────────────────────
// Each of the 3 questions gets its OWN story clue — richer cultural/personal
// detail per country. No raw data (name, age number, city) ever shown directly.

interface MysteryQuestion extends Question {
  clue: string; // story shown above this specific question
}

interface MysteryCard {
  questions: MysteryQuestion[];
}

// ── Age stories ───────────────────────────────────────────────────────────────
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

// ── Location stories ──────────────────────────────────────────────────────────
function locationClue(city: string | null, country: string): { clue: string; label: string; options: string[] } {
  const c = (city || country).toLowerCase();

  if (c.includes("bali")) return {
    clue: "There's a temple at the end of my road that holds ceremonies every few weeks. The night before, the women leave small woven offerings — flowers, rice, incense — at every doorstep before sunrise. I've lived here long enough that I smell the incense before I see it. It's completely ordinary. Which is the extraordinary part.",
    label: "Bali, Indonesia",
    options: shuffle(["Bali, Indonesia", "Sri Lanka", "Thailand", "Philippines"]),
  };
  if (c.includes("jakarta")) return {
    clue: "My commute used to be two hours each way and nobody on the bus ever thought that was strange. Last Lebaran the roads went completely empty and I drove across the city in eighteen minutes. I pulled over and just sat there with the engine running. It felt like a different planet. The same streets, completely unrecognisable.",
    label: "Jakarta, Indonesia",
    options: shuffle(["Jakarta, Indonesia", "Manila", "Ho Chi Minh City", "Bangkok"]),
  };
  if (c.includes("indonesia") || c.includes("surabaya") || c.includes("bandung") || c.includes("medan") || c.includes("yogyakarta")) return {
    clue: "Every November the first big rain arrives and the whole city smells like warm earth and electricity at the same time. I've tried describing it to people who didn't grow up here and I can never quite get it right. You have to be standing on that pavement at that exact moment. Nothing else smells like home the same way.",
    label: "Indonesia",
    options: shuffle(["Indonesia", "Malaysia", "Philippines", "Vietnam"]),
  };
  if (c.includes("malaysia") || c.includes("kuala lumpur") || c.includes("penang")) return {
    clue: "Growing up we celebrated everything — Raya, Chinese New Year, Deepavali, Christmas. Different houses, different food, different songs. My grandmother made rendang, my best friend's grandmother made tang yuan, my neighbour made murukku. We ate at all three tables in the same week. Nobody thought that was unusual. I think about that a lot now.",
    label: "Malaysia",
    options: shuffle(["Malaysia", "Indonesia", "Singapore", "Brunei"]),
  };
  if (c.includes("singapore")) return {
    clue: "National Day rehearsal happens every July and you can hear the jets from anywhere on the island. I used to climb onto my uncle's shophouse roof to watch. Last year I watched from a condo balcony on the 28th floor and I still craned my neck the exact same way I did at nine years old.",
    label: "Singapore",
    options: shuffle(["Singapore", "Malaysia", "Hong Kong", "Taiwan"]),
  };
  if (c.includes("philippines") || c.includes("manila") || c.includes("cebu")) return {
    clue: "Christmas lights go up in September and nobody apologises. Noche Buena means the whole family is still awake at midnight eating and arguing about nothing that matters. The year we had it in a different house because of the typhoon, my grandmother brought her own parols and hung them before she'd even unpacked her bag.",
    label: "Philippines",
    options: shuffle(["Philippines", "Indonesia", "Thailand", "Vietnam"]),
  };
  if (c.includes("thailand") || c.includes("bangkok") || c.includes("chiang mai")) return {
    clue: "Songkran — I got completely soaked walking to the 7-Eleven twenty metres from my front door. I was carrying groceries. A child on a motorbike hit me with a water gun from three metres away and looked very pleased with himself. I couldn't even be angry. For three days that's just the rule. Everyone gets wet.",
    label: "Thailand",
    options: shuffle(["Thailand", "Vietnam", "Cambodia", "Laos"]),
  };
  if (c.includes("vietnam") || c.includes("ho chi minh") || c.includes("hanoi")) return {
    clue: "The morning of Tết my grandmother was already up at 4am arranging the altar. Red and gold everywhere, fruit stacked into towers, incense lit before sunrise. She said the ancestors arrive first thing and you have to be ready for them. I've lived abroad for four years now and I still wake up at 4am on Tết morning without an alarm.",
    label: "Vietnam",
    options: shuffle(["Vietnam", "Thailand", "Cambodia", "Myanmar"]),
  };
  if (c.includes("japan") || c.includes("tokyo") || c.includes("osaka")) return {
    clue: "Cherry blossom season lasts maybe ten days. My whole neighbourhood treats those days like a countdown — people reserve hanami spots weeks in advance. One year it rained for seven of the ten days. We went anyway. Sat under wet trees, passed a flask of sake around, and nobody once suggested leaving early.",
    label: "Japan",
    options: shuffle(["Japan", "South Korea", "China", "Taiwan"]),
  };
  if (c.includes("korea") || c.includes("seoul")) return {
    clue: "Chuseok means going home no matter where you are. I drove twelve hours once because the flights were full. The traffic was so bad we stopped at a motorway rest stop for two hours and ate ramyeon standing up. When I finally got there my grandmother pretended she hadn't been waiting by the window. She had been.",
    label: "South Korea",
    options: shuffle(["South Korea", "Japan", "China", "Taiwan"]),
  };
  if (c.includes("india") || c.includes("mumbai") || c.includes("delhi") || c.includes("bangalore")) return {
    clue: "Diwali night from our rooftop — every rooftop in the neighbourhood lit up at once, fireworks going in every direction, the air thick with gunpowder and the smell of mithai from someone's kitchen. My father burned the same sparklers he'd bought since I was small. I have no idea where he finds them every year. I've never asked.",
    label: "India",
    options: shuffle(["India", "Sri Lanka", "Pakistan", "Bangladesh"]),
  };
  if (c.includes("australia") || c.includes("sydney") || c.includes("melbourne") || c.includes("brisbane")) return {
    clue: "Christmas lunch at 40 degrees on my aunt's back patio, ceiling fan at full speed, someone always burning their hand on the BBQ. My cousin fell asleep in a deck chair by 2pm with sunscreen on his nose. We did the same thing every year and complained about the heat every year and then planned it again in December.",
    label: "Australia",
    options: shuffle(["Australia", "New Zealand", "South Africa", "Canada"]),
  };
  if (c.includes("london") || c.includes("uk") || c.includes("england") || c.includes("manchester")) return {
    clue: "Bank holiday Monday and the entire country migrates to the nearest beer garden the second the temperature hits 17 degrees. My friend texted me 'gorgeous out' at 9am. It was overcast with a light drizzle. We went anyway and sat there in jackets, sunglasses on, calling it summer. Some things are just tradition.",
    label: "United Kingdom",
    options: shuffle(["United Kingdom", "Ireland", "Australia", "Canada"]),
  };
  if (c.includes("dubai") || c.includes("uae") || c.includes("abu dhabi")) return {
    clue: "Iftar during Ramadan — the whole office goes quiet in that last hour before sunset. Everyone waiting. Then at the exact moment the call to prayer starts, something releases. Food appears from everywhere at once. A colleague shared dates with me on my very first day and explained this is how you begin. I've never forgotten the taste of that first one.",
    label: "UAE / Gulf",
    options: shuffle(["UAE / Gulf", "Saudi Arabia", "Qatar", "Bahrain"]),
  };
  if (c.includes("nigeria") || c.includes("lagos") || c.includes("abuja")) return {
    clue: "I went to an owambe last month where I counted fourteen different ankara prints on fourteen different people and none of them clashed. The jollof debate started before the food even arrived. Someone's auntie won an argument she had no business winning. I ate three plates and still left feeling like I should have had one more.",
    label: "Nigeria",
    options: shuffle(["Nigeria", "Ghana", "Kenya", "South Africa"]),
  };
  if (c.includes("south africa") || c.includes("cape town") || c.includes("johannesburg")) return {
    clue: "My uncle lights the braai before he even says hello. It doesn't matter if it's a Tuesday, a heatwave, or someone's birthday — if people are coming over, the fire is going. Heritage Day is just the one day the whole country admits what we already do every weekend.",
    label: "South Africa",
    options: shuffle(["South Africa", "Nigeria", "Kenya", "Zimbabwe"]),
  };
  if (c.includes("brazil") || c.includes("rio") || c.includes("são paulo")) return {
    clue: "I watched Carnaval from a window above the street the year I was too sick to go down. The sound, the colour, strangers dancing with strangers at 4am like they'd known each other for years. I was devastated to miss it. I've made sure I've never missed it since.",
    label: "Brazil",
    options: shuffle(["Brazil", "Argentina", "Colombia", "Mexico"]),
  };
  if (c.includes("mexico") || c.includes("cdmx")) return {
    clue: "The Día de los Muertos altar my grandmother builds every year has photos going back four generations. Marigolds, candles, favourite foods of people long gone. I used to think it was sad. Now I think it's the most honest thing I've ever seen — grief that doesn't pretend, just lights a candle and sets a place at the table.",
    label: "Mexico",
    options: shuffle(["Mexico", "Colombia", "Brazil", "Argentina"]),
  };
  if (c.includes("usa") || c.includes("new york") || c.includes("los angeles") || c.includes("chicago")) return {
    clue: "Fourth of July at my neighbour's house — their fireworks budget is genuinely alarming and they treat it like a personal competition with the rest of the street. Thanksgiving my whole family does the exact same meal in the exact same order and any deviation is treated like a constitutional crisis. I love both of those things more than I can explain.",
    label: "United States",
    options: shuffle(["United States", "Canada", "Australia", "United Kingdom"]),
  };
  if (c.includes("canada") || c.includes("toronto") || c.includes("vancouver")) return {
    clue: "Hockey playoffs turn quiet people into strangers who are shouting at each other in bars and somehow feel like old friends by the third period. I drove four hours north once just to see the northern lights properly. Pulled over on a completely dark road, engine off, and stood there in minus fifteen for forty minutes. Worth every second.",
    label: "Canada",
    options: shuffle(["Canada", "United States", "Australia", "New Zealand"]),
  };

  return {
    clue: "The first big rain of the season here stops everything. Traffic, conversations, plans. Everyone just stands and watches it come down. The smell afterwards — warm pavement and wet earth — is something I've tried to explain to people who didn't grow up with it. I never quite manage it.",
    label: country,
    options: shuffle([country, "Australia", "Europe", "North America"]),
  };
}

// ── Intent stories ────────────────────────────────────────────────────────────
function intentClue(lookingFor: string | null): { clue: string; label: string; options: string[] } {
  const lf = (lookingFor || "").toLowerCase();
  if (lf.includes("marriage") || lf.includes("marry")) return {
    clue: "My parents have been married 34 years and still argue about how to load the dishwasher. Last year I watched my father quietly refold a blanket my mother had just folded badly. She pretended not to notice. He pretended not to do it. I want the 34-year version of that. That's the whole thing.",
    label: "Marriage / Long-term",
    options: shuffle(["Marriage / Long-term", "Casual dating", "Just friends", "Still figuring it out"]),
  };
  if (lf.includes("serious") || lf.includes("relationship")) return {
    clue: "I kept a note on my phone of every first date I went on for two years. 26 entries. At some point I realised I was collecting experiences rather than building anything. I deleted the note, deleted the apps, and took six months off. I'm back now and what I want is completely different. I know exactly what it is.",
    label: "Serious relationship",
    options: shuffle(["Serious relationship", "Casual & free", "Friendship only", "Travel partner"]),
  };
  if (lf.includes("casual") || lf.includes("fun") || lf.includes("something fun")) return {
    clue: "A stranger at a coffee shop started talking to me about a book I was reading last year. We talked for two hours. I never saw him again. That conversation stayed with me for weeks — the ease of it, no agenda, no follow-up needed. That's what I'm actually looking for. Not the drama. Just that ease.",
    label: "Casual / No pressure",
    options: shuffle(["Casual / No pressure", "Serious relationship", "Marriage", "Friendship"]),
  };
  if (lf.includes("friend")) return {
    clue: "The closest friends I have were strangers I ended up next to by accident — a queue, a shared table, a delayed flight. My favourite relationship I've ever witnessed started as a three-year friendship where both people pretended not to have feelings. I'm not in a rush. I'd rather get it right than get it fast.",
    label: "Friendship first",
    options: shuffle(["Friendship first", "Serious relationship", "Marriage", "Casual dating"]),
  };
  if (lf.includes("travel")) return {
    clue: "I once spent three days in a city I hadn't planned to visit because my connection got cancelled and the next flight wasn't until Thursday. I had nothing arranged. I ate at places with no English menus, got lost twice, and it was the best three days of the entire trip. I want the kind of person who hears that story and says: I would have done the same thing.",
    label: "Travel partner / Adventure",
    options: shuffle(["Travel partner / Adventure", "Marriage", "Casual fun", "Stay-home comfort"]),
  };
  return {
    clue: "Someone asked me recently what I was looking for and I gave them the honest answer: I don't fully know yet. I know how I want to feel. I know what I don't want. The rest I'd rather figure out with someone than decide alone in advance. That feels more true than any checklist I've ever written.",
    label: "Open / Exploring",
    options: shuffle(["Open / Exploring", "Serious relationship", "Marriage", "Casual only"]),
  };
}

// ── Build the 3-question mystery card ────────────────────────────────────────
function generateMysteryCard(p: BlindProfile): MysteryCard {
  const age    = ageClue(p.age);
  const loc    = locationClue(p.city, p.country);
  const intent = intentClue(p.looking_for);

  // Ensure the correct label is always in the shuffled options
  const ageOpts = (() => {
    const all = ["18 – 22", "23 – 26", "27 – 30", "31 – 35", "36 – 40", "40+"];
    const others = shuffle(all.filter(x => x !== age.label)).slice(0, 3);
    return shuffle([age.label, ...others]);
  })();

  const questions: MysteryQuestion[] = [
    {
      clue: age.clue,
      text: "From their story — roughly how old do you think this person is?",
      options: ageOpts,
      correct: ageOpts.indexOf(age.label) === -1 ? 0 : ageOpts.indexOf(age.label),
    },
    {
      clue: loc.clue,
      text: "Based on what they described — where do you think they live?",
      options: loc.options.slice(0, 4),
      correct: loc.options.indexOf(loc.label) === -1 ? 0 : loc.options.indexOf(loc.label),
    },
    {
      clue: intent.clue,
      text: "Reading between the lines — what are they actually looking for?",
      options: intent.options.slice(0, 4),
      correct: intent.options.indexOf(intent.label) === -1 ? 0 : intent.options.indexOf(intent.label),
    },
  ];

  return { questions };
}

// ── QA Modal ──────────────────────────────────────────────────────────────────

function BlindDateQAModal({
  profile,
  userId,
  onClose,
  onPassed,
  onStoriesReady,
}: {
  profile: BlindProfile;
  userId: string;
  onClose: () => void;
  onPassed: () => void;
  onStoriesReady: (id: string, stories: { age: string; location: string; intent: string }) => void;
}) {
  // Use AI stories if already generated, otherwise fall back to hardcoded
  const hasAiStories = !!(profile.blind_date_story_age && profile.blind_date_story_location && profile.blind_date_story_intent);
  const [generatingStories, setGeneratingStories] = useState(!hasAiStories && !import.meta.env.DEV);
  const [aiProfile, setAiProfile] = useState<BlindProfile>(profile);

  // Generate stories on first open if missing (production only)
  useEffect(() => {
    if (hasAiStories || import.meta.env.DEV) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-blind-date-stories", {
          body: {
            profile_id: profile.id,
            age: profile.age,
            city: profile.city,
            country: profile.country,
            looking_for: profile.looking_for,
          },
        });
        if (!cancelled && !error && data?.story_age) {
          const updated = {
            ...profile,
            blind_date_story_age:      data.story_age,
            blind_date_story_location: data.story_location,
            blind_date_story_intent:   data.story_intent,
          };
          setAiProfile(updated);
          onStoriesReady(profile.id, { age: data.story_age, location: data.story_location, intent: data.story_intent });
        }
      } catch { /* fall back to hardcoded silently */ }
      finally { if (!cancelled) setGeneratingStories(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const { questions } = generateMysteryCard(aiProfile);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [result, setResult] = useState<"passed" | "failed" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const current = questions[step];

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
  };

  const handleNext = async () => {
    if (selected === null) return;
    const correct = selected === current.correct;
    const newAnswers = [...answers, correct];

    if (step < questions.length - 1) {
      setAnswers(newAnswers);
      setSelected(null);
      setStep(s => s + 1);
      return;
    }

    // Final — submit
    setSubmitting(true);
    const score = newAnswers.filter(Boolean).length;
    const { data } = await supabase.rpc("submit_blind_date_attempt" as any, {
      p_guesser_id: userId,
      p_target_id: profile.id,
      p_score: score,
    });
    setSubmitting(false);
    setResult(data ? "passed" : "failed");
    if (data) setTimeout(onPassed, 2200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 16px",
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        style={{
          width: "100%", maxWidth: 400,
          backgroundImage: "url('/images/app-background.png')",
          backgroundSize: "cover", backgroundPosition: "center",
          border: "1.5px solid rgba(194,24,91,0.55)",
          borderRadius: 22,
          boxShadow: "0 0 48px rgba(194,24,91,0.35), 0 8px 32px rgba(0,0,0,0.6)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Dark overlay over background image */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)", pointerEvents: "none", borderRadius: 22 }} />
        {/* Modal content sits above overlay */}
        <div style={{ position: "relative", zIndex: 1, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Story generating spinner — shown while Claude writes stories */}
        {generatingStories && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 14 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(194,24,91,0.2)", borderTopColor: "#c2185b" }}
            />
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
              Writing their story…
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "white" }}>
              Blind Date Quiz
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
              Answer 2 of 3 correctly to unlock chat
            </div>
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", fontSize: 22, background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Progress dots — hidden while story is generating */}
        {!generatingStories && <div style={{ display: "flex", gap: 6 }}>
          {questions.map((_: Question, i: number) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 4,
              background: i < step ? "#c2185b" : i === step ? "rgba(194,24,91,0.5)" : "rgba(255,255,255,0.12)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>}

        {/* Quiz — hidden while story is generating */}
        {!generatingStories && result ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{result === "passed" ? "💘" : "💔"}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: result === "passed" ? "#c2185b" : "rgba(255,255,255,0.7)", marginBottom: 8 }}>
              {result === "passed" ? "You unlocked the chat!" : "Not quite — try again soon"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
              {result === "passed"
                ? `${profile.name} will be notified you passed their quiz.`
                : "You need 2 correct answers. Retry in 24h or spend 10 coins."}
            </div>
            {result === "failed" && (
              <button
                onClick={onClose}
                style={{
                  marginTop: 20, padding: "10px 28px",
                  background: "rgba(194,24,91,0.2)", border: "1.5px solid rgba(194,24,91,0.5)",
                  borderRadius: 12, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Close
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Blurred avatar + mystery name */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : undefined,
                backgroundSize: "cover", backgroundPosition: "center",
                filter: "blur(10px)",
                border: "2px solid rgba(194,24,91,0.4)",
                background: profile.avatar_url ? undefined : "#c2185b33",
              }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>Mystery Person</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Read the story — then answer</div>
              </div>
            </div>

            {/* Per-question clue story */}
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(194,24,91,0.25)",
              borderRadius: 12, padding: "12px 14px",
              fontSize: 12.5, color: "rgba(255,255,255,0.82)",
              lineHeight: 1.6, fontStyle: "italic",
            }}>
              {(current as MysteryQuestion).clue}
            </div>

            {/* Question */}
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>
              {current.text}
            </div>

            {/* Options — 2×2 compact round grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {current.options.map((opt: string, idx: number) => {
                const isSelected = selected === idx;
                const isCorrect  = selected !== null && idx === current.correct;
                const isWrong    = isSelected && idx !== current.correct;
                return (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelect(idx)}
                    style={{
                      padding: "9px 10px", borderRadius: 50,
                      background: isCorrect ? "rgba(34,197,94,0.22)" : isWrong ? "rgba(239,68,68,0.22)" : isSelected ? "rgba(194,24,91,0.28)" : "rgba(255,255,255,0.07)",
                      border: isCorrect ? "1.5px solid rgba(34,197,94,0.7)" : isWrong ? "1.5px solid rgba(239,68,68,0.7)" : isSelected ? "1.5px solid #c2185b" : "1.5px solid rgba(255,255,255,0.14)",
                      color: "white", fontSize: 12, fontWeight: 600,
                      textAlign: "center", cursor: selected !== null ? "default" : "pointer",
                      transition: "all 0.18s", lineHeight: 1.3,
                    }}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>

            {/* Next / Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleNext}
              disabled={selected === null || submitting}
              style={{
                padding: "13px", borderRadius: 14,
                background: selected !== null ? "#c2185b" : "rgba(194,24,91,0.2)",
                border: "none", color: "white", fontSize: 15, fontWeight: 700,
                cursor: selected !== null ? "pointer" : "not-allowed",
                transition: "background 0.2s",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Submitting…" : step < questions.length - 1 ? "Next" : "Submit"}
            </motion.button>
          </>
        )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main BlindDateGrid ────────────────────────────────────────────────────────

export default function BlindDateGrid({ userId }: { userId: string }) {
  const [profiles, setProfiles] = useState<BlindProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BlindProfile | null>(null);
  const [passed, setPassed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("get_blind_date_profiles" as any, { p_user_id: userId });
    const live = (data as BlindProfile[]) || [];
    // Fall back to mock profiles in DEV when DB has no blind date records yet
    setProfiles(live.length > 0 ? live : import.meta.env.DEV ? DEV_BLIND_PROFILES : []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handlePassed = (id: string) => {
    setPassed(prev => new Set([...prev, id]));
    setSelected(null);
  };

  // Cache AI-generated stories back into the profiles list so re-opens are instant
  const handleStoriesReady = (id: string, stories: { age: string; location: string; intent: string }) => {
    setProfiles(prev => prev.map(p => p.id !== id ? p : {
      ...p,
      blind_date_story_age:      stories.age,
      blind_date_story_location: stories.location,
      blind_date_story_intent:   stories.intent,
    }));
    if (selected?.id === id) {
      setSelected(prev => prev ? {
        ...prev,
        blind_date_story_age:      stories.age,
        blind_date_story_location: stories.location,
        blind_date_story_intent:   stories.intent,
      } : prev);
    }
  };

  const isNew = (p: BlindProfile) => {
    const days = (Date.now() - new Date(p.created_at).getTime()) / 86400000;
    return days <= 3;
  };

  return (
    <>
      <div style={{
        display: "flex", flexDirection: "column", gap: 12,
        height: "100%", overflowY: "auto",
        padding: "8px 4px",
      }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                aspectRatio: "3/4", borderRadius: 16,
                background: "rgba(255,255,255,0.06)",
                animation: "pulse 1.5s infinite",
              }} />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👁️</div>
            No blind dates available right now.<br />Check back soon!
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {profiles.map(p => {
              const hasPassed = passed.has(p.id);
              return (
                <motion.div
                  key={p.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => !hasPassed && setSelected(p)}
                  style={{
                    aspectRatio: "3/4", borderRadius: 16, overflow: "hidden",
                    position: "relative", cursor: hasPassed ? "default" : "pointer",
                    border: hasPassed
                      ? "2px solid rgba(34,197,94,0.6)"
                      : "1.5px solid rgba(194,24,91,0.3)",
                    boxShadow: hasPassed
                      ? "0 0 16px rgba(34,197,94,0.2)"
                      : "0 4px 20px rgba(0,0,0,0.4)",
                  }}
                >
                  {/* Blurred background photo */}
                  {p.avatar_url && (
                    <div style={{
                      position: "absolute", inset: 0,
                      backgroundImage: `url(${p.avatar_url})`,
                      backgroundSize: "cover", backgroundPosition: "center",
                      filter: hasPassed ? "blur(0px)" : "blur(18px)",
                      transform: "scale(1.12)",
                      transition: "filter 0.6s ease",
                    }} />
                  )}

                  {/* Dark overlay */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: hasPassed
                      ? "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%)"
                      : "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 100%)",
                  }} />

                  {/* Lock icon */}
                  {!hasPassed && (
                    <div style={{
                      position: "absolute", top: "50%", left: "50%",
                      transform: "translate(-50%, -60%)",
                      fontSize: 32, opacity: 0.9,
                    }}>
                      💘
                    </div>
                  )}

                  {/* NEW badge */}
                  {isNew(p) && !hasPassed && (
                    <div style={{
                      position: "absolute", top: 10, left: 10,
                      background: "#c2185b", color: "white",
                      fontSize: 10, fontWeight: 800, letterSpacing: "0.05em",
                      padding: "3px 8px", borderRadius: 20,
                    }}>
                      NEW
                    </div>
                  )}

                  {/* Passed badge */}
                  {hasPassed && (
                    <div style={{
                      position: "absolute", top: 10, right: 10,
                      background: "rgba(34,197,94,0.9)", color: "white",
                      fontSize: 10, fontWeight: 800,
                      padding: "3px 8px", borderRadius: 20,
                    }}>
                      UNLOCKED
                    </div>
                  )}

                  {/* Name + info */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    padding: "10px 12px",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>
                      {p.name}{p.age ? `, ${p.age}` : ""}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                      {hasPassed ? (p.city || p.country) : "??? · Tap to guess"}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* QA Modal */}
      <AnimatePresence>
        {selected && (
          <BlindDateQAModal
            profile={selected}
            userId={userId}
            onClose={() => setSelected(null)}
            onPassed={() => handlePassed(selected.id)}
            onStoriesReady={handleStoriesReady}
          />
        )}
      </AnimatePresence>
    </>
  );
}
