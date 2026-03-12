import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface TreatOverlayProps {
  showTreatPage: any;
  onClose: () => void;
  currentUser: any;
}

// ── Fingerprint SVG ──────────────────────────────────────────────────────────
const FingerprintIcon = ({ size = 17, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.16-.28-.47-.12-.7.37-.52.8-1 1.28-1.44C6.22 6.1 9.05 5 12 5c2.96 0 5.79 1.1 7.63 2.49.5.41.95.87 1.31 1.38.16.23.1.54-.13.7-.23.16-.54.1-.7-.13-.32-.45-.73-.87-1.18-1.24C17.29 7.01 14.7 6 12 6c-2.71 0-5.29 1.01-7.12 2.2-.48.36-.87.76-1.18 1.21-.09.13-.24.2-.39.21h-.01zm12.94 8.53c-.07 0-.14-.01-.2-.05-.24-.14-.34-.44-.21-.69.22-.45.34-.93.34-1.44 0-.49-.13-.98-.36-1.44l-.01-.02c-.48-.96-1.41-1.61-2.49-1.61-.55 0-1.05.15-1.51.48l-.04.03c-.37.29-.65.66-.83 1.09-.19.44-.28.9-.28 1.47 0 .29-.23.52-.52.52-.29 0-.52-.23-.52-.52 0-.68.12-1.33.36-1.9.25-.6.64-1.12 1.12-1.52.57-.43 1.25-.65 1.99-.65.97 0 1.88.39 2.58 1.09.37.37.65.83.82 1.34.17.51.24 1.02.24 1.57 0 .66-.15 1.31-.44 1.9-.1.18-.28.3-.48.3h-.01zm-7.94-.46c-.11 0-.22-.04-.31-.11-.21-.17-.25-.49-.08-.7.62-.77.93-1.66.93-2.64 0-1.36-.55-2.59-1.56-3.47-.35-.3-.34-.83.02-1.12.35-.28.86-.23 1.14.11 1.24 1.1 1.95 2.65 1.95 4.48 0 1.23-.38 2.38-1.13 3.34-.09.11-.23.16-.36.16zm3.96.27c-.09 0-.18-.02-.26-.08-.22-.15-.27-.46-.13-.69l.01-.01c.65-1.1 1-2.33 1-3.62 0-.49-.06-.97-.16-1.4-.07-.3.1-.59.39-.67.3-.07.59.1.67.39.13.5.2 1.05.2 1.6 0 1.47-.39 2.88-1.14 4.13-.1.21-.31.35-.58.35zm-7.89-.85c-.16 0-.31-.07-.41-.21-.62-.86-.94-1.87-.94-2.92C4.01 11.88 7.86 9 12 9c4.14 0 7.99 2.88 7.99 6.48 0 .99-.29 1.93-.87 2.8-.16.24-.5.3-.73.14-.23-.16-.3-.49-.14-.73.44-.67.69-1.41.69-2.2 0-2.93-3.24-5.43-6.94-5.43-3.7 0-6.94 2.5-6.94 5.43 0 .82.26 1.59.73 2.27.15.23.09.54-.14.7-.08.06-.17.09-.26.09z" />
  </svg>
);

// ── Flip-card image galleries per category ───────────────────────────────────
const FLIP_IMAGES: Record<string, string[]> = {
  massage: [
    "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=320&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=320&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=320&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=320&q=75&auto=format&fit=crop",
  ],
  beautician: [
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=320&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=320&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560066984-138daaa22279?w=320&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=320&q=75&auto=format&fit=crop",
  ],
  flowers: [
    "https://images.unsplash.com/photo-1548198471-89014d55f8d0?w=320&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1487530811015-780f7e3d5c2b?w=320&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490750967-23b94de16e3e?w=320&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1566305977571-5666677c6e98?w=320&q=75&auto=format&fit=crop",
  ],
  jewelry: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=320&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=320&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=320&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=320&q=75&auto=format&fit=crop",
  ],
};

// Massage shows type names; others show numbers
const FLIP_LABELS: Record<string, string[]> = {
  massage:    ["Swedish", "Hot Stone", "Deep Tissue", "Aromatherapy"],
  beautician: ["1", "2", "3", "4"],
  flowers:    ["1", "2", "3", "4"],
  jewelry:    ["1", "2", "3", "4"],
};

// ── Static page data ─────────────────────────────────────────────────────────
type TreatDef = {
  key: string; emoji: string; title: string; subtitle: string;
  bg: string; accent: string; accentText: string; glow: string;
  services: { icon: string; name: string; desc: string }[];
  cta: string;
};

