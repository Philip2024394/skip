import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Heart, Plane, ShieldCheck, ChevronRight, Phone, Search, UserCheck, Star } from "lucide-react";
import { PremiumFeature } from "@/data/premiumFeatures";
import { useUserCurrency } from "@/shared/hooks/useUserCurrency";

const BG_IMAGE = "https://ik.imagekit.io/7grri5v7d/5345354345354345345wettert52345.png";

const C = {
  gold:        "#d4a853",
  goldLight:   "#f0cc7a",
  goldBright:  "#ffe08a",
  goldGlow:    "rgba(212,168,83,0.40)",
  goldBorder:  "rgba(212,168,83,0.45)",
  goldFaint:   "rgba(212,168,83,0.15)",
  white:       "rgba(255,255,255,0.92)",
  whiteFaint:  "rgba(255,255,255,0.55)",
  whiteDim:    "rgba(255,255,255,0.30)",
  glass:       "rgba(255,255,255,0.055)",
  glassMid:    "rgba(255,255,255,0.08)",
  glassStrong: "rgba(255,255,255,0.11)",
};

const CONSULTATION_FEATURE: PremiumFeature = {
  id: "intl_marriage_consult",
  name: "Marriage Consultation",
  emoji: "🌍",
  description: "Direct WhatsApp with a certified international marriage & visa consultant.",
  price: "$19.99",
  priceCents: 1999,
  priceId: import.meta.env.VITE_STRIPE_PRICE_PLUSONE ?? "price_plusone_premium",
  productId: import.meta.env.VITE_STRIPE_PRODUCT_PLUSONE ?? "prod_plusone_premium",
  color: "gold",
  icon: "shield",
  perks: [
    "🌍 Certified international marriage consultant",
    "📋 Full documentation guidance",
    "✈️ Visa application support",
    "💍 Marriage certificate processing",
  ],
};

const STEPS = [
  { icon: FileText,    title: "Legal Registration",      desc: "We prepare and lodge all documentation for official marriage registration in both countries — no paperwork surprises." },
  { icon: Heart,       title: "Marriage Certification",  desc: "Notarised, apostille-stamped certificates fully recognised internationally and by all relevant embassies." },
  { icon: Plane,       title: "Visa & Immigration",      desc: "Complete spousal / fiancé visa management — from document gathering to submission and approval follow-up." },
  { icon: ShieldCheck, title: "Embassy Liaison",         desc: "Direct coordination with embassies and civil authorities. We attend hearings on your behalf where permitted." },
  { icon: Search,      title: "Personal Due Diligence",  desc: "Optional pre-commitment background checks through official law enforcement channels for full confidence." },
];

const WHY_US = [
  "10+ years of international marriage facilitation",
  "Registered agency in 12 countries",
  "Average visa approval time: 6–14 weeks",
  "Multilingual consultants (EN, ID, AR, ZH, JA, KO)",
  "Full refund if application is rejected at our fault",
];

interface Props {
  profile: any;
  onConsult: (feature: PremiumFeature) => void;
}

