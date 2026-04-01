import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Shield, Bell, Zap } from "lucide-react";
import type { OutNowSession } from "@/shared/hooks/useOutNow";

interface OutNowOverlayProps {
  session: OutNowSession;
  currentUserId: string;
  onPurchase: () => Promise<{ url?: string; contactNumber?: string; locked?: boolean; free?: boolean }>;
  onDismiss: () => void;
  onJoinWaitlist: () => void;
  coinBalance: number;
}

// ── Countdown helpers ─────────────────────────────────────────────────────────
function useCountdown(targetIso: string | null): { total: number; display: string } {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!targetIso) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, new Date(targetIso).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [targetIso]);

  const totalMs = targetIso ? new Date(targetIso).getTime() - Date.now() : 0;
  const clampedTotal = Math.max(0, totalMs);
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const display = `${m}m ${s.toString().padStart(2, "0")}s`;

  return { total: remaining, display };
}

// ── Circular countdown ring (SVG) ─────────────────────────────────────────────
const RING_R = 44;
const RING_CIRCUM = 2 * Math.PI * RING_R;
const LOCK_WINDOW_MS = 10 * 60 * 1000;

function CountdownRing({ lockExpiresAt }: { lockExpiresAt: string }) {
  const { total, display } = useCountdown(lockExpiresAt);
  const fraction = Math.min(1, total / LOCK_WINDOW_MS);
  const dashOffset = RING_CIRCUM * (1 - fraction);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <svg width={106} height={106} viewBox="0 0 106 106">
        {/* Track */}
        <circle
          cx={53} cy={53} r={RING_R}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={8}
        />
        {/* Progress */}
        <circle
          cx={53} cy={53} r={RING_R}
          fill="none"
          stroke={fraction < 0.25 ? "#ef4444" : "#fbbf24"}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUM}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 53 53)"
          style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.5s" }}
        />
        <text
          x={53} y={57}
          textAnchor="middle"
          fill="#f3f4f6"
          fontSize={14}
          fontWeight={700}
          fontFamily="system-ui, sans-serif"
        >
          {display}
        </text>
      </svg>
      <div style={{ color: "#d1d5db", fontSize: 14, textAlign: "center" }}>
        Someone is on their way
      </div>
    </div>
  );
}

