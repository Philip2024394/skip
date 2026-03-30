import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useCoinBalance } from "@/shared/hooks/useCoinBalance";
import ChatPanel from "@/features/messaging/components/ChatPanel";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Conversation {
  partner_id: string;
  partner_name: string;
  partner_avatar: string | null;
  partner_age: number;
  partner_city: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_sender: boolean;
  last_seen_at?: string | null;
}

interface BlindQuestion {
  question_id: string;
  asker_id: string;
  asker_name: string;
  asker_avatar: string | null;
  asker_age: number;
  question: string;
  answer: string | null;
  created_at: string;
  last_seen_at?: string | null;
}

interface Like {
  like_id: string;
  liker_id: string;
  liker_name: string;
  liker_avatar: string | null;
  liker_age: number;
  liker_city: string | null;
  is_rose: boolean;
  created_at: string;
  is_mutual: boolean;
  last_seen_at?: string | null;
}

interface Gift {
  id: string;
  sender_id: string;
  sender_name: string;
  gift_name: string;
  gift_emoji: string;
  message: string | null;
  created_at: string;
  status: string;
  last_seen_at?: string | null;
}

type Tab = "all" | "chats" | "blind" | "likes";

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// Online: <5m, Recent: <60m, Offline: else
function onlineStatus(lastSeen?: string | null): "online" | "recent" | "offline" {
  if (!lastSeen) return "offline";
  const mins = (Date.now() - new Date(lastSeen).getTime()) / 60000;
  if (mins < 5)  return "online";
  if (mins < 60) return "recent";
  return "offline";
}

function OnlineDot({ lastSeen, size = 10 }: { lastSeen?: string | null; size?: number }) {
  const s = onlineStatus(lastSeen);
  const color = s === "online" ? "#22c55e" : s === "recent" ? "#f59e0b" : "rgba(255,255,255,0.2)";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color,
      border: `2px solid rgba(6,4,15,0.9)`,
      boxShadow: s === "online" ? `0 0 6px ${color}` : "none",
      flexShrink: 0,
    }} />
  );
}

function Avatar({
  src, name, size = 44, lastSeen, blur = false,
}: {
  src: string | null; name: string; size?: number;
  lastSeen?: string | null; blur?: boolean;
}) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%", overflow: "hidden",
        background: "rgba(194,24,91,0.25)",
        border: "1.5px solid rgba(255,255,255,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {src ? (
          <img src={src} alt={name} style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: blur ? "blur(8px)" : "none",
            transform: blur ? "scale(1.15)" : "none",
          }} />
        ) : (
          <span style={{ fontSize: size * 0.38, color: "rgba(255,255,255,0.6)" }}>{name[0]}</span>
        )}
      </div>
      {lastSeen !== undefined && (
        <div style={{ position: "absolute", bottom: 0, right: 0 }}>
          <OnlineDot lastSeen={lastSeen} size={11} />
        </div>
      )}
    </div>
  );
}

// ── Feature landscape card ─────────────────────────────────────────────────────

