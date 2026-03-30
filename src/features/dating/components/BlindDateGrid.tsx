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

// ── Age clues ─────────────────────────────────────────────────────────────────
function ageClue(age: number): { label: string; clue: string } {
  if (age <= 22) return {
    label: "18 – 22",
    clue: "\"Growing up my whole childhood was shaped by short-form videos — TikTok trends were basically our yearbook. My older cousins still make fun of me for it.\"",
  };
  if (age <= 26) return {
    label: "23 – 26",
    clue: "\"I graduated right as the whole world locked down. My first job was remote from day one — I've never actually been to my company's office in person.\"",
  };
  if (age <= 30) return {
    label: "27 – 30",
    clue: "\"I remember being in middle school when the 2008 financial crisis hit. My parents suddenly went very quiet about money. I didn't fully understand it then.\"",
  };
  if (age <= 35) return {
    label: "31 – 35",
    clue: "\"I was a teenager when Facebook launched and genuinely thought it was the most revolutionary thing I'd ever seen. I check it maybe once a year now.\"",
  };
  if (age <= 40) return {
    label: "36 – 40",
    clue: "\"My first phone had a pull-out antenna and a screen the size of a postage stamp. I thought it was incredible. We burned CDs for road trips.\"",
  };
  return {
    label: "40+",
    clue: "\"We passed notes in class, not texts. The internet came to our house when I was a teenager and we had one shared computer in the hallway.\"",
  };
}

