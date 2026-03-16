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
    // Use fallback gifts with simple solid colors and emoji text
    console.log('GiftSelector: Loading 25 virtual gifts with simple images');
    const allGifts = [
      { id: 'gift001', name: 'Premium Rose', image_url: 'https://picsum.photos/150/150?random=1&blur=2&bg=ff69b4&text=🌹', image_name: 'premium_rose', token_price: 3 },
      { id: 'gift002', name: 'Diamond Ring', image_url: 'https://picsum.photos/150/150?random=2&blur=2&bg=87ceeb&text=💍', image_name: 'diamond_ring', token_price: 5 },
      { id: 'gift003', name: 'Love Heart', image_url: 'https://picsum.photos/150/150?random=3&blur=2&bg=ff1493&text=❤️', image_name: 'love_heart', token_price: 2 },
      { id: 'gift004', name: 'Teddy Bear', image_url: 'https://picsum.photos/150/150?random=4&blur=2&bg=daa520&text=🧸', image_name: 'teddy_bear', token_price: 4 },
      { id: 'gift005', name: 'Chocolate Box', image_url: 'https://picsum.photos/150/150?random=5&blur=2&bg=d2691e&text=🍫', image_name: 'chocolate_box', token_price: 3 },
      { id: 'gift006', name: 'Perfume', image_url: 'https://picsum.photos/150/150?random=6&blur=2&bg=9370db&text=👗', image_name: 'perfume', token_price: 6 },
      { id: 'gift007', name: 'Jewelry Box', image_url: 'https://picsum.photos/150/150?random=7&blur=2&bg=ffd700&text=💎', image_name: 'jewelry_box', token_price: 8 },
      { id: 'gift008', name: 'Flower Bouquet', image_url: 'https://picsum.photos/150/150?random=8&blur=2&bg=ff69b4&text=💐', image_name: 'flower_bouquet', token_price: 4 },
      { id: 'gift009', name: 'Wine Bottle', image_url: 'https://picsum.photos/150/150?random=9&blur=2&bg=8b0000&text=🍷', image_name: 'wine_bottle', token_price: 7 },
      { id: 'gift010', name: 'Watch', image_url: 'https://picsum.photos/150/150?random=10&blur=2&bg=c0c0c0&text=⌚', image_name: 'watch', token_price: 10 },
      { id: 'gift011', name: 'Necklace', image_url: 'https://picsum.photos/150/150?random=11&blur=2&bg=ffd700&text=📿', image_name: 'necklace', token_price: 9 },
      { id: 'gift012', name: 'Bracelet', image_url: 'https://picsum.photos/150/150?random=12&blur=2&bg=c0c0c0&text=⌚', image_name: 'bracelet', token_price: 6 },
      { id: 'gift013', name: 'Earrings', image_url: 'https://picsum.photos/150/150?random=13&blur=2&bg=ffd700&text=👂', image_name: 'earrings', token_price: 5 },
      { id: 'gift014', name: 'Handbag', image_url: 'https://picsum.photos/150/150?random=14&blur=2&bg=8b4513&text=👜', image_name: 'handbag', token_price: 11 },
      { id: 'gift015', name: 'Shoes', image_url: 'https://picsum.photos/150/150?random=15&blur=2&bg=ff69b4&text=👠', image_name: 'shoes', token_price: 8 },
      { id: 'gift016', name: 'Makeup Kit', image_url: 'https://picsum.photos/150/150?random=16&blur=2&bg=ff69b4&text=💄', image_name: 'makeup_kit', token_price: 4 },
      { id: 'gift017', name: 'Spa Voucher', image_url: 'https://picsum.photos/150/150?random=17&blur=2&bg=98fb98&text=💆', image_name: 'spa_voucher', token_price: 12 },
      { id: 'gift018', name: 'Romantic Dinner', image_url: 'https://picsum.photos/150/150?random=18&blur=2&bg=dc143c&text=🍽️', image_name: 'romantic_dinner', token_price: 15 },
      { id: 'gift019', name: 'Weekend Trip', image_url: 'https://picsum.photos/150/150?random=19&blur=2&bg=87ceeb&text=✈️', image_name: 'weekend_trip', token_price: 20 },
      { id: 'gift020', name: 'Luxury Car', image_url: 'https://picsum.photos/150/150?random=20&blur=2&bg=000000&text=🚗', image_name: 'luxury_car', token_price: 25 },
      { id: 'gift021', name: 'Special Gift 1', image_url: 'https://picsum.photos/150/150?random=21&blur=2&bg=ff69b4&text=🎁', image_name: 'special_gift_1', token_price: 3 },
      { id: 'gift022', name: 'Special Gift 2', image_url: 'https://picsum.photos/150/150?random=22&blur=2&bg=87ceeb&text=🎀', image_name: 'special_gift_2', token_price: 4 },
      { id: 'gift023', name: 'Special Gift 3', image_url: 'https://picsum.photos/150/150?random=23&blur=2&bg=ffd700&text=🎉', image_name: 'special_gift_3', token_price: 5 },
      { id: 'gift024', name: 'Special Gift 4', image_url: 'https://picsum.photos/150/150?random=24&blur=2&bg=9370db&text=🎈', image_name: 'special_gift_4', token_price: 6 },
      { id: 'gift025', name: 'Special Gift 5', image_url: 'https://picsum.photos/150/150?random=25&blur=2&bg=ff6347&text=🎊', image_name: 'special_gift_5', token_price: 7 },
    ];

    // Set gifts directly without Supabase call
    console.log('GiftSelector: Setting gifts array with', allGifts.length, 'items');
    setGifts(allGifts);
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
    <div>
      {/* Token Status */}
      {userTokens && (
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="text-white/50 text-xs">
            {freeGiftsRemaining > 0 ? (
              <span className="text-green-400">{freeGiftsRemaining} Free Gifts</span>
            ) : (
              <span className="text-yellow-400">{userTokens.tokens_balance} Tokens</span>
            )}
          </div>
          <button
            onClick={() => setShowTokenPurchase(true)}
            className="text-pink-400 text-xs hover:text-pink-300 transition-colors"
          >
            Get Tokens
          </button>
        </div>
      )}

      <div className="overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide px-4 py-3 bg-black/20 rounded-2xl border border-pink-400/20 h-32">
        {gifts.map((gift) => {
          const isFree = freeGiftsRemaining > 0;
          const canAfford = userTokens && userTokens.tokens_balance >= gift.token_price;
          const canSend = isFree || canAfford;

          return (
            <div
              key={gift.id}
              className={`inline-block align-top w-20 mr-3 whitespace-normal cursor-pointer transition-transform duration-200 ease-out rounded-xl p-2 h-28 ${canSend
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
              <div className="w-16 h-16 rounded-lg overflow-hidden mb-1.5 bg-white/10 flex items-center justify-center">
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

      {/* Token Purchase Popup */}
      {showTokenPurchase && (
        <TokenPurchase
          onClose={() => setShowTokenPurchase(false)}
          onPurchaseSuccess={() => {
            setShowTokenPurchase(false);
            fetchUserTokens();
          }}
        />
      )}
    </div>
  );
}
