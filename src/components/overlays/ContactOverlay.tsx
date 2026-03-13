import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { Send, ChevronDown, X, Sparkles, Clock, CheckCircle2, Users, MessageSquare, ChevronRight } from "lucide-react";

interface ContactOverlayProps {
  show: boolean;
  onClose: () => void;
  currentUser?: any;
}

// ── FAQ Database ──────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: "How do I unlock WhatsApp numbers?",           a: "Purchase any Unlock pack from the Unlock tab. After payment you receive the WhatsApp contacts instantly. 1 Unlock = $1.99, 3 Pack = $4.99, or 10 Pack = $12.99.",          tags: ["unlock","whatsapp","contact","number"] },
  { q: "How do Treat services work?",                  a: "Treat services let you gift a massage, beautician session, flowers, or jewelry to someone special in Yogyakarta. Tap a treat card, unlock the provider's WhatsApp, and coordinate directly.",  tags: ["treat","massage","flowers","gift","beautician","jewelry"] },
  { q: "How do I request a refund?",                   a: "Contact us immediately if a service was paid for but not delivered. We review all refund requests within 40–72 hours. Include your ticket number and payment screenshot.",        tags: ["refund","money","payment","charge"] },
  { q: "How do I cancel my VIP subscription?",         a: "Go to your profile → Settings → Manage Subscription → Cancel. VIP access continues until the end of the billing period. No partial refunds on subscription periods.", tags: ["cancel","subscription","vip","billing"] },
  { q: "What does VIP membership include?",            a: "VIP ($10.99/mo) includes 7 WhatsApp unlocks, 5 Super Likes, a VIP crown badge, and priority placement in the New Profiles list — saving 54% vs buying separately.", tags: ["vip","membership","crown","premium"] },
  { q: "What is a Super Like?",                        a: "A Super Like (⭐) places your profile first in the recipient's Likes Me list and sends them a notification. They see your profile highlighted in gold.",  tags: ["super like","star","like","notification"] },
  { q: "What is a Profile Boost?",                     a: "A Boost (🚀) puts your profile at the top of everyone's swipe stack for 1 hour, giving you 5–10× more views. Best used on Friday or Saturday evenings.",  tags: ["boost","views","visibility","swipe"] },
  { q: "What is Incognito Mode?",                      a: "Incognito (👻) lets you browse all profiles for 24 hours without appearing in anyone's 'Recently Viewed' list. Nobody knows you visited.",  tags: ["incognito","invisible","privacy","ghost"] },
  { q: "How do I delete my account?",                  a: "Go to Profile → Settings → Account → Delete Account. This permanently removes your profile, photos, matches, and payment history. This action cannot be undone.", tags: ["delete","account","remove","close"] },
  { q: "Why am I not getting matches?",                a: "Try boosting your profile with a Boost, complete your bio and add clear photos, and make sure your distance and age filters aren't too narrow. Activity also plays a role — log in daily.", tags: ["match","matches","likes","visibility"] },
  { q: "Is my data and personal information safe?",    a: "Yes. We use end-to-end encryption for all messages. Your phone number is never shared without your consent. Read our Privacy Policy for the full data handling details.", tags: ["safe","security","data","privacy","personal"] },
  { q: "What payment methods are accepted?",           a: "We accept all major credit and debit cards (Visa, Mastercard, Amex) and Apple Pay / Google Pay. All payments are processed securely via Stripe.", tags: ["payment","card","credit","pay","stripe"] },
  { q: "How do I report a scam or fake profile?",      a: "Tap the flag (🚩) icon on any profile card to report it. Choose the reason from the list. Our moderation team reviews all reports within 24 hours.", tags: ["scam","fake","report","fraud","abuse"] },
  { q: "How do I edit my profile?",                    a: "Tap your avatar in the top-right of the home screen → Edit Profile. You can update photos, bio, age, city, and lifestyle preferences at any time.",   tags: ["edit","profile","photo","bio","update"] },
  { q: "Why was my photo rejected?",                   a: "Photos must show a clear face, must not include explicit content, and must not include other people's faces without consent. Sunglasses and group photos are not accepted as your primary photo.", tags: ["photo","rejected","image","picture"] },
  { q: "How do I set location / distance filters?",    a: "From the home screen tap the filter icon (top right) → Location. You can set a country, city, or allow GPS-based proximity matching.", tags: ["location","distance","city","filter","near"] },
  { q: "How do I contact a service provider?",         a: "Unlock their profile from the Treat section ($1.99 for 5 contacts). Once unlocked, their WhatsApp number appears and you can message them directly to arrange the service.", tags: ["contact","provider","service","whatsapp","arrange"] },
  { q: "How long does a treat order take?",            a: "Service providers aim to respond within a few hours. Delivery or visit times depend on your location and provider availability. Always confirm estimated arrival via WhatsApp.", tags: ["order","delivery","time","how long","treat"] },
  { q: "What is the Spotlight feature?",               a: "Spotlight (🌟) features your profile at the very top of everyone's swipe stack for 24 hours — maximum visibility across the entire platform.", tags: ["spotlight","featured","visibility","top"] },
  { q: "How do I get a Verified Badge?",               a: "Purchase the Verified Badge (✅ $1.99) from the Unlock tab. It confirms your identity, boosts your ranking in search, and increases trust with other users.", tags: ["verified","badge","trust","identity"] },
];