export default function InternationalMarriagePanel({ profile, onConsult }: Props) {
  const [open, setOpen] = useState(false);
  const { fmt } = useUserCurrency();
  const profileName = profile?.name || "her";

  return (
    <>
      {/* ── Teaser card ───────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="w-full h-full relative overflow-hidden flex items-center gap-3 text-left px-4"
        style={{
          background: "rgba(88,28,135,0.45)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "none",
          cursor: "pointer",
        }}
      >

        {/* Ring icon */}
        <div style={{
          position: "relative", zIndex: 1,
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: C.goldFaint,
          border: `1.5px solid ${C.gold}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 14px ${C.goldGlow}`,
        }}>
          <span style={{ fontSize: 18 }}>💍</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0" style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: C.goldLight, fontWeight: 800, fontSize: 11, letterSpacing: "0.05em", margin: 0 }}>
            INTERNATIONAL MARRIAGE SERVICES
          </p>
          <p style={{ color: C.whiteFaint, fontSize: 10, margin: "2px 0 0", lineHeight: 1.4 }}>
            Registration · Marriage Certificate · Visa Approval
          </p>
        </div>

        <ChevronRight size={15} color={C.gold} style={{ position: "relative", zIndex: 1, flexShrink: 0 }} />
      </button>

      {/* ── Full overlay — portalled to body ─────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.32, ease: [0.32, 0, 0.1, 1] }}
              style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "#000",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch" as any,
                display: "flex", flexDirection: "column",
              }}
            >

              {/* ── Hero header — full image, no crop ───────────────── */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                {/* Full image — natural dimensions, no cropping */}
                <img
                  src={BG_IMAGE}
                  alt=""
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
                {/* Gradient — subtle dark at top for close btn, fades to black at bottom */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.0) 25%, rgba(0,0,0,0.0) 65%, rgba(0,0,0,0.85) 88%, rgba(0,0,0,1) 100%)",
                }} />

                {/* Close */}
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    position: "absolute", top: 16, right: 16, zIndex: 10,
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(0,0,0,0.55)",
                    border: `1px solid ${C.goldBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: C.white,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <X size={17} />
                </button>

                {/* Header text — overlaid near top of image */}
                <div style={{
                  position: "absolute", top: "12%", left: 0, right: 0,
                  padding: "0 22px",
                  textAlign: "center",
                  zIndex: 2,
                }}>
                  <p style={{
                    color: C.goldLight, fontSize: 10, fontWeight: 800,
                    letterSpacing: "0.14em", textTransform: "uppercase",
                    margin: "0 0 6px",
                    textShadow: "0 1px 8px rgba(0,0,0,0.9)",
                  }}>
                    Certified Agency · Est. 2013
                  </p>
                  <h1 style={{
                    color: "#fff", fontSize: 24, fontWeight: 900, lineHeight: 1.15,
                    margin: "0 0 10px",
                    textShadow: "0 2px 20px rgba(0,0,0,0.95)",
                  }}>
                    International Marriage<br />&amp; Visa Services
                  </h1>
                  <div style={{
                    width: 52, height: 2, margin: "0 auto",
                    background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
                  }} />
                </div>
              </div>

              {/* ── Body ────────────────────────────────────────────── */}
              <div style={{ flex: 1, padding: `0 18px calc(120px + env(safe-area-inset-bottom, 0px))`, marginTop: -600 }}>

                {/* Tagline */}
                <p style={{
                  color: C.whiteFaint, fontSize: 13, lineHeight: 1.65,
                  textAlign: "center", margin: "14px 0 16px",
                }}>
                  Your trusted partner from first meeting to official marriage certificate — across borders, across cultures.
                </p>

                {/* Personalised ribbon — glass gold */}
                <div style={{
                  background: C.glassMid,
                  border: `1px solid ${C.goldBorder}`,
                  borderRadius: 16, padding: "13px 15px", marginBottom: 26,
                  display: "flex", alignItems: "center", gap: 11,
                  backdropFilter: "blur(14px)",
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 20px rgba(0,0,0,0.4)`,
                }}>
                  <img
                    src={profile?.avatar_url || profile?.photos?.[0]}
                    alt={profileName}
                    style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      objectFit: "cover",
                      border: `1.5px solid ${C.goldBorder}`,
                      boxShadow: `0 0 10px ${C.goldGlow}`,
                    }}
                  />
                  <p style={{ color: C.whiteFaint, fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                    Interested in <strong style={{ color: C.goldBright }}>{profileName}</strong>? We assist with every legal step to build a future together — regardless of nationality.
                  </p>
                </div>

                {/* ── Services ── */}
                <SectionLabel text="What We Handle For You" />
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
                  {STEPS.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div key={i} style={{
                        background: C.glass,
                        border: `1px solid ${C.goldBorder}`,
                        borderRadius: 16, padding: "13px 14px",
                        display: "flex", gap: 13, alignItems: "flex-start",
                        backdropFilter: "blur(16px)",
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 12px rgba(0,0,0,0.35)`,
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                          background: C.goldFaint,
                          border: `1.5px solid ${C.goldBorder}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: `0 0 10px ${C.goldGlow}`,
                        }}>
                          <Icon size={17} color={C.goldLight} />
                        </div>
                        <div>
                          <p style={{ color: C.white, fontWeight: 700, fontSize: 13, margin: "0 0 3px" }}>{step.title}</p>
                          <p style={{ color: C.whiteDim, fontSize: 11, lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Safety screening — glass gold ── */}
                <SectionLabel text="Partner Safety & Verification" />
                <div style={{
                  background: C.glass,
                  border: `1px solid ${C.goldBorder}`,
                  borderRadius: 16, padding: "15px", marginBottom: 26,
                  backdropFilter: "blur(16px)",
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 12px rgba(0,0,0,0.35)`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                      background: C.goldFaint,
                      border: `1.5px solid ${C.goldBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 0 10px ${C.goldGlow}`,
                    }}>
                      <UserCheck size={16} color={C.goldLight} />
                    </div>
                    <p style={{ color: C.goldLight, fontWeight: 800, fontSize: 13, margin: 0 }}>
                      Personal Due Diligence Report
                    </p>
                  </div>
                  <p style={{ color: C.whiteDim, fontSize: 12, lineHeight: 1.6, margin: "0 0 12px" }}>
                    Before making a lifelong commitment, our agency can conduct a discreet, certified background review — giving you peace of mind and protecting your future.
                  </p>
                  {[
                    { icon: "🔍", label: "Criminal record check",            detail: "Verified through official law enforcement databases in the relevant country." },
                    { icon: "📋", label: "Personal conduct history",         detail: "Review of civil and legal records, including restraining orders or prior disputes." },
                    { icon: "🧪", label: "Substance use history screening",  detail: "Voluntary declaration reviewed against available healthcare and rehabilitation records where legally permissible." },
                    { icon: "🛡️", label: "Identity & document authenticity", detail: "Passport, national ID and civil status documents verified against official registries." },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 10, alignItems: "flex-start",
                      paddingTop: 10,
                      borderTop: `1px solid rgba(212,168,83,0.12)`,
                    }}>
                      <span style={{ fontSize: 14, flexShrink: 0, lineHeight: "20px" }}>{item.icon}</span>
                      <div>
                        <p style={{ color: C.white, fontWeight: 700, fontSize: 12, margin: "0 0 2px" }}>{item.label}</p>
                        <p style={{ color: C.whiteDim, fontSize: 11, margin: 0, lineHeight: 1.4 }}>{item.detail}</p>
                      </div>
                    </div>
                  ))}
                  <div style={{
                    marginTop: 12, padding: "7px 11px",
                    background: C.goldFaint,
                    borderRadius: 8, border: `1px solid rgba(212,168,83,0.20)`,
                  }}>
                    <p style={{ color: "rgba(212,168,83,0.55)", fontSize: 10, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                      All screening requires written consent from both parties and complies with local privacy laws.
                    </p>
                  </div>
                </div>

                {/* ── Process ── */}
                <SectionLabel text="The Process" />
                <div style={{
                  background: C.glass,
                  border: `1px solid ${C.goldBorder}`,
                  borderRadius: 16, padding: "15px", marginBottom: 26,
                  backdropFilter: "blur(16px)",
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 12px rgba(0,0,0,0.35)`,
                }}>
                  {[
                    { step: "01", label: "Free assessment call",   detail: "We review your nationalities and advise on the fastest legal route." },
                    { step: "02", label: "Document collection",    detail: "We provide a personalised checklist and translate where needed." },
                    { step: "03", label: "Official registration",  detail: "We file with civil registries in both countries simultaneously." },
                    { step: "04", label: "Certificate issuance",   detail: "Apostille-stamped certificates delivered digitally and by post." },
                    { step: "05", label: "Visa lodgement",         detail: "Spousal / fiancé visa submitted with full supporting package." },
                    { step: "06", label: "Approval & settlement",  detail: "We monitor your case until the visa is stamped and you're reunited." },
                  ].map((item, i, arr) => (
                    <div key={i} style={{
                      display: "flex", gap: 13, alignItems: "flex-start",
                      paddingBottom: i < arr.length - 1 ? 13 : 0,
                      borderBottom: i < arr.length - 1 ? `1px solid rgba(212,168,83,0.12)` : "none",
                      marginBottom: i < arr.length - 1 ? 13 : 0,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                        background: C.goldFaint,
                        border: `1.5px solid ${C.goldBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: C.goldLight, fontSize: 9, fontWeight: 900,
                        boxShadow: `0 0 8px ${C.goldGlow}`,
                      }}>
                        {item.step}
                      </div>
                      <div>
                        <p style={{ color: C.white, fontWeight: 700, fontSize: 12, margin: "0 0 2px" }}>{item.label}</p>
                        <p style={{ color: C.whiteDim, fontSize: 11, margin: 0, lineHeight: 1.4 }}>{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Why us ── */}
                <SectionLabel text="Why Clients Choose Us" />
                <div style={{
                  background: C.glass,
                  border: `1px solid ${C.goldBorder}`,
                  borderRadius: 16, padding: "13px 15px",
                  backdropFilter: "blur(16px)",
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 12px rgba(0,0,0,0.35)`,
                }}>
                  {WHY_US.map((point, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 9,
                      marginBottom: i < WHY_US.length - 1 ? 9 : 0,
                    }}>
                      <Star size={11} color={C.gold} style={{ flexShrink: 0, marginTop: 3 }} fill={C.gold} />
                      <p style={{ color: C.whiteFaint, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Sticky CTA ──────────────────────────────────────── */}
              <div style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10,
                background: `linear-gradient(to top, #000 0%, rgba(0,0,0,0.97) 65%, transparent 100%)`,
                padding: `14px 18px calc(18px + env(safe-area-inset-bottom, 0px))`,
              }}>
                <button
                  onClick={() => { setOpen(false); onConsult(CONSULTATION_FEATURE); }}
                  style={{
                    width: "100%", height: 54, borderRadius: 28,
                    background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldBright} 50%, ${C.gold} 100%)`,
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                    boxShadow: `0 6px 28px ${C.goldGlow}, 0 0 0 1px rgba(212,168,83,0.3)`,
                    color: "#0a0a0a", fontWeight: 900, fontSize: 14,
                  }}
                >
                  <Phone size={17} />
                  Book Private Consultation — {fmt(1999)}
                </button>
                <p style={{
                  textAlign: "center", color: "rgba(212,168,83,0.4)", fontSize: 9,
                  marginTop: 7, fontWeight: 600, lineHeight: 1.4,
                }}>
                  Unlocks direct WhatsApp with a certified marriage &amp; visa consultant · Confidential
                </p>
              </div>

            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{
      color: "rgba(212,168,83,0.60)", fontSize: 9, fontWeight: 800,
      letterSpacing: "0.10em", textTransform: "uppercase",
      marginBottom: 9,
    }}>
      {text}
    </p>
  );
}
