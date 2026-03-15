import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SentGift {
  id: string;
  gift_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  virtual_gifts: {
    emoji: string;
    name: string;
  };
}

interface SentGiftsDisplayProps {
  profileId: string;
}

export default function SentGiftsDisplay({ profileId }: SentGiftsDisplayProps) {
  const [sentGifts, setSentGifts] = useState<SentGift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSentGifts();
  }, [profileId]);

  const fetchSentGifts = async () => {
    try {
      const { data, error } = await supabase
        .from('sent_gifts')
        .select(`
          id,
          gift_id,
          sender_id,
          message,
          created_at,
          virtual_gifts!inner(
            emoji,
            name
          )
        `)
        .eq('recipient_id', profileId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching sent gifts:', error);
        return;
      }

      setSentGifts(data || []);
    } catch (error) {
      console.error('Error fetching sent gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || sentGifts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {sentGifts.map((gift) => (
        <div
          key={gift.id}
          className="flex items-center gap-1 bg-black/30 backdrop-blur-sm border border-white/20 rounded-full px-2 py-1"
          title={`${gift.virtual_gifts.name} - ${new Date(gift.created_at).toLocaleDateString()}`}
        >
          <span className="text-sm">{gift.virtual_gifts.emoji}</span>
        </div>
      ))}
    </div>
  );
}
