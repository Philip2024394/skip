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
    fetchGifts();
    fetchUserTokens();
  }, []);

  const fetchGifts = async () => {
    const { data, error } = await supabase
      .from('virtual_gifts')
      .select('*')
      .eq('is_active', true)
      .order('token_price', { ascending: true });

    if (error) {
      console.log('GiftSelector: Using fallback gifts due to error');
      // Use fallback gifts if database fails
      const fallbackGifts = [
        { id: 'gift001', name: 'Premium Rose', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview.png?updatedAt=1773598754691', image_name: 'premium_rose', token_price: 3 },
        { id: 'gift002', name: 'Love Heart', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-2.png?updatedAt=1773598754691', image_name: 'love_heart', token_price: 2 },
        { id: 'gift003', name: 'Teddy Bear', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-3.png?updatedAt=1773598754691', image_name: 'teddy_bear', token_price: 4 },
        { id: 'gift004', name: 'Chocolate Box', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-4.png?updatedAt=1773598754691', image_name: 'chocolate_box', token_price: 3 },
        { id: 'gift005', name: 'Perfume', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-5.png?updatedAt=1773598754691', image_name: 'perfume', token_price: 6 },
        { id: 'gift006', name: 'Flower Bouquet', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-7.png?updatedAt=1773598754691', image_name: 'flower_bouquet', token_price: 4 },
      ];
      setGifts(fallbackGifts);
    } else {
      setGifts(data || []);
    }
    setLoading(false);
  };

  const fetchUserTokens = async () => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from('user_tokens')
      .select('tokens_balance, free_gifts_used')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.log('GiftSelector: No tokens found, initializing');
      // Initialize user tokens if not exists
      const { error: insertError } = await supabase
        .from('user_tokens')
        .insert({ user_id: userId, tokens_balance: 0, free_gifts_used: 0 });
      
      if (!insertError) {
        setUserTokens({ tokens_balance: 0, free_gifts_used: 0 });
      }
    } else {
      setUserTokens(data);
    }
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

      <div className="text-white/50 text-xs mb-2 px-4">{gifts.length} Virtual Gifts Available</div>
      <div className="overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide px-4 py-3 bg-black/20 rounded-2xl border border-pink-400/20 h-32">
        {gifts.map((gift) => {
          const isFree = freeGiftsRemaining > 0;
          const canAfford = userTokens && userTokens.tokens_balance >= gift.token_price;
          const canSend = isFree || canAfford;

          return (
            <div
              key={gift.id}
              className={`inline-block align-top w-20 mr-3 whitespace-normal cursor-pointer transition-transform duration-200 ease-out rounded-xl p-2 h-28 ${
                canSend 
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
                    console.log('GiftSelector: Image failed to load:', gift.image_url);
                    const img = e.target as HTMLImageElement;
                    img.style.display = "none";
                    const parent = img.parentElement;
                    if (parent && !parent.querySelector('.fallback-emoji')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'fallback-emoji';
                      fallback.textContent = '🎁';
                      fallback.style.cssText = 'font-size: 24px; display: flex; align-items: center; justify-content: center; height: 100%; color: white;';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <div className="text-white text-[9px] font-semibold text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                {gift.name}
              </div>
              <div className={`text-[8px] font-bold text-center leading-tight ${
                isFree ? 'text-green-400' : 'text-yellow-400'
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
