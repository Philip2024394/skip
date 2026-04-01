import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, ShieldCheck, Lock, Video, Flag, X } from "lucide-react";
import { useMessages, validateChatMessage } from "@/shared/hooks/useMessages";
import { pushMessageReceived } from "@/shared/utils/pushNotify";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import VideoCallPanel from "@/features/video/components/VideoCallPanel";
import ContactRevealModal, { PLATFORMS_ALL, PlatformId } from "./ContactRevealModal";
import TeddyRoomModal from "./TeddyRoomModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCoinBalance } from "@/shared/hooks/useCoinBalance";

// ── Teddy Room invite helpers ─────────────────────────────────────────────────
const TEDDY_INVITE_PREFIX = "__TEDDY_INVITE__";
interface TeddyInvitePayload { inviteId: string; checkoutUrl: string; }
function encodeTeddyInvite(payload: TeddyInvitePayload): string {
  return TEDDY_INVITE_PREFIX + JSON.stringify(payload);
}
function decodeTeddyInvite(content: string): TeddyInvitePayload | null {
  if (!content.startsWith(TEDDY_INVITE_PREFIX)) return null;
  try { return JSON.parse(content.slice(TEDDY_INVITE_PREFIX.length)); }
  catch { return null; }
}

interface TeddyRoomInvite {
  id: string;
  room_owner_id: string;
  invited_user_id: string;
  status: "pending" | "accepted" | "declined" | "expired";
  expires_at: string | null;
}

// ── Contact card helpers ───────────────────────────────────────────────────────

const CONTACT_CARD_PREFIX = "__CONTACT_CARD__";
const COINS_CONTACT_REVEAL = 20;

// Placeholders per platform
const PLATFORM_PLACEHOLDER: Record<string, string> = {
  whatsapp:  "+62 812 3456 7890",
  telegram:  "@username",
  instagram: "@your_handle",
  tiktok:    "@your_handle",
  snapchat:  "@username",
  phone:     "+62 812 3456 7890",
  line:      "line_id",
  wechat:    "wechat_id",
  signal:    "+1 234 567 8900",
  facebook:  "profile.name",
};

interface ContactCard { platform: PlatformId; value: string; name: string; }

function encodeContactCard(card: ContactCard): string {
  return CONTACT_CARD_PREFIX + JSON.stringify(card);
}

function decodeContactCard(content: string): ContactCard | null {
  if (!content.startsWith(CONTACT_CARD_PREFIX)) return null;
  try { return JSON.parse(content.slice(CONTACT_CARD_PREFIX.length)); }
  catch { return null; }
}

