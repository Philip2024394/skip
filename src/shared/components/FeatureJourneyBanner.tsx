import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { pushFeatureUnlocked } from "@/shared/utils/pushNotify";

// ── Feature unlock schedule ────────────────────────────────────────────────────
export interface FeatureUnlock {
  day: number;
  key: string;
  feature: string;
  emoji: string;
  description: string;
  color: string;
}

export const FEATURE_UNLOCKS: FeatureUnlock[] = [
  { day: 0,  key: "swipe",    feature: "Swipe & Match",   emoji: "💘", description: "Discover profiles near you",       color: "#ec4899" },
  { day: 0,  key: "chat",     feature: "Messaging",        emoji: "💬", description: "Chat with your matches",           color: "#a855f7" },
  { day: 1,  key: "coins",    feature: "Coin Wallet",      emoji: "🪙", description: "Earn coins — like, match, win",    color: "#f59e0b" },
  { day: 2,  key: "blind",    feature: "Blind Dates",      emoji: "😈", description: "Mystery match mode",               color: "#c2185b" },
  { day: 3,  key: "connect4", feature: "Connect 4",        emoji: "🔴", description: "Bet coins with your matches",      color: "#ef4444" },
  { day: 5,  key: "keys",     feature: "Key & Safe",       emoji: "🗝️", description: "Unlock real contact details",      color: "#fbbf24" },
  { day: 7,  key: "teddy",    feature: "Teddy Room",       emoji: "🐻", description: "Private shared media room",        color: "#8b5cf6" },
  { day: 14, key: "global",   feature: "Global Dating",    emoji: "🌍", description: "Match with anyone worldwide",      color: "#06b6d4" },
  { day: 30, key: "vip",      feature: "VIP Status",       emoji: "👑", description: "All premium perks unlocked",       color: "#f59e0b" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
}

function msUntilDayN(isoDate: string, day: number): number {
  const unlockAt = new Date(isoDate).getTime() + day * 86_400_000;
  return Math.max(0, unlockAt - Date.now());
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "Unlocking…";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  if (h > 23) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

const TOAST_KEY = "fj_toasted_keys";
function getToastedKeys(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(TOAST_KEY) ?? "[]")); } catch { return new Set(); }
}
function markToasted(key: string) {
  try {
    const s = getToastedKeys(); s.add(key);
    localStorage.setItem(TOAST_KEY, JSON.stringify([...s]));
  } catch { /* silent */ }
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  createdAt: string;
  userId?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FeatureJourneyBanner({ createdAt, userId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const firedRef = useRef(false);

  // Tick every second for live countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1_000);
    return () => clearInterval(id);
  }, []);

  const days = daysSince(createdAt);
  const unlocked = FEATURE_UNLOCKS.filter(f => f.day <= days);

  // Fire a toast + push the first time each feature unlocks
  useEffect(() => {
    if (firedRef.current) return;
    const toasted = getToastedKeys();
    const newlyUnlocked = unlocked.filter(f => f.day > 0 && !toasted.has(f.key));
    if (newlyUnlocked.length === 0) return;
    firedRef.current = true;
    newlyUnlocked.forEach((f, i) => {
      setTimeout(() => {
        toast.success(`${f.emoji} ${f.feature} unlocked!`, {
          description: f.description,
          duration: 5000,
        });
        markToasted(f.key);
        if (userId) pushFeatureUnlocked(userId, f.feature, f.emoji);
      }, i * 1200);
    });
  }, [unlocked.length, userId]);
  const locked   = FEATURE_UNLOCKS.filter(f => f.day > days);
  const next     = locked[0] ?? null;
  const progress = unlocked.length / FEATURE_UNLOCKS.length;

  return (
    <div style={{ marginBottom: 4 }}>
      {/* ── Collapsed banner ────────────────────────────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setExpanded(v => !v)}
        style={{
          width: "100%", textAlign: "left", padding: "12px 14px",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: expanded ? "14px 14px 0 0" : 14,
          cursor: "pointer", transition: "border-radius 0.2s",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 14 }}>🏆</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: "0.02em" }}>
              Feature Journey
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
              background: "rgba(194,24,91,0.2)", border: "1px solid rgba(194,24,91,0.4)",
              color: "#f48fb1", borderRadius: 20, padding: "2px 7px",
            }}>
              Day {days}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.25s", display: "block" }}>▾</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden", marginBottom: 7 }}>
          <motion.div
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              height: "100%", borderRadius: 99,
              background: "linear-gradient(90deg,#c2185b,#e91e8c,#a855f7)",
              boxShadow: "0 0 8px rgba(194,24,91,0.6)",
            }}
          />
        </div>

        {/* Status line */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
            {unlocked.length}/{FEATURE_UNLOCKS.length} features unlocked
          </span>
          {next && (
            <span style={{ fontSize: 9, color: "rgba(194,24,91,0.8)", fontWeight: 700 }}>
              {next.emoji} in {fmtCountdown(msUntilDayN(createdAt, next.day))}
            </span>
          )}
        </div>
      </motion.button>

      {/* ── Expanded list ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              background: "rgba(0,0,0,0.60)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)", borderTop: "none",
              borderRadius: "0 0 14px 14px",
              padding: "8px 12px 12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
            }}>
              {FEATURE_UNLOCKS.map((f, i) => {
                const isUnlocked = f.day <= days;
                const isNext = f.key === next?.key;
                const remaining = isNext ? msUntilDayN(createdAt, f.day) : 0;

                return (
                  <motion.div
                    key={f.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.18 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 6px",
                      borderBottom: i < FEATURE_UNLOCKS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      opacity: isUnlocked ? 1 : isNext ? 0.85 : 0.4,
                    }}
                  >
                    {/* Icon bubble */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                      background: isUnlocked
                        ? `linear-gradient(135deg,${f.color}30,${f.color}18)`
                        : "rgba(255,255,255,0.04)",
                      border: isUnlocked
                        ? `1px solid ${f.color}50`
                        : isNext
                          ? "1px solid rgba(255,255,255,0.15)"
                          : "1px solid rgba(255,255,255,0.06)",
                      boxShadow: isUnlocked ? `0 0 8px ${f.color}25` : "none",
                      transition: "all 0.3s",
                    }}>
                      {isUnlocked ? f.emoji : isNext ? f.emoji : "🔒"}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: isUnlocked ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.45)",
                        }}>
                          {f.feature}
                        </span>
                        {isUnlocked && (
                          <span style={{
                            fontSize: 8, fontWeight: 800, letterSpacing: "0.06em",
                            background: `${f.color}25`, border: `1px solid ${f.color}50`,
                            color: f.color, borderRadius: 20, padding: "1px 6px",
                          }}>LIVE</span>
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{f.description}</span>
                    </div>

                    {/* Right: unlock status */}
                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      {isUnlocked ? (
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: `linear-gradient(135deg,${f.color},${f.color}99)`,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                          boxShadow: `0 2px 8px ${f.color}40`,
                        }}>✓</div>
                      ) : isNext ? (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 9, color: "#f48fb1", fontWeight: 700, whiteSpace: "nowrap" }}>
                            {fmtCountdown(remaining)}
                          </div>
                          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>Day {f.day}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", fontWeight: 600 }}>
                          Day {f.day}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* All unlocked state */}
              {locked.length === 0 && (
                <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>🎉</div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>All features unlocked!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
