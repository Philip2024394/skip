import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/shared/components/button";
import { X, Gift, Coins, Heart, Sparkles } from "lucide-react";
import analyticsLogger from "@/shared/services/analytics";
import SecureTextarea from "@/shared/components/SecureTextarea";
import TokenPurchase from "./TokenPurchase";

interface VirtualGift {
  id: string;
  name: string;
  emoji?: string;
  image_url: string;
  image_name: string;
  token_price: number;
  tier?: string;
}

interface GiftSendPopupProps {
  gift: VirtualGift;
  recipientId: string;
  recipientName: string;
  userTokens: number;
  freeGiftsRemaining: number;
  onClose: () => void;
  onGiftSent: () => void;
}

const SLOGANS = [
  "Make their heart skip a beat",
  "Show them you care",
  "A little sparkle goes a long way",
  "Brighten their day",
  "Let love shine through",
];

export default function GiftSendPopup({
  gift,
  recipientId,
  recipientName,
  userTokens,
  freeGiftsRemaining,
  onClose,
  onGiftSent,
}: GiftSendPopupProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showRefuel, setShowRefuel] = useState(false);
  const [sent, setSent] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [spamError, setSpamError] = useState<string | null>(null);

  const validateMessage = (text: string): string | null => {
    if (!text.trim()) return null; // empty is fine
    // Block URLs
    if (/https?:\/\//i.test(text) || /www\./i.test(text)) return "Links are not allowed in gift messages";
    // Block digit phone numbers (7+ consecutive digits)
    if (/\d{7,}/.test(text.replace(/[\s\-().]/g, ""))) return "Phone numbers are not allowed";
    // Block formatted phone numbers
    if (/\b\d{3,4}[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}\b/.test(text)) return "Phone numbers are not allowed";
    // Block text-format numbers (English)
    if (/\b(zero|one|two|three|four|five|six|seven|eight|nine)\b.*\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/i.test(text)) return "Contact information in text format is not allowed";
    // Block text-format numbers (Indonesian)
    if (/\b(nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)\b.*\b(nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)\b/i.test(text)) return "Informasi kontak dalam format teks tidak diizinkan";
    return null;
  };

  const isFreeGift = freeGiftsRemaining > 0;
  const canAfford = userTokens >= gift.token_price;
  const canSend = isFreeGift || canAfford;
  const slogan = SLOGANS[Math.abs(gift.id.charCodeAt(0)) % SLOGANS.length];

  const handleSend = async () => {
    if (!canSend) return;

    const spamCheck = validateMessage(message);
    if (spamCheck) { setSpamError(spamCheck); return; }
    setSpamError(null);

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFreeGift) {
        const currentUsed = parseInt(localStorage.getItem(`free_gifts_used_${user.id}`) || '0');
        localStorage.setItem(`free_gifts_used_${user.id}`, (currentUsed + 1).toString());

        const sentGifts = JSON.parse(localStorage.getItem('sent_gifts_demo') || '[]');
        sentGifts.push({
          id: `demo_${Date.now()}`,
          sender_id: user.id,
          recipient_id: recipientId,
          gift_id: gift.id,
          gift_name: gift.name,
          gift_image_url: gift.image_url,
          message: message.trim(),
          status: 'pending',
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('sent_gifts_demo', JSON.stringify(sentGifts));
      } else {
        try {
          const { error } = await (supabase as any).from("sent_gifts").insert({
            sender_id: user.id,
            recipient_id: recipientId,
            gift_id: gift.id,
            message: message.trim(),
            tokens_used: gift.token_price,
            status: "pending",
          });

          if (error) throw error;

          const { error: tokenError } = await (supabase as any).rpc("deduct_tokens", {
            p_user_id: user.id,
            p_tokens: gift.token_price,
          });
          if (tokenError) throw tokenError;
        } catch (dbError) {
          analyticsLogger.logGiftSent({
            userId: user.id,
            giftId: gift.id,
            giftName: gift.name,
            recipientId: recipientId,
            tokenAmount: gift.token_price,
            isFreeGift: isFreeGift,
            error: dbError instanceof Error ? dbError.message : 'Unknown database error'
          });

          const sentGifts = JSON.parse(localStorage.getItem('sent_gifts_demo') || '[]');
          sentGifts.push({
            id: `demo_${Date.now()}`,
            sender_id: user.id,
            recipient_id: recipientId,
            gift_id: gift.id,
            gift_name: gift.name,
            gift_image_url: gift.image_url,
            message: message.trim(),
            status: 'pending',
            tokens_used: gift.token_price,
            created_at: new Date().toISOString(),
          });
          localStorage.setItem('sent_gifts_demo', JSON.stringify(sentGifts));
        }

        analyticsLogger.logGiftSent({
          userId: user.id,
          giftId: gift.id,
          giftName: gift.name,
          recipientId: recipientId,
          tokenAmount: gift.token_price,
          isFreeGift: isFreeGift
        });
      }

      setSent(true);
      setTimeout(() => {
        onGiftSent();
        onClose();
      }, 1200);
    } catch (error) {
      console.error("Error sending gift:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Sent success animation
  if (sent) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ background: "radial-gradient(ellipse at center, rgba(190,24,93,0.35) 0%, rgba(0,0,0,0.88) 70%)" }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ scale: [1, 1.35, 1], rotate: [0, 12, -12, 0] }}
            transition={{ duration: 0.7 }}
            className="text-8xl drop-shadow-[0_0_30px_rgba(251,113,133,0.7)]"
          >
            {gift.emoji || "🎁"}
          </motion.div>
          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-white font-black text-xl tracking-tight"
          >
            Gift sent! 💕
          </motion.p>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-rose-300/80 text-sm"
          >
            {recipientName} will love it
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(190,24,93,0.28) 0%, rgba(6,0,20,0.82) 70%)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.92, y: 28 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 28 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="max-w-sm w-full rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #2d0022 0%, #100018 45%, #1a0010 100%)",
            border: "1.5px solid rgba(251,113,133,0.30)",
            boxShadow: "0 24px 70px rgba(190,24,93,0.30), 0 0 0 1px rgba(251,113,133,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Top warm glow stripe */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #f43f5e, #ec4899, #fb923c, #ec4899, #f43f5e)" }} />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #f43f5e, #fb923c)" }}>
                <Gift className="w-3 h-3 text-white" />
              </div>
              <span className="text-rose-200/80 text-xs font-semibold uppercase tracking-widest">Send Gift</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(251,113,133,0.10)", border: "1px solid rgba(251,113,133,0.20)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(251,113,133,0.22)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(251,113,133,0.10)")}
            >
              <X className="w-3.5 h-3.5 text-rose-300/70" />
            </button>
          </div>

          {/* Gift Preview */}
          <div className="flex flex-col items-center px-5 py-3">
            <motion.div
              initial={{ scale: 0.75, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="w-22 h-22 rounded-2xl flex items-center justify-center mb-3"
              style={{
                width: 88, height: 88,
                background: "linear-gradient(135deg, rgba(244,63,94,0.18), rgba(251,146,60,0.14))",
                border: "1.5px solid rgba(251,113,133,0.28)",
                boxShadow: "0 0 28px rgba(244,63,94,0.20), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              {gift.image_url ? (
                <img
                  src={gift.image_url}
                  alt={gift.name}
                  className="w-14 h-14 object-contain drop-shadow-[0_2px_10px_rgba(244,63,94,0.35)]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    const p = (e.target as HTMLImageElement).parentElement;
                    if (p && !p.querySelector(".efb")) {
                      const s = document.createElement("span");
                      s.className = "efb";
                      s.textContent = gift.emoji || "🎁";
                      s.style.cssText = "font-size:40px;line-height:1;";
                      p.appendChild(s);
                    }
                  }}
                />
              ) : (
                <span className="text-[40px] leading-none select-none">{gift.emoji || "🎁"}</span>
              )}
            </motion.div>

            <h4 className="text-white font-black text-base tracking-tight">{gift.name}</h4>
            <p className="text-rose-300/60 text-[11px] italic mt-0.5">{slogan}</p>

            {/* Price badge */}
            <div className="flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full"
              style={{ background: "rgba(251,113,133,0.10)", border: "1px solid rgba(251,113,133,0.22)" }}>
              {isFreeGift ? (
                <span className="text-emerald-400 text-xs font-bold">✦ FREE</span>
              ) : (
                <>
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300 text-xs font-bold">{gift.token_price} coins</span>
                </>
              )}
            </div>
          </div>

          {/* Recipient chip */}
          <div className="mx-5 mb-3 flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(251,113,133,0.18)" }}>
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/50" />
            <div className="flex-1 min-w-0">
              <p className="text-rose-300/50 text-[10px]">Sending to</p>
              <p className="text-white font-semibold text-sm truncate">{recipientName}</p>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-400/60" />
          </div>

          {/* Message Input */}
          <div className="px-5 mb-4">
            <div className="rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(251,113,133,0.22)", background: "rgba(255,255,255,0.04)" }}>
              <SecureTextarea
                id="gift-message"
                value={message}
                onChange={setMessage}
                placeholder="Add a sweet note... 💌"
                rows={2}
                maxLength={350}
                label=""
                context="gift_message"
                userId={user?.id}
              />
            </div>
            {spamError && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <span>⚠️</span> {spamError}
              </p>
            )}
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-rose-300/30 text-[10px]">No links or phone numbers</span>
              <span className={`text-[10px] font-medium ${message.length > 320 ? "text-amber-400" : "text-rose-300/30"}`}>
                {message.length}/350
              </span>
            </div>
          </div>

          {/* Insufficient coins — Refuel Gate */}
          {!canSend && !isFreeGift && (
            <div className="mx-5 mb-3">
              <button
                onClick={() => setShowRefuel(true)}
                className="w-full rounded-xl px-4 py-2.5 flex items-center justify-between transition-all"
                style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.10), rgba(251,146,60,0.10))", border: "1px solid rgba(251,191,36,0.28)" }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 text-xs font-semibold">Need {gift.token_price - userTokens} more coins</span>
                </div>
                <span className="text-amber-400 text-xs font-black">Top up →</span>
              </button>
            </div>
          )}

          {/* Action row */}
          <div className="px-5 pb-5 flex gap-2.5">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 text-sm font-semibold transition-all"
              style={{
                background: "rgba(251,113,133,0.07)",
                border: "1px solid rgba(251,113,133,0.20)",
                color: "rgba(251,113,133,0.70)",
              }}
              aria-label="Cancel gift sending"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!canSend || isSending || message.length > 350}
              className="flex-1 h-11 text-sm font-black text-white disabled:opacity-40"
              style={{
                background: canSend ? "linear-gradient(135deg, #f43f5e, #ec4899, #fb923c)" : undefined,
                boxShadow: canSend ? "0 4px 22px rgba(244,63,94,0.45), 0 0 0 1px rgba(251,113,133,0.20)" : undefined,
              }}
              aria-label={`Send ${gift.name} gift to ${recipientName}`}
            >
              {isSending ? (
                <span className="animate-pulse">Sending...</span>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-1.5" />
                  {isFreeGift ? "Send Free 💫" : "Send Gift 💝"}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Refuel Gate overlay */}
      {showRefuel && (
        <TokenPurchase
          onClose={() => setShowRefuel(false)}
          onPurchaseSuccess={() => setShowRefuel(false)}
        />
      )}
    </>
  );
}
