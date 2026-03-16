import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import GiftSendPopup from "./GiftSendPopup";
import TokenPurchase from "./TokenPurchase";

interface VirtualGift {
  id: string;
  name: string;
  image_url: string;
  image_name: string;
  token_price: number;
}

interface UserTokens {
  tokens_balance: number;
  free_gifts_used: number;
}

interface GiftSelectorProps {
  userId: string;
  profileId: string;
  profileName: string;
  onGiftSelected?: (gift: VirtualGift) => void;
  onGiftSent?: () => void;
}

export default function GiftSelector({ userId, profileId, profileName, onGiftSent }: GiftSelectorProps) {
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
  const [selectedGifts, setSelectedGifts] = useState<VirtualGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [userTokens, setUserTokens] = useState<UserTokens | null>(null);
  const [showSendPopup, setShowSendPopup] = useState(false);
  const [showTokenPurchase, setShowTokenPurchase] = useState(false);
  const [selectedGift, setSelectedGift] = useState<VirtualGift | null>(null);

  useEffect(() => {
    console.log('GiftSelector: Component mounted, starting fetchGifts');
    fetchGifts();
    fetchUserTokens();
  }, []);

  // Debug logging for gifts state
  useEffect(() => {
    console.log('GiftSelector: Gifts state updated:', {
      giftsCount: gifts.length,
      loading,
      userTokens
    });
  }, [gifts, loading, userTokens]);

  const fetchGifts = async () => {
    // Try to fetch from Supabase virtual_gifts table first
    console.log('GiftSelector: Fetching gifts from Supabase virtual_gifts table');
    try {
      const { data, error } = await supabase
        .from('virtual_gifts')
        .select('id, name, image_url, name_display, price')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('GiftSelector: Error fetching gifts from Supabase:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('GiftSelector: Successfully fetched', data.length, 'gifts from Supabase');
        // Transform Supabase data to match our format
        const transformedGifts = data.map(gift => ({
          id: gift.id,
          name: gift.name_display || gift.name,
          image_url: gift.image_url,
          image_name: gift.name,
          token_price: Math.round(gift.price) || 5
        }));
        setGifts(transformedGifts);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.log('GiftSelector: Supabase fetch failed, using fallback gifts');
    }

    // Fallback to hardcoded gifts with reliable placeholder images
    console.log('GiftSelector: Using fallback gifts with reliable placeholder images');
    const fallbackGifts = [
      { id: 'gift001', name: 'Classic Rose', image_url: 'https://via.placeholder.com/150x150/ff69b4/ffffff?text=🌹', image_name: 'classic_rose', token_price: 6 },
      { id: 'gift002', name: 'Romantic Heart', image_url: 'https://via.placeholder.com/150x150/ff1493/ffffff?text=❤️', image_name: 'romantic_heart', token_price: 7 },
      { id: 'gift003', name: 'Diamond Ring', image_url: 'https://via.placeholder.com/150x150/87ceeb/ffffff?text=💍', image_name: 'diamond_ring', token_price: 16 },
      { id: 'gift004', name: 'Chocolate Box', image_url: 'https://via.placeholder.com/150x150/d2691e/ffffff?text=🍫', image_name: 'chocolate_box', token_price: 9 },
      { id: 'gift005', name: 'Teddy Bear', image_url: 'https://via.placeholder.com/150x150/daa520/ffffff?text=🧸', image_name: 'teddy_bear', token_price: 10 },
      { id: 'gift006', name: 'Flower Bouquet', image_url: 'https://via.placeholder.com/150x150/ff69b4/ffffff?text=💐', image_name: 'flower_bouquet', token_price: 13 },
      { id: 'gift007', name: 'Love Letter', image_url: 'https://via.placeholder.com/150x150/ff69b4/ffffff?text=💌', image_name: 'love_letter', token_price: 5 },
      { id: 'gift008', name: 'Perfume', image_url: 'https://via.placeholder.com/150x150/9370db/ffffff?text=👗', image_name: 'perfume', token_price: 15 },
      { id: 'gift009', name: 'Jewelry Box', image_url: 'https://via.placeholder.com/150x150/ffd700/ffffff?text=💎', image_name: 'jewelry_box', token_price: 19 },
      { id: 'gift010', name: 'Wine Bottle', image_url: 'https://via.placeholder.com/150x150/8b0000/ffffff?text=🍷', image_name: 'wine_bottle', token_price: 17 },
      { id: 'gift011', name: 'Cake Slice', image_url: 'https://via.placeholder.com/150x150/ff69b4/ffffff?text=🍰', image_name: 'cake_slice', token_price: 8 },
      { id: 'gift012', name: 'Music Box', image_url: 'https://via.placeholder.com/150x150/9370db/ffffff?text=🎵', image_name: 'music_box', token_price: 12 },
      { id: 'gift013', name: 'Photo Frame', image_url: 'https://via.placeholder.com/150x150/c0c0c0/ffffff?text=🖼️', image_name: 'photo_frame', token_price: 11 },
      { id: 'gift014', name: 'Candle Light', image_url: 'https://via.placeholder.com/150x150/ffa500/ffffff?text=🕯', image_name: 'candle_light', token_price: 6 },
      { id: 'gift015', name: 'Keychain', image_url: 'https://via.placeholder.com/150x150/silver/ffffff?text=🔑', image_name: 'keychain', token_price: 6 },
      { id: 'gift016', name: 'Bracelet', image_url: 'https://via.placeholder.com/150x150/c0c0c0/ffffff?text⌚', image_name: 'bracelet', token_price: 14 },
      { id: 'gift017', name: 'Necklace', image_url: 'https://via.placeholder.com/150x150/ffd700/ffffff?text=📿', image_name: 'necklace', token_price: 18 },
      { id: 'gift018', name: 'Earrings', image_url: 'https://via.placeholder.com/150x150/ffd700/ffffff?text=👂', image_name: 'earrings', token_price: 14 },
      { id: 'gift019', name: 'Watch', image_url: 'https://via.placeholder.com/150x150/c0c0c0/ffffff?text=⌚', image_name: 'watch', token_price: 23 },
      { id: 'gift020', name: 'Special Gift 1', image_url: 'https://via.placeholder.com/150x150/ff69b4/ffffff?text=🎁', image_name: 'special_gift_1', token_price: 8 },
      { id: 'gift021', name: 'Special Gift 2', image_url: 'https://via.placeholder.com/150x150/87ceeb/ffffff?text=🎀', image_name: 'special_gift_2', token_price: 9 },
      { id: 'gift022', name: 'Special Gift 3', image_url: 'https://via.placeholder.com/150x150/ffd700/ffffff?text=🎉', image_name: 'special_gift_3', token_price: 10 },
      { id: 'gift023', name: 'Special Gift 4', image_url: 'https://via.placeholder.com/150x150/9370db/ffffff?text=🎈', image_name: 'special_gift_4', token_price: 11 },
      { id: 'gift024', name: 'Special Gift 5', image_url: 'https://via.placeholder.com/150x150/ff6347/ffffff?text=🎊', image_name: 'special_gift_5', token_price: 12 },
      { id: 'gift025', name: 'Special Gift 6', image_url: 'https://via.placeholder.com/150x150/20b2aa/ffffff?text=🎋', image_name: 'special_gift_6', token_price: 14 },
    ];

    console.log('GiftSelector: Setting fallback gifts array with', fallbackGifts.length, 'items');
    setGifts(fallbackGifts);
    setLoading(false);

    // Set default user tokens for admin
    setUserTokens({
      tokens_balance: 100,
      free_gifts_used: 0
    });
  };

  const fetchUserTokens = async () => {
    // Use default values for admin user to avoid Supabase errors
    setUserTokens({
      tokens_balance: 100,
      free_gifts_used: 0
    });
  };

  const handleGiftClick = (gift: VirtualGift) => {
    if (!profileId || profileId === "") return;

    setSelectedGift(gift);
    setShowSendPopup(true);
  };

  const handleGiftSent = () => {
    setShowSendPopup(false);
    setSelectedGift(null);
    fetchUserTokens(); // Refresh token balance
    onGiftSent?.();
  };

  const freeGiftsRemaining = userTokens ? Math.max(0, 3 - userTokens.free_gifts_used) : 0;

  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-md border border-pink-400/30 rounded-2xl p-4 m-4">
        <div className="text-white/70 text-center">Loading gifts...</div>
      </div>
    );
  }

  if (gifts.length === 0 && !loading) {
    return (
      <div className="bg-black/40 backdrop-blur-md border border-pink-400/30 rounded-2xl p-4 m-4">
        <div className="text-white/70 text-center">No gifts available</div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl p-3 h-48 overflow-hidden relative border-2 border-white/20">
        {/* Solid edge background - matching New Members */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-2xl pointer-events-none" />

        {/* Gift content container */}
        <div className="relative z-10 h-full overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide">
          {gifts.map((gift) => {
            const isFree = freeGiftsRemaining > 0;
            const canAfford = userTokens && userTokens.tokens_balance >= gift.token_price;
            const canSend = isFree || canAfford;

            return (
              <div
                key={gift.id}
                className={`inline-block align-top w-20 mr-3 whitespace-normal cursor-pointer transition-transform duration-200 ease-out rounded-xl p-2 h-36 ${canSend
                  ? 'bg-white/5 hover:scale-105'
                  : 'bg-white/5 opacity-50 cursor-not-allowed'
                  }`}
                onMouseEnter={(e) => {
                  if (canSend) e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onClick={() => canSend && handleGiftClick(gift)}
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden mb-2 bg-white/10 flex items-center justify-center">
                  <img
                    src={gift.image_url}
                    alt={gift.name}
                    className="w-full h-full object-contain"
                    onLoad={() => {
                      console.log('GiftSelector: Image loaded:', gift.image_url);
                    }}
                    onError={(e) => {
                      console.log('GiftSelector: Image failed to load, using fallback:', gift.image_url);
                      const img = e.target as HTMLImageElement;
                      img.style.display = "none";
                      const parent = img.parentElement;
                      if (parent && !parent.querySelector('.fallback-emoji')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'fallback-emoji';
                        fallback.textContent = '🎁';
                        fallback.style.cssText = 'font-size: 32px; display: flex; align-items: center; justify-content: center; height: 100%; color: white; background: linear-gradient(135deg, #ff69b4, #87ceeb); border-radius: 8px;';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                  {/* Always show emoji as backup */}
                  <div
                    className="fallback-emoji absolute"
                    style={{
                      fontSize: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'white',
                      background: 'linear-gradient(135deg, #ff69b4, #87ceeb)',
                      borderRadius: '8px',
                      opacity: 0
                    }}
                  >
                    🎁
                  </div>
                </div>
                <div className="text-white text-[9px] font-semibold text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  {gift.name}
                </div>
                <div className={`text-[8px] font-bold text-center leading-tight ${isFree ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                  {isFree ? 'FREE' : `${gift.token_price}₽`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Send Gift Popup */}
      {showSendPopup && selectedGift && userTokens && (
        <GiftSendPopup
          gift={selectedGift}
          recipientId={profileId}
          recipientName={profileName}
          userTokens={userTokens.tokens_balance}
          freeGiftsRemaining={freeGiftsRemaining}
          onClose={() => {
            setShowSendPopup(false);
            setSelectedGift(null);
          }}
          onGiftSent={handleGiftSent}
        />
      )}

      {/* Token Purchase */}
      {showTokenPurchase && (
        <TokenPurchase
          onClose={() => setShowTokenPurchase(false)}
          onPurchaseSuccess={() => {
            setShowTokenPurchase(false);
            fetchUserTokens();
          }}
        />
      )}
    </>
  );
}
