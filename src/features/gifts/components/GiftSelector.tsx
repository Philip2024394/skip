import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import GiftSendPopup from "./GiftSendPopup";
import TokenPurchase from "./TokenPurchase";

interface VirtualGift {
  id: string;
  name: string;
  emoji: string;
  image_url: string;
  image_name: string;
  token_price: number;
  tier: "standard" | "premium" | "luxury";
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

// Diamond Standard fallback gift catalogue — matches Supabase virtual_gifts with ImageKit URLs
const DIAMOND_GIFTS: VirtualGift[] = [
  { id: "g01", name: "Love Letter", emoji: "\u{1F48C}", image_url: "https://ik.imagekit.io/7grri5v7d/love-letter-removebg-preview.png", image_name: "love_letter", token_price: 5, tier: "standard" },
  { id: "g02", name: "Classic Rose", emoji: "\u{1F339}", image_url: "https://ik.imagekit.io/7grri5v7d/classic-rose-removebg-preview.png", image_name: "classic_rose", token_price: 6, tier: "standard" },
  { id: "g03", name: "Candle Light", emoji: "\u{1F56F}\uFE0F", image_url: "https://ik.imagekit.io/7grri5v7d/candle-light-removebg-preview.png", image_name: "candle_light", token_price: 6, tier: "standard" },
  { id: "g04", name: "Romantic Heart", emoji: "\u2764\uFE0F", image_url: "https://ik.imagekit.io/7grri5v7d/romantic-heart-removebg-preview.png", image_name: "romantic_heart", token_price: 7, tier: "standard" },
  { id: "g05", name: "Cake Slice", emoji: "\u{1F370}", image_url: "https://ik.imagekit.io/7grri5v7d/cake-slice-removebg-preview.png", image_name: "cake_slice", token_price: 8, tier: "standard" },
  { id: "g06", name: "Chocolate Box", emoji: "\u{1F36B}", image_url: "https://ik.imagekit.io/7grri5v7d/chocolate-box-removebg-preview.png", image_name: "chocolate_box", token_price: 9, tier: "standard" },
  { id: "g07", name: "Teddy Bear", emoji: "\u{1F9F8}", image_url: "https://ik.imagekit.io/7grri5v7d/teddy-bear-removebg-preview.png", image_name: "teddy_bear", token_price: 10, tier: "standard" },
  { id: "g08", name: "Keychain", emoji: "\u{1F511}", image_url: "https://ik.imagekit.io/7grri5v7d/keychain-removebg-preview.png", image_name: "keychain", token_price: 6, tier: "standard" },
  { id: "g09", name: "Music Box", emoji: "\u{1F3B5}", image_url: "https://ik.imagekit.io/7grri5v7d/music-box-removebg-preview.png", image_name: "music_box", token_price: 12, tier: "premium" },
  { id: "g10", name: "Photo Frame", emoji: "\u{1F5BC}\uFE0F", image_url: "https://ik.imagekit.io/7grri5v7d/photo-frame-removebg-preview.png", image_name: "photo_frame", token_price: 11, tier: "premium" },
  { id: "g11", name: "Flower Bouquet", emoji: "\u{1F490}", image_url: "https://ik.imagekit.io/7grri5v7d/flower-bouquet-removebg-preview.png", image_name: "flower_bouquet", token_price: 13, tier: "premium" },
  { id: "g12", name: "Bracelet", emoji: "\u{1F4FF}", image_url: "https://ik.imagekit.io/7grri5v7d/bracelet-removebg-preview.png", image_name: "bracelet", token_price: 14, tier: "premium" },
  { id: "g13", name: "Earrings", emoji: "\u2728", image_url: "https://ik.imagekit.io/7grri5v7d/earrings-removebg-preview.png", image_name: "earrings", token_price: 14, tier: "premium" },
  { id: "g14", name: "Perfume", emoji: "\u{1F48E}", image_url: "https://ik.imagekit.io/7grri5v7d/perfume-removebg-preview.png", image_name: "perfume", token_price: 15, tier: "premium" },
  { id: "g15", name: "Diamond Ring", emoji: "\u{1F48D}", image_url: "https://ik.imagekit.io/7grri5v7d/diamond-ring-removebg-preview.png", image_name: "diamond_ring", token_price: 16, tier: "luxury" },
  { id: "g16", name: "Wine Bottle", emoji: "\u{1F377}", image_url: "https://ik.imagekit.io/7grri5v7d/wine-bottle-removebg-preview.png", image_name: "wine_bottle", token_price: 17, tier: "luxury" },
  { id: "g17", name: "Necklace", emoji: "\u{1F4AB}", image_url: "https://ik.imagekit.io/7grri5v7d/necklace-removebg-preview.png", image_name: "necklace", token_price: 18, tier: "luxury" },
  { id: "g18", name: "Jewelry Box", emoji: "\u{1F48E}", image_url: "https://ik.imagekit.io/7grri5v7d/jewelry-box-removebg-preview.png", image_name: "jewelry_box", token_price: 19, tier: "luxury" },
  { id: "g19", name: "Watch", emoji: "\u231A", image_url: "https://ik.imagekit.io/7grri5v7d/watch-removebg-preview.png", image_name: "watch", token_price: 23, tier: "luxury" },
  { id: "g20", name: "Special Gift 1", emoji: "\u{1F381}", image_url: "https://ik.imagekit.io/7grri5v7d/dsfgsdfgsdfgds-removebg-preview.png?updatedAt=1773600046900", image_name: "special_gift_1", token_price: 8, tier: "standard" },
  { id: "g21", name: "Special Gift 2", emoji: "\u{1F380}", image_url: "https://ik.imagekit.io/7grri5v7d/dsfgsdfgsdfgdgsfgsdfg-removebg-preview.png?updatedAt=1773600149048", image_name: "special_gift_2", token_price: 9, tier: "standard" },
  { id: "g22", name: "Special Gift 3", emoji: "\u{1F389}", image_url: "https://ik.imagekit.io/7grri5v7d/dgafsgsdfgsdfgsdfgd-removebg-preview.png?updatedAt=1773600246313", image_name: "special_gift_3", token_price: 10, tier: "premium" },
  { id: "g23", name: "Special Gift 4", emoji: "\u{1F388}", image_url: "https://ik.imagekit.io/7grri5v7d/sdfasdfasdfasdfasdf-removebg-preview.png?updatedAt=1773601143240", image_name: "special_gift_4", token_price: 11, tier: "premium" },
  { id: "g24", name: "Special Gift 5", emoji: "\u{1F38A}", image_url: "https://ik.imagekit.io/7grri5v7d/sdfasdfasdfaasdfasdf-removebg-preview.png?updatedAt=1773601223203", image_name: "special_gift_5", token_price: 12, tier: "premium" },
  { id: "g25", name: "Special Gift 6", emoji: "\u{1F38B}", image_url: "https://ik.imagekit.io/7grri5v7d/dfsgdfgsdfgd-removebg-preview.png?updatedAt=1773601367483", image_name: "special_gift_6", token_price: 14, tier: "luxury" },
];

const TIER_GRADIENT: Record<string, string> = {
  standard: "from-pink-500/20 to-pink-700/10",
  premium: "from-violet-500/25 to-fuchsia-700/15",
  luxury: "from-amber-400/30 to-yellow-600/15",
};

const TIER_BORDER: Record<string, string> = {
  standard: "border-pink-400/20",
  premium: "border-violet-400/30",
  luxury: "border-yellow-400/40",
};

export default function GiftSelector({ userId, profileId, profileName, onGiftSent }: GiftSelectorProps) {
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
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
    try {
      const { data, error } = await (supabase as any)
        .from("virtual_gifts")
        .select("id, name, image_url, name_display, price, emoji, tier")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: VirtualGift[] = data.map((g: any) => ({
          id: g.id,
          name: g.name_display || g.name,
          emoji: g.emoji || "\u{1F381}",
          image_url: g.image_url || "",
          image_name: g.name,
          token_price: Math.round(g.price) || 5,
          tier: g.tier || "standard",
        }));
        setGifts(mapped);
        setLoading(false);
        return;
      }
    } catch {
      // fallback below
    }

