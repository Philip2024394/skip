import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/shared/types/profile";

const GIFTS = [
  { id: "rose",       label: "Red Rose",       emoji: "🌹", coins: 2 },
  { id: "bouquet",    label: "Bouquet",         emoji: "💐", coins: 4 },
  { id: "champagne",  label: "Champagne",       emoji: "🍾", coins: 6 },
  { id: "chocolate",  label: "Chocolates",      emoji: "🍫", coins: 3 },
  { id: "ring",       label: "Ring",            emoji: "💍", coins: 10 },
  { id: "teddy",      label: "Teddy Bear",      emoji: "🧸", coins: 5 },
  { id: "dinner",     label: "Dinner invite",   emoji: "🍽️", coins: 8 },
  { id: "star",       label: "Shooting Star",   emoji: "🌟", coins: 2 },
];

const TONIGHT_SUGGESTIONS = [
  "Dinner at a nice restaurant tonight — my treat 🍽️",
  "Coffee and a walk along the beach? 🌅",
  "Movie night — you pick the film 🎬",
  "Let's explore the night market together 🌙",
  "Drinks and good conversation tonight? 🥂",
];

interface TonightRequestModalProps {
  open: boolean;
  profile: Profile | null;
  currentUserId: string;
  currentUserCoins: number;
  onClose: () => void;
  onSent: (profileId: string, coinsSpent: number) => void;
}

const BASE_COINS = 3;

export default function TonightRequestModal({
  open,
  profile,
  currentUserId,
  currentUserCoins,
  onClose,
  onSent,
}: TonightRequestModalProps) {
  const [selectedGift, setSelectedGift] = useState<typeof GIFTS[0] | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const totalCoins = BASE_COINS + (selectedGift?.coins ?? 0);
  const canAfford = currentUserCoins >= totalCoins;
  const canSend = !!selectedGift && message.trim().length >= 10 && canAfford;

  const firstName = profile?.name?.split(" ")[0] ?? "them";

  // 1am tonight (local time → UTC)
  const getExpiry = () => {
    const d = new Date();
    d.setHours(25, 0, 0, 0); // next 1am (tomorrow 1am)
    return d.toISOString();
  };

  const handleSend = async () => {
    if (!profile || !selectedGift || !canSend) return;
    setSending(true);

    try {
      // 1. Deduct coins
      const { error: coinErr } = await supabase.rpc("spend_coins", {
        p_user_id: currentUserId,
        p_amount: totalCoins,
        p_reason: `Free Tonight invite to ${profile.name}`,
      });
      if (coinErr) throw new Error(coinErr.message);

      // 2. Insert tonight_request
      const { error: reqErr } = await (supabase.from("tonight_requests") as any).insert({
        sender_id: currentUserId,
        receiver_id: profile.id,
        gift_id: selectedGift.id,
        gift_label: selectedGift.label,
        gift_cost_coins: selectedGift.coins,
        coins_spent: totalCoins,
        message: message.trim(),
        expires_at: getExpiry(),
      });
      if (reqErr) throw new Error(reqErr.message);

      toast.success(`Invite sent to ${firstName}! 🌙`);
      onSent(profile.id, totalCoins);
      setSelectedGift(null);
      setMessage("");
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && profile && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 190, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            style={{
              position: "fixed", inset: "auto 12px 0 12px",
              bottom: 16, zIndex: 191,
              maxWidth: 480, margin: "0 auto",
              background: "linear-gradient(160deg, #0d0510 0%, #0a0212 100%)",
              border: "1px solid rgba(234,179,8,0.25)",
              borderRadius: 24,
              boxShadow: "0 8px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(234,179,8,0.15)",
              overflow: "hidden",
            }}
          >
            {/* Top accent */}
            <div style={{ height: 3, background: "linear-gradient(90deg, #f59e0b, #ec4899, #f59e0b)" }} />

            <div style={{ padding: "16px 16px 20px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, overflow: "hidden",
                    border: "2px solid rgba(234,179,8,0.4)", flexShrink: 0,
                  }}>
                    <img
                      src={profile.avatar_url ?? profile.image ?? ""}
                      alt={firstName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div>
                    <p style={{ color: "#fff", fontWeight: 900, fontSize: 15, margin: 0 }}>
                      Invite {firstName} 🌙
                    </p>
                    <p style={{ color: "rgba(251,191,36,0.7)", fontSize: 10, margin: 0 }}>
                      Send a gift + your plan for tonight
                    </p>
                  </div>
                </div>
                <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.6)", display: "flex" }}>
                  <X size={15} />
                </button>
              </div>

              {/* Gift picker */}
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                Choose a gift
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7, marginBottom: 14 }}>
                {GIFTS.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGift(g)}
                    style={{
                      padding: "9px 4px",
                      borderRadius: 12,
                      border: selectedGift?.id === g.id
                        ? "1.5px solid rgba(251,191,36,0.7)"
                        : "1px solid rgba(255,255,255,0.08)",
                      background: selectedGift?.id === g.id
                        ? "rgba(234,179,8,0.15)"
                        : "rgba(255,255,255,0.04)",
                      cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{g.emoji}</span>
                    <span style={{ color: selectedGift?.id === g.id ? "#fbbf24" : "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 700 }}>
                      🪙 {g.coins}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tonight plan message */}
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 6px" }}>
                Your plan for tonight
              </p>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder={`Tell ${firstName} your idea for tonight…`}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, padding: "10px 12px",
                  color: "#fff", fontSize: 13, lineHeight: 1.55,
                  resize: "none", outline: "none", fontFamily: "inherit",
                }}
              />

              {/* Suggestion chips */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6, marginBottom: 14 }}>
                {TONIGHT_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setMessage(s)}
                    style={{
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 20, padding: "3px 9px",
                      color: "rgba(255,255,255,0.45)", fontSize: 10, cursor: "pointer",
                    }}
                  >
                    {s.slice(0, 28)}…
                  </button>
                ))}
              </div>

              {/* Cost summary */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.18)",
                borderRadius: 12, padding: "9px 12px", marginBottom: 12,
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: 0 }}>
                    🪙 {BASE_COINS} invite + 🪙 {selectedGift?.coins ?? 0} gift = <strong style={{ color: "#fbbf24" }}>🪙 {totalCoins} coins</strong>
                  </p>
                  {!canAfford && (
                    <p style={{ color: "rgba(239,68,68,0.9)", fontSize: 10, margin: 0, fontWeight: 700 }}>
                      ⚠️ Not enough coins — you have {currentUserCoins}
                    </p>
                  )}
                </div>
                <div style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 16, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12 }}>🪙</span>
                  <span style={{ color: "#fbbf24", fontWeight: 800, fontSize: 13 }}>{currentUserCoins}</span>
                </div>
              </div>

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!canSend || sending}
                style={{
                  width: "100%", padding: "13px",
                  borderRadius: 16, border: "none", cursor: canSend ? "pointer" : "not-allowed",
                  background: canSend
                    ? "linear-gradient(135deg, #f59e0b, #ec4899)"
                    : "rgba(255,255,255,0.08)",
                  color: canSend ? "#fff" : "rgba(255,255,255,0.3)",
                  fontWeight: 900, fontSize: 15,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s",
                  boxShadow: canSend ? "0 4px 24px rgba(245,158,11,0.3)" : "none",
                }}
              >
                <Send size={16} />
                {sending ? "Sending…" : `Send Invite · 🪙 ${totalCoins}`}
              </button>

              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, textAlign: "center", marginTop: 8, marginBottom: 0 }}>
                {firstName} has until 1am to accept · If declined your coins are refunded
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
