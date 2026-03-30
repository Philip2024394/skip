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

// ── Mystery bio generator ─────────────────────────────────────────────────────
// Produces a clue-filled narrative paragraph + 3 questions the reader can
// actually answer by reading carefully. No raw data is ever shown directly.

interface MysteryCard {
  bio: string;         // clue-filled narrative
  questions: Question[];
}

function ageRange(age: number): { label: string; clue: string } {
  if (age <= 22) return {
    label: "18 – 22",
    clue: "I was still in school when everyone started obsessing over short-form videos — that whole era basically defined my teenage years.",
  };
  if (age <= 26) return {
    label: "23 – 26",
    clue: "I graduated just as the world went into lockdown. My first 'real job' was fully remote — I've never actually met half my old colleagues in person.",
  };
  if (age <= 30) return {
    label: "27 – 30",
    clue: "I remember my parents stressing about the 2008 financial crisis when I was in middle school. Didn't understand it then — understand it too well now.",
  };
  if (age <= 35) return {
    label: "31 – 35",
    clue: "I was a teenager when Facebook launched and thought it was the coolest thing alive. These days I barely open it.",
  };
  if (age <= 40) return {
    label: "36 – 40",
    clue: "I grew up with dial-up internet and cassette tapes. My first phone had an antenna you had to pull out.",
  };
  return {
    label: "40+",
    clue: "I remember when mobile phones were a luxury. We wrote letters and actually waited for replies — patience wasn't optional.",
  };
}

function locationClue(city: string | null, country: string): { hint: string; regionLabel: string; regionOptions: string[] } {
  const c = (city || country).toLowerCase();

  if (c.includes("bali"))       return { hint: "The smell of incense and rice offerings at sunrise is just part of daily life here. Temple bells on ceremony days.", regionLabel: "Bali, Indonesia", regionOptions: shuffle(["Bali, Indonesia", "Thailand", "Philippines", "Sri Lanka"]) };
  if (c.includes("jakarta"))    return { hint: "Two-hour commutes through gridlock, street food on every corner, and a skyline that never stops growing.", regionLabel: "Jakarta, Indonesia", regionOptions: shuffle(["Jakarta, Indonesia", "Kuala Lumpur", "Ho Chi Minh City", "Manila"]) };
  if (c.includes("indonesia") || c.includes("surabaya") || c.includes("bandung") || c.includes("medan")) return { hint: "Monsoon season here is no joke — streets flood and the air smells electric before the rain hits. Lebaran is the biggest event of the year.", regionLabel: "Indonesia", regionOptions: shuffle(["Indonesia", "Malaysia", "Philippines", "Vietnam"]) };
  if (c.includes("malaysia") || c.includes("kuala lumpur")) return { hint: "Mamak stalls open past midnight, the skyline is iconic, and you can eat four different cuisines in one street.", regionLabel: "Malaysia", regionOptions: shuffle(["Malaysia", "Indonesia", "Singapore", "Thailand"]) };
  if (c.includes("singapore"))  return { hint: "Everything is close, everything is clean, and you can get food at 3am without thinking twice.", regionLabel: "Singapore", regionOptions: shuffle(["Singapore", "Malaysia", "Hong Kong", "Taiwan"]) };
  if (c.includes("philippines") || c.includes("manila")) return { hint: "Island hopping is a real weekend plan here, not a dream. The ocean is never far.", regionLabel: "Philippines", regionOptions: shuffle(["Philippines", "Indonesia", "Thailand", "Vietnam"]) };
  if (c.includes("thailand") || c.includes("bangkok")) return { hint: "Songkran water festival, street markets, and temples that glow orange at dusk.", regionLabel: "Thailand", regionOptions: shuffle(["Thailand", "Vietnam", "Cambodia", "Myanmar"]) };
  if (c.includes("australia") || c.includes("sydney") || c.includes("melbourne")) return { hint: "Summer here means UV warnings before 10am. Beaches on Christmas Day are completely normal.", regionLabel: "Australia", regionOptions: shuffle(["Australia", "New Zealand", "South Africa", "Canada"]) };
  if (c.includes("london") || c.includes("uk") || c.includes("england")) return { hint: "We complain about the weather constantly but still somehow look surprised when it rains in July.", regionLabel: "United Kingdom", regionOptions: shuffle(["United Kingdom", "Australia", "Canada", "Ireland"]) };
  if (c.includes("dubai") || c.includes("uae")) return { hint: "40°C in summer is just Tuesday here. The desert sunsets though — nothing compares.", regionLabel: "UAE / Middle East", regionOptions: shuffle(["UAE / Middle East", "Saudi Arabia", "Qatar", "Bahrain"]) };

  // Generic tropical fallback
  return { hint: "The rainy season here is relentless — but mango season makes up for everything.", regionLabel: country, regionOptions: shuffle([country, "Australia", "Europe", "North America"]) };
}

