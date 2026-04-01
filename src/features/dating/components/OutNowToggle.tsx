import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Clock, X } from "lucide-react";

interface OutNowToggleProps {
  isActive: boolean;
  expiresAt: string | null;
  onActivate: (hours: 1 | 2 | 3) => void;
  onDeactivate: () => void;
  disabled?: boolean;
}

const DURATION_OPTIONS: { hours: 1 | 2 | 3; label: string; sublabel: string }[] = [
  { hours: 1, label: "1 Hour",  sublabel: "Quick meetup window" },
  { hours: 2, label: "2 Hours", sublabel: "Relaxed availability" },
  { hours: 3, label: "3 Hours", sublabel: "Extended window" },
];

function useRemainingTime(expiresAt: string | null): string {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!expiresAt) { setRemaining(""); return; }

    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`);
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

export default function OutNowToggle({
  isActive,
  expiresAt,
  onActivate,
  onDeactivate,
  disabled = false,
}: OutNowToggleProps) {
  const [showSheet, setShowSheet] = useState(false);
  const remainingTime = useRemainingTime(expiresAt);

  const handleRowClick = () => {
    if (disabled) return;
    if (isActive) {
      onDeactivate();
    } else {
      setShowSheet(true);
    }
  };

  const handleDurationPick = (hours: 1 | 2 | 3) => {
    setShowSheet(false);
    onActivate(hours);
  };

  return (
    <>
      {/* Toggle Row */}
      <div
        onClick={handleRowClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderRadius: 12,
          background: isActive
            ? "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.08))"
            : "rgba(255,255,255,0.05)",
          border: isActive ? "1px solid rgba(251,191,36,0.35)" : "1px solid rgba(255,255,255,0.08)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "background 0.25s, border 0.25s",
          userSelect: "none",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: isActive ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Zap
            size={18}
            color={isActive ? "#fbbf24" : "#9ca3af"}
            fill={isActive ? "#fbbf24" : "none"}
          />
        </div>

        {/* Label */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: isActive ? "#fbbf24" : "#f3f4f6", fontWeight: 600, fontSize: 15 }}>
            Out Now
          </div>
          {isActive && remainingTime ? (
            <div style={{ color: "#d1d5db", fontSize: 12, marginTop: 2 }}>
              {remainingTime} · tap to turn off
            </div>
          ) : (
            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
              Let your matches know you're free
            </div>
          )}
        </div>

        {/* Animated toggle pill */}
        <div
          style={{
            width: 46,
            height: 26,
            borderRadius: 13,
            background: isActive ? "#fbbf24" : "rgba(255,255,255,0.12)",
            position: "relative",
            flexShrink: 0,
            transition: "background 0.3s",
          }}
        >
          <motion.div
            animate={{ x: isActive ? 22 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            style={{
              position: "absolute",
              top: 3,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
          />
        </div>
      </div>

      {/* Duration picker bottom sheet */}
      <AnimatePresence>
        {showSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSheet(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                zIndex: 290,
              }}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                background: "#1a1a2e",
                borderRadius: "20px 20px 0 0",
                padding: "0 16px 32px",
                zIndex: 291,
                maxHeight: "80vh",
              }}
            >
              {/* Handle bar */}
              <div
                style={{
                  width: 40,
                  height: 4,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 2,
                  margin: "12px auto 0",
                }}
              />

              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 0 16px",
                }}
              >
                <div>
                  <div style={{ color: "#f3f4f6", fontWeight: 700, fontSize: 18 }}>
                    Go Out Now
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 13, marginTop: 3 }}>
                    Notify mutual matches you're free
                  </div>
                </div>
                <button
                  onClick={() => setShowSheet(false)}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "none",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} color="#9ca3af" />
                </button>
              </div>

              {/* Duration options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {DURATION_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.hours}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleDurationPick(opt.hours)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "rgba(251,191,36,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Clock size={18} color="#fbbf24" />
                    </div>
                    <div>
                      <div style={{ color: "#f3f4f6", fontWeight: 600, fontSize: 15 }}>
                        {opt.label}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                        {opt.sublabel}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
