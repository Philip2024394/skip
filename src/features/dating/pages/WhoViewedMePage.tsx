import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Viewer {
  viewer_id: string;
  name: string;
  age: number | null;
  city: string | null;
  photos: string[] | null;
  last_seen_at: string | null;
  view_count: number;
  last_viewed_at: string;
}

// Coin cost tiers by view count
function unlockCost(viewCount: number): number {
  if (viewCount <= 2) return 0;
  if (viewCount <= 5) return 25;
  if (viewCount <= 10) return 40;
  return 60;
}

function tierLabel(viewCount: number): string {
  if (viewCount <= 2) return "Free";
  if (viewCount <= 5) return "25 🪙";
  if (viewCount <= 10) return "40 🪙";
  return "60 🪙";
}

// ── Online status ─────────────────────────────────────────────────────────────
function onlineStatus(lastSeen: string | null): "online" | "recent" | "offline" {
  if (!lastSeen) return "offline";
  const mins = (Date.now() - new Date(lastSeen).getTime()) / 60000;
  return mins < 5 ? "online" : mins < 60 ? "recent" : "offline";
}

// ── Time ago label ────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins < 60) return `${Math.round(mins)}m ago`;
  const hrs = mins / 60;
  if (hrs < 24) return `${Math.round(hrs)}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

// ── Avatar with online dot ────────────────────────────────────────────────────
function Avatar({ src, status, blur }: { src: string; status: "online" | "recent" | "offline"; blur?: boolean }) {
  const dotColor = status === "online" ? "#4ade80" : status === "recent" ? "#fb923c" : "#666";
  const glowColor = status === "online" ? "rgba(74,222,128,0.6)" : "rgba(251,146,60,0.5)";
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <img
        src={src || "/placeholder.svg"}
        alt=""
        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        style={{
          width: 44, height: 44, borderRadius: "50%",
          objectFit: "cover", objectPosition: "top",
          border: "2px solid rgba(255,255,255,0.15)",
          filter: blur ? "blur(8px)" : "none",
          transition: "filter 0.3s",
        }}
      />
      {status !== "offline" && (
        <span style={{
          position: "absolute", bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: "50%",
          background: dotColor,
          border: "2px solid rgba(4,2,10,0.9)",
          boxShadow: `0 0 6px ${glowColor}`,
        }} />
      )}
    </div>
  );
}

// ── ViewerCard ─────────────────────────────────────────────────────────────────
function ViewerCard({
  viewer,
  unlocked,
  onUnlock,
  onMessage,
}: {
  viewer: Viewer;
  unlocked: boolean;
  onUnlock: (v: Viewer) => void;
  onMessage: (v: Viewer) => void;
}) {
  const photo = viewer.photos?.[0] || "/placeholder.svg";
  const status = onlineStatus(viewer.last_seen_at);
  const locked = viewer.view_count >= 3 && !unlocked;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: "133%",
        borderRadius: 14,
        overflow: "hidden",
        border: locked
          ? "1.5px solid rgba(194,24,91,0.35)"
          : "1.5px solid rgba(255,255,255,0.14)",
        background: "#0e0612",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        {/* Profile image */}
        <img
          src={photo}
          alt={viewer.name}
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "50% 0%",
            display: "block",
            filter: locked ? "blur(14px) brightness(0.55)" : "none",
            transition: "filter 0.4s",
          }}
        />

        {/* Bottom gradient */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)",
          padding: "28px 8px 8px",
        }}>
          {!locked ? (
            <>
              <p style={{ color: "white", fontWeight: 800, fontSize: 11, margin: "0 0 1px", lineHeight: 1.25, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
                {viewer.name}{viewer.age ? `, ${viewer.age}` : ""}
              </p>
              {viewer.city && (
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, margin: "0 0 6px", lineHeight: 1.2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  {viewer.city}
                </p>
              )}
              {/* Message button */}
              <button
                onClick={(e) => { e.stopPropagation(); onMessage(viewer); }}
                style={{
                  width: "100%", height: 28, borderRadius: 20,
                  background: "linear-gradient(135deg,#c2185b,#e91e8c)",
                  border: "none", color: "white",
                  fontSize: 10, fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  boxShadow: "0 4px 14px rgba(194,24,91,0.45)",
                }}
              >
                <span style={{ fontSize: 12 }}>💬</span> Message
              </button>
            </>
          ) : (
            /* Locked state */
            <button
              onClick={(e) => { e.stopPropagation(); onUnlock(viewer); }}
              style={{
                width: "100%", height: 32, borderRadius: 20,
                background: "rgba(194,24,91,0.18)",
                border: "1.5px solid rgba(194,24,91,0.55)",
                color: "rgba(236,72,153,0.95)",
                fontSize: 10, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}
            >
              🔒 Unlock · {tierLabel(viewer.view_count)}
            </button>
          )}
        </div>

        {/* View count badge — top left */}
        <div style={{
          position: "absolute", top: 7, left: 7,
          background: "rgba(0,0,0,0.72)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 20, padding: "3px 7px",
          fontSize: 9, fontWeight: 800, color: "white",
          display: "flex", alignItems: "center", gap: 3,
          backdropFilter: "blur(6px)",
        }}>
          <span>👁</span>
          <span>{viewer.view_count}×</span>
        </div>

        {/* Online dot — top right */}
        {status !== "offline" && (
          <span style={{
            position: "absolute", top: 8, right: 8,
            width: 9, height: 9, borderRadius: "50%",
            background: status === "online" ? "#4ade80" : "#fb923c",
            border: "1.5px solid rgba(0,0,0,0.6)",
            boxShadow: status === "online" ? "0 0 6px rgba(74,222,128,0.7)" : "0 0 6px rgba(251,146,60,0.6)",
          }} />
        )}

        {/* Lock overlay icon */}
        {locked && (
          <div style={{
            position: "absolute", top: "38%", left: "50%",
            transform: "translate(-50%,-50%)",
            fontSize: 28, opacity: 0.85,
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))",
          }}>🔒</div>
        )}

        {/* Time ago label */}
        <div style={{
          position: "absolute", top: 7, right: locked ? 7 : 20,
          ...(locked ? {} : {}),
          background: "rgba(0,0,0,0.6)",
          borderRadius: 10, padding: "2px 6px",
          fontSize: 8, color: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(4px)",
          display: locked ? "none" : "block",
        }}>
          {timeAgo(viewer.last_viewed_at)}
        </div>
      </div>
    </motion.div>
  );
}

// ── MessageGameSheet ───────────────────────────────────────────────────────────
const GAMES = [
  { id: "connect4", emoji: "🔴", label: "Connect 4", desc: "Drop discs, 4 in a row wins" },
  { id: "match",    emoji: "🃏", label: "Memory Match", desc: "Flip cards, find all pairs" },
  { id: "poker",    emoji: "♠️", label: "Poker",  desc: "Coming soon — stay tuned!", soon: true },
];

const GIFTS = [
  { emoji: "🌹", label: "Rose" },
  { emoji: "💐", label: "Bouquet" },
  { emoji: "🍫", label: "Chocolate" },
  { emoji: "🧸", label: "Teddy" },
  { emoji: "💍", label: "Ring" },
  { emoji: "✨", label: "Sparkle" },
];

function MessageGameSheet({
  viewer,
  onClose,
  onSend,
}: {
  viewer: Viewer;
  onClose: () => void;
  onSend: (payload: { type: "message" | "game" | "gift"; data: any }) => void;
}) {
  const [tab, setTab] = useState<"games" | "message" | "gift">("games");
  const [text, setText] = useState("");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);

  const photo = viewer.photos?.[0] || "/placeholder.svg";
  const status = onlineStatus(viewer.last_seen_at);

  const canSend =
    (tab === "message" && text.trim().length > 0) ||
    (tab === "games" && selectedGame !== null) ||
    (tab === "gift" && selectedGift !== null);

  function handleSend() {
    if (tab === "message") onSend({ type: "message", data: { text } });
    else if (tab === "games") onSend({ type: "game", data: { game: selectedGame } });
    else onSend({ type: "gift", data: { gift: selectedGift } });
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 900,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, margin: "0 auto",
          background: "rgba(10,5,20,0.98)",
          border: "1.5px solid rgba(194,24,91,0.3)",
          borderRadius: "24px 24px 0 0",
          overflow: "hidden",
          boxShadow: "0 -20px 60px rgba(194,24,91,0.18)",
          paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Recipient header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px 10px" }}>
          <Avatar src={photo} status={status} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>
              {viewer.name}{viewer.age ? `, ${viewer.age}` : ""}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
              {status === "online" ? "🟢 Online now" : status === "recent" ? "🟡 Recently active" : "⚫ Offline"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer", padding: "0 4px" }}
          >✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, padding: "0 16px 12px" }}>
          {(["games", "message", "gift"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, height: 34, borderRadius: 20,
                background: tab === t ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "rgba(255,255,255,0.07)",
                border: tab === t ? "none" : "1px solid rgba(255,255,255,0.1)",
                color: tab === t ? "white" : "rgba(255,255,255,0.5)",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {t === "games" ? "🎮 Games" : t === "message" ? "💬 Message" : "🎁 Gift"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: "0 16px", minHeight: 200 }}>
          {tab === "games" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {GAMES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => !g.soon && setSelectedGame(g.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 14,
                    background: selectedGame === g.id
                      ? "rgba(194,24,91,0.22)"
                      : g.soon ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                    border: selectedGame === g.id
                      ? "1.5px solid rgba(194,24,91,0.6)"
                      : "1.5px solid rgba(255,255,255,0.08)",
                    cursor: g.soon ? "not-allowed" : "pointer",
                    opacity: g.soon ? 0.45 : 1,
                    width: "100%", textAlign: "left",
                    transition: "all 0.18s",
                  }}
                >
                  <span style={{ fontSize: 26, flexShrink: 0 }}>{g.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>{g.label}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{g.desc}</div>
                  </div>
                  {selectedGame === g.id && (
                    <span style={{ fontSize: 16, color: "#e91e8c" }}>✓</span>
                  )}
                  {g.soon && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: "rgba(255,200,0,0.8)",
                      background: "rgba(255,200,0,0.12)", border: "1px solid rgba(255,200,0,0.25)",
                      borderRadius: 8, padding: "2px 6px",
                    }}>SOON</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {tab === "message" && (
            <div>
              <textarea
                placeholder={`Send ${viewer.name} a message...`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                style={{
                  width: "100%", borderRadius: 14, padding: "12px 14px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1.5px solid rgba(255,255,255,0.12)",
                  color: "white", fontSize: 13,
                  resize: "none", outline: "none",
                  fontFamily: "inherit", lineHeight: 1.55,
                  boxSizing: "border-box",
                }}
              />
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6, textAlign: "right" }}>
                {text.length}/300
              </div>
            </div>
          )}

          {tab === "gift" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {GIFTS.map((g) => (
                <button
                  key={g.label}
                  onClick={() => setSelectedGift(g.label)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    gap: 5, padding: "14px 8px", borderRadius: 14,
                    background: selectedGift === g.label
                      ? "rgba(194,24,91,0.22)"
                      : "rgba(255,255,255,0.06)",
                    border: selectedGift === g.label
                      ? "1.5px solid rgba(194,24,91,0.6)"
                      : "1.5px solid rgba(255,255,255,0.08)",
                    cursor: "pointer", transition: "all 0.18s",
                  }}
                >
                  <span style={{ fontSize: 28 }}>{g.emoji}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{g.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Send button */}
        <div style={{ padding: "14px 16px 0" }}>
          <motion.button
            whileTap={canSend ? { scale: 0.97 } : {}}
            onClick={canSend ? handleSend : undefined}
            style={{
              width: "100%", height: 50, borderRadius: 50,
              background: canSend
                ? "linear-gradient(135deg,#c2185b,#e91e8c)"
                : "rgba(255,255,255,0.06)",
              border: canSend ? "none" : "1.5px solid rgba(255,255,255,0.1)",
              color: canSend ? "white" : "rgba(255,255,255,0.3)",
              fontSize: 15, fontWeight: 800, cursor: canSend ? "pointer" : "not-allowed",
              transition: "all 0.22s",
              boxShadow: canSend ? "0 6px 24px rgba(194,24,91,0.4)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {tab === "games" ? "🎮 Send Game Invite" : tab === "message" ? "💬 Send Message" : "🎁 Send Gift"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Unlock Confirm Modal ───────────────────────────────────────────────────────
function UnlockModal({
  viewer,
  coinBalance,
  onConfirm,
  onClose,
}: {
  viewer: Viewer;
  coinBalance: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cost = unlockCost(viewer.view_count);
  const canAfford = coinBalance >= cost;
  const photo = viewer.photos?.[0] || "/placeholder.svg";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 950,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 340,
          background: "rgba(10,5,20,0.98)",
          border: "1.5px solid rgba(194,24,91,0.4)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(194,24,91,0.2)",
          textAlign: "center",
        }}
      >
        {/* Blurred preview */}
        <div style={{ position: "relative", height: 160, overflow: "hidden" }}>
          <img
            src={photo}
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", filter: "blur(18px) brightness(0.5)" }}
          />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 36 }}>🔒</span>
            <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>
              Viewed your profile {viewer.view_count} times
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              They're clearly interested...
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 22px 22px" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "white", marginBottom: 6 }}>
            Unlock for {cost} 🪙
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 18, lineHeight: 1.55 }}>
            See their name, photo and send a message or game invite.
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>
            Your balance: <strong style={{ color: canAfford ? "#4ade80" : "#f87171" }}>{coinBalance} 🪙</strong>
          </div>

          {canAfford ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onConfirm}
              style={{
                width: "100%", height: 48, borderRadius: 50,
                background: "linear-gradient(135deg,#c2185b,#e91e8c)",
                border: "none", color: "white",
                fontSize: 14, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 6px 24px rgba(194,24,91,0.45)",
                marginBottom: 10,
              }}
            >
              ✓ Unlock Profile
            </motion.button>
          ) : (
            <div style={{
              padding: "12px 14px", borderRadius: 14,
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.3)",
              color: "#f87171", fontSize: 12, fontWeight: 700,
              marginBottom: 10,
            }}>
              Not enough coins — top up your wallet first
            </div>
          )}

          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer" }}
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Mock viewers (shown when DB has no data yet) ──────────────────────────────
const MOCK_VIEWERS: Viewer[] = [
  { viewer_id: "mock-01", name: "Putri",   age: 24, city: "Jakarta",  photos: ["https://i.pravatar.cc/300?img=1"],  last_seen_at: new Date(Date.now()-2*60000).toISOString(),    view_count: 1, last_viewed_at: new Date(Date.now()-5*60000).toISOString() },
  { viewer_id: "mock-02", name: "Dewi",    age: 22, city: "Bali",     photos: ["https://i.pravatar.cc/300?img=5"],  last_seen_at: new Date(Date.now()-18*60000).toISOString(),   view_count: 2, last_viewed_at: new Date(Date.now()-20*60000).toISOString() },
  { viewer_id: "mock-03", name: "Sari",    age: 26, city: "Surabaya", photos: ["https://i.pravatar.cc/300?img=9"],  last_seen_at: new Date(Date.now()-90*60000).toISOString(),   view_count: 1, last_viewed_at: new Date(Date.now()-100*60000).toISOString() },
  { viewer_id: "mock-04", name: "Ayu",     age: 23, city: "Bandung",  photos: ["https://i.pravatar.cc/300?img=10"], last_seen_at: new Date(Date.now()-4*60000).toISOString(),    view_count: 4, last_viewed_at: new Date(Date.now()-8*60000).toISOString() },
  { viewer_id: "mock-05", name: "Rina",    age: 25, city: "Yogya",    photos: ["https://i.pravatar.cc/300?img=12"], last_seen_at: null,                                          view_count: 6, last_viewed_at: new Date(Date.now()-3*60*60000).toISOString() },
  { viewer_id: "mock-06", name: "Wulan",   age: 21, city: "Medan",    photos: ["https://i.pravatar.cc/300?img=15"], last_seen_at: new Date(Date.now()-30*60000).toISOString(),   view_count: 2, last_viewed_at: new Date(Date.now()-35*60000).toISOString() },
  { viewer_id: "mock-07", name: "Indah",   age: 27, city: "Makassar", photos: ["https://i.pravatar.cc/300?img=20"], last_seen_at: new Date(Date.now()-1*60000).toISOString(),    view_count: 8, last_viewed_at: new Date(Date.now()-2*60000).toISOString() },
  { viewer_id: "mock-08", name: "Ratna",   age: 29, city: "Bali",     photos: ["https://i.pravatar.cc/300?img=25"], last_seen_at: null,                                          view_count: 3, last_viewed_at: new Date(Date.now()-5*60*60000).toISOString() },
  { viewer_id: "mock-09", name: "Mega",    age: 24, city: "Jakarta",  photos: ["https://i.pravatar.cc/300?img=27"], last_seen_at: new Date(Date.now()-3*60000).toISOString(),    view_count: 1, last_viewed_at: new Date(Date.now()-6*60000).toISOString() },
  { viewer_id: "mock-10", name: "Dian",    age: 23, city: "Semarang", photos: ["https://i.pravatar.cc/300?img=29"], last_seen_at: new Date(Date.now()-50*60000).toISOString(),   view_count: 5, last_viewed_at: new Date(Date.now()-60*60000).toISOString() },
  { viewer_id: "mock-11", name: "Anisa",   age: 22, city: "Bandung",  photos: ["https://i.pravatar.cc/300?img=30"], last_seen_at: null,                                          view_count: 2, last_viewed_at: new Date(Date.now()-2*24*60*60000).toISOString() },
  { viewer_id: "mock-12", name: "Fitri",   age: 26, city: "Surabaya", photos: ["https://i.pravatar.cc/300?img=32"], last_seen_at: new Date(Date.now()-7*60000).toISOString(),    view_count: 12,last_viewed_at: new Date(Date.now()-15*60000).toISOString() },
  { viewer_id: "mock-13", name: "Nurul",   age: 25, city: "Lombok",   photos: ["https://i.pravatar.cc/300?img=33"], last_seen_at: null,                                          view_count: 3, last_viewed_at: new Date(Date.now()-8*60*60000).toISOString() },
  { viewer_id: "mock-14", name: "Sinta",   age: 28, city: "Bali",     photos: ["https://i.pravatar.cc/300?img=35"], last_seen_at: new Date(Date.now()-2*60000).toISOString(),    view_count: 1, last_viewed_at: new Date(Date.now()-4*60000).toISOString() },
  { viewer_id: "mock-15", name: "Kartika", age: 24, city: "Jakarta",  photos: ["https://i.pravatar.cc/300?img=40"], last_seen_at: new Date(Date.now()-25*60000).toISOString(),   view_count: 7, last_viewed_at: new Date(Date.now()-30*60000).toISOString() },
  { viewer_id: "mock-16", name: "Melati",  age: 21, city: "Yogya",    photos: ["https://i.pravatar.cc/300?img=44"], last_seen_at: null,                                          view_count: 2, last_viewed_at: new Date(Date.now()-1*24*60*60000).toISOString() },
  { viewer_id: "mock-17", name: "Citra",   age: 23, city: "Bandung",  photos: ["https://i.pravatar.cc/300?img=47"], last_seen_at: new Date(Date.now()-4*60000).toISOString(),    view_count: 4, last_viewed_at: new Date(Date.now()-10*60000).toISOString() },
  { viewer_id: "mock-18", name: "Bunga",   age: 27, city: "Medan",    photos: ["https://i.pravatar.cc/300?img=48"], last_seen_at: null,                                          view_count: 9, last_viewed_at: new Date(Date.now()-4*60*60000).toISOString() },
  { viewer_id: "mock-19", name: "Kirana",  age: 22, city: "Surabaya", photos: ["https://i.pravatar.cc/300?img=56"], last_seen_at: new Date(Date.now()-1*60000).toISOString(),    view_count: 1, last_viewed_at: new Date(Date.now()-3*60000).toISOString() },
  { viewer_id: "mock-20", name: "Dinda",   age: 25, city: "Bali",     photos: ["https://i.pravatar.cc/300?img=60"], last_seen_at: new Date(Date.now()-12*60000).toISOString(),   view_count: 3, last_viewed_at: new Date(Date.now()-20*60000).toISOString() },
];

// ── WhoViewedMePage ────────────────────────────────────────────────────────────
export default function WhoViewedMePage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [coinBalance, setCoinBalance] = useState(0);
  const [viewers, setViewers]       = useState<Viewer[]>([]);
  const [unlocked, setUnlocked]     = useState<Set<string>>(new Set());
  const [loading, setLoading]       = useState(true);
  const [unlockTarget, setUnlockTarget] = useState<Viewer | null>(null);
  const [messageTarget, setMessageTarget] = useState<Viewer | null>(null);
  const [toast, setToast]           = useState<string | null>(null);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        // No session — show mocks immediately
        setViewers(MOCK_VIEWERS);
        setLoading(false);
      }
    });
  }, []);

  // Load viewers + coin balance + previously unlocked
  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [viewRes, profileRes, unlockRes] = await Promise.all([
      supabase.rpc("get_who_viewed_me" as any, { p_user_id: userId }),
      supabase.from("profiles").select("coins_balance").eq("id", userId).single(),
      supabase.from("viewer_unlocks" as any).select("viewer_id").eq("user_id", userId),
    ]);

    const fetchedViewers: Viewer[] = ((viewRes as any).data as Viewer[]) || [];
    setViewers(fetchedViewers.length > 0 ? fetchedViewers : MOCK_VIEWERS);
    setCoinBalance((profileRes.data as any)?.coins_balance ?? 0);
    const prevUnlocked = new Set<string>(
      (((unlockRes as any).data ?? []) as { viewer_id: string }[]).map((r) => r.viewer_id)
    );
    setUnlocked(prevUnlocked);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  async function handleUnlockConfirm() {
    if (!unlockTarget || !userId) return;
    const cost = unlockCost(unlockTarget.view_count);
    const res = await supabase.rpc("unlock_viewer" as any, {
      p_user_id: userId,
      p_viewer_id: unlockTarget.viewer_id,
      p_cost: cost,
    });
    const result = (res as any).data as { ok: boolean; error?: string; new_balance?: number };
    if (result?.ok) {
      setUnlocked((prev) => new Set([...prev, unlockTarget.viewer_id]));
      setCoinBalance(result.new_balance ?? coinBalance - cost);
      showToast("Profile unlocked!");
    } else {
      showToast("Not enough coins");
    }
    setUnlockTarget(null);
  }

  async function handleSend(payload: { type: "message" | "game" | "gift"; data: any }) {
    if (!messageTarget || !userId) return;
    if (payload.type === "message") {
      await (supabase as any).from("messages").insert({
        sender_id: userId,
        receiver_id: messageTarget.viewer_id,
        content: payload.data.text,
      });
      showToast("Message sent!");
    } else if (payload.type === "game") {
      await (supabase as any).from("messages").insert({
        sender_id: userId,
        receiver_id: messageTarget.viewer_id,
        content: `🎮 Game invite: ${payload.data.game === "connect4" ? "Connect 4" : "Memory Match"}`,
      });
      showToast(`${payload.data.game === "connect4" ? "Connect 4" : "Memory Match"} invite sent!`);
    } else if (payload.type === "gift") {
      const g = GIFTS.find((x) => x.label === payload.data.gift);
      if (g) {
        await (supabase as any).from("sent_gifts").insert({
          sender_id: userId,
          recipient_id: messageTarget.viewer_id,
          gift_name: g.label,
          gift_emoji: g.emoji,
          status: "pending",
        });
        showToast(`${g.emoji} ${g.label} sent!`);
      }
    }
  }

  // Split: free viewers (1-2) and locked (3+)
  const freeViewers   = viewers.filter((v) => v.view_count <= 2);
  const lockedViewers = viewers.filter((v) => v.view_count >= 3);

  return (
    <div style={{
      minHeight: "100dvh",
      backgroundImage: "url('/images/app-background.png')",
      backgroundSize: "cover", backgroundPosition: "center",
      display: "flex", flexDirection: "column",
    }}>
      {/* Content */}
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column", width: "100%" }}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          paddingTop: "max(44px,env(safe-area-inset-top,44px))",
          paddingLeft: 16, paddingRight: 16, paddingBottom: 12,
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          background: "transparent",
          flexShrink: 0,
        }}>
          {/* Logo — left */}
          <img
            src="https://ik.imagekit.io/dateme/Untitledfgdsfg-removebg-preview.png"
            alt="logo"
            style={{ width: 44, height: 44, objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 0 6px rgba(255,255,255,0.4))" }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>
              👁 Who Viewed Me
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
              {viewers.length} {viewers.length === 1 ? "person" : "people"} checked your profile
            </div>
          </div>
          {/* Coin balance pill */}
          <div style={{
            background: "rgba(255,193,7,0.12)", border: "1px solid rgba(255,193,7,0.3)",
            borderRadius: 20, padding: "5px 12px",
            fontSize: 12, fontWeight: 800, color: "rgba(255,220,80,0.95)",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            🪙 {coinBalance}
          </div>
          {/* Home button — right */}
          <button
            onClick={() => navigate("/home")}
            style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20, width: 34, height: 34, cursor: "pointer",
              color: "white", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >🏠</button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", paddingBottom: "max(20px,env(safe-area-inset-bottom,20px))" }}>

          {loading ? (
            <div style={{ textAlign: "center", paddingTop: 60, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              Loading...
            </div>
          ) : viewers.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👁</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "white", marginBottom: 8 }}>No views yet</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                When someone views your profile,<br />they'll appear here.
              </div>
            </div>
          ) : (
            <>
              {/* Free viewers */}
              {freeViewers.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                    Recent Visitors
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
                    {freeViewers.map((v) => (
                      <ViewerCard
                        key={v.viewer_id}
                        viewer={v}
                        unlocked={true}
                        onUnlock={() => {}}
                        onMessage={setMessageTarget}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Locked viewers */}
              {lockedViewers.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(236,72,153,0.8)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      🔥 Seriously Interested
                    </div>
                    <div style={{
                      background: "rgba(194,24,91,0.15)", border: "1px solid rgba(194,24,91,0.35)",
                      borderRadius: 10, padding: "2px 8px",
                      fontSize: 9, fontWeight: 800, color: "rgba(236,72,153,0.9)",
                    }}>
                      {lockedViewers.length} locked
                    </div>
                  </div>
                  <div style={{
                    background: "rgba(194,24,91,0.06)", border: "1px solid rgba(194,24,91,0.2)",
                    borderRadius: 14, padding: "10px 12px", marginBottom: 12,
                    fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.55,
                  }}>
                    These people have viewed your profile <strong style={{ color: "rgba(236,72,153,0.8)" }}>3+ times</strong>. They're clearly interested — unlock to see who they are and start a conversation.
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {lockedViewers.map((v) => (
                      <ViewerCard
                        key={v.viewer_id}
                        viewer={v}
                        unlocked={unlocked.has(v.viewer_id)}
                        onUnlock={setUnlockTarget}
                        onMessage={setMessageTarget}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {unlockTarget && (
          <UnlockModal
            key="unlock"
            viewer={unlockTarget}
            coinBalance={coinBalance}
            onConfirm={handleUnlockConfirm}
            onClose={() => setUnlockTarget(null)}
          />
        )}
        {messageTarget && (
          <MessageGameSheet
            key="msg"
            viewer={messageTarget}
            onClose={() => setMessageTarget(null)}
            onSend={handleSend}
          />
        )}
      </AnimatePresence>

      {/* ── Toast ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
              background: "rgba(10,5,20,0.95)",
              border: "1.5px solid rgba(194,24,91,0.4)",
              borderRadius: 30, padding: "10px 22px",
              fontSize: 13, fontWeight: 700, color: "white",
              zIndex: 999,
              boxShadow: "0 6px 24px rgba(194,24,91,0.25)",
              whiteSpace: "nowrap",
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
