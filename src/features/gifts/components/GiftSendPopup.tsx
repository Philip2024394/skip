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

  const isFreeGift = freeGiftsRemaining > 0;
  const canAfford = userTokens >= gift.token_price;
  const canSend = isFreeGift || canAfford;
  const slogan = SLOGANS[Math.abs(gift.id.charCodeAt(0)) % SLOGANS.length];

  const handleSend = async () => {
    if (!canSend) return;

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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6 }}
            className="text-7xl"
          >
            {gift.emoji || "\u{1F381}"}
          </motion.div>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white font-bold text-lg"
          >
            Gift sent!
          </motion.p>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/50 text-sm"
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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl border border-pink-400/20 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(236,72,153,0.08)] max-w-sm w-full overflow-hidden"
        >
          {/* Top accent line */}
          <div className="h-0.5 bg-gradient-to-r from-transparent via-pink-500/60 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-pink-400" />
              <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Send Gift</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Gift Preview — centered emoji + name + slogan */}
          <div className="flex flex-col items-center px-5 py-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/15 to-violet-500/15 border border-pink-400/20 flex items-center justify-center mb-3"
            >
              {gift.image_url ? (
                <img
                  src={gift.image_url}
                  alt={gift.name}
                  className="w-14 h-14 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    const p = (e.target as HTMLImageElement).parentElement;
                    if (p && !p.querySelector(".efb")) {
                      const s = document.createElement("span");
                      s.className = "efb";
                      s.textContent = gift.emoji || "\u{1F381}";
                      s.style.cssText = "font-size:40px;line-height:1;";
                      p.appendChild(s);
                    }
                  }}
                />
              ) : (
                <span className="text-[40px] leading-none select-none">{gift.emoji || "\u{1F381}"}</span>
              )}
            </motion.div>

            <h4 className="text-white font-bold text-base">{gift.name}</h4>

            {/* Slogan */}
            <p className="text-pink-300/60 text-[11px] italic mt-1">{slogan}</p>

            {/* Price badge */}
            <div className="flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-black/30 border border-white/10">
              {isFreeGift ? (
                <span className="text-green-400 text-xs font-bold">FREE</span>
              ) : (
                <>
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-yellow-400 text-xs font-bold">{gift.token_price} coins</span>
                </>
              )}
            </div>
          </div>

          {/* Recipient chip */}
          <div className="mx-5 mb-3 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Heart className="w-3.5 h-3.5 text-pink-400/70" />
            <div className="flex-1 min-w-0">
              <p className="text-white/40 text-[10px]">Sending to</p>
              <p className="text-white/90 text-sm font-medium truncate">{recipientName}</p>
            </div>
          </div>

          {/* Message Input */}
          <div className="px-5 mb-4">
            <SecureTextarea
              id="gift-message"
              value={message}
              onChange={setMessage}
              placeholder="Add a sweet note..."
              rows={2}
              maxLength={350}
              label=""
              context="gift_message"
              userId={user?.id}
            />
          </div>

          {/* Insufficient coins — Refuel Gate */}
          {!canSend && !isFreeGift && (
            <div className="mx-5 mb-3">
              <button
                onClick={() => setShowRefuel(true)}
                className="w-full bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border border-yellow-400/30 rounded-xl px-4 py-2.5 flex items-center justify-between hover:border-yellow-400/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 text-xs font-medium">Need {gift.token_price - userTokens} more coins</span>
                </div>
                <span className="text-yellow-400 text-xs font-bold">Refuel</span>
              </button>
            </div>
          )}

          {/* Action row */}
          <div className="px-5 pb-5 flex gap-2.5">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 h-10 text-sm"
              aria-label="Cancel gift sending"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!canSend || isSending || message.length > 350}
              className="flex-1 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white font-semibold h-10 text-sm shadow-[0_4px_20px_rgba(236,72,153,0.3)] disabled:opacity-40 disabled:shadow-none"
              aria-label={`Send ${gift.name} gift to ${recipientName}`}
            >
              {isSending ? (
                <span className="animate-pulse">Sending...</span>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-1.5" />
                  {isFreeGift ? "Send Free" : "Send Gift"}
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
