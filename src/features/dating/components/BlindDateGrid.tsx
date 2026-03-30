import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

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

interface Question {
  text: string;
  options: string[];
  correct: number; // index into options
}

// ── Question generator ────────────────────────────────────────────────────────

function generateQuestions(p: BlindProfile): Question[] {
  const qs: Question[] = [];

  // Q1 — Age (easy)
  if (p.age) {
    const wrong = [p.age - 2, p.age + 2, p.age + 4].filter(n => n > 17 && n !== p.age);
    const opts = shuffle([p.age, ...wrong.slice(0, 3)]).map(String);
    qs.push({
      text: `How old is ${p.name}?`,
      options: opts,
      correct: opts.indexOf(String(p.age)),
    });
  }

  // Q2 — City / Country (easy)
  const location = p.city || p.country;
  if (location) {
    const fakes = ["London", "Jakarta", "Sydney", "Dubai", "Toronto", "Bangkok", "Berlin"].filter(c => c !== location);
    const opts = shuffle([location, ...fakes.slice(0, 3)]);
    qs.push({
      text: `Where is ${p.name} from?`,
      options: opts,
      correct: opts.indexOf(location),
    });
  }

  // Q3 — Looking for (medium)
  if (p.looking_for) {
    const all = ["Casual Dating", "Serious Relationship", "Marriage", "Friendship", "Travel Partner", "Something Fun"];
    const fakes = all.filter(v => v !== p.looking_for);
    const opts = shuffle([p.looking_for, ...fakes.slice(0, 3)]);
    qs.push({
      text: `What is ${p.name} looking for?`,
      options: opts,
      correct: opts.indexOf(p.looking_for),
    });
  }

  // Q4 — Gender fallback if we only have 2 questions
  if (qs.length < 3 && p.gender) {
    const opts = shuffle(["Male", "Female", "Non-binary", "Prefer not to say"]);
    const correct = opts.findIndex(o => o.toLowerCase() === p.gender!.toLowerCase());
    if (correct !== -1) {
      qs.push({
        text: `What is ${p.name}'s gender?`,
        options: opts,
        correct,
      });
    }
  }

  return qs.slice(0, 3);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  const questions = generateQuestions(profile);
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
          {questions.map((_, i) => (
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
            {/* Blurred avatar hint */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : "#c2185b33",
                filter: "blur(10px)", overflow: "hidden", flexShrink: 0,
                border: "2px solid rgba(194,24,91,0.4)",
              }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{profile.name}, {profile.age}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{profile.city || profile.country}</div>
              </div>
            </div>

            {/* Question */}
            <div style={{ fontSize: 15, fontWeight: 700, color: "white", lineHeight: 1.4 }}>
              Q{step + 1}. {current.text}
            </div>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {current.options.map((opt, idx) => {
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
    setProfiles((data as BlindProfile[]) || []);
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
