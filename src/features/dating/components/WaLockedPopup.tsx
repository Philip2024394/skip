import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface WaLockedPopupProps {
  profileName: string;
  profileImage?: string;
  lockUntil: number; // timestamp ms
  onClose: () => void;
}

function useCountdown(lockUntil: number) {
  const [remaining, setRemaining] = useState(() => Math.max(0, lockUntil - Date.now()));

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, lockUntil - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockUntil]);

  const totalSec = Math.floor(remaining / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  return { days, hours, mins, secs, expired: remaining <= 0 };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 44 }}>
      <motion.div
        key={value}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          fontSize: 26,
          fontWeight: 900,
          color: "white",
          lineHeight: 1,
          textShadow: "0 0 20px rgba(236,72,153,0.6)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(value).padStart(2, "0")}
      </motion.div>
      <span style={{
        fontSize: 9,
        fontWeight: 700,
        color: "rgba(255,255,255,0.4)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginTop: 3,
      }}>{label}</span>
    </div>
  );
}

export default function WaLockedPopup({ profileName, profileImage, lockUntil, onClose }: WaLockedPopupProps) {
  const { days, hours, mins, secs, expired } = useCountdown(lockUntil);
  const firstName = profileName.split(" ")[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        background: "rgba(0,0,0,0.52)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Card */}
      <motion.div
        initial={{ scale: 0.88, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 12, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.05 }}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 360,
          background: "rgba(12,12,18,0.72)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 22,
          overflow: "hidden",
        }}
      >
        {/* Pink top strip */}
        <div style={{
          height: 4,
          background: "linear-gradient(90deg, #ec4899, #f472b6, #ec4899)",
        }} />

        <div style={{ padding: "24px 24px 28px" }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14, right: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              width: 30, height: 30,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "rgba(255,255,255,0.5)",
            }}
          >
            <X size={14} />
          </button>

          {/* Profile image + lock badge side by side */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 20 }}>
            {/* Profile avatar */}
            <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={firstName}
                  style={{
                    width: 88, height: 88,
                    borderRadius: "50%",
                    objectFit: "cover",
                    filter: "grayscale(60%) brightness(0.5)",
                    border: "2px solid rgba(255,255,255,0.2)",
                  }}
                />
              ) : (
                <div style={{
                  width: 88, height: 88, borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)",
                  border: "2px solid rgba(255,255,255,0.2)",
                }} />
              )}
              {/* Lock overlay centered on avatar */}
              <div style={{
                position: "absolute", inset: 0,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.52)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img
                  src="https://ik.imagekit.io/7grri5v7d/Profile%20locked%20with%20heart-shaped%20padlock.png"
                  alt="Locked"
                  style={{ width: 46, height: 46, objectFit: "contain" }}
                />
              </div>
            </div>
          </div>

          {/* Label */}
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(236,72,153,0.8)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textAlign: "center",
            margin: "0 0 8px",
          }}>Account Locked</p>

          {/* Headline */}
          <p style={{
            fontSize: 17,
            fontWeight: 800,
            background: "linear-gradient(135deg, #f472b6, #ec4899, #f43f8e)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textAlign: "center",
            margin: "0 0 12px",
            lineHeight: 1.35,
          }}>
            {firstName} is in a WhatsApp connection
          </p>

          {/* Body */}
          <p style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}>
            This account is locked due to a match connection — both users are now connected on WhatsApp. The profile will be available again when the lock period ends.
          </p>

          {/* Divider */}
          <div style={{
            height: 1,
            background: "rgba(255,255,255,0.06)",
            marginBottom: 20,
          }} />

          {/* Countdown label */}
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(236,72,153,0.7)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            textAlign: "center",
            marginBottom: 14,
          }}>
            {expired ? "Unlocking now..." : "Unlocks in"}
          </p>

          {/* Countdown */}
          {!expired ? (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 4,
            }}>
              <CountdownUnit value={days} label="days" />
              <span style={{ fontSize: 22, fontWeight: 900, color: "rgba(236,72,153,0.5)", marginBottom: 10 }}>:</span>
              <CountdownUnit value={hours} label="hours" />
              <span style={{ fontSize: 22, fontWeight: 900, color: "rgba(236,72,153,0.5)", marginBottom: 10 }}>:</span>
              <CountdownUnit value={mins} label="mins" />
              <span style={{ fontSize: 22, fontWeight: 900, color: "rgba(236,72,153,0.5)", marginBottom: 10 }}>:</span>
              <CountdownUnit value={secs} label="secs" />
            </div>
          ) : (
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", fontSize: 22, marginTop: 4 }}
            >
              ✅
            </motion.p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Storage helpers ────────────────────────────────────────────────────────────
const WA_LOCK_KEY = "wa_locked_profiles_v1";

export interface WaLock {
  profileId: string;
  profileName: string;
  profileImage?: string;
  lockUntil: number;
}

export function getWaLocks(): WaLock[] {
  try { return JSON.parse(localStorage.getItem(WA_LOCK_KEY) || "[]"); } catch { return []; }
}

export function addWaLock(lock: WaLock) {
  const existing = getWaLocks().filter(l => l.profileId !== lock.profileId);
  localStorage.setItem(WA_LOCK_KEY, JSON.stringify([...existing, lock]));
}

export function isWaLocked(profileId: string): WaLock | null {
  const lock = getWaLocks().find(l => l.profileId === profileId);
  if (!lock) return null;
  if (lock.lockUntil <= Date.now()) return null; // expired
  return lock;
}