// ── Contact categories ────────────────────────────────────────────────────────
const CONTACT_REASONS = [
  { value: "",              label: "Select a reason for contact",         icon: "" },
  { value: "general",       label: "💌  General Inquiry",                  icon: "💌" },
  { value: "billing",       label: "💳  Billing & Payments",               icon: "💳" },
  { value: "account",       label: "🔐  Account Issues",                   icon: "🔐" },
  { value: "refund",        label: "↩️  Refund Request",                    icon: "↩️" },
  { value: "report",        label: "🚩  Report a User or Provider",         icon: "🚩" },
  { value: "safety",        label: "🛡️  Safety & Security",                 icon: "🛡️" },
  { value: "technical",     label: "🔧  Technical Support",                 icon: "🔧" },
  { value: "treat",         label: "🎁  Treat Services",                    icon: "🎁" },
  { value: "membership",    label: "👑  Membership & VIP",                  icon: "👑" },
  { value: "partnership",   label: "🤝  Partnership Inquiry",               icon: "🤝" },
  { value: "other",         label: "❓  Other",                             icon: "❓" },
];

// ── Animated queue counter ────────────────────────────────────────────────────
function QueueCounter({ targetQueue }: { targetQueue: number }) {
  const [count, setCount] = useState(60);
  const [done, setDone]   = useState(false);

  useEffect(() => {
    const start     = 60;
    const end       = targetQueue;
    const duration  = 3200;
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(frame);
      else setDone(true);
    };
    requestAnimationFrame(frame);
  }, [targetQueue]);

  return (
    <div style={{ textAlign: "center" }}>
      <motion.p
        key={count}
        style={{ color: "#fff", fontWeight: 900, fontSize: 52, margin: 0, lineHeight: 1, fontVariantNumeric: "tabular-nums", background: "linear-gradient(135deg,#e070ff,#ff70c8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
      >
        {count.toLocaleString()}
      </motion.p>
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "4px 0 0", letterSpacing: "0.05em" }}>
        {done ? "users currently in queue" : "counting queue position…"}
      </p>
    </div>
  );
}

// ── FAQ accordion item ────────────────────────────────────────────────────────
function FAQItem({ item }: { item: typeof FAQ_ITEMS[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(195,60,255,0.2)", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: "transparent", border: "none", cursor: "pointer", gap: 10 }}>
        <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, fontWeight: 600, margin: 0, textAlign: "left", lineHeight: 1.4 }}>{item.q}</p>
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }} style={{ flexShrink: 0 }}>
          <ChevronRight size={14} color="rgba(195,60,255,0.7)" strokeWidth={2.5} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 14px 12px", borderTop: "1px solid rgba(195,60,255,0.12)" }}>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, lineHeight: 1.65, margin: "10px 0 0" }}>{item.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ContactOverlay ───────────────────────────────────────────────────────