// ── Location clues ────────────────────────────────────────────────────────────
function locationClue(city: string | null, country: string): { clue: string; label: string; options: string[] } {
  const c = (city || country).toLowerCase();

  if (c.includes("bali")) return {
    clue: "\"Every morning before sunrise there are canang sari offerings at every doorstep — flowers, rice, incense. Temple ceremonies happen every few weeks and the whole village shows up. It's completely ordinary here, which is the extraordinary part.\"",
    label: "Bali, Indonesia",
    options: shuffle(["Bali, Indonesia", "Sri Lanka", "Thailand", "Philippines"]),
  };
  if (c.includes("jakarta")) return {
    clue: "\"My commute is two hours each way and nobody thinks that's unusual. During Lebaran the whole city empties out and for three days you can drive anywhere in ten minutes — it's the only time the streets make sense.\"",
    label: "Jakarta, Indonesia",
    options: shuffle(["Jakarta, Indonesia", "Manila", "Ho Chi Minh City", "Bangkok"]),
  };
  if (c.includes("indonesia") || c.includes("surabaya") || c.includes("bandung") || c.includes("medan") || c.includes("yogyakarta")) return {
    clue: "\"Lebaran brings the whole country home — streets go quiet, family tables go loud. When the rains come in November the smell of petrichor on warm pavement is one of those things that never gets old.\"",
    label: "Indonesia",
    options: shuffle(["Indonesia", "Malaysia", "Philippines", "Vietnam"]),
  };
  if (c.includes("malaysia") || c.includes("kuala lumpur") || c.includes("penang")) return {
    clue: "\"We celebrate Raya, Chinese New Year, Deepavali and Christmas within the same year and somehow each one feels equally real. Mamak stalls are open at 2am and I've had some of my best conversations over roti canai at midnight.\"",
    label: "Malaysia",
    options: shuffle(["Malaysia", "Indonesia", "Singapore", "Brunei"]),
  };
  if (c.includes("singapore")) return {
    clue: "\"National Day fireworks, hawker centers that food critics fly in for, and the fact that you can get almost anywhere in 30 minutes. Small country but nothing feels small about living here.\"",
    label: "Singapore",
    options: shuffle(["Singapore", "Malaysia", "Hong Kong", "Taiwan"]),
  };
  if (c.includes("philippines") || c.includes("manila") || c.includes("cebu")) return {
    clue: "\"Fiesta season means the whole barangay is outside, the streets smell like lechon, and the procession runs past midnight. Christmas season starts in September and nobody apologizes for it.\"",
    label: "Philippines",
    options: shuffle(["Philippines", "Indonesia", "Thailand", "Vietnam"]),
  };
  if (c.includes("thailand") || c.includes("bangkok") || c.includes("chiang mai")) return {
    clue: "\"Songkran isn't just a water festival — it's three days of the entire country deciding nothing matters except being outside and getting soaked. Loy Krathong on the river at night is something you can't describe, only feel.\"",
    label: "Thailand",
    options: shuffle(["Thailand", "Vietnam", "Cambodia", "Laos"]),
  };
  if (c.includes("vietnam") || c.includes("ho chi minh") || c.includes("hanoi")) return {
    clue: "\"Tết Nguyên Đán — the whole country transforms. Red and gold everywhere, families gather from across the country, and every meal for a week is a ceremony in itself.\"",
    label: "Vietnam",
    options: shuffle(["Vietnam", "Thailand", "Cambodia", "Myanmar"]),
  };
  if (c.includes("japan") || c.includes("tokyo") || c.includes("osaka")) return {
    clue: "\"Cherry blossom season is two weeks and everyone treats it like a countdown. Obon in August when the lanterns go out on the water — that stillness is something you carry with you.\"",
    label: "Japan",
    options: shuffle(["Japan", "South Korea", "China", "Taiwan"]),
  };
  if (c.includes("korea") || c.includes("seoul")) return {
    clue: "\"Chuseok means going home no matter how far — traffic for twelve hours, worth it every time. The seasons here are four distinct personalities: cherry blossoms, monsoon heat, golden maple, and snowfall.\"",
    label: "South Korea",
    options: shuffle(["South Korea", "Japan", "China", "Taiwan"]),
  };
  if (c.includes("india") || c.includes("mumbai") || c.includes("delhi") || c.includes("bangalore")) return {
    clue: "\"Diwali means every rooftop in the neighbourhood lit up at once — the smell of fireworks and mithai everywhere for a week. Holi is the one day strangers are expected to cover each other in colour and nobody objects.\"",
    label: "India",
    options: shuffle(["India", "Sri Lanka", "Pakistan", "Bangladesh"]),
  };
  if (c.includes("australia") || c.includes("sydney") || c.includes("melbourne") || c.includes("brisbane")) return {
    clue: "\"Christmas BBQ at 38°C, New Year's fireworks over the harbour, and a long weekend that somehow always coincides with perfect surf. Summer here starts just when the rest of the world goes dark.\"",
    label: "Australia",
    options: shuffle(["Australia", "New Zealand", "South Africa", "Canada"]),
  };
  if (c.includes("london") || c.includes("uk") || c.includes("england") || c.includes("manchester")) return {
    clue: "\"Bank holiday Monday and everyone migrates to the nearest pub garden the second the sun appears. 18°C counts as a heatwave. Guy Fawkes Night, the smell of sparklers and bonfires — some things never change.\"",
    label: "United Kingdom",
    options: shuffle(["United Kingdom", "Ireland", "Australia", "Canada"]),
  };
  if (c.includes("dubai") || c.includes("uae") || c.includes("abu dhabi")) return {
    clue: "\"Iftar at sunset during Ramadan — the whole city synchronises in that one quiet moment before it all starts again. Desert camping at night with no light pollution and a sky that doesn't look real.\"",
    label: "UAE / Gulf",
    options: shuffle(["UAE / Gulf", "Saudi Arabia", "Qatar", "Bahrain"]),
  };
  if (c.includes("nigeria") || c.includes("lagos") || c.includes("abuja")) return {
    clue: "\"Owambe parties where everyone is dressed to compete and the jollof is always a topic of debate. Lagos energy is something visitors talk about for years — relentless, loud, magnetic.\"",
    label: "Nigeria",
    options: shuffle(["Nigeria", "Ghana", "Kenya", "South Africa"]),
  };
  if (c.includes("south africa") || c.includes("cape town") || c.includes("johannesburg")) return {
    clue: "\"Braai culture is basically a religion here — weekend, weekday, celebration or Tuesday, someone is firing up the grill. Heritage Day in September is just the official excuse.\"",
    label: "South Africa",
    options: shuffle(["South Africa", "Nigeria", "Kenya", "Zimbabwe"]),
  };
  if (c.includes("brazil") || c.includes("rio") || c.includes("são paulo")) return {
    clue: "\"Carnaval is five days where the whole country drops everything. The smell of street food, samba from every speaker, strangers dancing with strangers at 4am — nothing prepares you for it.\"",
    label: "Brazil",
    options: shuffle(["Brazil", "Argentina", "Colombia", "Mexico"]),
  };
  if (c.includes("mexico") || c.includes("cdmx")) return {
    clue: "\"Día de los Muertos is one of the most beautiful things you'll ever see — altars covered in marigolds, photos of people who are gone, candlelight in every cemetery. It's grief turned into something luminous.\"",
    label: "Mexico",
    options: shuffle(["Mexico", "Colombia", "Brazil", "Argentina"]),
  };
  if (c.includes("usa") || c.includes("new york") || c.includes("los angeles") || c.includes("chicago")) return {
    clue: "\"Fourth of July means every neighbourhood competing on fireworks intensity. Thanksgiving is the one holiday where the whole country is somehow doing the exact same thing at the same time.\"",
    label: "United States",
    options: shuffle(["United States", "Canada", "Australia", "United Kingdom"]),
  };
  if (c.includes("canada") || c.includes("toronto") || c.includes("vancouver")) return {
    clue: "\"Hockey playoff season turns quiet people into shouting strangers in bars who feel like old friends. Maple syrup season in spring, the northern lights if you're far enough north — this country has moods.\"",
    label: "Canada",
    options: shuffle(["Canada", "United States", "Australia", "New Zealand"]),
  };

  // Tropical generic fallback
  return {
    clue: "\"Rainy season here is its own personality — the kind of downpour that stops traffic and smells like earth and electricity. Mango season though. Worth every flooded street.\"",
    label: country,
    options: shuffle([country, "Australia", "Europe", "North America"]),
  };
}

