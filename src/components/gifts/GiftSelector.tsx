import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VirtualGift {
  id: string;
  name: string;
  emoji: string;
  price: number;
}

interface GiftSelectorProps {
  userId: string;
  profileId: string;
  profileName: string;
  onGiftSelected?: (gift: VirtualGift) => void;
  onGiftSent?: () => void;
}

export default function GiftSelector({ userId, profileId, profileName, onGiftSelected, onGiftSent }: GiftSelectorProps) {
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
  const [selectedGifts, setSelectedGifts] = useState<VirtualGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingGift, setSendingGift] = useState<string | null>(null);

  useEffect(() => {
    fetchGifts();
    fetchSelectedGifts();
  }, [userId]);

  const fetchGifts = async () => {
    const { data, error } = await supabase
      .from('virtual_gifts')
      .select('id, name, emoji, price')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching gifts:', error);
      return;
    }

    setGifts(data || []);
    setLoading(false);
  };

  const fetchSelectedGifts = async () => {
    const { data, error } = await supabase
      .from('user_preferred_gifts')
      .select(`
        position,
        virtual_gifts!inner(
          id,
          name,
          emoji,
          price
        )
      `)
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching selected gifts:', error);
      return;
    }

    const selected = data?.map(item => ({
      id: item.virtual_gifts.id,
      name: item.virtual_gifts.name,
      emoji: item.virtual_gifts.emoji,
      price: item.virtual_gifts.price
    })) || [];

    setSelectedGifts(selected);
  };

  const toggleGift = async (gift: VirtualGift) => {
    const isSelected = selectedGifts.some(g => g.id === gift.id);
    
    if (isSelected) {
      // Remove gift
      const position = selectedGifts.findIndex(g => g.id === gift.id) + 1;
      const { error } = await supabase
        .from('user_preferred_gifts')
        .delete()
        .eq('user_id', userId)
        .eq('position', position);

      if (error) {
        toast.error('Failed to remove gift');
        return;
      }

      // Reorder remaining gifts
      const remainingGifts = selectedGifts.filter(g => g.id !== gift.id);
      for (let i = 0; i < remainingGifts.length; i++) {
        await supabase
          .from('user_preferred_gifts')
          .update({ position: i + 1 })
          .eq('user_id', userId)
          .eq('gift_id', remainingGifts[i].id);
      }

      setSelectedGifts(remainingGifts);
      toast.success('Gift removed from preferences');
    } else if (selectedGifts.length < 5) {
      // Add gift
      const { error } = await supabase
        .from('user_preferred_gifts')
        .insert({
          user_id: userId,
          gift_id: gift.id,
          position: selectedGifts.length + 1
        });

      if (error) {
        toast.error('Failed to add gift');
        return;
      }

      setSelectedGifts([...selectedGifts, gift]);
      toast.success('Gift added to preferences');
    } else {
      toast.error('You can only select up to 5 gifts');
    }
  };

  const sendGiftToProfile = async (gift: VirtualGift) => {
    setSendingGift(gift.id);
    
    try {
      // TODO: Implement actual payment processing
      // For now, we'll simulate the gift sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Save to sent_gifts table
      console.log(`Sending ${gift.name} to ${profileName} (ID: ${profileId})`);
      
      toast.success(`🎁 ${gift.name} sent to ${profileName}!`);
      
      if (onGiftSent) {
        onGiftSent();
      }
    } catch (error) {
      toast.error("Failed to send gift. Please try again.");
    } finally {
      setSendingGift(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: 16,
        margin: "16px 0",
      }}>
        <p style={{ color: "white", textAlign: "center" }}>Loading gifts...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12,
      padding: 16,
      margin: "16px 0",
    }}>
      {profileId ? (
        <>
          <h3 style={{
            color: "rgba(236,72,153,0.9)",
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 12,
            textAlign: "center",
          }}>
            Send a Gift to {profileName}
          </h3>
          
          <p style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 12,
            marginBottom: 16,
            textAlign: "center",
          }}>
            Choose a gift to send - $1 each
          </p>
        </>
      ) : (
        <>
          <h3 style={{
            color: "rgba(236,72,153,0.9)",
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            Gifts That Get My Attention
          </h3>
          
          <p style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 12,
            marginBottom: 16,
          }}>
            Select up to 5 gifts that you'd love to receive. These will be highlighted on your profile for others to send you.
          </p>
        </>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
        gap: 12,
        marginBottom: 16,
      }}>
        {gifts.map((gift) => {
          const isSelected = selectedGifts.some(g => g.id === gift.id);
          return (
            <motion.div
              key={gift.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => profileId ? sendGiftToProfile(gift) : toggleGift(gift)}
              style={{
                background: isSelected 
                  ? "rgba(236,72,153,0.2)" 
                  : "rgba(255,255,255,0.05)",
                border: isSelected 
                  ? "2px solid rgba(236,72,153,0.8)" 
                  : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: 12,
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{
                fontSize: 32,
                marginBottom: 4,
              }}>
                {gift.emoji}
              </div>
              <div style={{
                color: "white",
                fontSize: 10,
                fontWeight: 600,
                marginBottom: 2,
              }}>
                {gift.name}
              </div>
              <div style={{
                color: sendingGift === gift.id 
                  ? "rgba(255,255,255,0.5)" 
                  : "rgba(236,72,153,0.8)",
                fontSize: 9,
                fontWeight: 700,
              }}>
                {sendingGift === gift.id ? "Sending..." : `$${gift.price}`}
              </div>
            </motion.div>
          );
        })}
      </div>

      {profileId ? (
        <div>
          <p style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 10,
            textAlign: "center",
            marginTop: 12,
          }}>
            Each gift costs $1 USD
          </p>
          <p style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 10,
            textAlign: "center",
            marginTop: 4,
          }}>
            Gifts will appear on their profile
          </p>
        </div>
      ) : selectedGifts.length > 0 && (
        <div>
          <p style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 11,
            marginBottom: 8,
          }}>
            Your selected gifts ({selectedGifts.length}/5):
          </p>
          <div style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}>
            {selectedGifts.map((gift) => (
              <div
                key={gift.id}
                style={{
                  background: "rgba(236,72,153,0.15)",
                  border: "1px solid rgba(236,72,153,0.4)",
                  borderRadius: 8,
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span>{gift.emoji}</span>
                <span style={{
                  color: "rgba(236,72,153,0.9)",
                  fontSize: 10,
                  fontWeight: 600,
                }}>
                  {gift.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