export default function ContactOverlay({ show, onClose, currentUser }: ContactOverlayProps) {
  const [step,        setStep]        = useState<"form" | "success">("form");
  const [reason,      setReason]      = useState("");
  const [name,        setName]        = useState(currentUser?.name || currentUser?.user_metadata?.name || "");
  const [email,       setEmail]       = useState(currentUser?.email || "");
  const [message,     setMessage]     = useState("");
  const [suggestions, setSuggestions] = useState<typeof FAQ_ITEMS>([]);
  const [ticketNum,   setTicketNum]   = useState("");
  const [queuePos,    setQueuePos]    = useState(687);
  const [faqSearch,   setFaqSearch]   = useState("");
  const [sending,     setSending]     = useState(false);
  const msgRef = useRef<HTMLTextAreaElement>(null);

  // Update suggestions as user types
  useEffect(() => {
    const q = message.trim().toLowerCase();
    if (q.length < 2) { setSuggestions([]); return; }
    const matches = FAQ_ITEMS.filter(
      (f) => f.tags.some((t) => t.includes(q)) || f.q.toLowerCase().includes(q)
    ).slice(0, 3);
    setSuggestions(matches);
  }, [message]);

  const filteredFAQ = faqSearch.trim().length > 1
    ? FAQ_ITEMS.filter((f) => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.tags.some((t) => t.includes(faqSearch.toLowerCase())))
    : FAQ_ITEMS;

  const handleSubmit = useCallback(() => {
    if (!reason || !message.trim()) return;
    setSending(true);
    // Simulate API call
    setTimeout(() => {
      const ticket = `2DM-${Math.floor(100000 + Math.random() * 900000)}`;
      const queue  = Math.floor(640 + Math.random() * 80);
      setTicketNum(ticket);
      setQueuePos(queue);
      setSending(false);
      setStep("success");
    }, 1200);
  }, [reason, message]);

  const resetForm = () => {
    setStep("form");
    setReason("");
    setMessage("");
    setSuggestions([]);
    setTicketNum("");
  };

  if (!show) return null;

  // ── Shared glass vars ──────────────────────────────────────────────────────
  const gBg   = "rgba(6,0,18,0.97)";
  const gRim  = "rgba(195,60,255,0.40)";
  const gBlur = "blur(24px)";
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 12,
    background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(195,60,255,0.22)",
    color: "#fff", fontSize: 12, outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.18s",
  };

  return (
    <AnimatePresence>
      <motion.div
        key="contact-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 9999998, background: "rgba(0,0,0,0.85)", overflowY: "auto" }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ minHeight: "100vh", background: gBg, position: "relative", overflowX: "hidden" }}
        >
          {/* ── Decorative glow orbs ── */}
          <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(195,60,255,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 200, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,72,199,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

          {/* ── Close button ── */}
          <button onClick={onClose}
            style={{ position: "fixed", top: 16, right: 16, zIndex: 10, width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
            <X size={16} strokeWidth={2} />
          </button>

          <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 48px" }}>

            {/* ── Header ── */}
            <div style={{ paddingTop: 52, paddingBottom: 28, textAlign: "center" }}>
              {/* Diamond logo mark */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, rgba(195,60,255,0.25), rgba(232,72,199,0.15))", border: "1.5px solid rgba(195,60,255,0.4)", marginBottom: 16 }}
              >
                <span style={{ fontSize: 28 }}>💎</span>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                style={{ background: "linear-gradient(135deg,#e8a0ff,#ff80d0,#c060ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 900, fontSize: 24, margin: 0, letterSpacing: "-0.3px" }}>
                2DateMe Support
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "6px 0 0" }}>
                Premium dating support · Diamond standard service
              </motion.p>
              {/* Response time pills */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {[
                  { icon: <Clock size={10} />, text: "40–72 hr response" },
                  { icon: <Sparkles size={10} />, text: "Priority support" },
                  { icon: <Users size={10} />, text: "Live queue system" },
                ].map((p, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: "rgba(195,60,255,0.1)", border: "1px solid rgba(195,60,255,0.25)", color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: 700, letterSpacing: "0.04em" }}>
                    {p.icon}{p.text}
                  </span>
                ))}
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>

                  {/* ── Form card ── */}
                  <div style={{ borderRadius: 22, background: "rgba(255,255,255,0.03)", border: `1.5px solid ${gRim}`, backdropFilter: gBlur, padding: "20px 18px", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                      <MessageSquare size={15} color="#c060ff" strokeWidth={2} />
                      <p style={{ color: "rgba(255,255,255,0.8)", fontWeight: 800, fontSize: 14, margin: 0 }}>Send us a Message</p>
                    </div>

                    {/* Reason dropdown */}
                    <div style={{ marginBottom: 12, position: "relative" }}>
                      <label style={{ color: "rgba(255,255,255,0.38)", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Reason for Contact</label>
                      <div style={{ position: "relative" }}>
                        <select value={reason} onChange={(e) => setReason(e.target.value)}
                          style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none", paddingRight: 36, background: reason ? "rgba(195,60,255,0.08)" : "rgba(255,255,255,0.05)", borderColor: reason ? "rgba(195,60,255,0.45)" : "rgba(195,60,255,0.22)", cursor: "pointer" }}>
                          {CONTACT_REASONS.map((r) => (
                            <option key={r.value} value={r.value} style={{ background: "#0a0018", color: r.value ? "#fff" : "rgba(255,255,255,0.35)" }}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} color="rgba(195,60,255,0.6)" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      </div>
                    </div>

                    {/* Name */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ color: "rgba(255,255,255,0.38)", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Your Name</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
                        style={inputStyle} />
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ color: "rgba(255,255,255,0.38)", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Email or Phone</label>
                      <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com or +62..."
                        style={inputStyle} />
                    </div>

                    {/* Message + FAQ suggestions */}
                    <div style={{ marginBottom: 4 }}>
                      <label style={{ color: "rgba(255,255,255,0.38)", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>How Can We Help?</label>
                      <textarea ref={msgRef} value={message} onChange={(e) => setMessage(e.target.value)}
                        placeholder="Describe your issue or question… (suggestions will appear as you type)"
                        rows={4}
                        style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
                    </div>

                    {/* FAQ suggestion chips */}
                    <AnimatePresence>
                      {suggestions.length > 0 && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                          style={{ overflow: "hidden", marginBottom: 12 }}>
                          <p style={{ color: "rgba(195,60,255,0.7)", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", margin: "6px 0 7px" }}>
                            ✦ Related FAQ — tap to view answer
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {suggestions.map((s, i) => (
                              <motion.button key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                onClick={() => setMessage(s.q)}
                                style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", borderRadius: 10, background: "rgba(195,60,255,0.08)", border: "1px solid rgba(195,60,255,0.25)", cursor: "pointer", textAlign: "left" }}>
                                <Sparkles size={11} color="#c060ff" style={{ flexShrink: 0, marginTop: 1 }} />
                                <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 10.5, margin: 0, lineHeight: 1.45 }}>{s.q}</p>
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit button */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSubmit}
                      disabled={!reason || !message.trim() || sending}
                      style={{ width: "100%", height: 50, borderRadius: 16, background: (reason && message.trim() && !sending) ? "linear-gradient(135deg, rgba(195,60,255,0.9), rgba(232,72,199,0.9))" : "rgba(255,255,255,0.06)", border: "none", color: (reason && message.trim()) ? "#fff" : "rgba(255,255,255,0.22)", fontWeight: 800, fontSize: 13, cursor: (reason && message.trim() && !sending) ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: (reason && message.trim()) ? "0 4px 24px rgba(195,60,255,0.35)" : "none", transition: "all 0.2s", marginTop: 4 }}
                    >
                      {sending ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                      ) : (
                        <><Send size={14} strokeWidth={2.5} />Send Message</>
                      )}
                    </motion.button>
                  </div>

                  {/* ── Live queue indicator ── */}
                  <div style={{ borderRadius: 18, background: "rgba(255,255,255,0.02)", border: `1px solid rgba(195,60,255,0.2)`, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(195,60,255,0.1)", border: "1px solid rgba(195,60,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Users size={17} color="#c060ff" strokeWidth={2} />
                    </div>
                    <div>
                      <p style={{ color: "rgba(255,255,255,0.75)", fontWeight: 700, fontSize: 12, margin: 0 }}>Support Queue</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "2px 0 0" }}>
                        Average wait · <span style={{ color: "#c060ff", fontWeight: 700 }}>40–72 hours</span>
                      </p>
                    </div>
                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                      <p style={{ color: "#c060ff", fontWeight: 900, fontSize: 20, margin: 0 }}>687</p>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, margin: 0 }}>in queue</p>
                    </div>
                  </div>

                  {/* ── FAQ Section ── */}
                  <div style={{ borderRadius: 22, background: "rgba(255,255,255,0.02)", border: `1.5px solid ${gRim}`, backdropFilter: gBlur, padding: "18px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <Sparkles size={14} color="#c060ff" strokeWidth={2} />
                      <p style={{ color: "rgba(255,255,255,0.8)", fontWeight: 800, fontSize: 14, margin: 0 }}>Frequently Asked Questions</p>
                    </div>

                    {/* FAQ search */}
                    <div style={{ position: "relative", marginBottom: 12 }}>
                      <input type="text" value={faqSearch} onChange={(e) => setFaqSearch(e.target.value)}
                        placeholder="Search FAQ…"
                        style={{ ...inputStyle, paddingLeft: 34 }} />
                      <Sparkles size={12} color="rgba(195,60,255,0.5)" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {filteredFAQ.slice(0, 12).map((item, i) => <FAQItem key={i} item={item} />)}
                    </div>
                  </div>

                </motion.div>
              ) : (
                /* ── Success / ticket view ── */
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 280, damping: 26 }}>
                  {/* Success card */}
                  <div style={{ borderRadius: 24, background: "rgba(255,255,255,0.03)", border: `1.5px solid rgba(195,60,255,0.45)`, padding: "28px 20px 24px", marginBottom: 16, textAlign: "center" }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
                      style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, rgba(195,60,255,0.25), rgba(100,200,100,0.2))", border: "1.5px solid rgba(100,220,100,0.5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <CheckCircle2 size={28} color="#4ade80" strokeWidth={2} />
                    </motion.div>
                    <h2 style={{ color: "#fff", fontWeight: 900, fontSize: 20, margin: "0 0 6px" }}>Message Received</h2>
                    <p style={{ color: "rgba(255,255,255,0.48)", fontSize: 12, margin: "0 0 20px", lineHeight: 1.6 }}>
                      Your support request has been submitted successfully. Our team will review and respond within 40–72 hours.
                    </p>

                    {/* Ticket number */}
                    <div style={{ background: "rgba(195,60,255,0.1)", border: "1.5px solid rgba(195,60,255,0.4)", borderRadius: 14, padding: "12px 16px", marginBottom: 20 }}>
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>Your Ticket Number</p>
                      <p style={{ color: "#e070ff", fontWeight: 900, fontSize: 22, margin: 0, letterSpacing: "0.04em" }}>#{ticketNum}</p>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 9.5, margin: "4px 0 0" }}>Save this number to track your request</p>
                    </div>

                    {/* Queue animation */}
                    <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(195,60,255,0.2)", borderRadius: 16, padding: "16px" }}>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>
                        ◆ Queue Line Position
                      </p>
                      <QueueCounter targetQueue={queuePos} />

                      {/* Animated queue bar */}
                      <div style={{ marginTop: 14, background: "rgba(255,255,255,0.06)", borderRadius: 100, height: 6, overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "88%" }}
                          transition={{ duration: 3.2, ease: "easeOut" }}
                          style={{ height: "100%", background: "linear-gradient(90deg, #c060ff, #ff70c8)", borderRadius: 100 }}
                        />
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: "8px 0 0" }}>
                        Estimated response: <span style={{ color: "#c060ff", fontWeight: 700 }}>40–72 hours</span>
                      </p>
                    </div>
                  </div>

                  {/* Response time card */}
                  <div style={{ borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(195,60,255,0.2)", padding: "14px 16px", marginBottom: 16 }}>
                    {[
                      { icon: "📧", text: "You will receive a reply at: " + (email || "your registered email") },
                      { icon: "⏱️", text: "Expected response time: 40–72 business hours" },
                      { icon: "🎫", text: `Reference your ticket #${ticketNum} in any follow-up` },
                    ].map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < 2 ? 8 : 0 }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>{r.icon}</span>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10.5, margin: 0, lineHeight: 1.5 }}>{r.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={resetForm}
                      style={{ flex: 1, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      New Request
                    </button>
                    <button onClick={onClose}
                      style={{ flex: 1, height: 44, borderRadius: 14, background: "linear-gradient(135deg, rgba(195,60,255,0.85), rgba(232,72,199,0.85))", border: "none", color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer", boxShadow: "0 4px 16px rgba(195,60,255,0.3)" }}>
                      Done
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Bottom brand ── */}
            <div style={{ textAlign: "center", marginTop: 32, paddingBottom: 16 }}>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 9.5, letterSpacing: "0.06em" }}>
                ◆ 2DateMe.com · Premium Dating Platform · All rights reserved
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
