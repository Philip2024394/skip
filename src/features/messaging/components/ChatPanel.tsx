import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, ShieldCheck, Lock, Video, Flag, X } from "lucide-react";
import { useMessages, validateChatMessage } from "@/shared/hooks/useMessages";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import VideoCallPanel from "@/features/video/components/VideoCallPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCoinBalance } from "@/shared/hooks/useCoinBalance";

// ── Contact card helpers ───────────────────────────────────────────────────────

const CONTACT_CARD_PREFIX = "__CONTACT_CARD__";
const COINS_CONTACT_SHARE = 20;

const PLATFORMS = [
  { id: "whatsapp",  label: "WhatsApp",  emoji: "💬", color: "#25d366", placeholder: "+1 234 567 8900" },
  { id: "telegram",  label: "Telegram",  emoji: "✈️",  color: "#2AABEE", placeholder: "@username" },
  { id: "instagram", label: "Instagram", emoji: "📸", color: "#e1306c", placeholder: "@username" },
  { id: "phone",     label: "Phone",     emoji: "📞", color: "#a78bfa", placeholder: "+1 234 567 8900" },
] as const;

type PlatformId = typeof PLATFORMS[number]["id"];

interface ContactCard { platform: PlatformId; value: string; name: string; }

function encodeContactCard(card: ContactCard): string {
  return CONTACT_CARD_PREFIX + JSON.stringify(card);
}

function decodeContactCard(content: string): ContactCard | null {
  if (!content.startsWith(CONTACT_CARD_PREFIX)) return null;
  try { return JSON.parse(content.slice(CONTACT_CARD_PREFIX.length)); }
  catch { return null; }
}


