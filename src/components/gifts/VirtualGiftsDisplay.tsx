import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface SentGift {
  id: string;
  gift_id: string;
  gift: {
    image_url: string;
    name_display: string;
  };
  sender_id: string;
  message: string;
  created_at: string;
}

interface VirtualGiftsDisplayProps {
  userId: string;
}

export default function VirtualGiftsDisplay({ userId }: VirtualGiftsDisplayProps) {
  const [sentGifts, setSentGifts] = useState<SentGift[]>([]);

  useEffect(() => {
    fetchSentGifts();
  }, [userId]);

  const fetchSentGifts = async () => {
    const { data, error } = await supabase
      .from('sent_gifts')
      .select(`
        id,
        gift_id,
        message,
        created_at,
        virtual_gifts!inner(
          image_url,
          name_display
        )
      `)
      .eq('receiver_id', userId)
      .eq('is_displayed', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching sent gifts:', error);
      return;
    }

    const gifts = data?.map(gift => ({
      id: gift.id,
      gift_id: gift.gift_id,
      gift: {
        image_url: gift.virtual_gifts.image_url,
        name_display: gift.virtual_gifts.name_display
      },
      sender_id: '', // We don't need sender info for display
      message: gift.message || '',
      created_at: gift.created_at
    })) || [];

    setSentGifts(gifts);
  };

  if (sentGifts.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 12,
      right: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'flex-end',
      zIndex: 10,
    }}>
      <AnimatePresence>
        {sentGifts.map((gift, index) => (
          <motion.div
            key={gift.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: index === 0 ? 1 : 0.7, 
              opacity: 1 
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              delay: index * 0.1
            }}
            style={{
              fontSize: index === 0 ? '28px' : '20px',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
              cursor: 'pointer',
              transform: index === 0 ? 'scale(1)' : 'scale(0.7)',
            }}
            title={`${gift.gift.name_display}${gift.message ? ` - ${gift.message}` : ''}`}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: index === 0 ? '48px' : '32px',
                height: index === 0 ? '48px' : '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: '8px',
                border: '1px solid rgba(236,72,153,0.3)',
              }}
            >
              <img 
                src={gift.gift.image_url} 
                alt={gift.gift.name_display}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
