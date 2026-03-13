import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, ChevronDown, ShieldCheck, AlertCircle, Heart } from "lucide-react";

interface PackageTermsOverlayProps {
  show: boolean;
  onClose: () => void;
  highlightPackage?: string; // e.g. "unlock:single"
}

const GLASS   = "rgba(6,0,18,0.97)";
const RIM     = "rgba(195,60,255,0.38)";
const BLUR    = "blur(20px)";
const PINK    = "#e848c7";
const PURPLE  = "#c060ff";

// ── Accordion section ─────────────────────────────────────────────────────────
function TermsSection({ title, icon, children, defaultOpen = false }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${RIM}`, overflow: "hidden", marginBottom: 8 }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer" }}>
        <span style={{ flexShrink: 0 }}>{icon}</span>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 700, margin: 0, flex: 1, textAlign: "left" }}>{title}</p>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={14} color="rgba(195,60,255,0.65)" strokeWidth={2.5} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 14px 14px", borderTop: `1px solid rgba(195,60,255,0.12)` }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Feature row ───────────────────────────────────────────────────────────────
function FeatureRow({ emoji, name, price, included }: { emoji: string; name: string; price: string; included: string[] }) {
  return (
    <div style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{emoji}</span>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 11, margin: 0, flex: 1 }}>{name}</p>
        <span style={{ background: "rgba(232,72,199,0.12)", border: "1px solid rgba(232,72,199,0.3)", color: PINK, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>{price}</span>
      </div>
      {included.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 3 }}>
          <span style={{ color: PURPLE, fontSize: 10, flexShrink: 0, marginTop: 1 }}>◆</span>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: 0, lineHeight: 1.55 }}>{item}</p>
        </div>
      ))}
    </div>
  );
}

// ── Bullet point ──────────────────────────────────────────────────────────────
function Bullet({ text, highlight = false }: { text: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 7 }}>
      <span style={{ color: highlight ? PINK : PURPLE, fontSize: 10, flexShrink: 0, marginTop: 2 }}>{highlight ? "⚠" : "◆"}</span>
      <p style={{ color: highlight ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.52)", fontSize: 10, margin: 0, lineHeight: 1.6, fontWeight: highlight ? 600 : 400 }}>{text}</p>
    </div>
  );
}

export default function PackageTermsOverlay({ show, onClose }: PackageTermsOverlayProps) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div key="pkg-terms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 9999999, background: "rgba(0,0,0,0.88)", overflowY: "auto" }}>
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          style={{ minHeight: "100vh", background: GLASS, position: "relative", overflowX: "hidden" }}>

          {/* Glow orbs */}
          <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(195,60,255,0.13) 0%, transparent 70%)", pointerEvents: "none" }} />

          {/* Close */}
          <button onClick={onClose} style={{ position: "fixed", top: 16, right: 16, zIndex: 10, width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
            <X size={16} strokeWidth={2} />
          </button>

          <div style={{ maxWidth: 480, margin: "0 auto", padding: "52px 16px 48px" }}>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, rgba(195,60,255,0.2), rgba(232,72,199,0.15))", border: `1.5px solid ${RIM}`, marginBottom: 14 }}>
                <ShieldCheck size={26} color={PURPLE} strokeWidth={2} />
              </motion.div>
              <h1 style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 900, fontSize: 22, margin: 0 }}>
                Terms &amp; Conditions
              </h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "6px 0 0" }}>
                Purchase terms for all 2DateMe.com packages
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {["Non-refundable", "Platform protection", "WhatsApp guarantee"].map((t, i) => (
                  <span key={i} style={{ padding: "3px 9px", borderRadius: 20, background: "rgba(195,60,255,0.1)", border: `1px solid ${RIM}`, color: "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: 700 }}>{t}</span>
                ))}
              </div>
            </div>

            {/* ── IMPORTANT notice ── */}
            <div style={{ borderRadius: 16, background: "rgba(255,165,0,0.07)", border: "1.5px solid rgba(255,165,0,0.3)", padding: "14px 16px", marginBottom: 16, display: "flex", gap: 12 }}>
              <AlertCircle size={18} color="rgba(255,180,50,0.9)" style={{ flexShrink: 0, marginTop: 1 }} strokeWidth={2} />
              <div>
                <p style={{ color: "rgba(255,190,60,0.9)", fontWeight: 800, fontSize: 12, margin: "0 0 5px" }}>Important — Please Read Before Purchase</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, lineHeight: 1.65, margin: 0 }}>
                  All purchases on 2DateMe.com are made on <strong style={{ color: "rgba(255,255,255,0.8)" }}>non-refundable terms</strong> except where explicitly stated. By completing a purchase you confirm that you have read, understood, and agree to these terms in full.
                </p>
              </div>
            </div>

            {/* ── Section 1: What You're Getting ── */}
            <TermsSection title="What Each Package Delivers" icon={<span style={{ fontSize: 15 }}>📦</span>} defaultOpen>
              <div style={{ paddingTop: 12 }}>
                <FeatureRow emoji="💬" name="1 Match Unlock" price="$1.99"
                  included={[
                    "Access to one matched user's WhatsApp number after a mutual match is confirmed.",
                    "Enables direct WhatsApp messaging between both parties.",
                    "Valid indefinitely — does not expire after unlock.",
                  ]} />
                <FeatureRow emoji="💬" name="3 Unlock Pack" price="$4.99"
                  included={[
                    "Credits to unlock WhatsApp numbers for 3 different matches.",
                    "Credits are added to your account and used as you match.",
                    "Best for users actively matching over days or weeks.",
                  ]} />
                <FeatureRow emoji="💬" name="10 Unlock Pack" price="$12.99"
                  included={[
                    "10 unlock credits at the lowest cost-per-connection on the platform.",
                    "Ideal for power users seeking multiple real-world connections.",
                    "Credits do not expire and can be used at any time.",
                  ]} />
                <FeatureRow emoji="⭐" name="Super Like" price="$1.99"
                  included={[
                    "Your profile appears first in the recipient's Likes Me list.",
                    "The recipient receives a notification that you Super Liked them.",
                    "Does not guarantee a match, reply, or connection.",
                  ]} />
                <FeatureRow emoji="🚀" name="Profile Boost" price="$1.99"
                  included={[
                    "Your profile is placed at the top of the swipe stack for 1 hour.",
                    "Expected 5–10× increase in profile views during active boost period.",
                    "Boost activates immediately upon purchase.",
                  ]} />
                <FeatureRow emoji="✅" name="Verified Badge" price="$1.99"
                  included={[
                    "Permanent ✅ badge displayed on your profile.",
                    "Signals identity verification to other users, improving trust.",
                    "Increases match rate and profile ranking in search results.",
                  ]} />
                <FeatureRow emoji="👻" name="Incognito Mode" price="$2.99"
                  included={[
                    "Browse all profiles for 24 hours without appearing in any 'Recently Viewed' list.",
                    "Your profile remains hidden from people you view during the active period.",
                    "Activates immediately upon purchase. 24-hour timer starts at purchase.",
                  ]} />
                <FeatureRow emoji="🌟" name="Spotlight" price="$4.99"
                  included={[
                    "Featured at the top of every user's swipe stack for 24 hours.",
                    "Maximum visibility across the entire active user base during the period.",
                    "Activates immediately. 24-hour timer starts at purchase.",
                  ]} />
                <FeatureRow emoji="👑" name="VIP Monthly" price="$10.99/mo"
                  included={[
                    "Includes 7 WhatsApp unlock credits refreshed each billing cycle.",
                    "Includes 5 Super Like credits refreshed each billing cycle.",
                    "VIP crown badge permanently shown on your profile for duration of subscription.",
                    "Priority placement in the New Profiles discovery list.",
                    "Auto-renews monthly. Cancel anytime before the next billing date.",
                  ]} />
              </div>
            </TermsSection>

            {/* ── Section 2: Refund Policy ── */}
            <TermsSection title="Refund Policy" icon={<span style={{ fontSize: 15 }}>↩️</span>}>
              <div style={{ paddingTop: 12 }}>
                <Bullet text="All purchases are final and non-refundable except in the circumstances described below." highlight />
                <Bullet text="If a WhatsApp number you unlocked is found to be not in service, disconnected, or invalid, contact our support team immediately. We will issue a full refund for that specific connection cost upon verification." />
                <Bullet text="VIP subscription refunds are not provided for partial billing periods. Cancel before your next renewal date to stop future charges." />
                <Bullet text="Boost, Super Like, Spotlight, and Incognito Mode activate immediately upon purchase. No refunds are available once these features have been activated." />
                <Bullet text="Verified Badge purchases are non-refundable once the badge has been applied to your profile." />
                <Bullet text="If a technical error on our platform prevented a feature from activating correctly, contact support with evidence and we will investigate and resolve within 40–72 hours." />
                <Bullet text="Fraudulent chargeback requests will result in permanent account suspension." />
              </div>
            </TermsSection>

            {/* ── Section 3: Connection Expectations ── */}
            <TermsSection title="Connection Expectations" icon={<Heart size={15} color={PINK} strokeWidth={2} />}>
              <div style={{ paddingTop: 12 }}>
                <Bullet text="Purchasing any package does not guarantee that the other user will respond to your messages, accept your connection, or continue communication." highlight />
                <Bullet text="Users may be in a relationship at the time of your connection attempt, may not wish to connect, or may have become inactive on the platform." />
                <Bullet text="Super Likes notify the user of your interest but do not force a match or response. The recipient retains full discretion." />
                <Bullet text="A Profile Boost increases your visibility but does not guarantee matches. Results depend on your profile quality and the active user base at the time." />
                <Bullet text="We strongly recommend reviewing each profile carefully before spending on a connection. The quality of a match is determined by compatibility, not volume of unlocks." />
                <Bullet text="Spotlight and Boost performance varies based on the number of active users during the active period. Peak hours (evenings, weekends) generally yield the best results." />
              </div>
            </TermsSection>

            {/* ── Section 4: Platform Terms ── */}
            <TermsSection title="Platform Use & Account Terms" icon={<ShieldCheck size={14} color={PURPLE} strokeWidth={2} />}>
              <div style={{ paddingTop: 12 }}>
                <Bullet text="2DateMe.com is a connection facilitation platform. We do not guarantee romantic, social, or professional outcomes from any connection made on the platform." />
                <Bullet text="Features purchased are tied to your account and are non-transferable." />
                <Bullet text="Abuse of platform features — including using unlocked numbers to spam, harass, or solicit — will result in immediate permanent suspension without refund." />
                <Bullet text="Packages purchased are for personal, non-commercial use only. Resale or transfer of credits or features is strictly prohibited." />
                <Bullet text="2DateMe.com reserves the right to modify, discontinue, or alter features with reasonable notice. In the event a purchased feature is discontinued, affected users will be credited." />
                <Bullet text="Users must be 18 years or older to purchase any package. By purchasing you confirm that you meet this requirement." />
                <Bullet text="All transactions are processed securely through Stripe. 2DateMe.com does not store payment card details." />
              </div>
            </TermsSection>

            {/* ── Section 5: Our Tips for Success ── */}
            <TermsSection title="Our Tips for Success" icon={<span style={{ fontSize: 15 }}>💡</span>}>
              <div style={{ paddingTop: 12 }}>
                <Bullet text="Study each profile in detail before sending a Super Like or unlocking a WhatsApp number. Look at photos, bio, interests, and lifestyle preferences." />
                <Bullet text="Use a friendly, genuine opening message — reference something specific from their profile to stand out from generic openers." />
                <Bullet text="Use a Boost during peak hours (Friday and Saturday evenings) for maximum impact." />
                <Bullet text="Verified Badge and a complete profile significantly increase your match acceptance rate." />
                <Bullet text="If a number is unresponsive, allow 24–48 hours before concluding non-service, as users may be unavailable temporarily." />
                <Bullet text="Combining VIP membership with Spotlight gives you the highest possible visibility and connection rate on the platform." />
              </div>
            </TermsSection>

            {/* ── Closing ── */}
            <div style={{ borderRadius: 16, background: "rgba(232,72,199,0.05)", border: `1px solid rgba(232,72,199,0.2)`, padding: "14px 16px", marginTop: 16, textAlign: "center" }}>
              <p style={{ color: `${PINK}cc`, fontSize: 10, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
                By making any purchase on 2DateMe.com you agree to these Terms &amp; Conditions in full. For any questions or concerns please contact our support team. We are committed to your experience and will always aim to resolve any issue fairly and promptly. 💖
              </p>
            </div>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: "0.06em" }}>
                ◆ 2DateMe.com · Last updated March 2025
              </p>
            </div>

            <button onClick={onClose}
              style={{ width: "100%", height: 48, borderRadius: 16, marginTop: 16, background: `linear-gradient(135deg, rgba(195,60,255,0.85), rgba(232,72,199,0.85))`, border: "none", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 20px rgba(195,60,255,0.3)" }}>
              I Understand — Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
