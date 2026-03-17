import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VirtualGift {
  id: string;
  name: string;
  image_url: string;
  name_display: string;
  price: number;
}

interface MockGiftSelectorProps {
  profileId: string;
}

export default function MockGiftSelector({ profileId }: MockGiftSelectorProps) {
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
  const [selectedGifts, setSelectedGifts] = useState<VirtualGift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGifts();
    fetchSelectedGifts();
  }, [profileId]);

  const fetchGifts = async () => {
    const { data, error } = await supabase
      .from('virtual_gifts')
      .select('id, name, image_url, name_display, price')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      // Use fallback gifts when database doesn't exist
      const fallbackGifts = [
        // Original 19 gift images
        { id: 'gift001', name: 'Classic Rose', image_url: 'https://ik.imagekit.io/7grri5v7d/classic-rose-removebg-preview.png', name_display: 'Classic Rose', price: 5.99 },
        { id: 'gift002', name: 'Romantic Heart', image_url: 'https://ik.imagekit.io/7grri5v7d/romantic-heart-removebg-preview.png', name_display: 'Romantic Heart', price: 6.99 },
        { id: 'gift003', name: 'Diamond Ring', image_url: 'https://ik.imagekit.io/7grri5v7d/diamond-ring-removebg-preview.png', name_display: 'Diamond Ring', price: 15.99 },
        { id: 'gift004', name: 'Chocolate Box', image_url: 'https://ik.imagekit.io/7grri5v7d/chocolate-box-removebg-preview.png', name_display: 'Chocolate Box', price: 8.99 },
        { id: 'gift005', name: 'Teddy Bear', image_url: 'https://ik.imagekit.io/7grri5v7d/teddy-bear-removebg-preview.png', name_display: 'Teddy Bear', price: 9.99 },
        { id: 'gift006', name: 'Flower Bouquet', image_url: 'https://ik.imagekit.io/7grri5v7d/flower-bouquet-removebg-preview.png', name_display: 'Flower Bouquet', price: 12.99 },
        { id: 'gift007', name: 'Love Letter', image_url: 'https://ik.imagekit.io/7grri5v7d/love-letter-removebg-preview.png', name_display: 'Love Letter', price: 4.99 },
        { id: 'gift008', name: 'Perfume', image_url: 'https://ik.imagekit.io/7grri5v7d/perfume-removebg-preview.png', name_display: 'Perfume', price: 14.99 },
        { id: 'gift009', name: 'Jewelry Box', image_url: 'https://ik.imagekit.io/7grri5v7d/jewelry-box-removebg-preview.png', name_display: 'Jewelry Box', price: 18.99 },
        { id: 'gift010', name: 'Wine Bottle', image_url: 'https://ik.imagekit.io/7grri5v7d/wine-bottle-removebg-preview.png', name_display: 'Wine Bottle', price: 16.99 },
        { id: 'gift011', name: 'Cake Slice', image_url: 'https://ik.imagekit.io/7grri5v7d/cake-slice-removebg-preview.png', name_display: 'Cake Slice', price: 7.99 },
        { id: 'gift012', name: 'Music Box', image_url: 'https://ik.imagekit.io/7grri5v7d/music-box-removebg-preview.png', name_display: 'Music Box', price: 11.99 },
        { id: 'gift013', name: 'Photo Frame', image_url: 'https://ik.imagekit.io/7grri5v7d/photo-frame-removebg-preview.png', name_display: 'Photo Frame', price: 10.99 },
        { id: 'gift014', name: 'Candle Light', image_url: 'https://ik.imagekit.io/7grri5v7d/candle-light-removebg-preview.png', name_display: 'Candle Light', price: 5.99 },
        { id: 'gift015', name: 'Keychain', image_url: 'https://ik.imagekit.io/7grri5v7d/keychain-removebg-preview.png', name_display: 'Keychain', price: 6.49 },
        { id: 'gift016', name: 'Bracelet', image_url: 'https://ik.imagekit.io/7grri5v7d/bracelet-removebg-preview.png', name_display: 'Bracelet', price: 13.99 },
        { id: 'gift017', name: 'Necklace', image_url: 'https://ik.imagekit.io/7grri5v7d/necklace-removebg-preview.png', name_display: 'Necklace', price: 17.99 },
        { id: 'gift018', name: 'Earrings', image_url: 'https://ik.imagekit.io/7grri5v7d/earrings-removebg-preview.png', name_display: 'Earrings', price: 14.49 },
        { id: 'gift019', name: 'Watch', image_url: 'https://ik.imagekit.io/7grri5v7d/watch-removebg-preview.png', name_display: 'Watch', price: 22.99 },
        // New 6 gift images
        { id: 'gift020', name: 'Special Gift 1', image_url: 'https://ik.imagekit.io/7grri5v7d/dsfgsdfgsdfgds-removebg-preview.png?updatedAt=1773600046900', name_display: 'Special Gift 1', price: 7.99 },
        { id: 'gift021', name: 'Special Gift 2', image_url: 'https://ik.imagekit.io/7grri5v7d/dsfgsdfgsdfgdgsfgsdfg-removebg-preview.png?updatedAt=1773600149048', name_display: 'Special Gift 2', price: 8.99 },
        { id: 'gift022', name: 'Special Gift 3', image_url: 'https://ik.imagekit.io/7grri5v7d/dgafsgsdfgsdfgsdfgd-removebg-preview.png?updatedAt=1773600246313', name_display: 'Special Gift 3', price: 9.99 },
        { id: 'gift023', name: 'Special Gift 4', image_url: 'https://ik.imagekit.io/7grri5v7d/sdfasdfasdfasdfasdf-removebg-preview.png?updatedAt=1773601143240', name_display: 'Special Gift 4', price: 10.99 },
        { id: 'gift024', name: 'Special Gift 5', image_url: 'https://ik.imagekit.io/7grri5v7d/sdfasdfasdfaasdfasdf-removebg-preview.png?updatedAt=1773601223203', name_display: 'Special Gift 5', price: 11.99 },
        { id: 'gift025', name: 'Special Gift 6', image_url: 'https://ik.imagekit.io/7grri5v7d/dfsgdfgsdfgd-removebg-preview.png?updatedAt=1773601367483', name_display: 'Special Gift 6', price: 13.99 },
      ];
      setGifts(fallbackGifts);
      setLoading(false);
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
          image_url,
          name_display,
          price
        )
      `)
      .eq('user_id', profileId)
      .order('position', { ascending: true });

    if (error) {
      setSelectedGifts([]);
      return;
    }

    const selected = data?.map(item => ({
      id: item.virtual_gifts.id,
      name: item.virtual_gifts.name,
      image_url: item.virtual_gifts.image_url,
      name_display: item.virtual_gifts.name_display,
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
        .eq('user_id', profileId)
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
          .eq('user_id', profileId)
          .eq('gift_id', remainingGifts[i].id);
      }

      setSelectedGifts(remainingGifts);
      toast.success('Gift removed from mock profile');
    } else if (selectedGifts.length < 5) {
      // Add gift
      const { error } = await supabase
        .from('user_preferred_gifts')
        .insert({
          user_id: profileId,
          gift_id: gift.id,
          position: selectedGifts.length + 1
        });

      if (error) {
        toast.error('Failed to add gift');
        return;
      }

      setSelectedGifts([...selectedGifts, gift]);
      toast.success('Gift added to mock profile');
    } else {
      toast.error('Mock profiles can only have up to 5 gifts');
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
      <h3 style={{
        color: "rgba(168,85,247,0.9)",
        fontSize: 14,
        fontWeight: 700,
        marginBottom: 12,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}>
        Mock Profile Gifts
      </h3>
      
      <p style={{
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
        marginBottom: 16,
      }}>
        Select up to 5 gifts that users can send to this mock profile.
      </p>

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
              onClick={() => toggleGift(gift)}
              style={{
                background: isSelected 
                  ? "rgba(168,85,247,0.2)" 
                  : "rgba(255,255,255,0.05)",
                border: isSelected 
                  ? "2px solid rgba(168,85,247,0.8)" 
                  : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: 12,
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: '8px',
              }}>
                <img 
                  src={gift.image_url} 
                  alt={gift.name_display}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    // Fallback to a placeholder if image fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div style={{
                color: "white",
                fontSize: 10,
                fontWeight: 600,
                marginBottom: 2,
              }}>
                {gift.name_display}
              </div>
              <div style={{
                color: "rgba(168,85,247,0.8)",
                fontSize: 9,
                fontWeight: 700,
              }}>
                ${gift.price}
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedGifts.length > 0 && (
        <div>
          <p style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 11,
            marginBottom: 8,
          }}>
            Selected gifts ({selectedGifts.length}/5):
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
                  background: "rgba(168,85,247,0.15)",
                  border: "1px solid rgba(168,85,247,0.4)",
                  borderRadius: 8,
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderRadius: '4px',
                }}>
                  <img 
                    src={gift.image_url} 
                    alt={gift.name_display}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                <span style={{
                  color: "rgba(168,85,247,0.9)",
                  fontSize: 10,
                  fontWeight: 600,
                }}>
                  {gift.name_display}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