function intentClue(lookingFor: string | null): { hint: string; label: string; options: string[] } {
  const lf = (lookingFor || "").toLowerCase();
  if (lf.includes("marriage") || lf.includes("marry")) return {
    hint: "I'm at the point in life where I want to build something real — not just collect memories, but share them with one person long-term.",
    label: "Marriage / Long-term",
    options: shuffle(["Marriage / Long-term", "Casual dating", "Just friends", "Still figuring it out"]),
  };
  if (lf.includes("serious") || lf.includes("relationship")) return {
    hint: "I've done the casual thing. What I actually want now is someone I can still be talking to in ten years.",
    label: "Serious relationship",
    options: shuffle(["Serious relationship", "Casual fun", "Friendship only", "Travel companion"]),
  };
  if (lf.includes("casual") || lf.includes("fun") || lf.includes("something fun")) return {
    hint: "No pressure, no heavy expectations — I just want to meet interesting people and see what happens naturally.",
    label: "Casual / No pressure",
    options: shuffle(["Casual / No pressure", "Serious relationship", "Marriage", "Friendship"]),
  };
  if (lf.includes("friend")) return {
    hint: "Honestly, the best relationships I've seen started as close friendships first. I'm not rushing anything.",
    label: "Friendship first",
    options: shuffle(["Friendship first", "Serious relationship", "Marriage", "Casual dating"]),
  };
  if (lf.includes("travel")) return {
    hint: "I want someone to explore with — not a tourist, a travel partner. Someone who reads the side streets, not just the guidebook.",
    label: "Travel partner / Adventure",
    options: shuffle(["Travel partner / Adventure", "Marriage", "Casual fun", "Stay-home connection"]),
  };
  return {
    hint: "I'm open to where things go. Connection first — labels can come later.",
    label: "Open / Exploring",
    options: shuffle(["Open / Exploring", "Serious relationship", "Marriage", "Casual only"]),
  };
}

function generateMysteryCard(p: BlindProfile): MysteryCard {
  const age   = ageRange(p.age);
  const loc   = locationClue(p.city, p.country);
  const intent = intentClue(p.looking_for);

  // Stitch the three clues into a flowing bio paragraph
  const bio = `${age.clue} ${loc.hint} ${intent.hint}`;

  const questions: Question[] = [
    {
      text: "Based on the story above — how old do you think this person roughly is?",
      options: shuffle(["18 – 22", "23 – 26", "27 – 30", "31 – 35", "36 – 40", "40+"]).slice(0, 4),
      get correct() {
        const idx = this.options.indexOf(age.label);
        return idx === -1 ? 0 : idx;
      },
    },
    {
      text: "From the clues in their story — where do you think they're from?",
      options: loc.regionOptions.slice(0, 4),
      get correct() {
        const idx = this.options.indexOf(loc.regionLabel);
        return idx === -1 ? 0 : idx;
      },
    },
    {
      text: "Reading between the lines — what is this person really looking for?",
      options: intent.options.slice(0, 4),
      get correct() {
        const idx = this.options.indexOf(intent.label);
        return idx === -1 ? 0 : idx;
      },
    },
  ];

  return { bio, questions };
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
  const { bio: mysteryBio, questions } = generateMysteryCard(profile);
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

            {/* Mystery bio */}
            {step === 0 && (
              <div style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(194,24,91,0.25)",
                borderRadius: 12, padding: "14px 16px",
                fontSize: 13, color: "rgba(255,255,255,0.8)",
                lineHeight: 1.65, fontStyle: "italic",
              }}>
                "{mysteryBio}"
              </div>
            )}

            {/* Question */}
            <div style={{ fontSize: 15, fontWeight: 700, color: "white", lineHeight: 1.4 }}>
              Q{step + 1}. {current.text}
            </div>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {current.options.map((opt: string, idx: number) => {
                const isSelected = selected === idx;
                const isCorrect = selected !== null && idx === current.correct;
                const isWrong = isSelected && idx !== current.correct;

                return (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelect(idx)}
                    style={{
                      padding: "12px 16px", borderRadius: 12,
                      background: isCorrect
                        ? "rgba(34,197,94,0.2)"
                        : isWrong
                          ? "rgba(239,68,68,0.2)"
                          : isSelected
                            ? "rgba(194,24,91,0.25)"
                            : "rgba(255,255,255,0.06)",
                      border: isCorrect
                        ? "1.5px solid rgba(34,197,94,0.6)"
                        : isWrong
                          ? "1.5px solid rgba(239,68,68,0.6)"
                          : isSelected
                            ? "1.5px solid #c2185b"
                            : "1.5px solid rgba(255,255,255,0.12)",
                      color: "white", fontSize: 14, fontWeight: 500,
                      textAlign: "left", cursor: selected !== null ? "default" : "pointer",
                      transition: "all 0.2s",
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
