import { useState, useEffect } from "react";
import GiftReceivePopup from "./GiftReceivePopup";
import GiftRefusedNotification from "./GiftRefusedNotification";

interface DemoGift {
  id: string;
  sender_id: string;
  sender_name: string;
  gift_id: string;
  gift_name: string;
  gift_image_url: string;
  message: string;
  status: string;
  created_at: string;
}

interface GiftReceiverProps {
  currentUserId?: string;
}

export default function GiftReceiver({ currentUserId }: GiftReceiverProps) {
  const [pendingGifts, setPendingGifts] = useState<DemoGift[]>([]);
  const [showReceivePopup, setShowReceivePopup] = useState(false);
  const [currentGift, setCurrentGift] = useState<DemoGift | null>(null);
  const [showRefusedNotification, setShowRefusedNotification] = useState(false);

  useEffect(() => {
    // Check for pending gifts every 5 seconds (demo simulation)
    const checkGifts = () => {
      const sentGifts = JSON.parse(localStorage.getItem('sent_gifts_demo') || '[]');
      const pending = sentGifts.filter((gift: DemoGift) => 
        gift.recipient_id === currentUserId && gift.status === 'pending'
      );
      
      if (pending.length > 0 && !showReceivePopup) {
        setCurrentGift(pending[0]);
        setShowReceivePopup(true);
      }
    };

    checkGifts();
    const interval = setInterval(checkGifts, 5000);
    return () => clearInterval(interval);
  }, [currentUserId, showReceivePopup]);

  const handleAccept = () => {
    if (currentGift) {
      // Update gift status in localStorage
      const sentGifts = JSON.parse(localStorage.getItem('sent_gifts_demo') || '[]');
      const updatedGifts = sentGifts.map((gift: DemoGift) => 
        gift.id === currentGift.id ? { ...gift, status: 'accepted' } : gift
      );
      localStorage.setItem('sent_gifts_demo', JSON.stringify(updatedGifts));
      
      // Add to likes (simulate)
      const likes = JSON.parse(localStorage.getItem('demo_likes') || '[]');
      likes.push({
        liker_id: currentGift.sender_id,
        liked_id: currentUserId,
        created_at: new Date().toISOString(),
        gift_received: currentGift,
      });
      localStorage.setItem('demo_likes', JSON.stringify(likes));
      
      console.log('GiftReceiver: Gift accepted, like created');
    }
    setShowReceivePopup(false);
    setCurrentGift(null);
  };

  const handleRefuse = () => {
    if (currentGift) {
      // Update gift status in localStorage
      const sentGifts = JSON.parse(localStorage.getItem('sent_gifts_demo') || '[]');
      const updatedGifts = sentGifts.map((gift: DemoGift) => 
        gift.id === currentGift.id ? { ...gift, status: 'refused' } : gift
      );
      localStorage.setItem('sent_gifts_demo', JSON.stringify(updatedGifts));
      
      // Store refusal notification for sender
      const refusals = JSON.parse(localStorage.getItem('gift_refusals') || '[]');
      refusals.push({
        sender_id: currentGift.sender_id,
        message: "Unfortunately, this profile has refused your gift for now. Let's try again.",
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('gift_refusals', JSON.stringify(refusals));
      
      console.log('GiftReceiver: Gift refused, notification sent to sender');
    }
    setShowReceivePopup(false);
    setCurrentGift(null);
  };

  // Check for refusal notifications
  useEffect(() => {
    if (currentUserId) {
      const refusals = JSON.parse(localStorage.getItem('gift_refusals') || '[]');
      const userRefusals = refusals.filter((r: any) => r.sender_id === currentUserId);
      if (userRefusals.length > 0 && !showRefusedNotification) {
        setShowRefusedNotification(true);
      }
    }
  }, [currentUserId, showRefusedNotification]);

  return (
    <>
      {showReceivePopup && currentGift && (
        <GiftReceivePopup
          gift={{
            id: currentGift.id,
            sender_id: currentGift.sender_id,
            sender_name: currentGift.sender_name || 'Anonymous',
            gift_id: currentGift.gift_id,
            gift_name: currentGift.gift_name,
            gift_image_url: currentGift.gift_image_url,
            message: currentGift.message,
            status: currentGift.status,
            created_at: currentGift.created_at,
          }}
          onClose={() => {
            setShowReceivePopup(false);
            setCurrentGift(null);
          }}
          onGiftAccepted={handleAccept}
          onGiftRefused={handleRefuse}
        />
      )}

      {showRefusedNotification && (
        <GiftRefusedNotification
          onClose={() => setShowRefusedNotification(false)}
          onTryAgain={() => setShowRefusedNotification(false)}
        />
      )}
    </>
  );
}