const TREAT_PAGES: TreatDef[] = [
  {
    key: "massage", emoji: "💆", title: "Massage",
    subtitle: "Melt away stress with a luxurious spa experience",
    bg: "linear-gradient(160deg, #1a0800 0%, #2d1200 40%, #0d0500 100%)",
    accent: "rgba(212,168,83,0.85)", accentText: "#D4A853", glow: "rgba(212,168,83,0.35)",
    services: [
      { icon: "🕯️", name: "Swedish Massage", desc: "Gentle relaxation for body & mind" },
      { icon: "🪨",  name: "Hot Stone",        desc: "Deep heat therapy for muscle tension" },
      { icon: "💪",  name: "Deep Tissue",      desc: "Targets deep muscle knots" },
      { icon: "🌿",  name: "Aromatherapy",     desc: "Essential oils for total calm" },
    ],
    cta: "🎁 Gift a Massage",
  },
  {
    key: "beautician", emoji: "💅", title: "Beautician",
    subtitle: "Pamper her with a professional glamour treatment",
    bg: "linear-gradient(160deg, #1a0020 0%, #2d0040 40%, #0d0015 100%)",
    accent: "rgba(255,105,180,0.85)", accentText: "#FF69B4", glow: "rgba(255,105,180,0.35)",
    services: [
      { icon: "💅", name: "Nail Art",        desc: "Gel, acrylic or classic manicure" },
      { icon: "✨", name: "Facial",          desc: "Deep cleanse & radiant glow" },
      { icon: "💇", name: "Hair Treatment",  desc: "Colour, cut or blowout styling" },
      { icon: "💄", name: "Makeup Session",  desc: "Professional glam look" },
    ],
    cta: "🎁 Gift a Beauty Session",
  },
  {
    key: "flowers", emoji: "🌸", title: "Flowers",
    subtitle: "Send a stunning bouquet straight to her heart",
    bg: "linear-gradient(160deg, #051a05 0%, #0a2d12 40%, #030d05 100%)",
    accent: "rgba(255,160,200,0.85)", accentText: "#FF9EC8", glow: "rgba(255,160,200,0.35)",
    services: [
      { icon: "🌹", name: "Red Roses",      desc: "Classic romance — a timeless choice" },
      { icon: "🌷", name: "Mixed Bouquet",  desc: "Colourful seasonal arrangement" },
      { icon: "🌻", name: "Sunflowers",     desc: "Bright & cheerful day-maker" },
      { icon: "🪻", name: "Orchids",        desc: "Elegant & long-lasting blooms" },
    ],
    cta: "🌸 Send Flowers",
  },
  {
    key: "jewelry", emoji: "💎", title: "Jewelry",
    subtitle: "A sparkling gift she will treasure forever",
    bg: "linear-gradient(160deg, #000000 0%, #0a0a14 40%, #050508 100%)",
    accent: "rgba(255,215,0,0.85)", accentText: "#FFD700", glow: "rgba(255,215,0,0.35)",
    services: [
      { icon: "💍", name: "Ring",      desc: "Gold, silver or gemstone styles" },
      { icon: "📿", name: "Necklace", desc: "Delicate chain or statement piece" },
      { icon: "🔮", name: "Bracelet", desc: "Charm or bangle collection" },
      { icon: "✨", name: "Earrings", desc: "Studs, hoops or drop earrings" },
    ],
    cta: "💎 Gift Jewelry",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function TreatOverlay({ showTreatPage, onClose }: TreatOverlayProps) {
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [enlargedImg, setEnlargedImg] = useState<string | null>(null);

  if (!showTreatPage) return null;

  const page = TREAT_PAGES.find((p) => p.key === showTreatPage);
  if (!page) return null;

  const flipImages = FLIP_IMAGES[page.key] ?? [];
  const flipLabels = FLIP_LABELS[page.key] ?? ["1", "2", "3", "4"];

  const accentBorder = page.accent.replace("0.85", "0.28");
  const accentBorderStrong = page.accent.replace("0.85", "0.45");

  return (
    <>
      {/* ── Full-screen page ─────────────────────────────────────────────── */}
      <AnimatePresence>
        <motion.div
          key={showTreatPage}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            position: "fixed", inset: 0, zIndex: 999999,
            background: page.bg, display: "flex",
            flexDirection: "column", overflowY: "auto",
          }}
        >
          {/* Glow orb */}
          <div style={{
            position: "absolute", top: 80, left: "50%", transform: "translateX(-50%)",
            width: 260, height: 260, borderRadius: "50%",
            background: `radial-gradient(circle, ${page.glow} 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          {/* Back button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, left: 16, zIndex: 10,
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white", fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}
          >
            ←
          </button>

          {/* Hero */}
          <div style={{ padding: "64px 24px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
              style={{ fontSize: 72, lineHeight: 1 }}
            >
              {page.emoji}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ color: page.accentText, fontSize: 28, fontWeight: 900, textAlign: "center", margin: 0, textShadow: `0 0 24px ${page.glow}` }}
            >
              {page.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, textAlign: "center", maxWidth: 280, lineHeight: 1.6, margin: 0 }}
            >
              {page.subtitle}
            </motion.p>
          </div>

          {/* Service cards with flip */}
          <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 12, position: "relative", zIndex: 1 }}>
            {page.services.map((s, idx) => {
              const cardKey = `${page.key}-${idx}`;
              const isFlipped = flippedCard === cardKey;

              return (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.08 }}
                >
                  <AnimatePresence mode="wait">
                    {!isFlipped ? (
                      /* ── FRONT ── */
                      <motion.div
                        key="front"
                        initial={{ rotateY: -90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: 90, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        style={{
                          borderRadius: 16,
                          background: "rgba(255,255,255,0.06)",
                          border: `1px solid ${accentBorder}`,
                          padding: "14px 16px",
                          display: "flex", alignItems: "center", gap: 14,
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        <span style={{ fontSize: 28, flexShrink: 0 }}>{s.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0, marginBottom: 2 }}>{s.name}</p>
                          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>{s.desc}</p>
                        </div>
                        {/* Fingerprint flip button */}
                        <button
                          onClick={() => setFlippedCard(cardKey)}
                          title="Flip card"
                          style={{
                            width: 34, height: 34, borderRadius: "50%",
                            background: "rgba(255,255,255,0.1)",
                            border: `1px solid ${accentBorderStrong}`,
                            color: page.accentText, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, backdropFilter: "blur(6px)",
                          }}
                        >
                          <FingerprintIcon size={17} color={page.accentText} />
                        </button>
                      </motion.div>
                    ) : (
                      /* ── BACK ── */
                      <motion.div
                        key="back"
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: -90, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        style={{
                          borderRadius: 16,
                          background: "rgba(255,255,255,0.09)",
                          border: `1px solid ${accentBorderStrong}`,
                          padding: "12px 12px 14px",
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        {/* Back header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <p style={{ color: page.accentText, fontWeight: 800, fontSize: 13, margin: 0 }}>{s.name}</p>
                          <button
                            onClick={() => { setFlippedCard(null); setEnlargedImg(null); }}
                            style={{
                              width: 26, height: 26, borderRadius: "50%",
                              background: "rgba(255,255,255,0.15)",
                              border: "1px solid rgba(255,255,255,0.3)",
                              color: "white", fontSize: 13, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        {/* 2×2 image grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {flipImages.map((imgUrl, imgIdx) => (
                            <div key={imgIdx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                              <button
                                onClick={() => setEnlargedImg(imgUrl)}
                                style={{
                                  width: "100%", aspectRatio: "4/3", borderRadius: 10,
                                  overflow: "hidden",
                                  border: `1px solid ${accentBorder}`,
                                  cursor: "pointer", padding: 0, background: "transparent",
                                  transition: "transform 0.15s",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
                                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                              >
                                <img
                                  src={imgUrl}
                                  alt={flipLabels[imgIdx]}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                  loading="lazy"
                                />
                              </button>
                              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: 700, margin: 0, textAlign: "center", letterSpacing: "0.03em" }}>
                                {flipLabels[imgIdx]}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <div style={{ padding: "0 20px 40px", position: "relative", zIndex: 1, marginTop: "auto" }}>
            <motion.button
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={() => {}}
              style={{
                width: "100%", height: 52, borderRadius: 18,
                background: `linear-gradient(135deg, ${page.accentText}, ${page.accent})`,
                color: page.key === "jewelry" || page.key === "flowers" ? "#000" : "#fff",
                fontWeight: 900, fontSize: 16, border: "none", cursor: "pointer",
                boxShadow: `0 0 32px ${page.glow}`,
              }}
            >
              {page.cta}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Enlarged image overlay (not full screen) ─────────────────────── */}
      <AnimatePresence>
        {enlargedImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEnlargedImg(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 9999999,
              background: "rgba(0,0,0,0.72)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ scale: 0.78, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.78, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{ position: "relative" }}
            >
              <img
                src={enlargedImg}
                alt="Enlarged"
                style={{
                  maxWidth: "78vw", maxHeight: "52vh",
                  borderRadius: 18, objectFit: "cover",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
                  display: "block",
                }}
              />
              <button
                onClick={() => setEnlargedImg(null)}
                style={{
                  position: "absolute", top: -13, right: -13,
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.35)",
                  color: "white", fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
