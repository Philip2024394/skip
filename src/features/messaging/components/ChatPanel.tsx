import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, ShieldCheck, Lock } from "lucide-react";
import { useMessages, validateChatMessage } from "@/shared/hooks/useMessages";
import { isOnline } from "@/shared/hooks/useOnlineStatus";

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

export default function ChatPanel({ currentUserId, otherUser, onClose, onUnlock }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, loading, sending, sendMessage } = useMessages(currentUserId, otherUser.id);

  const firstName = otherUser.name.split(" ")[0];
  const online = isOnline(otherUser.last_seen_at);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      {/* ── Privacy bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 16px",
        background: "rgba(14,165,233,0.06)",
        borderBottom: "1px solid rgba(14,165,233,0.1)",
        flexShrink: 0,
      }}>
        <ShieldCheck style={{ width: 11, height: 11, color: "rgba(125,211,252,0.65)", flexShrink: 0 }} />
        <span style={{ fontSize: 10, color: "rgba(125,211,252,0.65)", fontWeight: 600 }}>
          Private chat · No numbers or contact info · Unlock WhatsApp when you're ready
        </span>
      </div>

      {/* ── Message list ── */}
      <div
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
                    <div style={{
                      maxWidth: "76%",
                      padding: "10px 14px",
                      borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: isMine
                        ? "linear-gradient(135deg, #f472b6, #ec4899)"
                        : "rgba(255,255,255,0.08)",
                      border: isMine ? "none" : "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      fontSize: 14,
                      lineHeight: 1.45,
                      wordBreak: "break-word",
                      boxShadow: isMine ? "0 2px 14px rgba(236,72,153,0.28)" : "none",
                    }}>
                      {msg.content}
                    </div>
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

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, padding: "0 4px" }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", gap: 3 }}>
            <Lock style={{ width: 7, height: 7 }} />
            No numbers · No contact info
          </span>
          <span style={{ fontSize: 9, color: draft.length > 450 ? "#fbbf24" : "rgba(255,255,255,0.14)" }}>
            {draft.length}/500
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
