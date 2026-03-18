import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Coins, X, Send, Plus } from "lucide-react";
import { useCoinBalance } from "@/shared/hooks/useCoinBalance";
import { toast } from "sonner";
import TokenPurchase from "@/features/gifts/components/TokenPurchase";

export const SUPER_LIKE_STYLES = [
  { id: "classic",  emoji: "⭐", name: "Classic Star",  desc: "Simple & direct",      coins: 1,  glow: "rgba(250,204,21,0.6)",  border: "rgba(250,204,21,0.4)"  },
  { id: "heart",    emoji: "💛", name: "Golden Heart",  desc: "Warm & sincere",       coins: 2,  glow: "rgba(251,191,36,0.55)", border: "rgba(251,191,36,0.4)"  },
  { id: "fire",     emoji: "🔥", name: "Bold Fire",     desc: "Confident & bold",     coins: 3,  glow: "rgba(239,68,68,0.5)",   border: "rgba(239,68,68,0.4)"   },
  { id: "diamond",  emoji: "💎", name: "Diamond",       desc: "Premium & serious",    coins: 5,  glow: "rgba(147,197,253,0.55)",border: "rgba(147,197,253,0.4)" },
  { id: "rose",     emoji: "🌹", name: "Rose",          desc: "Romantic",             coins: 2,  glow: "rgba(244,114,182,0.55)",border: "rgba(244,114,182,0.4)" },
];

interface SuperLikeSelectorProps {
  userId?: string;
  recipientId?: string;
  recipientName?: string;
  onSent?: (styleId: string, message: string) => void;
}

export default function SuperLikeSelector({ userId, recipientId, recipientName, onSent }: SuperLikeSelectorProps) {
  const { balance, addCoins } = useCoinBalance(userId || null);
  const [selected, setSelected] = useState<typeof SUPER_LIKE_STYLES[0] | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);

  const handleSend = () => {
    if (!selected) return;
    if (!recipientId) {
      toast.info("Open a profile and tap ⭐ to send a Super Like");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSelected(null);
      setMessage("");
      toast.success(`${selected.emoji} Super Like sent to ${recipientName || "them"}!`);
      onSent?.(selected.id, message);
    }, 800);
  };

  return (
    <div className="space-y-4">
      {/* Balance bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
          <span className="text-white/70 text-xs font-semibold">Super Likes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1">
            <Coins className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-xs">{balance ?? "—"} coins</span>
          </div>
          <button
            onClick={() => setShowTopUp(true)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "linear-gradient(135deg, rgba(250,204,21,0.2), rgba(251,146,60,0.15))",
              border: "1.5px solid rgba(250,204,21,0.4)",
              borderRadius: 999, padding: "4px 10px",
              color: "rgb(250,204,21)", fontSize: 10, fontWeight: 800,
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            <Plus style={{ width: 10, height: 10 }} /> Top Up
          </button>
        </div>
      </div>

      {/* Style grid */}
      <div className="grid grid-cols-5 gap-2">
        {SUPER_LIKE_STYLES.map((style, i) => {
          const canAfford = (balance ?? 0) >= style.coins;
          const isSelected = selected?.id === style.id;
          return (
            <motion.button
              key={style.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => { if (canAfford) setSelected(isSelected ? null : style); }}
              style={{
                background: isSelected
                  ? `radial-gradient(circle, ${style.glow} 0%, rgba(0,0,0,0.6) 100%)`
                  : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${isSelected ? style.border : "rgba(255,255,255,0.08)"}`,
                borderRadius: 14,
                padding: "10px 4px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                cursor: canAfford ? "pointer" : "not-allowed",
                opacity: canAfford ? 1 : 0.38,
                boxShadow: isSelected ? `0 0 16px ${style.glow}` : "none",
                transition: "all 0.18s",
              }}
            >
              <span style={{ fontSize: 26, lineHeight: 1 }}>{style.emoji}</span>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 8, fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
                {style.name}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Coins style={{ width: 9, height: 9, color: "rgba(250,204,21,0.8)" }} />
                <span style={{ color: "rgba(250,204,21,0.8)", fontSize: 9, fontWeight: 800 }}>{style.coins}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Tip when no recipient */}
      {!recipientId && (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", fontStyle: "italic" }}>
          Open a profile and tap ⭐ to send a Super Like directly
        </p>
      )}

      {/* Send panel — shown when style selected */}
      <AnimatePresence>
        {selected && recipientId && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${selected.border}`,
              borderRadius: 16,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 28 }}>{selected.emoji}</span>
                <div>
                  <p style={{ color: "#fff", fontWeight: 800, fontSize: 13, margin: 0 }}>{selected.name}</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>{selected.desc} · {selected.coins} coins</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4 }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={`Add a personal note to ${recipientName || "them"}... (optional)`}
              maxLength={120}
              rows={2}
              style={{
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: "8px 10px",
                color: "white",
                fontSize: 12,
                resize: "none",
                outline: "none",
                width: "100%",
                fontFamily: "inherit",
              }}
            />

            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                background: sending ? "rgba(232,72,199,0.3)" : `linear-gradient(135deg, ${selected.glow}, rgba(139,92,246,0.8))`,
                border: "none",
                borderRadius: 12,
                padding: "10px 0",
                color: "#fff",
                fontWeight: 800,
                fontSize: 13,
                cursor: sending ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                width: "100%",
                boxShadow: `0 4px 16px ${selected.glow}`,
              }}
            >
              {sending
                ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                : <><Send style={{ width: 14, height: 14 }} /> Send {selected.emoji} Super Like</>
              }
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How it works */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 14px" }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>How it works</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            ["⭐", "Appears at the top of their Likes Library with a glowing effect"],
            ["💬", "Your personal note is shown with the Super Like"],
            ["❤️", "They can Accept (creates a match), Pass, or refer a Bestie"],
            ["🎁", "Free Super Likes earned from adding Besties — up to 10 free"],
          ].map(([icon, text]) => (
            <div key={icon} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 1.4 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Up modal */}
      {showTopUp && (
        <TokenPurchase
          onClose={() => setShowTopUp(false)}
          onPurchaseSuccess={() => {
            setShowTopUp(false);
            addCoins(50);
          }}
        />
      )}
    </div>
  );
}
