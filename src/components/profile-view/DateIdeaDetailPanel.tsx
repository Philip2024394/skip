import { motion } from "framer-motion";
import { X } from "lucide-react";
import { getDateIdeaDescription } from "@/data/dateIdeaDescriptions";
import { getDateIdeaMetadata } from "@/data/dateIdeaMetadata";

interface DateIdeaDetailPanelProps {
  dateIdea: string;
  imageUrl?: string;
  onClose: () => void;
}

export default function DateIdeaDetailPanel({ dateIdea, imageUrl, onClose }: DateIdeaDetailPanelProps) {
  const description = getDateIdeaDescription(dateIdea);
  const metadata = getDateIdeaMetadata(dateIdea);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-2xl overflow-hidden min-h-0 flex flex-col bg-black/70 backdrop-blur-xl border-2 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-white/5"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 10, right: 10, zIndex: 10,
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "rgba(255,255,255,0.7)",
        }}
        aria-label="Close"
      >
        <X size={14} />
      </button>

      {/* Image header */}
      {imageUrl && (
        <div style={{ position: "relative", height: 180, flexShrink: 0 }}>
          <img
            src={imageUrl}
            alt={dateIdea}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8))",
          }} />
        </div>
      )}

      {/* Content */}
      <div
        className="scrollbar-pink"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px 20px",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(236,72,153,0.4) transparent",
        }}
      >
        {/* Date idea title */}
        <p style={{
          color: "rgba(236,72,153,0.95)",
          fontSize: 13,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: "0 0 12px 0",
          paddingBottom: 10,
          borderBottom: "1.5px solid rgba(236,72,153,0.25)",
        }}>
          {dateIdea}
        </p>

        {/* Description */}
        <p style={{
          color: "rgba(255,255,255,0.90)",
          fontSize: 13,
          lineHeight: 1.7,
          margin: "0 0 16px 0",
          fontWeight: 500,
        }}>
          {description}
        </p>

        {/* Quick Info Section */}
        <div style={{
          background: "rgba(236,72,153,0.08)",
          border: "1px solid rgba(236,72,153,0.2)",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 16,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 15 }}>🏷️</span>
              <div>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 600, letterSpacing: "0.03em" }}>TYPE</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.88)", margin: 0, fontWeight: 700 }}>{metadata.dateType}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 15 }}>⏱️</span>
              <div>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 600, letterSpacing: "0.03em" }}>DURATION</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.88)", margin: 0, fontWeight: 700 }}>{metadata.duration}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 15 }}>💰</span>
              <div>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 600, letterSpacing: "0.03em" }}>COST</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.88)", margin: 0, fontWeight: 700 }}>{metadata.costLevelIDR}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 15 }}>🌅</span>
              <div>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 600, letterSpacing: "0.03em" }}>BEST TIME</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.88)", margin: 0, fontWeight: 700 }}>{metadata.bestTime}</p>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(236,72,153,0.15)" }}>
            <span style={{ fontSize: 15 }}>✨</span>
            <div>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 600, letterSpacing: "0.03em" }}>VIBE</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.88)", margin: 0, fontWeight: 700 }}>{metadata.vibe}</p>
            </div>
          </div>
        </div>

        {/* Why This Place Is Good */}
        <div style={{ marginBottom: 16 }}>
          <p style={{
            fontSize: 10,
            fontWeight: 800,
            color: "rgba(236,72,153,0.95)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: "0 0 8px 0",
          }}>💝 Why This Date Works</p>
          <ul style={{ margin: 0, paddingLeft: 18, listStyle: "none" }}>
            {metadata.whyGoodDate.map((reason, idx) => (
              <li key={idx} style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.78)",
                lineHeight: 1.6,
                marginBottom: 5,
                position: "relative",
                paddingLeft: 14,
              }}>
                <span style={{ position: "absolute", left: 0, color: "rgba(236,72,153,0.7)", fontWeight: 700 }}>•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Conversation Starters */}
        <div style={{ marginBottom: 16 }}>
          <p style={{
            fontSize: 10,
            fontWeight: 800,
            color: "rgba(236,72,153,0.95)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: "0 0 8px 0",
          }}>💬 Conversation Starters</p>
          {metadata.conversationStarters.map((starter, idx) => (
            <p key={idx} style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.6,
              margin: "0 0 6px 0",
              fontStyle: "italic",
              paddingLeft: 10,
              borderLeft: "2.5px solid rgba(236,72,153,0.35)",
            }}>
              "{starter}"
            </p>
          ))}
        </div>

        {/* Suggested Extras */}
        {metadata.suggestedExtras.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{
              fontSize: 10,
              fontWeight: 800,
              color: "rgba(236,72,153,0.95)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin: "0 0 8px 0",
            }}>🎁 Make It Extra Special</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {metadata.suggestedExtras.map((extra, idx) => (
                <div key={idx} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  background: "rgba(168,85,247,0.1)",
                  border: "1px solid rgba(168,85,247,0.25)",
                  borderRadius: 10,
                }}>
                  <span style={{ fontSize: 16 }}>{extra.icon}</span>
                  <p style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.85)",
                    margin: 0,
                    fontWeight: 600,
                    flex: 1,
                  }}>{extra.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Tip */}
        <div style={{
          background: "rgba(168,85,247,0.1)",
          border: "1px solid rgba(168,85,247,0.25)",
          borderRadius: 10,
          padding: "10px 12px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontSize: 14, marginTop: 1 }}>🛡️</span>
            <p style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.65)",
              margin: 0,
              lineHeight: 1.6,
            }}>
              <strong style={{ color: "rgba(168,85,247,0.95)", fontWeight: 700 }}>Safety First:</strong> Always meet in public places for first dates. Use verified professionals from our platform for any services.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