    setGifts(DIAMOND_GIFTS);
    setUserTokens({ tokens_balance: 500, free_gifts_used: 0 });
    setLoading(false);
  };

  const fetchUserTokens = async () => {
    setUserTokens({ tokens_balance: 500, free_gifts_used: 0 });
  };

  const handleGiftClick = (gift: VirtualGift) => {
    if (!profileId) return;
    setSelectedGift(gift);
    setShowSendPopup(true);
  };

  const handleGiftSent = () => {
    setShowSendPopup(false);
    setSelectedGift(null);
    fetchUserTokens();
    onGiftSent?.();
  };

  const freeGiftsRemaining = userTokens ? Math.max(0, 3 - userTokens.free_gifts_used) : 0;

  if (loading) {
    return (
      <div className="rounded-2xl p-4 h-44 relative border border-white/10 bg-black/30 backdrop-blur-md flex items-center justify-center">
        <div className="flex items-center gap-2 text-white/50 text-sm">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Loading gifts...</span>
        </div>
      </div>
    );
  }

  if (gifts.length === 0) return null;

  return (
    <>
      <div className="rounded-2xl h-44 overflow-hidden relative border border-white/10">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-md rounded-2xl pointer-events-none" />

        {/* Scrollable gift grid */}
        <div className="relative z-10 h-full overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide px-2 py-2 flex items-start gap-2">
          {gifts.map((gift, i) => {
            const isFree = freeGiftsRemaining > 0;
            const canAfford = userTokens && userTokens.tokens_balance >= gift.token_price;
            const canSend = isFree || canAfford;

            return (
              <motion.div
                key={gift.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className={`
                  inline-flex flex-col items-center flex-shrink-0 w-[72px] rounded-xl p-1.5 cursor-pointer
                  transition-all duration-200 border
                  bg-gradient-to-b ${TIER_GRADIENT[gift.tier]} ${TIER_BORDER[gift.tier]}
                  ${canSend ? "hover:scale-105 hover:shadow-lg hover:shadow-pink-500/10 active:scale-95" : "opacity-40 cursor-not-allowed"}
                `}
                onClick={() => canSend && handleGiftClick(gift)}
              >
                {/* Emoji icon */}
                <div className="w-12 h-12 rounded-lg bg-black/20 flex items-center justify-center mb-1 relative overflow-hidden">
                  {gift.image_url ? (
                    <img
                      src={gift.image_url}
                      alt={gift.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent && !parent.querySelector(".emoji-fb")) {
                          const fb = document.createElement("span");
                          fb.className = "emoji-fb";
                          fb.textContent = gift.emoji;
                          fb.style.cssText = "font-size:28px;line-height:1;";
                          parent.appendChild(fb);
                        }
                      }}
                    />
                  ) : (
                    <span className="text-[28px] leading-none select-none">{gift.emoji}</span>
                  )}
                  {gift.tier === "luxury" && (
                    <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <span className="text-white/90 text-[8px] font-semibold text-center leading-tight truncate w-full">
                  {gift.name}
                </span>

                {/* Price */}
                <div className="flex items-center gap-0.5 mt-0.5">
                  {isFree ? (
                    <span className="text-green-400 text-[8px] font-bold">FREE</span>
                  ) : (
                    <>
                      <Coins className="w-2.5 h-2.5 text-yellow-400" />
                      <span className="text-yellow-400 text-[8px] font-bold">{gift.token_price}</span>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Send Gift Modal */}
      <AnimatePresence>
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
      </AnimatePresence>

      {/* Coin Refuel Gate */}
      <AnimatePresence>
        {showTokenPurchase && (
          <TokenPurchase
            onClose={() => setShowTokenPurchase(false)}
            onPurchaseSuccess={() => {
              setShowTokenPurchase(false);
              fetchUserTokens();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
