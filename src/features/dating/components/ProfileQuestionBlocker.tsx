import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReceivedQuestion } from "../hooks/useProfileQuestions";

// ── Floating hearts (same system as MatchCelebrationOverlay) ──────────────────
const HEART_EMOJIS = ["💕", "💗", "💓", "💞", "🌸", "✨", "💫", "🌺"];
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  emoji: HEART_EMOJIS[i % HEART_EMOJIS.length],
  x: 4 + (i * 6.8) % 92,
  delay: (i * 0.41) % 3.2,
  duration: 5 + (i * 0.37) % 4,
  size: 14 + (i * 3) % 16,
}));

function HeartParticles() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute",
            bottom: -30,
            left: `${p.x}%`,
            fontSize: p.size,
            opacity: 0.35,
            userSelect: "none",
          }}
          animate={{ y: [0, -420], opacity: [0, 0.35, 0.35, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface ProfileQuestionBlockerProps {
  question: ReceivedQuestion;
  onAnswer: (questionId: string, answer: string) => void;
}

export default function ProfileQuestionBlocker({ question, onAnswer }: ProfileQuestionBlockerProps) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  const handleSubmit = () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      setDone(true);
      setTimeout(() => onAnswer(question.id, answer.trim()), 900);
    }, 600);
  };

  const canSubmit = answer.trim().length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(8,8,12,0.97)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 3,
        background: "linear-gradient(90deg, #ec4899, #a855f7, #ec4899)",
        backgroundSize: "200% 100%",
      }} />

      {/* Radial glow */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(236,72,153,0.18) 0%, rgba(168,85,247,0.10) 50%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <HeartParticles />

      {/* Content card */}
      <motion.div
        initial={{ scale: 0.88, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 22 }}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "rgba(8,8,12,0.88)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "28px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "16px 0" }}
            >
              <div style={{ fontSize: 52, marginBottom: 12 }}>💕</div>
              <p style={{
                fontSize: 20,
                fontWeight: 800,
                background: "linear-gradient(135deg, #f472b6, #ec4899, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: "0 0 8px",
              }}>Answer sent!</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
                Your profile has been updated
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Lock icon header */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💌</div>
                <p style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(236,72,153,0.8)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  margin: "0 0 6px",
                }}>Someone wants to know you better</p>
                <p style={{
                  fontSize: 18,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #f472b6, #ec4899, #a855f7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  margin: 0,
                  lineHeight: 1.3,
                }}>
                  {question.fromName} is curious
                </p>
              </div>

              {/* The question */}
              <div style={{
                background: "rgba(236,72,153,0.08)",
                border: "1px solid rgba(236,72,153,0.2)",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 20,
              }}>
                <p style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(236,72,153,0.7)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  margin: "0 0 6px",
                }}>
                  {question.fieldLabel}
                </p>
                <p style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.92)",
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {question.question}
                </p>
              </div>

              {/* Answer input */}
              <textarea
                ref={inputRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={3}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  color: "white",
                  fontSize: 14,
                  fontFamily: "inherit",
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: 16,
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(236,72,153,0.5)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; }}
              />

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 12,
                  border: "none",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  background: canSubmit
                    ? "linear-gradient(135deg, #ec4899, #a855f7)"
                    : "rgba(255,255,255,0.08)",
                  color: canSubmit ? "white" : "rgba(255,255,255,0.3)",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  transition: "all 0.2s",
                }}
              >
                {submitting ? "Sending..." : "Answer & Continue 💕"}
              </button>

              {/* Lock message */}
              <p style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
                textAlign: "center",
                margin: "12px 0 0",
              }}>
                Answer required to continue using the app
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
