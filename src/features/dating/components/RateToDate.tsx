import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { generateIndonesianProfiles } from "@/data/indonesianProfiles";
import { useCoinBalance } from "@/shared/hooks/useCoinBalance";

// ── Constants ──────────────────────────────────────────────────────────────────

const COINS_ACCEPT_CHAT = 20;   // User A pays to enter chat after invite
const COINS_ACCEPT_KEY  = 1;    // User A spends 1 key for off-app contact

// ── Types ──────────────────────────────────────────────────────────────────────

interface RTDProfile {
  id: string;
  name: string;
  age: number;
  city: string | null;
  country: string;
  avatar_url: string | null;
  looking_for: string | null;
}

interface ImpressionReport {
  id: string;
  viewer_id: string;
  viewer_name: string;
  viewer_avatar: string | null;
  rating: number;
  noticed: string[];
  personality: string[];
  intent: string;
  question: string | null;
  status: "pending" | "invited" | "accepted" | "declined";
  created_at: string;
}

type RatePhase = "rating" | "noticed" | "personality" | "intent" | "question" | "done";

// ── Question tiers ─────────────────────────────────────────────────────────────

const PRESET_QUESTIONS = [
  "What's your idea of a perfect Sunday?",
  "What's something you're really proud of?",
  "What makes you laugh most?",
  "Best place you've ever been?",
  "One thing on your bucket list?",
];

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_PROFILES: RTDProfile[] = generateIndonesianProfiles(20).map(p => ({
  id: p.id,
  name: p.name,
  age: p.age,
  city: p.city ?? null,
  country: p.country,
  avatar_url: p.image ?? (p.images?.[0] ?? null),
  looking_for: (p as any).looking_for ?? null,
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map(n => (
        <motion.button
          key={n}
          whileTap={{ scale: 0.85 }}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          style={{
            fontSize: 36, background: "none", border: "none",
            cursor: "pointer", padding: 0, lineHeight: 1,
            filter: n <= (hovered || value) ? "drop-shadow(0 0 6px rgba(251,191,36,0.8))" : "grayscale(1) opacity(0.35)",
            transition: "filter 0.15s",
          }}
        >⭐</motion.button>
      ))}
    </div>
  );
}

// ── RateModal: the impression questionnaire ────────────────────────────────────