function FeatureCard({
  icon, color, label, count, subtitle, onSeeAll, children,
}: {
  icon: string; color: string; label: string;
  count?: number; subtitle?: string;
  onSeeAll?: () => void; children?: React.ReactNode;
}) {
  return (
    <div style={{ margin: "0 0 14px" }}>
      {/* Card header */}
      <motion.div
        whileTap={onSeeAll ? { scale: 0.99 } : {}}
        onClick={onSeeAll}
        style={{
          display: "flex", alignItems: "center", gap: 13,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(20px)",
          border: `1px solid rgba(255,255,255,0.08)`,
          borderBottom: children ? "1px solid rgba(255,255,255,0.05)" : undefined,
          borderRadius: children ? "18px 18px 0 0" : 18,
          padding: "14px 16px",
          cursor: onSeeAll ? "pointer" : "default",
        }}
      >
        {/* Icon circle */}
        <div style={{
          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
          background: `${color}22`,
          border: `1.5px solid ${color}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
          boxShadow: `0 0 16px ${color}18`,
        }}>
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 800, color: "white",
            letterSpacing: "-0.01em",
          }}>
            {label}
            {count !== undefined && count > 0 && (
              <span style={{
                marginLeft: 8, display: "inline-flex",
                alignItems: "center", justifyContent: "center",
                background: `linear-gradient(135deg,#c2185b,#e91e8c)`,
                borderRadius: 20, padding: "1px 8px",
                fontSize: 10, fontWeight: 800, color: "white",
                verticalAlign: "middle",
                boxShadow: "0 0 8px rgba(233,30,140,0.4)",
              }}>
                {count > 99 ? "99+" : count}
              </span>
            )}
          </div>
          {subtitle && (
            <div style={{
              fontSize: 11, color: "rgba(255,255,255,0.38)",
              marginTop: 2, whiteSpace: "nowrap", overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {subtitle}
            </div>
          )}
        </div>

        {onSeeAll && (
          <div style={{
            fontSize: 11, color: "rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", gap: 3, flexShrink: 0,
          }}>
            See all <span style={{ fontSize: 14 }}>›</span>
          </div>
        )}
      </motion.div>

      {/* Card body */}
      {children && (
        <div style={{
          background: "rgba(0,0,0,0.42)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderTop: "none",
          borderRadius: "0 0 18px 18px",
          overflow: "hidden",
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Activity row inside a card ─────────────────────────────────────────────────

function ActivityRow({
  avatar, name, lastSeen, primary, secondary, time, badge, onClick, isLast = false,
}: {
  avatar: string | null; name: string; lastSeen?: string | null;
  primary: string; secondary?: string;
  time: string; badge?: React.ReactNode;
  onClick?: () => void; isLast?: boolean;
}) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.99 } : {}}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "11px 16px",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <Avatar src={avatar} name={name} size={40} lastSeen={lastSeen} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
            {name.split(" ")[0]}
          </span>
          {lastSeen !== undefined && (
            <span style={{
              fontSize: 9, fontWeight: 600,
              color: onlineStatus(lastSeen) === "online"
                ? "#22c55e"
                : onlineStatus(lastSeen) === "recent"
                  ? "#f59e0b"
                  : "rgba(255,255,255,0.25)",
            }}>
              {onlineStatus(lastSeen) === "online"
                ? "● Online"
                : onlineStatus(lastSeen) === "recent"
                  ? "● Recently"
                  : ""}
            </span>
          )}
        </div>
        <div style={{
          fontSize: 12, color: "rgba(255,255,255,0.45)",
          marginTop: 1, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {primary}
        </div>
        {secondary && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>
            {secondary}
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{time}</span>
        {badge}
      </div>
    </motion.div>
  );
}

// ── Answer modal ───────────────────────────────────────────────────────────────

function AnswerModal({ q, userId, onDone }: { q: BlindQuestion; userId: string; onDone: () => void }) {
  const [answer, setAnswer] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!answer.trim() || sending) return;
    setSending(true);
    await supabase.rpc("answer_blind_date_question" as any, {
      p_question_id: q.question_id,
      p_answer: answer.trim(),
      p_user_id: userId,
    });
    setSending(false);
    onDone();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9900,
        background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: `0 16px max(28px,env(safe-area-inset-bottom,28px))`,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onDone(); }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        style={{
          width: "100%", maxWidth: 460,
          background: "rgba(8,6,18,0.99)",
          border: "1.5px solid rgba(194,24,91,0.4)",
          borderRadius: 28, overflow: "hidden",
          boxShadow: "0 0 60px rgba(194,24,91,0.2)",
        }}
      >
        <div style={{ padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar src={q.asker_avatar} name={q.asker_name} size={40} lastSeen={q.last_seen_at} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                {q.asker_name.split(" ")[0]}<span style={{ fontWeight: 400, fontSize: 13, color: "rgba(255,255,255,0.45)", marginLeft: 6 }}>{q.asker_age}</span>
              </div>
              <div style={{ fontSize: 10, color: "rgba(236,72,153,0.8)", fontWeight: 700 }}>💘 Passed your quiz</div>
            </div>
          </div>

          <div style={{
            background: "rgba(194,24,91,0.08)", border: "1px solid rgba(194,24,91,0.2)",
            borderRadius: 14, padding: "12px 14px",
            fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.55, fontStyle: "italic",
          }}>
            "{q.question}"
          </div>

          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value.slice(0, 200))}
            placeholder="Write your answer…"
            rows={3}
            style={{
              width: "100%", padding: "12px 14px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14, color: "white", fontSize: 13,
              resize: "none", outline: "none", fontFamily: "inherit",
              lineHeight: 1.5, boxSizing: "border-box",
            }}
          />

          <motion.button
            whileTap={{ scale: 0.97 }} onClick={handleSend}
            disabled={!answer.trim() || sending}
            style={{
              width: "100%", padding: "14px", borderRadius: 50,
              background: answer.trim() ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "rgba(194,24,91,0.15)",
              border: "none", color: "white", fontSize: 14, fontWeight: 800,
              cursor: answer.trim() ? "pointer" : "not-allowed",
              boxShadow: answer.trim() ? "0 4px 20px rgba(194,24,91,0.4)" : "none",
            }}
          >
            {sending ? "Sending…" : "Send my answer 💌"}
          </motion.button>

          <button onClick={onDone} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer" }}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// InboxPage
// ══════════════════════════════════════════════════════════════════════════════

export default function InboxPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [questions,     setQuestions]     = useState<BlindQuestion[]>([]);
  const [likes,         setLikes]         = useState<Like[]>([]);
  const [gifts,         setGifts]         = useState<Gift[]>([]);
  const [viewerCount,   setViewerCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [chatWith,      setChatWith]      = useState<Conversation | null>(null);
  const [answerQ,       setAnswerQ]       = useState<BlindQuestion | null>(null);

  useCoinBalance(userId ?? undefined);

  // ProtectedRoute already guards — just grab userId once
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setLoading(false); // no session — stop spinner so cards still render
      }
    });
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Wrap each query so a missing RPC/table never blocks the whole load
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safe = (p: any): Promise<{ data: any }> =>
      Promise.resolve(p).then((r: any) => r ?? { data: null }).catch(() => ({ data: null }));

    try {
      const [convRes, qRes, likeRes, giftRes, viewRes] = await Promise.all([
        safe(supabase.rpc("get_conversations" as any, { p_user_id: userId })),
        safe(supabase.rpc("get_received_blind_date_questions" as any, { p_user_id: userId })),
        safe(supabase.rpc("get_received_likes" as any, { p_user_id: userId })),
        safe(
          (supabase as any)
            .from("sent_gifts")
            .select("id, sender_id, sender_name, gift_name, gift_emoji, message, created_at, status")
            .eq("recipient_id", userId)
            .order("created_at", { ascending: false })
            .limit(5)
        ),
        safe(supabase.rpc("get_who_viewed_me" as any, { p_user_id: userId })),
      ]);

      setConversations((convRes.data as Conversation[]) || []);
      setQuestions((qRes.data as BlindQuestion[]) || []);
      setLikes((likeRes.data as Like[]) || []);
      setGifts((giftRes.data as Gift[]) || []);
      setViewerCount((viewRes.data as any[])?.length ?? 0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Derived counts
  const unreadChats    = conversations.filter(c => c.unread_count > 0).length;
  const unansweredQs   = questions.filter(q => !q.answer).length;
  const newLikes       = likes.length;
  const newGifts       = gifts.filter(g => g.status === "pending").length;
  const totalBadge     = unreadChats + unansweredQs + newLikes + newGifts;

  const tabs: { key: Tab; label: string; emoji: string; count?: number }[] = [
    { key: "all",   label: "All",        emoji: "✨", count: totalBadge || undefined },
    { key: "chats", label: "Chats",      emoji: "💬", count: unreadChats || undefined },
    { key: "blind", label: "Blind Date", emoji: "💘", count: unansweredQs || undefined },
    { key: "likes", label: "Likes",      emoji: "♥",  count: newLikes || undefined },
  ];

  const showChats  = tab === "all" || tab === "chats";
  const showBlinds = tab === "all" || tab === "blind";
  const showLikes  = tab === "all" || tab === "likes";
  const showGifts  = tab === "all";

  return (
    <div style={{
      position: "fixed", inset: 0,
      backgroundImage: "url('/images/app-background.png')",
      backgroundSize: "cover", backgroundPosition: "center",
      display: "flex", flexDirection: "column",
      fontFamily: "inherit", color: "white",
    }}>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{
          padding: `max(18px,env(safe-area-inset-top,18px)) 18px 12px`,
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(20px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            {/* Title + back */}
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate("/home")}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "white", fontSize: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                }}
              >🏠</motion.button>
              <div>
                <div style={{
                  fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em",
                  background: "linear-gradient(90deg,white 40%,rgba(236,72,153,0.8))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  💎 Inbox
                </div>
              </div>
            </div>

          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {tabs.map(t => (
              <motion.button
                key={t.key} whileTap={{ scale: 0.95 }}
                onClick={() => setTab(t.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 14px", borderRadius: 50, cursor: "pointer", flexShrink: 0,
                  background: tab === t.key ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "rgba(255,255,255,0.07)",
                  border: tab === t.key ? "none" : "1px solid rgba(255,255,255,0.1)",
                  boxShadow: tab === t.key ? "0 3px 14px rgba(194,24,91,0.35)" : "none",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 12 }}>{t.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: tab === t.key ? "white" : "rgba(255,255,255,0.6)" }}>
                  {t.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: `14px 14px max(24px,env(safe-area-inset-bottom,24px))`,
        }}>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 280, gap: 14 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(194,24,91,0.2)", borderTopColor: "#c2185b" }}
              />
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Loading your inbox…</div>
            </div>
          ) : (
            <>

              {/* ── Messages ─────────────────────────────────────────── */}
              {showChats && (
                <FeatureCard
                  icon="💬" color="#e91e8c" label="Messages"
                  count={unreadChats}
                  subtitle={
                    conversations.length === 0
                      ? "No conversations yet"
                      : `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}${unreadChats ? ` · ${unreadChats} unread` : ""}`
                  }
                  onSeeAll={conversations.length > 0 ? () => setTab("chats") : undefined}
                >
                  {conversations.length === 0 ? (
                    <div style={{ padding: "16px 18px", fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                      Match with someone to start chatting
                    </div>
                  ) : (
                    conversations.slice(0, 4).map((c, i) => (
                      <ActivityRow
                        key={c.partner_id}
                        avatar={c.partner_avatar}
                        name={c.partner_name}
                        lastSeen={c.last_seen_at}
                        primary={
                          c.last_message.startsWith("__CONTACT_CARD__")
                            ? "📇 Shared a contact card"
                            : (c.is_sender ? "You: " : "") + truncate(c.last_message, 42)
                        }
                        time={timeAgo(c.last_message_at)}
                        onClick={() => setChatWith(c)}
                        isLast={i === Math.min(conversations.length, 4) - 1}
                        badge={c.unread_count > 0 ? (
                          <div style={{
                            background: "linear-gradient(135deg,#c2185b,#e91e8c)",
                            borderRadius: "50%", width: 20, height: 20,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 9, fontWeight: 800, color: "white",
                            boxShadow: "0 0 8px rgba(233,30,140,0.4)",
                          }}>
                            {c.unread_count > 9 ? "9+" : c.unread_count}
                          </div>
                        ) : undefined}
                      />
                    ))
                  )}
                </FeatureCard>
              )}

              {/* ── Blind Date Questions ──────────────────────────────── */}
              {showBlinds && (
                <FeatureCard
                  icon="💘" color="#c2185b" label="Blind Date"
                  count={unansweredQs}
                  subtitle={
                    questions.length === 0
                      ? "No blind date questions yet"
                      : `${questions.length} question${questions.length !== 1 ? "s" : ""} received${unansweredQs ? ` · ${unansweredQs} waiting` : ""}`
                  }
                  onSeeAll={questions.length > 0 ? () => setTab("blind") : undefined}
                >
                  {questions.length === 0 ? (
                    <div style={{ padding: "16px 18px", fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                      When someone passes your quiz and sends a question, it shows here
                    </div>
                  ) : (
                    questions.slice(0, 3).map((q, i) => (
                      <ActivityRow
                        key={q.question_id}
                        avatar={q.asker_avatar}
                        name={q.asker_name}
                        lastSeen={q.last_seen_at}
                        primary={`"${truncate(q.question, 44)}"`}
                        secondary={q.answer ? `You answered: "${truncate(q.answer, 30)}"` : undefined}
                        time={timeAgo(q.created_at)}
                        onClick={!q.answer ? () => setAnswerQ(q) : undefined}
                        isLast={i === Math.min(questions.length, 3) - 1}
                        badge={!q.answer ? (
                          <div style={{
                            background: "linear-gradient(135deg,#c2185b,#e91e8c)",
                            borderRadius: 20, padding: "2px 8px",
                            fontSize: 9, fontWeight: 800, color: "white",
                          }}>
                            REPLY
                          </div>
                        ) : (
                          <div style={{
                            background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.3)",
                            borderRadius: 20, padding: "2px 8px",
                            fontSize: 9, fontWeight: 800, color: "#4ade80",
                          }}>
                            DONE ✓
                          </div>
                        )}
                      />
                    ))
                  )}
                </FeatureCard>
              )}

              {/* ── Gifts received ────────────────────────────────────── */}
              {showGifts && (
                <FeatureCard
                  icon="🎁" color="#a855f7" label="Gifts Received"
                  count={newGifts}
                  subtitle={
                    gifts.length === 0
                      ? "No gifts yet"
                      : `${gifts.length} gift${gifts.length !== 1 ? "s" : ""} received`
                  }
                >
                  {gifts.length === 0 ? (
                    <div style={{ padding: "16px 18px", fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                      Gifts sent to you will appear here
                    </div>
                  ) : (
                    gifts.slice(0, 3).map((g, i) => (
                      <ActivityRow
                        key={g.id}
                        avatar={null}
                        name={g.sender_name}
                        primary={`${g.gift_emoji || "🎁"} ${g.gift_name}${g.message ? ` — "${truncate(g.message, 28)}"` : ""}`}
                        time={timeAgo(g.created_at)}
                        isLast={i === Math.min(gifts.length, 3) - 1}
                        badge={g.status === "pending" ? (
                          <div style={{
                            background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                            borderRadius: 20, padding: "2px 8px",
                            fontSize: 9, fontWeight: 800, color: "white",
                          }}>NEW</div>
                        ) : undefined}
                      />
                    ))
                  )}
                </FeatureCard>
              )}

              {/* ── Likes ─────────────────────────────────────────────── */}
              {showLikes && (
                <FeatureCard
                  icon="♥" color="#f43f5e" label="Likes"
                  count={newLikes}
                  subtitle={
                    likes.length === 0
                      ? "No likes yet"
                      : `${likes.length} like${likes.length !== 1 ? "s" : ""}${likes.filter(l => l.is_rose).length ? ` · ${likes.filter(l => l.is_rose).length} 🌹 rose` : ""}`
                  }
                  onSeeAll={likes.length > 0 ? () => setTab("likes") : undefined}
                >
                  {likes.length === 0 ? (
                    <div style={{ padding: "16px 18px", fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                      Keep swiping — your first like is close
                    </div>
                  ) : (
                    <>
                      {/* Rose likes banner */}
                      {likes.some(l => l.is_rose) && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 16px",
                          background: "rgba(244,114,182,0.1)",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                        }}>
                          <span style={{ fontSize: 16 }}>🌹</span>
                          <span style={{ fontSize: 12, color: "rgba(244,114,182,0.9)", fontWeight: 600 }}>
                            {likes.filter(l => l.is_rose).length} rose {likes.filter(l => l.is_rose).length === 1 ? "like" : "likes"} — someone really wants your attention
                          </span>
                        </div>
                      )}
                      {/* Avatar strip */}
                      <div style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        {likes.slice(0, 8).map(l => (
                          <div key={l.like_id} style={{ position: "relative" }}>
                            <Avatar
                              src={l.liker_avatar}
                              name={l.liker_name}
                              size={42}
                              lastSeen={l.last_seen_at}
                              blur={!l.is_mutual}
                            />
                            {l.is_rose && (
                              <div style={{
                                position: "absolute", top: -3, right: -3,
                                fontSize: 12, background: "rgba(0,0,0,0.5)",
                                borderRadius: "50%", width: 18, height: 18,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>🌹</div>
                            )}
                          </div>
                        ))}
                        {likes.length > 8 && (
                          <div style={{
                            width: 42, height: 42, borderRadius: "50%",
                            background: "rgba(255,255,255,0.08)",
                            border: "1.5px solid rgba(255,255,255,0.12)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)",
                          }}>
                            +{likes.length - 8}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </FeatureCard>
              )}

              {/* ── Who Viewed Me ─────────────────────────────────────── */}
              {tab === "all" && (
                <FeatureCard
                  icon="👁️" color="#e91e8c" label="Who Viewed Me"
                  count={viewerCount}
                  subtitle={viewerCount === 0 ? "No profile views yet" : `${viewerCount} ${viewerCount === 1 ? "person" : "people"} checked your profile`}
                  onSeeAll={() => navigate("/who-viewed-me")}
                >
                  {viewerCount === 0 ? (
                    <div style={{ padding: "16px 18px", fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                      When someone views your profile, they'll appear here
                    </div>
                  ) : (
                    <div style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>👁️</span>
                      <span><strong style={{ color: "rgba(236,72,153,0.9)" }}>{viewerCount}</strong> {viewerCount === 1 ? "person has" : "people have"} viewed your profile — tap to see who</span>
                    </div>
                  )}
                </FeatureCard>
              )}

              {/* ── Explore features ──────────────────────────────────── */}
              {tab === "all" && (
                <>
                  <div style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
                    marginBottom: 10, paddingLeft: 4,
                  }}>
                    Explore
                  </div>
                  <FeatureCard icon="💘" color="#c2185b" label="Blind Date" subtitle="Swipe anonymously — reveal on match" onSeeAll={() => navigate("/home")} />
                  <FeatureCard icon="🗺️" color="#3b82f6" label="Nearby Map" subtitle="See who's around you right now" onSeeAll={() => navigate("/map")} />
                  <FeatureCard icon="📍" color="#10b981" label="Date Spots" subtitle="Discover great places to meet" onSeeAll={() => navigate("/dates")} />
                  <FeatureCard icon="🧸" color="#f59e0b" label="Teddy Room" subtitle="Your virtual cosy space" onSeeAll={() => navigate("/teddy")} />
                  <FeatureCard icon="🎟️" color="#8b5cf6" label="Events Near Me" subtitle="Local events and meetups" onSeeAll={() => navigate("/events")} />
                </>
              )}

            </>
          )}
        </div>
      </div>

      {/* ── Chat panel ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {chatWith && userId && (
          <ChatPanel
            currentUserId={userId}
            otherUser={{
              id: chatWith.partner_id,
              name: chatWith.partner_name,
              avatar_url: chatWith.partner_avatar,
              last_seen_at: chatWith.last_seen_at ?? null,
              age: chatWith.partner_age,
            }}
            onClose={() => { setChatWith(null); load(); }}
            onUnlock={() => setChatWith(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Answer modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {answerQ && userId && (
          <AnswerModal
            q={answerQ}
            userId={userId}
            onDone={() => { setAnswerQ(null); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
