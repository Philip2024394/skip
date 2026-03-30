import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLogo } from "@/shared/components";
import { useLanguage } from "@/i18n/LanguageContext";

// ── Colour token — matches the name input on the welcome slider ───────────────
const INPUT_BG  = "#c2185b";
const INPUT_BDR = "rgba(255,255,255,0.25)";

// ── Section block — same visual as the name input ─────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: 12,
      background: INPUT_BG,
      border: `1.5px solid ${INPUT_BDR}`,
      borderRadius: 14,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 16px 8px",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        fontSize: 11, fontWeight: 800,
        color: "rgba(255,255,255,0.9)",
        letterSpacing: "0.07em", textTransform: "uppercase",
      }}>
        {title}
      </div>
      <div style={{
        padding: "10px 16px 13px",
        fontSize: 12, color: "rgba(255,255,255,0.78)",
        lineHeight: 1.65,
      }}>
        {children}
      </div>
    </div>
  );
}

// ── TermsAcceptanceDialog ──────────────────────────────────────────────────────

interface TermsAcceptanceDialogProps {
  onAccept: () => void;
}

const TermsAcceptanceDialog = ({ onAccept }: TermsAcceptanceDialogProps) => {
  useLanguage();
  const [agreed, setAgreed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.88)", backdropFilter: "blur(14px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        style={{
          width: "100%", maxWidth: 480,
          maxHeight: "92vh",
          background: "rgba(12,6,20,0.98)",
          border: `1.5px solid rgba(194,24,91,0.4)`,
          borderRadius: 28,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(194,24,91,0.2), 0 24px 48px rgba(0,0,0,0.7)",
        }}
      >

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center",
          padding: "20px 22px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0, position: "relative",
        }}>
          {/* Logo — left */}
          <AppLogo style={{ width: 42, height: 42, objectFit: "contain", flexShrink: 0 }} />

          {/* Title — centred absolutely so logo doesn't push it */}
          <div style={{ position: "absolute", left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "white", letterSpacing: "-0.01em" }}>
              Terms & Conditions
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              Please read before joining 2DateMe
            </div>
          </div>
        </div>

        {/* ── Scrollable terms ────────────────────────────────────────── */}
        <div
          ref={scrollRef}
          style={{
            flex: 1, overflowY: "auto", padding: "16px 16px 8px",
            minHeight: 0,
          }}
        >
          {/* Intro */}
          <div style={{
            background: INPUT_BG,
            border: `1.5px solid ${INPUT_BDR}`,
            borderRadius: 14, padding: "12px 16px",
            fontSize: 13, color: "white", lineHeight: 1.6,
            marginBottom: 12, fontWeight: 500,
          }}>
            Welcome to <strong>2DateMe</strong>. By creating an account you agree to be bound by these Terms. If you do not agree, do not use the Platform.
            <div style={{ marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Effective Date: March 2026</div>
          </div>

          <Section title="1. Nature of the Platform">
            2DateMe is a social meeting platform — <strong>not</strong> a dating agency or matchmaking service. We do not guarantee compatibility, safety, or the outcome of any interaction. We do not verify user profiles, photographs, or personal information.
          </Section>

          <Section title="2. Limitation of Liability">
            2DateMe is not responsible for the accuracy of profiles, interactions between users online or offline, any damages or harm arising from use of the Platform, or the conduct of any user. You use the Platform <strong>entirely at your own risk</strong>. Our total liability shall not exceed amounts you paid in the preceding 12 months.
          </Section>

          <Section title="3. User Profiles & Content">
            You are solely responsible for content you upload. You warrant that all information is accurate and that you will not impersonate any person or create a misleading profile. 2DateMe does not verify identities, ages, or backgrounds.
          </Section>

          <Section title="4. Contact & WhatsApp">
            By providing your WhatsApp number, you consent to its disclosure to mutual matches. WhatsApp is a third-party service — 2DateMe has no control over communications there. You have the right to block any contact who offends or harasses you. Please report such users to us immediately.
          </Section>

          <Section title="5. Prohibited Conduct">
            Strictly prohibited: harassment, hate speech, abusive content, stalking, scamming, fraud, fake profiles, impersonation, solicitation of illegal activities, or any violation of law. Violations result in immediate suspension or permanent ban. These decisions are final.
          </Section>

          <Section title="6. Reporting & Safety">
            Report violations using the in-app feature. In cases of immediate danger, contact local law enforcement directly. 2DateMe will cooperate with law enforcement as required by law.
          </Section>

          <Section title="7. Payments & Refunds">
            Certain features require payment processed via Stripe. All payments are <strong>non-refundable</strong> unless required by consumer protection law. 2DateMe may modify pricing at any time.
          </Section>

          <Section title="8. Privacy & Data">
            Your use is governed by our Privacy Policy. By using the Platform you consent to collection and processing of your personal data. We will not sell your data. Data may be shared with law enforcement if required.
          </Section>

          <Section title="9. Age Requirement">
            You must be at least <strong>18 years of age</strong>. By creating an account you confirm you are 18+. We may terminate any account we believe belongs to a person under 18.
          </Section>

          <Section title="10 – 17. Additional Terms">
            You agree to indemnify 2DateMe against claims arising from your use. All intellectual property belongs to 2DateMe. Either party may terminate your account at any time. The Platform is provided "AS IS". Disputes are governed by binding arbitration. These Terms may be modified with notice. Invalidity of one provision does not affect the rest.
          </Section>

          {/* Scroll-to-bottom prompt */}
          <div style={{
            textAlign: "center", padding: "16px 0 8px",
            fontSize: 11, color: "rgba(255,255,255,0.3)",
          }}>
            ↓ Scroll to review all terms, then accept below
          </div>
        </div>

        {/* ── Footer — always visible ──────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          padding: "14px 18px max(20px,env(safe-area-inset-bottom,20px))",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(8,4,16,0.97)",
        }}>
          {/* Accept row */}
          <button
            onClick={() => setAgreed(a => !a)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 14,
              background: agreed ? "rgba(194,24,91,0.12)" : INPUT_BG,
              border: `1.5px solid ${agreed ? "rgba(194,24,91,0.6)" : INPUT_BDR}`,
              borderRadius: 14, padding: "13px 16px",
              cursor: "pointer", marginBottom: 10,
              transition: "all 0.22s",
              boxShadow: agreed ? "0 0 16px rgba(194,24,91,0.2)" : "none",
            }}
          >
            {/* Tick circle */}
            <div style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              border: `2.5px solid ${agreed ? "#e91e8c" : "rgba(255,255,255,0.45)"}`,
              background: agreed ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.22s",
              boxShadow: agreed ? "0 0 10px rgba(233,30,140,0.5)" : "none",
            }}>
              <AnimatePresence>
                {agreed && (
                  <motion.svg
                    key="tick"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    width="14" height="14" viewBox="0 0 14 14" fill="none"
                  >
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </div>

            {/* Label */}
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "white", lineHeight: 1.2 }}>
                Accept terms & conditions
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                I have read and agree to all terms above
              </div>
            </div>
          </button>

          {/* Grant access button */}
          <motion.button
            whileTap={agreed ? { scale: 0.97 } : {}}
            onClick={() => agreed && onAccept()}
            style={{
              width: "100%", height: 52, borderRadius: 50,
              background: agreed
                ? "linear-gradient(135deg,#c2185b,#e91e8c)"
                : "rgba(255,255,255,0.06)",
              border: agreed ? "none" : "1.5px solid rgba(255,255,255,0.1)",
              color: agreed ? "white" : "rgba(255,255,255,0.3)",
              fontSize: 15, fontWeight: 800,
              cursor: agreed ? "pointer" : "not-allowed",
              letterSpacing: "-0.01em",
              boxShadow: agreed ? "0 6px 28px rgba(194,24,91,0.45)" : "none",
              transition: "all 0.25s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {agreed ? (
              <>
                <span>✓</span>
                <span>Grant me access</span>
              </>
            ) : (
              <span>Accept terms to continue</span>
            )}
          </motion.button>
        </div>

      </motion.div>
    </motion.div>
  );
};

export default TermsAcceptanceDialog;
