import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { OutNowSession } from "@/shared/hooks/useOutNow";

interface OutNowCountdownProps {
  session: OutNowSession;
  isActivator: boolean;
  onConfirmMet: () => void;
  onMoveOn: () => void;
}

const LOCK_WINDOW_MS = 10 * 60 * 1000;

function useCountdownMs(targetIso: string | null) {
  const [ms, setMs] = useState(() =>
    targetIso ? Math.max(0, new Date(targetIso).getTime() - Date.now()) : 0
  );

  useEffect(() => {
    if (!targetIso) { setMs(0); return; }
    const tick = () => setMs(Math.max(0, new Date(targetIso).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [targetIso]);

  return ms;
}

function formatMs(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Spinner for button loading states
function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        border: "2px solid rgba(255,255,255,0.3)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

export default function OutNowCountdown({
  session,
  isActivator,
  onConfirmMet,
  onMoveOn,
}: OutNowCountdownProps) {
  const [metLoading, setMetLoading] = useState(false);
  const [moveOnLoading, setMoveOnLoading] = useState(false);

  const lockMs = useCountdownMs(session.lockExpiresAt);
  const isUrgent = lockMs < 2 * 60 * 1000 && lockMs > 0;

  // Progress: 1 → 0 as lock window drains
  const progress = session.lockExpiresAt
    ? Math.min(1, lockMs / LOCK_WINDOW_MS)
    : 0;

  const barColor = isUrgent ? "#ef4444" : "#fbbf24";

  const handleMet = async () => {
    if (metLoading || moveOnLoading) return;
    setMetLoading(true);
    try {
      await onConfirmMet();
    } finally {
      setMetLoading(false);
    }
  };

  const handleMoveOn = async () => {
    if (metLoading || moveOnLoading) return;
    setMoveOnLoading(true);
    try {
      await onMoveOn();
    } finally {
      setMoveOnLoading(false);
    }
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        style={{
          position: "fixed",
          bottom: 80,
          left: 12,
          right: 12,
          zIndex: 170,
          background: "#111827",
          border: `1.5px solid ${isUrgent ? "rgba(239,68,68,0.5)" : "rgba(251,191,36,0.4)"}`,
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: isUrgent
            ? "0 0 20px rgba(239,68,68,0.25)"
            : "0 0 20px rgba(251,191,36,0.18)",
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", position: "relative" }}>
          <motion.div
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.9, ease: "linear" }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              background: barColor,
              transition: `background 0.5s`,
            }}
          />
        </div>

        <div style={{ padding: "12px 14px 14px" }}>
          {/* Profile row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            {session.avatar ? (
              <img
                src={session.avatar}
                alt={session.name}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${barColor}`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(251,191,36,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "#fbbf24",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                {session.name.charAt(0)}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#f3f4f6", fontWeight: 700, fontSize: 15 }}>
                {session.name}
              </div>
              <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
                {session.distanceBand} away
              </div>
            </div>

            {/* Countdown */}
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  color: isUrgent ? "#ef4444" : "#fbbf24",
                  fontWeight: 800,
                  fontSize: 22,
                  fontVariantNumeric: "tabular-nums",
                  transition: "color 0.5s",
                  lineHeight: 1,
                }}
              >
                {formatMs(lockMs)}
              </div>
              <div style={{ color: "#6b7280", fontSize: 11, marginTop: 3 }}>
                remaining
              </div>
            </div>
          </div>

          {/* WhatsApp button for buyer (User B) */}
          {!isActivator && session.contactNumber && (
            <a
              href={`https://wa.me/${session.contactNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "11px 0",
                borderRadius: 11,
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
                color: "#4ade80",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                marginBottom: 10,
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="#4ade80">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Open WhatsApp
            </a>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleMet}
              disabled={metLoading || moveOnLoading}
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 11,
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
                color: "#4ade80",
                fontWeight: 700,
                fontSize: 13,
                cursor: metLoading || moveOnLoading ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {metLoading ? <Spinner /> : "We Met! +25🪙"}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleMoveOn}
              disabled={metLoading || moveOnLoading}
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 11,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#f87171",
                fontWeight: 700,
                fontSize: 13,
                cursor: metLoading || moveOnLoading ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {moveOnLoading ? <Spinner /> : "Move On"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
