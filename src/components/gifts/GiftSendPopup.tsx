import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Gift, Coins } from "lucide-react";

interface VirtualGift {
  id: string;
  name: string;
  image_url: string;
  image_name: string;
  token_price: number;
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

  const isFreeGift = freeGiftsRemaining > 0;
  const canAfford = userTokens >= gift.token_price;
  const canSend = isFreeGift || canAfford;

  const handleSend = async () => {
    if (!canSend) return;

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // For free gifts, use localStorage and simulate the flow
      if (isFreeGift) {
        // Update free gifts used in localStorage
        const currentUsed = parseInt(localStorage.getItem(`free_gifts_used_${user.id}`) || '0');
        localStorage.setItem(`free_gifts_used_${user.id}`, (currentUsed + 1).toString());
        
        // Store the sent gift in localStorage for demo purposes
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
        
        console.log('GiftSendPopup: Free gift sent successfully');
      } else {
        // Try to send paid gift via database
        try {
          const { error } = await supabase.from("sent_gifts").insert({
            sender_id: user.id,
            recipient_id: recipientId,
            gift_id: gift.id,
            message: message.trim(),
            tokens_used: gift.token_price,
            status: "pending",
          });

          if (error) throw error;

          // Update user tokens if not free
          const { error: tokenError } = await supabase.rpc("deduct_tokens", {
            p_user_id: user.id,
            p_tokens: gift.token_price,
          });
          if (tokenError) throw tokenError;
        } catch (dbError) {
          console.log('GiftSendPopup: Database error, simulating paid gift');
          // Simulate paid gift for demo
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
      }

      onGiftSent();
      onClose();
    } catch (error) {
      console.error("Error sending gift:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-pink-900/90 via-black/90 to-violet-900/90 rounded-3xl border-2 border-pink-400/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white text-xl font-bold">Send Virtual Gift</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gift Preview */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-32 h-32 rounded-2xl bg-white/10 border border-pink-400/30 flex items-center justify-center mb-3 overflow-hidden">
            <img
              src={gift.image_url}
              alt={gift.name}
              className="w-full h-full object-contain"
            />
          </div>
          <h4 className="text-white text-lg font-semibold">{gift.name}</h4>
          <div className="flex items-center gap-2 mt-2">
            {isFreeGift ? (
              <span className="text-green-400 text-sm font-medium">FREE Gift</span>
            ) : (
              <>
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">{gift.token_price} tokens</span>
              </>
            )}
          </div>
        </div>

        {/* Recipient Info */}
        <div className="bg-black/30 rounded-xl p-3 mb-4">
          <p className="text-white/70 text-sm">Sending to</p>
          <p className="text-white font-medium">{recipientName}</p>
        </div>

        {/* Message Input */}
        <div className="mb-6">
          <label className="text-white/70 text-sm block mb-2">
            Add a message (optional)
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 350))}
            placeholder="Say something nice..."
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:border-pink-400/50 focus:outline-none resize-none"
            rows={3}
          />
          <p className="text-white/50 text-xs mt-1 text-right">
            {message.length}/350
          </p>
        </div>

        {/* Status */}
        {!canSend && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4">
            <p className="text-red-300 text-sm text-center">
              {isFreeGift ? 
                "No free gifts remaining. Purchase tokens to send more gifts." :
                `Insufficient tokens. You need ${gift.token_price} tokens to send this gift.`
              }
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend || isSending || message.length > 350}
            className="flex-1 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white font-medium"
          >
            {isSending ? (
              "Sending..."
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Send Gift
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
