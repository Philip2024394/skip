import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VirtualGift {
  id: string;
  name: string;
  image_url: string;
  name_display: string;
  price: number;
}

interface GiftSelectorProps {
  userId: string;
  profileId: string;
  profileName: string;
  onGiftSelected?: (gift: VirtualGift) => void;
  onGiftSent?: () => void;
}

export default function GiftSelector({ userId, profileId, profileName }: GiftSelectorProps) {
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
  const [selectedGifts, setSelectedGifts] = useState<VirtualGift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    // Use fallback gifts directly since virtual_gifts table doesn't exist yet
    const fallbackGifts = [
      // Original 6 gift images with proper UUIDs
      { id: 'b0c1d2e3-f4a5-6789-3456-012345678901', name: 'Special Gift 1', image_url: 'https://ik.imagekit.io/7grri5v7d/dsfgsdfgsdfgds-removebg-preview.png?updatedAt=1773600046900', name_display: 'Special Gift 1', price: 7.99 },
      { id: 'c1d2e3f4-a5b6-7890-4567-123456789012', name: 'Special Gift 2', image_url: 'https://ik.imagekit.io/7grri5v7d/dsfgsdfgsdfgdgsfgsdfg-removebg-preview.png?updatedAt=1773600149048', name_display: 'Special Gift 2', price: 8.99 },
      { id: 'd2e3f4a5-b6c7-8901-5678-234567890123', name: 'Special Gift 3', image_url: 'https://ik.imagekit.io/7grri5v7d/dgafsgsdfgsdfgsdfgd-removebg-preview.png?updatedAt=1773600246313', name_display: 'Special Gift 3', price: 9.99 },
      { id: 'e3f4a5b6-c7d8-9012-6789-345678901234', name: 'Special Gift 4', image_url: 'https://ik.imagekit.io/7grri5v7d/sdfasdfasdfasdfasdf-removebg-preview.png?updatedAt=1773601143240', name_display: 'Special Gift 4', price: 10.99 },
      { id: 'f4a5b6c7-d8e9-0123-7890-456789012345', name: 'Special Gift 5', image_url: 'https://ik.imagekit.io/7grri5v7d/sdfasdfasdfaasdfasdf-removebg-preview.png?updatedAt=1773601223203', name_display: 'Special Gift 5', price: 11.99 },
      { id: 'a5b6c7d8-e9f0-1234-8901-567890123456', name: 'Special Gift 6', image_url: 'https://ik.imagekit.io/7grri5v7d/dfsgdfgsdfgd-removebg-preview.png?updatedAt=1773601367483', name_display: 'Special Gift 6', price: 13.99 },
      // New 19 gift images with proper UUIDs
      { id: 'b1c2d3e4-f5a6-7890-abcd-ef1234567891', name: 'Premium Rose', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview.png?updatedAt=1773598754691', name_display: 'Premium Rose', price: 6.99 },
      { id: 'c2d3e4f5-a6b7-8901-bcde-f1234567892', name: 'Diamond Ring', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-1.png?updatedAt=1773598754691', name_display: 'Diamond Ring', price: 8.99 },
      { id: 'd3e4f5a6-b7c8-9012-cdef-234567890123', name: 'Love Heart', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-2.png?updatedAt=1773598754691', name_display: 'Love Heart', price: 5.99 },
      { id: 'e4f5a6b7-c8d9-0123-def0-345678901234', name: 'Teddy Bear', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-3.png?updatedAt=1773598754691', name_display: 'Teddy Bear', price: 7.99 },
      { id: 'f5a6b7c8-d9e0-1234-ef01-456789012345', name: 'Chocolate Box', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-4.png?updatedAt=1773598754691', name_display: 'Chocolate Box', price: 9.99 },
      { id: 'a6b7c8d9-e0f1-2345-f012-567890123456', name: 'Perfume', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-5.png?updatedAt=1773598754691', name_display: 'Perfume', price: 12.99 },
      { id: 'b7c8d9e0-f1a2-3456-0123-678901234567', name: 'Jewelry Box', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-6.png?updatedAt=1773598754691', name_display: 'Jewelry Box', price: 15.99 },
      { id: 'c8d9e0f1-a2b3-4567-1234-789012345678', name: 'Flower Bouquet', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-7.png?updatedAt=1773598754691', name_display: 'Flower Bouquet', price: 8.99 },
      { id: 'd9e0f1a2-b3c4-5678-2345-890123456789', name: 'Wine Bottle', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-8.png?updatedAt=1773598754691', name_display: 'Wine Bottle', price: 18.99 },
      { id: 'e0f1a2b3-c4d5-6789-3456-901234567890', name: 'Watch', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-9.png?updatedAt=1773598754691', name_display: 'Watch', price: 22.99 },
      { id: 'f1a2b3c4-d5e6-7890-4567-012345678901', name: 'Necklace', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-10.png?updatedAt=1773598754691', name_display: 'Necklace', price: 14.99 },
      { id: 'a2b3c4d5-e6f7-8901-5678-123456789012', name: 'Bracelet', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-11.png?updatedAt=1773598754691', name_display: 'Bracelet', price: 11.99 },
      { id: 'b3c4d5e6-f7a8-9012-6789-234567890123', name: 'Earrings', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-12.png?updatedAt=1773598754691', name_display: 'Earrings', price: 9.99 },
      { id: 'c4d5e6f7-a8b9-0123-7890-345678901234', name: 'Handbag', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-13.png?updatedAt=1773598754691', name_display: 'Handbag', price: 19.99 },
      { id: 'd5e6f7a8-b9c0-1234-8901-456789012345', name: 'Shoes', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-14.png?updatedAt=1773598754691', name_display: 'Shoes', price: 16.99 },
      { id: 'e6f7a8b9-c0d1-2345-9012-567890123456', name: 'Makeup Kit', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-15.png?updatedAt=1773598754691', name_display: 'Makeup Kit', price: 13.99 },
      { id: 'f7a8b9c0-d1e2-3456-0123-678901234567', name: 'Spa Voucher', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-16.png?updatedAt=1773598754691', name_display: 'Spa Voucher', price: 25.99 },
      { id: 'a8b9c0d1-e2f3-4567-1234-789012345678', name: 'Romantic Dinner', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-17.png?updatedAt=1773598754691', name_display: 'Romantic Dinner', price: 35.99 },
      { id: 'b9c0d1e2-f3a4-5678-2345-890123456789', name: 'Weekend Trip', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-18.png?updatedAt=1773598754691', name_display: 'Weekend Trip', price: 49.99 },
      { id: 'c0d1e2f3-a4b5-6789-3456-901234567890', name: 'Luxury Car', image_url: 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-19.png?updatedAt=1773598754691', name_display: 'Luxury Car', price: 99.99 },
    ];
    
    console.log('GiftSelector: Using fallback gifts:', fallbackGifts.length);
    setGifts(fallbackGifts);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-md border border-pink-400/30 rounded-2xl p-4 m-4">
        <div className="text-white/70 text-center">Loading gifts...</div>
      </div>
    );
  }

  console.log('GiftSelector: Component loaded, gifts count:', gifts.length);
  console.log('GiftSelector: First few gifts:', gifts.slice(0, 3));

  if (gifts.length === 0 && !loading) {
    return (
      <div className="bg-black/40 backdrop-blur-md border border-pink-400/30 rounded-2xl p-4 m-4">
        <div className="text-white/70 text-center">No gifts available</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-white/50 text-xs mb-2 px-4">{gifts.length} Virtual Gifts Available</div>
      <div className="overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide px-4 py-3 bg-black/20 rounded-2xl border border-pink-400/20 h-32">
      {gifts.map((gift) => {
        console.log('GiftSelector: Rendering gift:', gift.name_display, gift.image_url);
        return (
          <div
            key={gift.id}
            className="inline-block align-top w-20 mr-3 whitespace-normal cursor-pointer transition-transform duration-200 ease-out bg-white/5 rounded-xl p-2 h-28 hover:scale-105"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            onClick={() => {
              // Handle gift selection action
            }}
          >
            <div className="w-16 h-16 rounded-lg overflow-hidden mb-1.5 bg-white/10 flex items-center justify-center">
              <img 
                src={gift.image_url} 
                alt={gift.name_display}
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
              {gift.name_display}
            </div>
            <div className="text-pink-400 text-[8px] font-bold text-center leading-tight">
              ${gift.price}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