interface RateModalProps {
  profile: RTDProfile;
  userId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

function RateModal({ profile, userId, onClose, onSubmitted }: RateModalProps) {
  const { balance, deductCoins } = useCoinBalance(userId);
  const [phase, setPhase]               = useState<RatePhase>("rating");
  const [rating, setRating]             = useState(0);
  const [noticed, setNoticed]           = useState<string[]>([]);
  const [personality, setPersonality]   = useState<string[]>([]);
  const [intent, setIntent]             = useState("");
  const [question, setQuestion]         = useState("");
  const [questionTier, setQuestionTier] = useState<"preset" | "custom" | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [sendingQ, setSendingQ]         = useState(false);

  const firstName = profile.name.split(" ")[0];

  const NOTICED_OPTIONS   = ["Smile 😊", "Eyes 👀", "Style 💫", "Confidence 🔥", "Mystery 🌙", "Friendly vibe ☀️"];
  const PERSONALITY_OPTIONS = ["Kind 💛", "Confident 💪", "Fun 😄", "Serious 🎯", "Ambitious 🚀", "Quiet 🌿", "Adventurous 🗺️"];
  const INTENT_OPTIONS    = ["Just chatting 💬", "Dating 💕", "Long-term 💍", "Marriage minded 🏡"];

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const PHASES: RatePhase[] = ["rating", "noticed", "personality", "intent"];
  const phaseIdx = PHASES.indexOf(phase as any);

  const handleSubmit = async (skipQuestion = false) => {
    if (submitting) return;
    setSubmitting(true);

    const coinCost = questionTier === "custom" ? 15 : questionTier === "preset" ? 5 : 0;

    if (coinCost > 0 && !skipQuestion) {
      const ok = await deductCoins(coinCost, "rtd_question");
      if (!ok) { setSubmitting(false); return; }
    }

    if (!import.meta.env.DEV) {
      await supabase.rpc("submit_rate_to_date" as any, {
        p_viewer_id:      userId,
        p_target_id:      profile.id,
        p_rating:         rating,
        p_noticed:        noticed,
        p_personality:    personality,
        p_intent:         intent,
        p_question:       skipQuestion ? null : (question.trim() || null),
        p_question_coins: skipQuestion ? 0 : coinCost,
      });
    }

    setSubmitting(false);
    setPhase("done");
    setTimeout(onSubmitted, 1800);
  };

  const STEP_LABELS = ["Rate", "Noticed", "Vibe", "Intent"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        style={{
          width: "100%", maxWidth: 430,
          background: "rgba(10,6,18,0.98)",
          border: "1.5px solid rgba(194,24,91,0.35)",
          borderBottom: "none",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -8px 60px rgba(194,24,91,0.2)",
          overflow: "hidden",
          maxHeight: "92vh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Profile photo header */}
        <div style={{ position: "relative", height: 200, flexShrink: 0, overflow: "hidden" }}>
          {profile.avatar_url ? (
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${profile.avatar_url})`,
              backgroundSize: "cover", backgroundPosition: "center top",
              transform: "scale(1.06)",
            }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#1a0a1e,#2d0a1e)" }} />
          )}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(10,6,18,1) 0%, rgba(10,6,18,0.2) 60%, rgba(0,0,0,0.1) 100%)",
          }} />

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 12, right: 12,
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.7)", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >×</button>

          {/* Name */}
          <div style={{ position: "absolute", bottom: 14, left: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "white" }}>{firstName}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
              {profile.age} · {profile.city ?? profile.country}
            </div>
          </div>

          {/* Rate To Date badge */}
          <div style={{
            position: "absolute", top: 12, left: 12,
            background: "linear-gradient(135deg,#c2185b,#e91e8c)",
            borderRadius: 20, padding: "4px 12px",
            fontSize: 10, fontWeight: 800, color: "white",
            boxShadow: "0 2px 12px rgba(194,24,91,0.5)",
            letterSpacing: "0.06em",
          }}>
            RATE TO DATE
          </div>
        </div>

        {/* Step progress */}
        {phase !== "done" && phase !== "question" && (
          <div style={{ padding: "10px 18px 0", display: "flex", gap: 6 }}>
            {STEP_LABELS.map((label, i) => (
              <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{
                  height: 3, width: "100%", borderRadius: 3,
                  background: i < phaseIdx ? "#c2185b" : i === phaseIdx ? "rgba(194,24,91,0.55)" : "rgba(255,255,255,0.08)",
                  transition: "background 0.3s",
                }} />
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: "0.05em",
                  color: i === phaseIdx ? "rgba(194,24,91,0.9)" : "rgba(255,255,255,0.25)",
                }}>
                  {label.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 28px" }}>

          {/* ── Rating ── */}
          {phase === "rating" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "white", marginBottom: 4 }}>
                  Rate your first impression
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  {firstName} will see this rating
                </div>
              </div>
              <StarRow value={rating} onChange={setRating} />
              {rating > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                    {["", "Not really my type", "Could be interesting", "Definitely intrigued", "Really caught my eye", "Absolutely my type"][rating]}
                  </div>
                </motion.div>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => rating > 0 && setPhase("noticed")}
                disabled={rating === 0}
                style={{
                  width: "100%", padding: "13px", borderRadius: 50,
                  background: rating > 0 ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "rgba(194,24,91,0.15)",
                  border: "none", color: "white", fontSize: 14, fontWeight: 700,
                  cursor: rating > 0 ? "pointer" : "not-allowed",
                  boxShadow: rating > 0 ? "0 4px 20px rgba(194,24,91,0.4)" : "none",
                  transition: "all 0.25s",
                }}
              >
                Continue →
              </motion.button>
            </motion.div>
          )}

          {/* ── What noticed ── */}
          {phase === "noticed" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "white", marginBottom: 4 }}>
                  What caught your attention?
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Pick all that apply</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {NOTICED_OPTIONS.map(opt => {
                  const sel = noticed.includes(opt);
                  return (
                    <motion.button
                      key={opt}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggle(noticed, opt, setNoticed)}
                      style={{
                        padding: "9px 14px", borderRadius: 50, cursor: "pointer",
                        background: sel ? "rgba(194,24,91,0.28)" : "rgba(255,255,255,0.06)",
                        border: `1.5px solid ${sel ? "rgba(194,24,91,0.7)" : "rgba(255,255,255,0.1)"}`,
                        color: sel ? "rgba(255,180,200,1)" : "rgba(255,255,255,0.65)",
                        fontSize: 13, fontWeight: 600, transition: "all 0.18s",
                      }}
                    >
                      {opt}
                    </motion.button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => setPhase("rating")}
                  style={{ flex: 1, padding: "12px", borderRadius: 50, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}
                >← Back</button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => noticed.length > 0 && setPhase("personality")}
                  disabled={noticed.length === 0}
                  style={{
                    flex: 2, padding: "13px", borderRadius: 50,
                    background: noticed.length > 0 ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "rgba(194,24,91,0.15)",
                    border: "none", color: "white", fontSize: 14, fontWeight: 700,
                    cursor: noticed.length > 0 ? "pointer" : "not-allowed",
                    boxShadow: noticed.length > 0 ? "0 4px 20px rgba(194,24,91,0.4)" : "none",
                    transition: "all 0.25s",
                  }}
                >
                  Continue →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Personality read ── */}
          {phase === "personality" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "white", marginBottom: 4 }}>
                  What personality do they seem?
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>First impression only — pick any that fit</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PERSONALITY_OPTIONS.map(opt => {
                  const sel = personality.includes(opt);
                  return (
                    <motion.button
                      key={opt}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggle(personality, opt, setPersonality)}
                      style={{
                        padding: "9px 14px", borderRadius: 50, cursor: "pointer",
                        background: sel ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)",
                        border: `1.5px solid ${sel ? "rgba(139,92,246,0.65)" : "rgba(255,255,255,0.1)"}`,
                        color: sel ? "rgba(196,181,253,1)" : "rgba(255,255,255,0.65)",
                        fontSize: 13, fontWeight: 600, transition: "all 0.18s",
                      }}
                    >
                      {opt}
                    </motion.button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => setPhase("noticed")}
                  style={{ flex: 1, padding: "12px", borderRadius: 50, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}
                >← Back</button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => personality.length > 0 && setPhase("intent")}
                  disabled={personality.length === 0}
                  style={{
                    flex: 2, padding: "13px", borderRadius: 50,
                    background: personality.length > 0 ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "rgba(139,92,246,0.15)",
                    border: "none", color: "white", fontSize: 14, fontWeight: 700,
                    cursor: personality.length > 0 ? "pointer" : "not-allowed",
                    boxShadow: personality.length > 0 ? "0 4px 20px rgba(139,92,246,0.4)" : "none",
                    transition: "all 0.25s",
                  }}
                >
                  Continue →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Intent ── */}
          {phase === "intent" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "white", marginBottom: 4 }}>
                  What's your intent feeling?
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  Be honest — {firstName} will see this
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {INTENT_OPTIONS.map(opt => (
                  <motion.button
                    key={opt}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIntent(opt)}
                    style={{
                      width: "100%", padding: "14px 18px", borderRadius: 14, textAlign: "left",
                      background: intent === opt ? "rgba(194,24,91,0.2)" : "rgba(255,255,255,0.05)",
                      border: `1.5px solid ${intent === opt ? "rgba(194,24,91,0.65)" : "rgba(255,255,255,0.09)"}`,
                      color: intent === opt ? "rgba(255,180,200,1)" : "rgba(255,255,255,0.75)",
                      fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.18s",
                    }}
                  >
                    {opt}
                  </motion.button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setPhase("personality")}
                  style={{ flex: 1, padding: "12px", borderRadius: 50, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}
                >← Back</button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => intent && setPhase("question")}
                  disabled={!intent}
                  style={{
                    flex: 2, padding: "13px", borderRadius: 50,
                    background: intent ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "rgba(194,24,91,0.15)",
                    border: "none", color: "white", fontSize: 14, fontWeight: 700,
                    cursor: intent ? "pointer" : "not-allowed",
                    boxShadow: intent ? "0 4px 20px rgba(194,24,91,0.4)" : "none",
                    transition: "all 0.25s",
                  }}
                >
                  Continue →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Optional question ── */}
          {phase === "question" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>💌</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                  Ask {firstName} something?
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, lineHeight: 1.5 }}>
                  Optional — your rating already goes to them. A question just starts the conversation.
                </div>
              </div>

              {!questionTier ? (
                <>
                  {/* Preset */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setQuestionTier("preset")}
                    style={{
                      width: "100%", padding: "16px 18px", borderRadius: 16,
                      background: "rgba(194,24,91,0.1)", border: "1.5px solid rgba(194,24,91,0.3)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>Pick a question</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Curated icebreakers</div>
                    </div>
                    <div style={{ padding: "5px 12px", borderRadius: 50, background: "linear-gradient(135deg,#c2185b,#e91e8c)", fontSize: 12, fontWeight: 800, color: "white" }}>
                      🪙 5
                    </div>
                  </motion.button>

                  {/* Custom */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setQuestionTier("custom")}
                    style={{
                      width: "100%", padding: "16px 18px", borderRadius: 16,
                      background: "rgba(139,92,246,0.08)", border: "1.5px solid rgba(139,92,246,0.28)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>Write your own</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Send anything you want</div>
                    </div>
                    <div style={{ padding: "5px 12px", borderRadius: 50, background: "linear-gradient(135deg,#7c3aed,#a855f7)", fontSize: 12, fontWeight: 800, color: "white" }}>
                      🪙 15
                    </div>
                  </motion.button>

                  {/* Skip */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSubmit(true)}
                    disabled={submitting}
                    style={{
                      width: "100%", padding: "13px", borderRadius: 50,
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      opacity: submitting ? 0.6 : 1,
                    }}
                  >
                    {submitting ? "Sending…" : "Skip — just send my rating"}
                  </motion.button>
                </>
              ) : questionTier === "preset" ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: -4 }}>
                    <button onClick={() => setQuestionTier(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer", padding: 0 }}>←</button>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Pick one — 5 coins</span>
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
                    onClick={() => handleSubmit(false)}
                    disabled={!question || submitting || balance < 5}
                    style={{
                      marginTop: 4, width: "100%", padding: "14px", borderRadius: 50,
                      background: question && balance >= 5 ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "rgba(194,24,91,0.15)",
                      border: "none", color: "white", fontSize: 14, fontWeight: 800,
                      cursor: question && balance >= 5 ? "pointer" : "not-allowed",
                      boxShadow: question && balance >= 5 ? "0 4px 20px rgba(194,24,91,0.4)" : "none",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? "Sending…" : balance < 5 ? "Not enough coins" : "💌 Send for 5 coins"}
                  </motion.button>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: -4 }}>
                    <button onClick={() => setQuestionTier(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer", padding: 0 }}>←</button>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Your question — 15 coins</span>
                  </div>
                  <textarea
                    value={question}
                    onChange={e => setQuestion(e.target.value.slice(0, 120))}
                    placeholder={`Ask ${firstName} anything…`}
                    rows={4}
                    style={{
                      width: "100%", padding: "13px 15px",
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 14, color: "white", fontSize: 13,
                      resize: "none", outline: "none", fontFamily: "inherit",
                      lineHeight: 1.5, boxSizing: "border-box",
                    }}
                  />
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "right", marginTop: -8 }}>
                    {question.length}/120
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSubmit(false)}
                    disabled={!question.trim() || submitting || balance < 15}
                    style={{
                      width: "100%", padding: "14px", borderRadius: 50,
                      background: question.trim() && balance >= 15 ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "rgba(139,92,246,0.15)",
                      border: "none", color: "white", fontSize: 14, fontWeight: 800,
                      cursor: question.trim() && balance >= 15 ? "pointer" : "not-allowed",
                      boxShadow: question.trim() && balance >= 15 ? "0 4px 20px rgba(139,92,246,0.4)" : "none",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? "Sending…" : balance < 15 ? "Not enough coins" : "💌 Send for 15 coins"}
                  </motion.button>
                </>
              )}
            </motion.div>
          )}

          {/* ── Done ── */}
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", padding: "16px 0 8px" }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.6 }}
                style={{ fontSize: 52 }}
              >
                💘
              </motion.div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "white", textAlign: "center" }}>
                Rating sent!
              </div>
              <div style={{
                background: "rgba(194,24,91,0.1)", border: "1px solid rgba(194,24,91,0.22)",
                borderRadius: 14, padding: "12px 16px",
                fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, textAlign: "center",
              }}>
                <strong style={{ color: "white" }}>{firstName}</strong> will see your {rating}⭐ rating, what you noticed, your personality read and intent.
                {question ? <> Your question is on its way too.</> : null}
                {" "}If they like what they see, they'll invite you to connect.
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── InboxCard: User B sees a blurred impression report ────────────────────────

interface InboxCardProps {
  report: ImpressionReport;
  onInvite: (report: ImpressionReport) => void;
  onDecline: (report: ImpressionReport) => void;
  unlocked: boolean;
  onUnlock: (report: ImpressionReport) => void;
  coinBalance: number;
}

const UNLOCK_COST = 10;

function InboxCard({ report, onInvite, onDecline, unlocked, onUnlock, coinBalance }: InboxCardProps) {
  const statusColors: Record<string, string> = {
    pending: "rgba(255,255,255,0.35)",
    invited: "rgba(34,197,94,0.8)",
    accepted: "rgba(194,24,91,0.8)",
    declined: "rgba(255,255,255,0.2)",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      {/* Viewer avatar row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 14px 10px" }}>
        <div style={{
          width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
          background: unlocked && report.viewer_avatar
            ? `url(${report.viewer_avatar}) center/cover`
            : "rgba(255,255,255,0.08)",
          border: "2px solid rgba(194,24,91,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
          filter: unlocked ? "none" : "blur(8px)",
        }}>
          {!report.viewer_avatar && "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700,
            color: unlocked ? "white" : "transparent",
            textShadow: unlocked ? "none" : "0 0 8px rgba(255,255,255,0.4)",
            background: unlocked ? "none" : "rgba(255,255,255,0.15)",
            borderRadius: unlocked ? 0 : 6,
            filter: unlocked ? "none" : "blur(6px)",
          }}>
            {unlocked ? report.viewer_name : "Anonymous"}
          </div>
          <div style={{ fontSize: 11, color: statusColors[report.status], marginTop: 2, fontWeight: 600 }}>
            {report.status === "pending" ? "Waiting for your response" :
             report.status === "invited" ? "✓ Invited" :
             report.status === "accepted" ? "💘 Connected" : "Declined"}
          </div>
        </div>
        {/* Stars — always visible */}
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          {[1,2,3,4,5].map(n => (
            <span key={n} style={{ fontSize: 14, opacity: n <= report.rating ? 1 : 0.2 }}>⭐</span>
          ))}
        </div>
      </div>

      {/* Impression data — blurred until unlocked */}
      <div style={{ padding: "0 14px 14px", position: "relative" }}>
        <div style={{ filter: unlocked ? "none" : "blur(5px)", pointerEvents: unlocked ? "auto" : "none" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {report.noticed.map(n => (
              <span key={n} style={{
                padding: "4px 10px", borderRadius: 50, fontSize: 11, fontWeight: 600,
                background: "rgba(194,24,91,0.18)", border: "1px solid rgba(194,24,91,0.35)",
                color: "rgba(255,180,200,0.9)",
              }}>{n}</span>
            ))}
            {report.personality.map(p => (
              <span key={p} style={{
                padding: "4px 10px", borderRadius: 50, fontSize: 11, fontWeight: 600,
                background: "rgba(139,92,246,0.16)", border: "1px solid rgba(139,92,246,0.3)",
                color: "rgba(196,181,253,0.9)",
              }}>{p}</span>
            ))}
          </div>
          {report.intent && (
            <div style={{
              fontSize: 12, color: "rgba(255,255,255,0.6)", fontStyle: "italic",
              marginBottom: report.question ? 8 : 0,
            }}>
              Intent: <strong style={{ color: "white" }}>{report.intent}</strong>
            </div>
          )}
          {report.question && (
            <div style={{
              padding: "10px 12px", borderRadius: 12,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12, color: "rgba(255,255,255,0.65)", fontStyle: "italic", lineHeight: 1.55,
            }}>
              💌 "{report.question}"
            </div>
          )}
        </div>

        {/* Unlock overlay */}
        {!unlocked && (
          <div style={{
            position: "absolute", inset: "0 14px 0",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onUnlock(report)}
              disabled={coinBalance < UNLOCK_COST}
              style={{
                padding: "9px 20px", borderRadius: 50,
                background: coinBalance >= UNLOCK_COST ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "rgba(194,24,91,0.2)",
                border: "none", color: "white", fontSize: 12, fontWeight: 800,
                cursor: coinBalance >= UNLOCK_COST ? "pointer" : "not-allowed",
                boxShadow: coinBalance >= UNLOCK_COST ? "0 4px 16px rgba(194,24,91,0.45)" : "none",
              }}
            >
              🔓 Unlock for {UNLOCK_COST} coins
            </motion.button>
          </div>
        )}
      </div>

      {/* Action buttons — shown after unlocking */}
      {unlocked && report.status === "pending" && (
        <div style={{ display: "flex", gap: 8, padding: "0 14px 14px" }}>
          <button
            onClick={() => onDecline(report)}
            style={{
              flex: 1, padding: "11px", borderRadius: 50,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer",
            }}
          >
            Pass
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onInvite(report)}
            style={{
              flex: 2, padding: "11px", borderRadius: 50,
              background: "linear-gradient(135deg,#c2185b,#e91e8c)",
              border: "none", color: "white", fontSize: 13, fontWeight: 800,
              cursor: "pointer", boxShadow: "0 4px 16px rgba(194,24,91,0.4)",
            }}
          >
            💬 Invite to Chat
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

// ── Accept Modal: User A pays to enter the chat ────────────────────────────────

interface AcceptModalProps {
  targetName: string;
  targetAvatar: string | null;
  balance: number;
  onAcceptChat: () => void;
  onAcceptKey: () => void;
  onClose: () => void;
  accepting: boolean;
}

function AcceptModal({ targetName, targetAvatar, balance, onAcceptChat, onAcceptKey, onClose, accepting }: AcceptModalProps) {
  const firstName = targetName.split(" ")[0];
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        style={{
          width: "100%", maxWidth: 380,
          background: "rgba(10,6,18,0.98)",
          border: "1.5px solid rgba(194,24,91,0.4)",
          borderRadius: 24, padding: "28px 22px",
          boxShadow: "0 0 60px rgba(194,24,91,0.2)",
          display: "flex", flexDirection: "column", gap: 18, alignItems: "center",
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: targetAvatar ? `url(${targetAvatar}) center/cover` : "rgba(194,24,91,0.2)",
          border: "3px solid rgba(194,24,91,0.6)",
          boxShadow: "0 0 24px rgba(194,24,91,0.4)",
        }} />

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 4 }}>
            {firstName} invited you!
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>
            They saw your rating and want to connect.<br />Choose how you'd like to meet.
          </div>
        </div>

        {/* Chat option */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onAcceptChat}
          disabled={balance < COINS_ACCEPT_CHAT || accepting}
          style={{
            width: "100%", padding: "15px 18px", borderRadius: 16,
            background: balance >= COINS_ACCEPT_CHAT ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "rgba(194,24,91,0.15)",
            border: `1.5px solid ${balance >= COINS_ACCEPT_CHAT ? "rgba(194,24,91,0.5)" : "rgba(194,24,91,0.2)"}`,
            cursor: balance >= COINS_ACCEPT_CHAT ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            textAlign: "left", opacity: accepting ? 0.7 : 1,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>Open Chat Window</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Chat inside the app</div>
          </div>
          <div style={{
            padding: "5px 12px", borderRadius: 50,
            background: "rgba(0,0,0,0.3)",
            fontSize: 12, fontWeight: 800, color: "white",
          }}>🪙 {COINS_ACCEPT_CHAT}</div>
        </motion.button>

        {/* Off-app / Key option */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onAcceptKey}
          disabled={accepting}
          style={{
            width: "100%", padding: "15px 18px", borderRadius: 16,
            background: "rgba(251,191,36,0.1)", border: "1.5px solid rgba(251,191,36,0.3)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            textAlign: "left", opacity: accepting ? 0.7 : 1,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>Connect Off-App</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Get their contact details</div>
          </div>
          <div style={{
            padding: "5px 12px", borderRadius: 50,
            background: "rgba(0,0,0,0.3)",
            fontSize: 12, fontWeight: 800, color: "white",
          }}>🗝️ 1 key</div>
        </motion.button>

        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer" }}
        >
          Decide later
        </button>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RateToDate — main page
// ══════════════════════════════════════════════════════════════════════════════

interface Props {
  userId: string;
  onClose: () => void;
  onStartChat: (profile: { id: string; name: string; avatar_url?: string }) => void;
}

export default function RateToDate({ userId, onClose, onStartChat }: Props) {
  const { balance, deductCoins } = useCoinBalance(userId);
  const [tab, setTab]                           = useState<"browse" | "inbox">("browse");
  const [profiles, setProfiles]                 = useState<RTDProfile[]>([]);
  const [ratingProfile, setRatingProfile]       = useState<RTDProfile | null>(null);
  const [ratedIds, setRatedIds]                 = useState<Set<string>>(new Set());
  const [inbox, setInbox]                       = useState<ImpressionReport[]>([]);
  const [unlockedIds, setUnlockedIds]           = useState<Set<string>>(new Set());
  const [pendingInvite, setPendingInvite]       = useState<ImpressionReport | null>(null);
  const [accepting, setAccepting]               = useState(false);
  const [showCoinShop, setShowCoinShop]         = useState(false);

  // Load browse profiles
  useEffect(() => {
    if (import.meta.env.DEV) {
      setProfiles(MOCK_PROFILES.filter(p => p.id !== userId));
      return;
    }
    supabase.from("profiles")
      .select("id,name,age,city,country,avatar_url,looking_for")
      .neq("id", userId)
      .limit(40)
      .then(({ data }) => { if (data) setProfiles(data as RTDProfile[]); });
  }, [userId]);

  // Load inbox (User B = current user)
  const loadInbox = useCallback(async () => {
    if (import.meta.env.DEV) {
      // Mock inbox data
      setInbox([
        {
          id: "mock-1", viewer_id: "v1", viewer_name: "Sarah K", viewer_avatar: null,
          rating: 4, noticed: ["Smile 😊", "Friendly vibe ☀️"], personality: ["Kind 💛", "Fun 😄"],
          intent: "Dating 💕", question: "What's your idea of a perfect Sunday?",
          status: "pending", created_at: new Date().toISOString(),
        },
        {
          id: "mock-2", viewer_id: "v2", viewer_name: "Ayu R", viewer_avatar: null,
          rating: 5, noticed: ["Confidence 🔥", "Style 💫"], personality: ["Confident 💪", "Ambitious 🚀"],
          intent: "Long-term 💍", question: null,
          status: "pending", created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
      return;
    }
    const { data } = await supabase
      .from("rate_to_date_impressions" as any)
      .select("id,viewer_id,rating,noticed,personality,intent,question,status,created_at,profiles!viewer_id(name,avatar_url)")
      .eq("target_id", userId)
      .order("created_at", { ascending: false });
    if (data) {
      setInbox((data as any[]).map(r => ({
        id: r.id,
        viewer_id: r.viewer_id,
        viewer_name: r.profiles?.name ?? "Someone",
        viewer_avatar: r.profiles?.avatar_url ?? null,
        rating: r.rating,
        noticed: r.noticed ?? [],
        personality: r.personality ?? [],
        intent: r.intent ?? "",
        question: r.question ?? null,
        status: r.status,
        created_at: r.created_at,
      })));
    }
  }, [userId]);

  useEffect(() => { loadInbox(); }, [loadInbox]);

  const handleUnlock = async (report: ImpressionReport) => {
    if (balance < UNLOCK_COST) return;
    const ok = await deductCoins(UNLOCK_COST, "rtd_unlock");
    if (ok) setUnlockedIds(prev => new Set([...prev, report.id]));
  };

  const handleInvite = async (report: ImpressionReport) => {
    if (!import.meta.env.DEV) {
      const { data: pushToken } = await supabase.rpc("rtd_invite" as any, {
        p_target_id: userId,
        p_viewer_id: report.viewer_id,
      });
      if (pushToken) {
        supabase.functions.invoke("send-push-notification", {
          body: {
            push_token: pushToken,
            title: "💘 Rate To Date — you've been invited!",
            body: "Someone liked your impression and wants to connect with you.",
          },
        }).catch(() => {});
      }
    }
    setInbox(prev => prev.map(r => r.id === report.id ? { ...r, status: "invited" } : r));
  };

  const handleDecline = async (report: ImpressionReport) => {
    if (!import.meta.env.DEV) {
      await supabase.from("rate_to_date_impressions" as any)
        .update({ status: "declined" })
        .eq("id", report.id);
    }
    setInbox(prev => prev.map(r => r.id === report.id ? { ...r, status: "declined" } : r));
  };

  const handleAcceptChat = async () => {
    if (!pendingInvite || accepting || balance < COINS_ACCEPT_CHAT) return;
    setAccepting(true);
    const ok = await deductCoins(COINS_ACCEPT_CHAT, "rtd_accept_chat");
    if (ok) {
      if (!import.meta.env.DEV) {
        await supabase.rpc("rtd_accept" as any, {
          p_viewer_id: userId,
          p_target_id: pendingInvite.viewer_id,
          p_coin_cost: COINS_ACCEPT_CHAT,
        });
      }
      onStartChat({ id: pendingInvite.viewer_id, name: pendingInvite.viewer_name, avatar_url: pendingInvite.viewer_avatar ?? undefined });
    }
    setAccepting(false);
    setPendingInvite(null);
  };

  const handleAcceptKey = async () => {
    if (!pendingInvite || accepting) return;
    // Key & Safe mechanic — spend 1 key for contact details
    // Integration with existing KeySafeModal can be added here
    setPendingInvite(null);
  };

  const pendingCount = inbox.filter(r => r.status === "pending").length;

  // Pair profiles 2-per-row
  const pairs: [RTDProfile, RTDProfile?][] = [];
  const available = profiles.filter(p => !ratedIds.has(p.id));
  for (let i = 0; i < available.length; i += 2) {
    pairs.push([available[i], available[i + 1]]);
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 36 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "linear-gradient(160deg,#0a0612 0%,#120818 50%,#0a0612 100%)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: `max(16px,env(safe-area-inset-top,16px)) 16px 10px`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, zIndex: 2,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, cursor: "pointer", color: "white",
            }}
          >←</motion.button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "white", lineHeight: 1 }}>Rate To Date</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>First impression dating</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Coin badge */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCoinShop(true)}
            style={{
              padding: "6px 12px", borderRadius: 50, cursor: "pointer",
              background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)",
              fontSize: 12, fontWeight: 700, color: "#fbbf24",
            }}
          >
            🪙 {balance}
          </motion.button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: "flex", padding: "10px 16px 0", gap: 6, flexShrink: 0,
      }}>
        {(["browse", "inbox"] as const).map(t => (
          <motion.button
            key={t}
            whileTap={{ scale: 0.96 }}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: "10px", borderRadius: 50,
              background: tab === t ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${tab === t ? "rgba(194,24,91,0.5)" : "rgba(255,255,255,0.1)"}`,
              color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: tab === t ? "0 4px 16px rgba(194,24,91,0.4)" : "none",
              transition: "all 0.2s",
              position: "relative",
            }}
          >
            {t === "browse" ? "🔍 Browse" : "💌 My Inbox"}
            {t === "inbox" && pendingCount > 0 && (
              <span style={{
                position: "absolute", top: -4, right: 8,
                width: 18, height: 18, borderRadius: "50%",
                background: "#c2185b", border: "2px solid #0a0612",
                fontSize: 10, fontWeight: 800, color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {pendingCount}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* ── Browse tab: 2-profile grid ── */}
      {tab === "browse" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 100px" }}>
          {pairs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
              You've rated everyone for now — check back soon!
            </div>
          ) : (
            pairs.map((pair, pIdx) => (
              <div key={pIdx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {pair.map((p, i) => p ? (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setRatingProfile(p)}
                    style={{
                      flex: 1, borderRadius: 18, overflow: "hidden",
                      border: "1.5px solid rgba(255,255,255,0.08)",
                      cursor: "pointer", padding: 0, background: "none",
                      position: "relative", aspectRatio: "9/13",
                    }}
                  >
                    {/* Photo */}
                    {p.avatar_url ? (
                      <div style={{
                        position: "absolute", inset: 0,
                        backgroundImage: `url(${p.avatar_url})`,
                        backgroundSize: "cover", backgroundPosition: "center top",
                      }} />
                    ) : (
                      <div style={{
                        position: "absolute", inset: 0,
                        background: `linear-gradient(135deg,hsl(${(pIdx * 2 + i) * 60},40%,15%),hsl(${(pIdx * 2 + i) * 60 + 30},30%,20%))`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 36, color: "rgba(255,255,255,0.2)",
                      }}>👤</div>
                    )}

                    {/* Bottom gradient */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
                    }} />

                    {/* Info */}
                    <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "white", lineHeight: 1 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>
                        {p.age} · {p.city ?? p.country}
                      </div>
                    </div>

                    {/* Rate To Date pill */}
                    <div style={{
                      position: "absolute", top: 8, right: 8,
                      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
                      borderRadius: 20, padding: "3px 8px",
                      fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.8)",
                      letterSpacing: "0.05em", border: "1px solid rgba(255,255,255,0.1)",
                    }}>RATE</div>
                  </motion.button>
                ) : (
                  <div key={`empty-${i}`} style={{ flex: 1 }} />
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Inbox tab ── */}
      {tab === "inbox" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 100px" }}>
          {inbox.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💌</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>
                No impressions yet
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
                When someone rates your profile, you'll see their impression here — blurred until you unlock it.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", padding: "2px 4px", fontWeight: 600 }}>
                {pendingCount} waiting · {inbox.length} total
              </div>
              {inbox.map(report => (
                <InboxCard
                  key={report.id}
                  report={report}
                  unlocked={unlockedIds.has(report.id)}
                  onUnlock={handleUnlock}
                  onInvite={handleInvite}
                  onDecline={handleDecline}
                  coinBalance={balance}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Rate Modal ── */}
      <AnimatePresence>
        {ratingProfile && (
          <RateModal
            key={ratingProfile.id}
            profile={ratingProfile}
            userId={userId}
            onClose={() => setRatingProfile(null)}
            onSubmitted={() => {
              setRatedIds(prev => new Set([...prev, ratingProfile.id]));
              setRatingProfile(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Accept invite modal (User A) ── */}
      <AnimatePresence>
        {pendingInvite && (
          <AcceptModal
            key="accept"
            targetName={pendingInvite.viewer_name}
            targetAvatar={pendingInvite.viewer_avatar}
            balance={balance}
            onAcceptChat={handleAcceptChat}
            onAcceptKey={handleAcceptKey}
            onClose={() => setPendingInvite(null)}
            accepting={accepting}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