// ── Intent clues ──────────────────────────────────────────────────────────────
function intentClue(lookingFor: string | null): { clue: string; label: string; options: string[] } {
  const lf = (lookingFor || "").toLowerCase();
  if (lf.includes("marriage") || lf.includes("marry")) return {
    clue: "\"I'm past the stage of collecting interesting experiences with people I'll never see again. I want someone to build something with — the kind of thing that's still standing in thirty years.\"",
    label: "Marriage / Long-term",
    options: shuffle(["Marriage / Long-term", "Casual dating", "Just friends", "Still figuring it out"]),
  };
  if (lf.includes("serious") || lf.includes("relationship")) return {
    clue: "\"I've done casual. What I actually want is someone I'll still be calling when something good happens — or something bad. Someone who becomes a habit you're glad you formed.\"",
    label: "Serious relationship",
    options: shuffle(["Serious relationship", "Casual & free", "Friendship only", "Travel partner"]),
  };
  if (lf.includes("casual") || lf.includes("fun") || lf.includes("something fun")) return {
    clue: "\"No heavy expectations, no pressure — I just want to meet real people and see what happens. Life is too short for manufactured urgency.\"",
    label: "Casual / No pressure",
    options: shuffle(["Casual / No pressure", "Serious relationship", "Marriage", "Friendship"]),
  };
  if (lf.includes("friend")) return {
    clue: "\"Every great relationship I've witnessed started as genuine friends first. I'm not in a rush. The right thing built slowly beats the fast thing built on nothing.\"",
    label: "Friendship first",
    options: shuffle(["Friendship first", "Serious relationship", "Marriage", "Casual dating"]),
  };
  if (lf.includes("travel")) return {
    clue: "\"I want someone to explore with — not a tourist, a real travel companion. Someone who chooses the unmarked path, eats street food at midnight, and isn't checking a list.\"",
    label: "Travel partner / Adventure",
    options: shuffle(["Travel partner / Adventure", "Marriage", "Casual fun", "Stay-home comfort"]),
  };
  return {
    clue: "\"I'm not here with a rigid checklist. I want connection that feels real — where it goes from there is a conversation, not a decision I've already made.\"",
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
}: {
  profile: BlindProfile;
  userId: string;
  onClose: () => void;
  onPassed: () => void;
}) {
  const { questions } = generateMysteryCard(profile);
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
          width: "100%", maxWidth: 380,
          background: "rgba(20,10,15,0.95)",
          border: "1.5px solid rgba(194,24,91,0.5)",
          borderRadius: 20,
          boxShadow: "0 0 40px rgba(194,24,91,0.3)",
          padding: "28px 22px",
          display: "flex", flexDirection: "column", gap: 20,
        }}
      >
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

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6 }}>
          {questions.map((_: Question, i: number) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 4,
              background: i < step ? "#c2185b" : i === step ? "rgba(194,24,91,0.5)" : "rgba(255,255,255,0.12)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* Result screen */}
        {result ? (
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
          />
        )}
      </AnimatePresence>
    </>
  );
}
