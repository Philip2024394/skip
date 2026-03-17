import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/shared/components/button";
import { Gift, Heart, XCircle } from "lucide-react";
import GiftFloatingAnimation from "./GiftFloatingAnimation";

interface SentGift {
  id: string;
  sender_id: string;
  sender_name: string;
  gift_id: string;
  gift_name: string;
  gift_image_url: string;
  gift_emoji?: string;
  message: string;
  status: string;
  created_at: string;
}

interface GiftReceivePopupProps {
  gift: SentGift;
  onClose: () => void;
  onGiftAccepted: () => void;
  onGiftRefused: () => void;
  onMatch?: (senderName: string, senderId: string) => void;
}

export default function GiftReceivePopup({
  gift,
  onClose,
  onGiftAccepted,
  onGiftRefused,
  onMatch,
}: GiftReceivePopupProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update gift status to accepted
      const { error } = await (supabase as any)
        .from("sent_gifts")
        .update({ status: "accepted" })
        .eq("id", gift.id);

      if (error) throw error;

      // Create a like relationship (similar to handleLike in Index.tsx)
      const { error: likeError } = await supabase
        .from("likes")
        .insert({
          liker_id: gift.sender_id,
          liked_id: user.id,
          created_at: new Date().toISOString(),
        });

      if (likeError) {
        console.error("Error creating like:", likeError);
      }

      // Check if it's a match: does current user have a like from sender?
      const { data: existingLike } = await supabase
        .from("likes")
        .select("id")
        .eq("liker_id", user.id)
        .eq("liked_id", gift.sender_id)
        .maybeSingle();

      if (existingLike && onMatch) {
        onMatch(gift.sender_name, gift.sender_id);
      } else {
        onGiftAccepted();
        onClose();
      }
    } catch (error) {
      console.error("Error accepting gift:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefuse = async () => {
    setIsProcessing(true);
    try {
      // Update gift status to refused
      const { error } = await (supabase as any)
        .from("sent_gifts")
        .update({ status: "refused" })
        .eq("id", gift.id);

      if (error) throw error;

      // Send notification back to sender (this would be implemented with real-time notifications)
      console.log(`Gift refused by user. Notifying sender: ${gift.sender_id}`);

      onGiftRefused();
      onClose();
    } catch (error) {
      console.error("Error refusing gift:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <GiftFloatingAnimation giftImageUrl={gift.gift_image_url} giftEmoji={gift.gift_emoji} />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-pink-900/90 via-black/90 to-violet-900/90 rounded-3xl border-2 border-pink-400/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Gift className="w-5 h-5 text-pink-400" />
            <h3 className="text-white text-xl font-bold">Gift Received!</h3>
          </div>

          {/* Gift Preview */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-32 h-32 rounded-2xl bg-white/10 border border-pink-400/30 flex items-center justify-center mb-3 overflow-hidden">
              <img
                src={gift.gift_image_url}
                alt={gift.gift_name}
                className="w-full h-full object-contain"
              />
            </div>
            <h4 className="text-white text-lg font-semibold">{gift.gift_name}</h4>
            <p className="text-white/70 text-sm">from {gift.sender_name}</p>
          </div>

          {/* Message */}
          {gift.message && (
            <div className="bg-black/30 rounded-xl p-4 mb-6">
              <p className="text-white/90 text-sm italic">"{gift.message}"</p>
            </div>
          )}

          {/* Question */}
          <div className="bg-pink-500/20 border border-pink-400/30 rounded-xl p-4 mb-6">
            <p className="text-white text-center font-medium">
              Would you like to accept this gift and connect with {gift.sender_name}?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleRefuse}
              disabled={isProcessing}
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {isProcessing ? (
                "Processing..."
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Refuse
                </>
              )}
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white font-medium"
            >
              {isProcessing ? (
                "Processing..."
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Accept
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