interface ChatPanelProps {
  currentUserId: string;
  otherUser: {
    id: string;
    name: string;
    avatar_url?: string | null;
    last_seen_at?: string | null;
    age?: number;
  };
  onClose: () => void;
  onUnlock?: () => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function shouldShowTimestamp(messages: any[], idx: number) {
  if (idx === 0) return true;
  const gap = new Date(messages[idx].created_at).getTime() - new Date(messages[idx - 1].created_at).getTime();
  return gap > 5 * 60 * 1000;
}

// ── MyMemory translation helper ───────────────────────────────────────────────
async function translateText(text: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=|en`
    );
    const json = await res.json();
    const result = json?.responseData?.translatedText as string | undefined;
    if (!result || result.toLowerCase() === text.toLowerCase()) return null;
    return result;
  } catch {
    return null;
  }
}

export default function ChatPanel({ currentUserId, otherUser, onClose, onUnlock }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [showContactShare, setShowContactShare] = useState(false);
  const [contactPlatform, setContactPlatform] = useState<PlatformId>("whatsapp");
  const [contactValue, setContactValue] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  // ── Translation state ────────────────────────────────────────────────────────
  // translationCache: msgId → { translated, original, loading }
  const [translationCache, setTranslationCache] = useState<Record<string, { translated: string; original: string } | "loading">>({});
  // flipped: set of msgIds currently showing original
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  async function requestTranslation(msgId: string, content: string) {
    if (translationCache[msgId]) return; // already cached or loading
    setTranslationCache(prev => ({ ...prev, [msgId]: "loading" }));
    const result = await translateText(content);
    if (result) {
      setTranslationCache(prev => ({ ...prev, [msgId]: { translated: result, original: content } }));
    } else {
      // No translation needed — remove loading entry
      setTranslationCache(prev => { const n = { ...prev }; delete n[msgId]; return n; });
    }
  }

  function toggleFlip(msgId: string) {
    setFlippedIds(prev => {
      const s = new Set(prev);
      s.has(msgId) ? s.delete(msgId) : s.add(msgId);
      return s;
    });
  }

  // Auto-close flipped bubbles on scroll
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handler = () => setFlippedIds(new Set());
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const { balance, deductCoins } = useCoinBalance(currentUserId);

  const handleReport = async (reason: string) => {
    try {
      await (supabase as any).from("message_reports").insert({
        reporter_id: currentUserId,
        reported_id: otherUser.id,
        reason,
      });
      setReportSent(true);
      setShowReport(false);
      toast.success("Report submitted — our team will review within 24h.");
    } catch {
      toast.error("Could not submit report. Try again.");
    }
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, loading, sending, sendMessage } = useMessages(currentUserId, otherUser.id);

  const firstName = otherUser.name.split(" ")[0];
  const online = isOnline(otherUser.last_seen_at);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendContactCard = async () => {
    if (!contactValue.trim() || sendingContact) return;
    if (balance < COINS_CONTACT_SHARE) {
      toast.error(`You need ${COINS_CONTACT_SHARE} coins to share your contact`);
      return;
    }
    setSendingContact(true);
    const ok = await deductCoins(COINS_CONTACT_SHARE, "contact_share");
    if (!ok) {
      toast.error("Not enough coins");
      setSendingContact(false);
      return;
    }
    const card = encodeContactCard({ platform: contactPlatform, value: contactValue.trim(), name: otherUser.name.split(" ")[0] });
    await sendMessage(card);
    setShowContactShare(false);
    setContactValue("");
    setSendingContact(false);
    toast.success("Contact shared! 💬");
  };

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    const preCheck = validateChatMessage(trimmed);
    if (preCheck) { setError(preCheck); return; }
    const err = await sendMessage(trimmed);
    if (err) { setError(err); return; }
    setDraft("");
    setError(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9500,
        background: "rgba(6,6,14,0.99)",
        display: "flex", flexDirection: "column",
        fontFamily: "inherit",
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "52px 16px 14px",
        background: "rgba(255,255,255,0.025)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(255,255,255,0.07)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <ArrowLeft style={{ width: 18, height: 18, color: "rgba(255,255,255,0.7)" }} />
        </button>

        {/* Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img
            src={otherUser.avatar_url || "/placeholder.svg"}
            alt={firstName}
            style={{
              width: 44, height: 44, borderRadius: "50%", objectFit: "cover",
              border: "2px solid rgba(236,72,153,0.4)",
            }}
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
          {online && (
            <span style={{
              position: "absolute", bottom: 1, right: 1,
              width: 10, height: 10, borderRadius: "50%",
              background: "#4ade80", border: "2px solid rgba(6,6,14,0.99)",
            }} />
          )}
        </div>

        {/* Name / status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "white", fontWeight: 800, fontSize: 15, margin: 0, lineHeight: 1.2 }}>
            {firstName}{otherUser.age ? `, ${otherUser.age}` : ""}
          </p>
          <p style={{ color: online ? "#4ade80" : "rgba(255,255,255,0.3)", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>
            {online ? "Online now" : "Chat · unlock WhatsApp when ready"}
          </p>
        </div>

        {/* Video call button */}
        <button
          onClick={() => setShowVideoCall(true)}
          style={{
            width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(56,189,248,0.35)",
            background: "rgba(56,189,248,0.12)", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", flexShrink: 0,
          }}
          title="Start video call"
        >
          <Video style={{ width: 16, height: 16, color: "#38bdf8" }} />
        </button>

        {/* Unlock shortcut */}
        {onUnlock && (
          <button
            onClick={onUnlock}
            style={{
              padding: "8px 16px", borderRadius: 22, border: "none",
              background: "linear-gradient(135deg, #f472b6, #ec4899)",
              color: "white", fontWeight: 800, fontSize: 11,
              cursor: "pointer", flexShrink: 0,
              boxShadow: "0 2px 14px rgba(236,72,153,0.45)",
            }}
          >
            Unlock 🔓
          </button>
        )}
      </div>

      {/* ── Safety bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
        padding: "7px 16px",
        background: "rgba(14,165,233,0.06)",
        borderBottom: "1px solid rgba(14,165,233,0.1)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <ShieldCheck style={{ width: 11, height: 11, color: "rgba(125,211,252,0.65)", flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: "rgba(125,211,252,0.65)", fontWeight: 600 }}>
            Private · No contact info shared
          </span>
        </div>
        {!reportSent ? (
          <button
            onClick={() => setShowReport(true)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "none", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 20, padding: "3px 8px", cursor: "pointer",
              color: "rgba(239,68,68,0.7)", fontSize: 9, fontWeight: 700,
            }}
          >
            <Flag style={{ width: 8, height: 8 }} />
            Is this person real?
          </button>
        ) : (
          <span style={{ fontSize: 9, color: "rgba(74,222,128,0.6)", fontWeight: 600 }}>✓ Reported</span>
        )}
      </div>

      {/* ── Report modal ── */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "flex-end",
            }}
            onClick={() => setShowReport(false)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: "100%", background: "#0c0c14",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "20px 20px 0 0",
                padding: "20px 20px 40px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <p style={{ color: "white", fontWeight: 800, fontSize: 16, margin: 0 }}>
                  Report {firstName}
                </p>
                <button onClick={() => setShowReport(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <X style={{ width: 20, height: 20, color: "rgba(255,255,255,0.4)" }} />
                </button>
              </div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 16px", lineHeight: 1.5 }}>
                Your report is anonymous. Our team reviews all reports within 24 hours.
              </p>
              {[
                { key: "fake_profile", label: "Fake or catfish profile", emoji: "🎭" },
                { key: "suspicious_messages", label: "Suspicious or scam messages", emoji: "⚠️" },
                { key: "money_request", label: "Asking for money or crypto", emoji: "💸" },
                { key: "inappropriate", label: "Inappropriate content", emoji: "🚫" },
                { key: "other", label: "Other concern", emoji: "🔍" },
              ].map(opt => (
                <motion.button
                  key={opt.key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleReport(opt.key)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14, padding: "12px 14px", marginBottom: 8,
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{opt.emoji}</span>
                  <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: 600 }}>{opt.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Message list ── */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1, overflowY: "auto", padding: "16px 16px 8px",
          display: "flex", flexDirection: "column", gap: 6,
        }}
      >
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              border: "2.5px solid rgba(236,72,153,0.3)",
              borderTopColor: "#ec4899",
              animation: "spin 0.8s linear infinite",
            }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", flex: 1, gap: 14, paddingBottom: 40,
          }}>
            <div style={{
              width: 76, height: 76, borderRadius: "50%",
              background: "rgba(236,72,153,0.09)",
              border: "1px solid rgba(236,72,153,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 34,
            }}>
              💌
            </div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, fontWeight: 700, margin: 0, textAlign: "center" }}>
              Say hi to {firstName}
            </p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, margin: 0, textAlign: "center", maxWidth: 240, lineHeight: 1.5 }}>
              Start a real conversation — people respond best to genuine questions
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isMine = msg.sender_id === currentUserId;
              return (
                <React.Fragment key={msg.id}>
                  {shouldShowTimestamp(messages, idx) && (
                    <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.18)", margin: "6px 0 2px" }}>
                      {formatTime(msg.created_at)}
                    </p>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}
                  >
                    {(() => {
                      const card = decodeContactCard(msg.content);
                      if (card) {
                        const plat = PLATFORMS.find(p => p.id === card.platform) ?? PLATFORMS[0];
                        return (
                          <div style={{
                            maxWidth: "82%",
                            background: `linear-gradient(135deg,${plat.color}22,${plat.color}11)`,
                            border: `1.5px solid ${plat.color}55`,
                            borderRadius: 18, padding: "14px 16px",
                            boxShadow: `0 4px 20px ${plat.color}22`,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <span style={{ fontSize: 20 }}>{plat.emoji}</span>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: plat.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                  {plat.label}
                                </div>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                                  Contact shared
                                </div>
                              </div>
                              <div style={{
                                marginLeft: "auto", fontSize: 9, fontWeight: 700,
                                background: "rgba(245,158,11,0.2)", color: "#f59e0b",
                                borderRadius: 20, padding: "2px 7px", border: "1px solid rgba(245,158,11,0.3)",
                              }}>
                                🪙 {COINS_CONTACT_SHARE}
                              </div>
                            </div>
                            <div style={{
                              background: "rgba(255,255,255,0.07)",
                              borderRadius: 10, padding: "9px 12px",
                              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                            }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "white", wordBreak: "break-all" }}>
                                {card.value}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard?.writeText(card.value);
                                  toast.success("Copied!");
                                }}
                                style={{
                                  flexShrink: 0, padding: "5px 10px", borderRadius: 20,
                                  background: plat.color, border: "none",
                                  color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer",
                                }}
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        );
                      }
                      // Trigger translation for incoming messages on first render
                      if (!isMine && !decodeContactCard(msg.content)) {
                        requestTranslation(msg.id, msg.content);
                      }
                      const cache = translationCache[msg.id];
                      const isLoading = cache === "loading";
                      const xlat = cache && cache !== "loading" ? cache : null;
                      const isFlipped = flippedIds.has(msg.id);
                      const displayText = !isMine && xlat && !isFlipped ? xlat.translated : msg.content;

                      return (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", gap: 3, maxWidth: "76%" }}>
                          <motion.div
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.32, ease: "easeInOut" }}
                            onClick={() => xlat && toggleFlip(msg.id)}
                            style={{
                              padding: "10px 14px",
                              borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                              background: isMine
                                ? "linear-gradient(135deg, #f472b6, #ec4899)"
                                : "rgba(255,255,255,0.08)",
                              border: isMine ? "none" : "1px solid rgba(255,255,255,0.1)",
                              color: "white", fontSize: 14, lineHeight: 1.45,
                              wordBreak: "break-word",
                              boxShadow: isMine ? "0 2px 14px rgba(236,72,153,0.28)" : "none",
                              cursor: xlat ? "pointer" : "default",
                            }}
                          >
                            {isLoading
                              ? <span style={{ fontSize: 12, opacity: 0.4, fontStyle: "italic" }}>translating…</span>
                              : displayText
                            }
                          </motion.div>
                          {/* 🌐 flip badge — only on translated incoming messages */}
                          {!isMine && xlat && (
                            <div
                              onClick={() => toggleFlip(msg.id)}
                              style={{
                                display: "flex", alignItems: "center", gap: 3,
                                cursor: "pointer", userSelect: "none",
                                fontSize: 10, color: "rgba(255,255,255,0.3)",
                                padding: "0 4px",
                              }}
                            >
                              <span style={{ fontSize: 12 }}>🌐</span>
                              <span>{isFlipped ? "Show translation" : "Show original"}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </motion.div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ── Input bar ── */}
      <div style={{
        padding: "10px 12px 32px",
        background: "rgba(255,255,255,0.025)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
      }}>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                display: "flex", alignItems: "flex-start", gap: 6,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)",
                borderRadius: 10, padding: "8px 12px", marginBottom: 8, overflow: "hidden",
              }}
            >
              <span style={{ fontSize: 13, flexShrink: 0 }}>⚠️</span>
              <p style={{ color: "#f87171", fontSize: 11, margin: 0, fontWeight: 600, lineHeight: 1.4 }}>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{
            flex: 1,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.11)",
            borderRadius: 22, overflow: "hidden",
          }}>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value.slice(0, 500));
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${firstName}…`}
              rows={1}
              style={{
                width: "100%", background: "transparent", border: "none", outline: "none",
                color: "white", fontSize: 14, padding: "11px 16px",
                resize: "none", fontFamily: "inherit", lineHeight: 1.4,
                maxHeight: 100, overflowY: "auto", boxSizing: "border-box",
              }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            style={{
              width: 44, height: 44, borderRadius: "50%", border: "none",
              background: draft.trim() && !sending
                ? "linear-gradient(135deg, #f472b6, #ec4899)"
                : "rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: draft.trim() && !sending ? "pointer" : "default",
              flexShrink: 0, transition: "all 0.18s",
              boxShadow: draft.trim() && !sending ? "0 2px 14px rgba(236,72,153,0.4)" : "none",
            }}
          >
            {sending ? (
              <div style={{
                width: 16, height: 16, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                animation: "spin 0.8s linear infinite",
              }} />
            ) : (
              <Send style={{ width: 16, height: 16, color: draft.trim() ? "white" : "rgba(255,255,255,0.22)", marginLeft: 1 }} />
            )}
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "0 2px", gap: 8 }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
            <Lock style={{ width: 7, height: 7 }} />
            No numbers · No contact info
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, color: draft.length > 450 ? "#fbbf24" : "rgba(255,255,255,0.14)" }}>
              {draft.length}/500
            </span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowContactShare(true)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "linear-gradient(135deg,rgba(245,158,11,0.18),rgba(249,115,22,0.14))",
                border: "1px solid rgba(245,158,11,0.35)",
                borderRadius: 20, padding: "5px 11px",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 11 }}>🔓</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", whiteSpace: "nowrap" }}>
                Share Contact · {COINS_CONTACT_SHARE} 🪙
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>

    {/* ── Contact share modal ─────────────────────────────────────────────── */}
    <AnimatePresence>
      {showContactShare && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9600,
            background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            padding: "0 0 max(24px,env(safe-area-inset-bottom,24px))",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowContactShare(false); }}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            style={{
              width: "100%", maxWidth: 480,
              background: "rgba(10,10,18,0.98)",
              border: "1.5px solid rgba(245,158,11,0.3)",
              borderRadius: "24px 24px 16px 16px",
              padding: "24px 20px 20px",
              display: "flex", flexDirection: "column", gap: 16,
              boxShadow: "0 0 48px rgba(245,158,11,0.12), 0 24px 48px rgba(0,0,0,0.7)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "white" }}>🔓 Share Your Contact</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                  {firstName} will receive your details — costs <span style={{ color: "#f59e0b", fontWeight: 700 }}>{COINS_CONTACT_SHARE} coins</span>
                </div>
              </div>
              <button onClick={() => setShowContactShare(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: 22, lineHeight: 1 }}>
                ×
              </button>
            </div>

            {/* Coin balance */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: balance >= COINS_CONTACT_SHARE ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${balance >= COINS_CONTACT_SHARE ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)"}`,
              borderRadius: 12, padding: "10px 14px",
            }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Your balance</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: balance >= COINS_CONTACT_SHARE ? "#f59e0b" : "#f87171" }}>
                🪙 {balance} coins
              </span>
            </div>

            {/* Platform selector */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                Platform
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {PLATFORMS.map(p => (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setContactPlatform(p.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 12px", borderRadius: 14, cursor: "pointer",
                      background: contactPlatform === p.id ? `${p.color}22` : "rgba(255,255,255,0.04)",
                      border: contactPlatform === p.id ? `1.5px solid ${p.color}66` : "1px solid rgba(255,255,255,0.08)",
                      transition: "all 0.18s",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{p.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: contactPlatform === p.id ? p.color : "rgba(255,255,255,0.6)" }}>
                      {p.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Contact input */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                Your {PLATFORMS.find(p => p.id === contactPlatform)?.label} details
              </div>
              <input
                type="text"
                value={contactValue}
                onChange={e => setContactValue(e.target.value)}
                placeholder={PLATFORMS.find(p => p.id === contactPlatform)?.placeholder}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14,
                  padding: "12px 14px", color: "white", fontSize: 15,
                  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                }}
              />
            </div>

            {/* Send button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSendContactCard}
              disabled={!contactValue.trim() || sendingContact || balance < COINS_CONTACT_SHARE}
              style={{
                width: "100%", padding: "14px", borderRadius: 50, border: "none",
                background: contactValue.trim() && balance >= COINS_CONTACT_SHARE
                  ? "linear-gradient(135deg,#f59e0b,#f97316)"
                  : "rgba(245,158,11,0.15)",
                color: "white", fontSize: 15, fontWeight: 800,
                cursor: contactValue.trim() && balance >= COINS_CONTACT_SHARE ? "pointer" : "not-allowed",
                boxShadow: contactValue.trim() && balance >= COINS_CONTACT_SHARE
                  ? "0 4px 24px rgba(245,158,11,0.4)" : "none",
                transition: "all 0.2s",
              }}
            >
              {sendingContact ? "Sending…" : balance < COINS_CONTACT_SHARE
                ? `Need ${COINS_CONTACT_SHARE - balance} more coins`
                : `🔓 Send for ${COINS_CONTACT_SHARE} coins`}
            </motion.button>

            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
              Only {firstName} will see this. You control what you share.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Video call overlay */}
    <AnimatePresence>
      {showVideoCall && (
        <VideoCallPanel
          currentUserId={currentUserId}
          otherProfile={{ id: otherUser.id, name: otherUser.name, avatar_url: otherUser.avatar_url ?? null }}
          onClose={() => setShowVideoCall(false)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