// DEV flag
const IS_DEV = import.meta.env.DEV;


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

  // Reveal state
  const [revealCard, setRevealCard] = useState<{ msgId: string; card: ContactCard } | null>(null);
  const [revealedCards, setRevealedCards] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(`rc_${currentUserId}_${otherUser.id}`);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  // DEV: platform picker for the test banner
  const [devPlatform, setDevPlatform] = useState<PlatformId>("whatsapp");

  // ── Teddy Room state ─────────────────────────────────────────────────────────
  const [hasTeddyRoom, setHasTeddyRoom] = useState(false);
  const [teddyInvite, setTeddyInvite] = useState<TeddyRoomInvite | null>(null);
  const [sendingTeddyInvite, setSendingTeddyInvite] = useState(false);
  const [showTeddyRoom, setShowTeddyRoom] = useState(false);

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

  // ── Load teddy room status ───────────────────────────────────────────────────
  useEffect(() => {
    const loadTeddy = async () => {
      // Check if current user owns a Teddy Room
      const { data: prof } = await (supabase.from("profiles") as any)
        .select("teddy_room_active")
        .eq("id", currentUserId)
        .maybeSingle();
      setHasTeddyRoom(!!prof?.teddy_room_active);

      // Check for existing invite between these two users (either direction)
      const { data: invite } = await (supabase as any).from("teddy_room_invites")
        .select("*")
        .or(`and(room_owner_id.eq.${currentUserId},invited_user_id.eq.${otherUser.id}),and(room_owner_id.eq.${otherUser.id},invited_user_id.eq.${currentUserId})`)
        .not("status", "eq", "declined")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (invite) setTeddyInvite(invite as TeddyRoomInvite);
    };
    loadTeddy();
  }, [currentUserId, otherUser.id]);

  // ── Send Teddy Room invite ───────────────────────────────────────────────────
  const handleSendTeddyInvite = async () => {
    if (sendingTeddyInvite) return;
    setSendingTeddyInvite(true);
    try {
      const { data, error } = await (supabase.functions as any).invoke("create-teddy-invite", {
        body: { invitedUserId: otherUser.id },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Could not send invite");
        return;
      }
      setTeddyInvite({ id: data.inviteId, room_owner_id: currentUserId, invited_user_id: otherUser.id, status: "pending", expires_at: null });
      await sendMessage(encodeTeddyInvite({ inviteId: data.inviteId, checkoutUrl: data.checkoutUrl }));
      toast.success(`Teddy Room invite sent to ${firstName}! 🐻`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite");
    } finally {
      setSendingTeddyInvite(false);
    }
  };

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

  const markRevealed = (msgId: string) => {
    setRevealedCards(prev => {
      const next = new Set(prev);
      next.add(msgId);
      try {
        localStorage.setItem(`rc_${currentUserId}_${otherUser.id}`, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const handleRevealContact = async (msgId: string, card: ContactCard) => {
    if (balance < COINS_CONTACT_REVEAL) {
      toast.error(`You need ${COINS_CONTACT_REVEAL} coins to reveal this contact`);
      return;
    }
    const ok = await deductCoins(COINS_CONTACT_REVEAL, "contact_reveal");
    if (!ok) { toast.error("Not enough coins"); return; }
    markRevealed(msgId);
    setRevealCard({ msgId, card });
  };

  const handleSendContactCard = async () => {
    if (!contactValue.trim() || sendingContact) return;
    setSendingContact(true);
    // Sender shares for free — receiver pays to reveal
    const card = encodeContactCard({
      platform: contactPlatform,
      value: contactValue.trim(),
      name: otherUser.name.split(" ")[0],
    });
    await sendMessage(card);
    setShowContactShare(false);
    setContactValue("");
    setSendingContact(false);
    toast.success("Contact shared! They'll need coins to reveal it. 💬");
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
    // Push notify the receiver (no-op if they're active in the app)
    pushMessageReceived(otherUser.id, otherUser.name?.split(" ")[0] ?? "Someone", trimmed);
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
                width: "100%",
                borderRadius: "20px 20px 0 0",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Background image */}
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: "url('https://ik.imagekit.io/dateme/Untitledsdfasdfsd.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }} />
              {/* Dark overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.62)",
                backdropFilter: "blur(2px)",
              }} />
              {/* Content */}
              <div style={{ position: "relative", zIndex: 1, padding: "20px 20px 40px" }}>
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
                      background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 14, padding: "12px 14px", marginBottom: 8,
                      cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{opt.emoji}</span>
                    <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 600 }}>{opt.label}</span>
                  </motion.button>
                ))}
              </div>
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
                      // ── Teddy Room invite card ──────────────────────────────
                      const teddyPayload = decodeTeddyInvite(msg.content);
                      if (teddyPayload) {
                        const inviteAccepted = teddyInvite?.status === "accepted";
                        return (
                          <div style={{
                            maxWidth: "84%",
                            background: "linear-gradient(135deg,rgba(168,85,247,0.18),rgba(124,58,237,0.12))",
                            border: "1.5px solid rgba(168,85,247,0.4)",
                            borderRadius: 18, padding: "14px 16px",
                            boxShadow: "0 4px 20px rgba(168,85,247,0.18)",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                              <span style={{ fontSize: 24 }}>🐻</span>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: "#c084fc", letterSpacing: "0.05em" }}>
                                  TEDDY ROOM INVITE
                                </div>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                                  {isMine ? `You invited ${firstName} · $2.99/mo` : `${firstName} invited you · $2.99/mo`}
                                </div>
                              </div>
                            </div>
                            {inviteAccepted ? (
                              <button
                                onClick={() => setShowTeddyRoom(true)}
                                style={{
                                  width: "100%", padding: "10px", borderRadius: 12, border: "none",
                                  background: "linear-gradient(135deg,#a855f7,#7c3aed)",
                                  color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer",
                                  boxShadow: "0 0 16px rgba(168,85,247,0.4)",
                                }}
                              >
                                🐻 Open Teddy Room
                              </button>
                            ) : isMine ? (
                              <div style={{
                                padding: "9px 12px", borderRadius: 10, textAlign: "center",
                                background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)",
                                fontSize: 12, color: "rgba(255,255,255,0.45)",
                              }}>
                                ⏳ Waiting for {firstName} to join…
                              </div>
                            ) : (
                              <button
                                onClick={() => { window.location.href = teddyPayload.checkoutUrl; }}
                                style={{
                                  width: "100%", padding: "10px", borderRadius: 12, border: "none",
                                  background: "linear-gradient(135deg,#a855f7,#7c3aed)",
                                  color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer",
                                  boxShadow: "0 0 16px rgba(168,85,247,0.4)",
                                }}
                              >
                                🐻 Join for $2.99/mo
                              </button>
                            )}
                          </div>
                        );
                      }

                      const card = decodeContactCard(msg.content);
                      if (card) {
                        const plat = PLATFORMS_ALL.find(p => p.id === card.platform) ?? PLATFORMS_ALL[0];
                        const isRevealed = isMine || revealedCards.has(msg.id);
                        return (
                          <div style={{
                            maxWidth: "82%",
                            background: `linear-gradient(135deg,${plat.color}22,${plat.color}11)`,
                            border: `1.5px solid ${plat.color}55`,
                            borderRadius: 18, padding: "14px 16px",
                            boxShadow: `0 4px 20px ${plat.color}22`,
                          }}>
                            {/* Header row */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <span style={{ fontSize: 20 }}>{plat.emoji}</span>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: plat.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                  {plat.label}
                                </div>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                                  {isMine ? "You shared your contact" : `${card.name} shared their contact`}
                                </div>
                              </div>
                              {!isMine && !isRevealed && (
                                <div style={{
                                  marginLeft: "auto", fontSize: 9, fontWeight: 700,
                                  background: "rgba(245,158,11,0.2)", color: "#f59e0b",
                                  borderRadius: 20, padding: "2px 7px", border: "1px solid rgba(245,158,11,0.3)",
                                }}>
                                  🪙 {COINS_CONTACT_REVEAL}
                                </div>
                              )}
                            </div>

                            {/* Value row — locked or revealed */}
                            {isRevealed ? (
                              <div style={{
                                background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "9px 12px",
                                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                              }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "white", wordBreak: "break-all" }}>
                                  {card.value}
                                </span>
                                <button
                                  onClick={() => { navigator.clipboard?.writeText(card.value); toast.success("Copied!"); }}
                                  style={{
                                    flexShrink: 0, padding: "5px 10px", borderRadius: 20,
                                    background: plat.color, border: "none",
                                    color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer",
                                  }}
                                >
                                  Copy
                                </button>
                              </div>
                            ) : (
                              /* Locked — receiver must pay to reveal */
                              <button
                                onClick={() => handleRevealContact(msg.id, card)}
                                style={{
                                  width: "100%", borderRadius: 10, padding: "11px 14px", border: "none",
                                  background: `linear-gradient(135deg,${plat.color}33,${plat.color}18)`,
                                  cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                                }}
                              >
                                {/* Blurred placeholder */}
                                <span style={{
                                  flex: 1, fontSize: 14, fontWeight: 700, color: "white",
                                  filter: "blur(5px)", userSelect: "none", textAlign: "left",
                                }}>
                                  +62 812 •••• ••••
                                </span>
                                <span style={{
                                  flexShrink: 0, fontSize: 11, fontWeight: 800, color: "#f59e0b",
                                  background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.4)",
                                  borderRadius: 20, padding: "4px 10px", whiteSpace: "nowrap",
                                }}>
                                  👁 Reveal · {COINS_CONTACT_REVEAL} 🪙
                                </span>
                              </button>
                            )}
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
            {/* Teddy Room button — show invite option or open room */}
            {teddyInvite?.status === "accepted" ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTeddyRoom(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "linear-gradient(135deg,rgba(168,85,247,0.22),rgba(124,58,237,0.16))",
                  border: "1px solid rgba(168,85,247,0.45)",
                  borderRadius: 20, padding: "5px 11px",
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 11 }}>🐻</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#c084fc", whiteSpace: "nowrap" }}>Our Room</span>
              </motion.button>
            ) : hasTeddyRoom && !teddyInvite ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSendTeddyInvite}
                disabled={sendingTeddyInvite}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "linear-gradient(135deg,rgba(168,85,247,0.22),rgba(124,58,237,0.16))",
                  border: "1px solid rgba(168,85,247,0.45)",
                  borderRadius: 20, padding: "5px 11px",
                  cursor: sendingTeddyInvite ? "default" : "pointer", flexShrink: 0,
                  opacity: sendingTeddyInvite ? 0.6 : 1,
                }}
              >
                <span style={{ fontSize: 11 }}>🐻</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#c084fc", whiteSpace: "nowrap" }}>
                  {sendingTeddyInvite ? "Inviting…" : "Invite to Room"}
                </span>
              </motion.button>
            ) : null}

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
                Share Contact 🔓
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
              maxHeight: "88dvh", overflowY: "auto",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "white" }}>🔓 Share Your Contact</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                  {firstName} pays coins to reveal — you share for free
                </div>
              </div>
              <button onClick={() => setShowContactShare(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: 22, lineHeight: 1 }}>
                ×
              </button>
            </div>

            {/* Platform selector — full grid */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
                Choose platform
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {PLATFORMS_ALL.map(p => (
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
                Your {PLATFORMS_ALL.find(p => p.id === contactPlatform)?.label} details
              </div>
              <input
                type="text"
                value={contactValue}
                onChange={e => setContactValue(e.target.value)}
                placeholder={PLATFORM_PLACEHOLDER[contactPlatform] ?? "Enter your details"}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14,
                  padding: "12px 14px", color: "white", fontSize: 15,
                  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                }}
              />
            </div>

            {/* Send button — free for sender */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSendContactCard}
              disabled={!contactValue.trim() || sendingContact}
              style={{
                width: "100%", padding: "14px", borderRadius: 50, border: "none",
                background: contactValue.trim()
                  ? "linear-gradient(135deg,#f59e0b,#f97316)"
                  : "rgba(245,158,11,0.15)",
                color: "white", fontSize: 15, fontWeight: 800,
                cursor: contactValue.trim() ? "pointer" : "not-allowed",
                boxShadow: contactValue.trim() ? "0 4px 24px rgba(245,158,11,0.4)" : "none",
                transition: "all 0.2s",
              }}
            >
              {sendingContact ? "Sending…" : "🔓 Share My Contact"}
            </motion.button>

            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
              You share for free — {firstName} spends {COINS_CONTACT_REVEAL} coins to reveal it. You control what you share.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* ── Teddy Room Modal ────────────────────────────────────────────────── */}
    <AnimatePresence>
      {showTeddyRoom && teddyInvite && (
        <TeddyRoomModal
          userId={currentUserId}
          partnerId={otherUser.id}
          partnerName={firstName}
          partnerAvatar={otherUser.avatar_url ?? undefined}
          invite={teddyInvite}
          onClose={() => setShowTeddyRoom(false)}
        />
      )}
    </AnimatePresence>

    {/* ── Contact Reveal Modal ─────────────────────────────────────────────── */}
    <AnimatePresence>
      {revealCard && (
        <ContactRevealModal
          platform={revealCard.card.platform}
          value={revealCard.card.value}
          senderName={revealCard.card.name}
          onClose={() => setRevealCard(null)}
        />
      )}
    </AnimatePresence>

    {/* ── DEV: inject a fake received card to test the full reveal flow ─── */}
    {IS_DEV && (
      <div style={{
        position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
        zIndex: 9800, display: "flex", alignItems: "center", gap: 6,
        background: "rgba(220,38,38,0.92)", border: "1.5px solid rgba(255,80,80,0.7)",
        borderRadius: 24, padding: "6px 10px 6px 14px",
        boxShadow: "0 4px 20px rgba(220,38,38,0.45)",
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: "white", letterSpacing: "0.06em" }}>🧪 DEV</span>
        <select
          value={devPlatform}
          onChange={e => setDevPlatform(e.target.value as PlatformId)}
          style={{
            background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8, color: "white", fontSize: 11, padding: "3px 6px", cursor: "pointer",
          }}
        >
          {PLATFORMS_ALL.map(p => (
            <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>
          ))}
        </select>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const plat = PLATFORMS_ALL.find(p => p.id === devPlatform) ?? PLATFORMS_ALL[0];
            const fakeCard: ContactCard = { platform: devPlatform, value: plat.id === "instagram" ? "@testuser" : "+62 812 3456 7890", name: firstName };
            setRevealCard({ msgId: "dev-test", card: fakeCard });
          }}
          style={{
            background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
            color: "white", fontSize: 11, fontWeight: 700, padding: "4px 10px", cursor: "pointer",
          }}
        >
          Test Reveal
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const plat = PLATFORMS_ALL.find(p => p.id === devPlatform) ?? PLATFORMS_ALL[0];
            const fakeCard: ContactCard = { platform: devPlatform, value: plat.id === "instagram" ? "@testuser" : "+62 812 3456 7890", name: firstName };
            const encoded = encodeContactCard(fakeCard);
            sendMessage(encoded);
          }}
          style={{
            background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
            color: "white", fontSize: 11, fontWeight: 700, padding: "4px 10px", cursor: "pointer",
          }}
        >
          Inject Card
        </motion.button>
      </div>
    )}

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