// ── Main overlay ──────────────────────────────────────────────────────────────
export default function OutNowOverlay({
  session,
  currentUserId: _currentUserId,
  onPurchase,
  onDismiss,
  onJoinWaitlist,
}: OutNowOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  const now = Date.now();
  const isLocked =
    session.lockedBy != null &&
    session.lockExpiresAt != null &&
    new Date(session.lockExpiresAt).getTime() > now;

  // Remaining time until Out Now expires
  const { display: expiryDisplay } = useCountdown(session.expiresAt);

  const handlePurchase = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await onPurchase();
      if (result.url) {
        window.location.href = result.url;
      }
      // free / contactNumber cases handled by parent via session update
    } catch {
      // silently handled — parent toasts
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = () => {
    if (waitlistJoined) return;
    setWaitlistJoined(true);
    onJoinWaitlist();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="out-now-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
          zIndex: 280,
          display: "flex",
          alignItems: "flex-end",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 34 }}
          style={{
            width: "100%",
            background: "#0f0f23",
            borderRadius: "20px 20px 0 0",
            overflow: "hidden",
            maxHeight: "92vh",
            overflowY: "auto",
          }}
        >
          {/* Hero photo */}
          <div style={{ position: "relative", height: 280 }}>
            {session.avatar ? (
              <img
                src={session.avatar}
                alt={session.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, #1e1b4b, #312e81)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 64,
                }}
              >
                {session.name.charAt(0)}
              </div>
            )}

            {/* Gradient overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.0) 40%, rgba(15,15,35,0.95) 100%)",
              }}
            />

            {/* OUT NOW pulsing badge */}
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                background: "#fbbf24",
                color: "#0f0f23",
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: 1.2,
                padding: "5px 10px",
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Zap size={11} fill="#0f0f23" />
              OUT NOW
            </motion.div>

            {/* Close button */}
            <button
              onClick={onDismiss}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: "50%",
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={16} color="#fff" />
            </button>

            {/* Name + meta overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 14,
                left: 16,
                right: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 22 }}>
                  {session.name}
                </span>
                {session.isVerified && (
                  <span
                    style={{
                      background: "#3b82f6",
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width={10} height={10} viewBox="0 0 10 10">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#fff"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 4,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: "#d1d5db",
                    fontSize: 13,
                  }}
                >
                  <MapPin size={12} />
                  {session.distanceBand}
                </span>
                <span
                  style={{
                    color: "#9ca3af",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Expires in {expiryDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div style={{ padding: "20px 16px 32px" }}>
            {!isLocked ? (
              /* ── AVAILABLE STATE ─────────────────────────────────────────── */
              <>
                {/* How it works */}
                <div
                  style={{
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.2)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      color: "#fbbf24",
                      fontWeight: 700,
                      fontSize: 13,
                      marginBottom: 10,
                      letterSpacing: 0.5,
                    }}
                  >
                    HOW IT WORKS
                  </div>
                  {[
                    { step: "1", text: `Tap "On The Way" — $2.99 unlocks ${session.name}'s contact` },
                    { step: "2", text: "You get 10 minutes to connect before the slot reopens" },
                    { step: "3", text: 'Tell us how it went — "We Met" earns you +25 coins' },
                  ].map((item) => (
                    <div
                      key={item.step}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "rgba(251,191,36,0.2)",
                          color: "#fbbf24",
                          fontWeight: 700,
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        {item.step}
                      </div>
                      <span style={{ color: "#d1d5db", fontSize: 14, lineHeight: 1.4 }}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Safety note */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    background: "rgba(59,130,246,0.07)",
                    border: "1px solid rgba(59,130,246,0.18)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 24,
                  }}
                >
                  <Shield size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: "#93c5fd", fontSize: 13, lineHeight: 1.5 }}>
                    Only mutual matches can see Out Now sessions. Your rough location is never shared
                    — we only show distance bands.
                  </span>
                </div>

                {/* CTA */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePurchase}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "16px 0",
                    borderRadius: 14,
                    background: loading
                      ? "rgba(251,191,36,0.4)"
                      : "linear-gradient(135deg, #fbbf24, #f59e0b)",
                    border: "none",
                    color: "#0f0f23",
                    fontWeight: 800,
                    fontSize: 16,
                    cursor: loading ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  {loading ? (
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        border: "2.5px solid rgba(0,0,0,0.3)",
                        borderTopColor: "#0f0f23",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                  ) : (
                    <>
                      <Zap size={18} fill="#0f0f23" />
                      On The Way — $2.99
                    </>
                  )}
                </motion.button>

                <button
                  onClick={onDismiss}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    color: "#6b7280",
                    fontSize: 14,
                    cursor: "pointer",
                    padding: "8px 0",
                  }}
                >
                  Not right now
                </button>

                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </>
            ) : (
              /* ── LOCKED STATE ────────────────────────────────────────────── */
              <>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <CountdownRing lockExpiresAt={session.lockExpiresAt!} />
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    marginBottom: 20,
                    textAlign: "center",
                    color: "#9ca3af",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  Another match is already on their way to meet {session.name}.
                  Join the waitlist to get notified if the slot opens up.
                </div>

                <motion.button
                  whileTap={{ scale: waitlistJoined ? 1 : 0.97 }}
                  onClick={handleWaitlist}
                  disabled={waitlistJoined}
                  style={{
                    width: "100%",
                    padding: "15px 0",
                    borderRadius: 14,
                    background: waitlistJoined
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(255,255,255,0.07)",
                    border: waitlistJoined
                      ? "1px solid rgba(34,197,94,0.3)"
                      : "1px solid rgba(255,255,255,0.12)",
                    color: waitlistJoined ? "#4ade80" : "#d1d5db",
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: waitlistJoined ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Bell size={17} />
                  {waitlistJoined ? "You're on the waitlist" : "Notify me if free again"}
                </motion.button>

                <button
                  onClick={onDismiss}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    color: "#6b7280",
                    fontSize: 14,
                    cursor: "pointer",
                    padding: "8px 0",
                  }}
                >
                  Dismiss
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
