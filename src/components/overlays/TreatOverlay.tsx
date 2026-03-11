import { motion, AnimatePresence } from "framer-motion";

interface TreatOverlayProps {
  showTreatPage: any;
  onClose: () => void;
  currentUser: any;
}

export default function TreatOverlay({ showTreatPage, onClose, currentUser }: TreatOverlayProps) {
  if (!showTreatPage) return null;
  const openTreatItem = showTreatPage;
  const setOpenTreatItem = (v: any) => {
    if (v === null) onClose();
  };
  return (
    <>
      {/* ── Treat full-screen themed pages ──────────────────────────────── */}
      <AnimatePresence>
        {openTreatItem && (() => {
          type TreatDef = {
            key: string;
            emoji: string;
            title: string;
            subtitle: string;
            bg: string;
            accent: string;
            accentText: string;
            glow: string;
            services: { icon: string; name: string; desc: string }[];
            cta: string;
          };
          const TREAT_PAGES: TreatDef[] = [
            {
              key: "massage",
              emoji: "💆",
              title: "Massage",
              subtitle: "Melt away stress with a luxurious spa experience",
              bg: "linear-gradient(160deg, #1a0800 0%, #2d1200 40%, #0d0500 100%)",
              accent: "rgba(212,168,83,0.85)",
              accentText: "#D4A853",
              glow: "rgba(212,168,83,0.35)",
              services: [
                { icon: "🕯️", name: "Swedish Massage", desc: "Gentle relaxation for body & mind" },
                { icon: "🪨", name: "Hot Stone", desc: "Deep heat therapy for muscle tension" },
                { icon: "💪", name: "Deep Tissue", desc: "Targets deep muscle knots" },
                { icon: "🌿", name: "Aromatherapy", desc: "Essential oils for total calm" },
              ],
              cta: "🎁 Gift a Massage",
            },
            {
              key: "beautician",
              emoji: "💅",
              title: "Beautician",
              subtitle: "Pamper her with a professional glamour treatment",
              bg: "linear-gradient(160deg, #1a0020 0%, #2d0040 40%, #0d0015 100%)",
              accent: "rgba(255,105,180,0.85)",
              accentText: "#FF69B4",
              glow: "rgba(255,105,180,0.35)",
              services: [
                { icon: "💅", name: "Nail Art", desc: "Gel, acrylic or classic manicure" },
                { icon: "✨", name: "Facial", desc: "Deep cleanse & radiant glow" },
                { icon: "💇", name: "Hair Treatment", desc: "Colour, cut or blowout styling" },
                { icon: "💄", name: "Makeup Session", desc: "Professional glam look" },
              ],
              cta: "🎁 Gift a Beauty Session",
            },
            {
              key: "flowers",
              emoji: "🌸",
              title: "Flowers",
              subtitle: "Send a stunning bouquet straight to her heart",
              bg: "linear-gradient(160deg, #051a05 0%, #0a2d12 40%, #030d05 100%)",
              accent: "rgba(255,160,200,0.85)",
              accentText: "#FF9EC8",
              glow: "rgba(255,160,200,0.35)",
              services: [
                { icon: "🌹", name: "Red Roses", desc: "Classic romance — a timeless choice" },
                { icon: "🌷", name: "Mixed Bouquet", desc: "Colourful seasonal arrangement" },
                { icon: "🌻", name: "Sunflowers", desc: "Bright & cheerful day-maker" },
                { icon: "🪻", name: "Orchids", desc: "Elegant & long-lasting blooms" },
              ],
              cta: "🌸 Send Flowers",
            },
            {
              key: "jewelry",
              emoji: "💎",
              title: "Jewelry",
              subtitle: "A sparkling gift she will treasure forever",
              bg: "linear-gradient(160deg, #000000 0%, #0a0a14 40%, #050508 100%)",
              accent: "rgba(255,215,0,0.85)",
              accentText: "#FFD700",
              glow: "rgba(255,215,0,0.35)",
              services: [
                { icon: "💍", name: "Ring", desc: "Gold, silver or gemstone styles" },
                { icon: "📿", name: "Necklace", desc: "Delicate chain or statement piece" },
                { icon: "🔮", name: "Bracelet", desc: "Charm or bangle collection" },
                { icon: "✨", name: "Earrings", desc: "Studs, hoops or drop earrings" },
              ],
              cta: "💎 Gift Jewelry",
            },
          ];
          const page = TREAT_PAGES.find((p) => p.key === openTreatItem);
          if (!page) return null;
          return (
            <motion.div
              key={openTreatItem}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 999999,
                background: page.bg,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
              }}
            >
              {/* Glow orb behind emoji */}
              <div style={{
                position: "absolute", top: 80, left: "50%", transform: "translateX(-50%)",
                width: 260, height: 260, borderRadius: "50%",
                background: `radial-gradient(circle, ${page.glow} 0%, transparent 70%)`,
                pointerEvents: "none",
              }} />

              {/* Close */}
              <button
                onClick={() => setOpenTreatItem(null)}
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ color: page.accentText, fontSize: 28, fontWeight: 900, textAlign: "center", margin: 0,
                    textShadow: `0 0 24px ${page.glow}` }}
                >
                  {page.title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, textAlign: "center", maxWidth: 280, lineHeight: 1.6, margin: 0 }}
                >
                  {page.subtitle}
                </motion.p>
              </div>

              {/* Service cards */}
              <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 12, position: "relative", zIndex: 1 }}>
                {page.services.map((s, idx) => (
                  <motion.div
                    key={s.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.08 }}
                    style={{
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${page.accent.replace("0.85", "0.25")}`,
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0, marginBottom: 2 }}>{s.name}</p>
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>{s.desc}</p>
                    </div>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: page.accentText,
                      boxShadow: `0 0 8px ${page.accentText}`,
                      flexShrink: 0,
                    }} />
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div style={{ padding: "0 20px 40px", position: "relative", zIndex: 1, marginTop: "auto" }}>
                <motion.button
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
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
          );
        })()}
      </AnimatePresence>
    </>
  );
}
