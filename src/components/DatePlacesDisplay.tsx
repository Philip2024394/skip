import { useState } from "react";
import { motion } from "framer-motion";
import type { DatePlace } from "./DatePlacesEditor";

const CATEGORY_IMAGES: Record<string, string> = {
  "☕": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=300&fit=crop",
  "🧋": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  "🌅": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
  "🍝": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
  "🌮": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop",
  "🍸": "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop",
  "🍹": "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&h=300&fit=crop",
  "🍺": "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=300&fit=crop",
  "🎵": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
  "🎷": "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=300&fit=crop",
  "🎯": "https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=300&fit=crop",
  "🧺": "https://images.unsplash.com/photo-1526662092594-e98c1e356d28?w=400&h=300&fit=crop",
  "🌃": "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop",
  "🍰": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
  "🥐": "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=400&h=300&fit=crop",
  "🍕": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
  "🍣": "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=300&fit=crop",
  "🌸": "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop",
  "🏙️": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop",
  "🌙": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
  "🍷": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop",
  "🚤": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop",
  "🌇": "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400&h=300&fit=crop",
  "🎶": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
  "🦢": "https://images.unsplash.com/photo-1526662092594-e98c1e356d28?w=400&h=300&fit=crop",
  "🔥": "https://images.unsplash.com/photo-1475738198235-4b30fc29c482?w=400&h=300&fit=crop",
  "⭐": "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop",
  "🏛️": "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=300&fit=crop",
  "🏔️": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop",
  "🚲": "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=400&h=300&fit=crop",
  "🎨": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop",
  "🎤": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
  "💃": "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400&h=300&fit=crop",
  "🧘": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop",
  "💆": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop",
  "☀️": "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=300&fit=crop",
  "🧑‍🍳": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
  "✨": "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop",
  "🕯️": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
};

const getEmojiFromIdea = (idea: string): string => {
  const match = idea.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);
  return match?.[match.length - 1] || "☕";
};

const getFallbackImage = (idea: string): string => {
  const emoji = getEmojiFromIdea(idea);
  return CATEGORY_IMAGES[emoji] || CATEGORY_IMAGES["☕"];
};

const isInstagram = (url: string) =>
  url.includes("instagram.com") || url.includes("instagr.am");

// Instagram logo SVG inline
const InstagramIcon = () => (
  <svg className="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

interface DatePlacesDisplayProps {
  places: DatePlace[];
  profileName: string;
}

const DatePlacesDisplay = ({ places, profileName }: DatePlacesDisplayProps) => {
  const [selectedPlace, setSelectedPlace] = useState<DatePlace | null>(null);

  if (!places || places.length === 0) return null;

  return (
    <>
      {/* Horizontal cards row — compact, 1 row */}
      <div className="flex items-center gap-2 mt-3 w-full overflow-x-auto pb-1 px-1" style={{ scrollbarWidth: "none" }}>
        {places.map((place, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            onClick={(e) => { e.stopPropagation(); setSelectedPlace(place); }}
            className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden group"
          >
            <img
              src={place.image_url || getFallbackImage(place.idea)}
              alt={place.idea}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            {/* Instagram badge if link is from IG */}
            {(place.instagram_url || (place.url && isInstagram(place.url))) && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="#E1306C">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </div>
            )}
            <div className="absolute bottom-1 left-1 right-1">
              <p className="text-white text-[8px] font-semibold leading-tight truncate drop-shadow-lg">
                {place.idea}
              </p>
              {place.title && (
                <p className="text-white/60 text-[7px] truncate">{place.title}</p>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Improved popup */}
      {selectedPlace && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99990]"
            onClick={() => setSelectedPlace(null)}
          />

          {/* Modal */}
          <div
            className="fixed left-4 right-4 z-[99999] rounded-2xl overflow-hidden"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              maxWidth: 380,
              margin: "0 auto",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Hero image */}
            <div className="relative w-full" style={{ height: 220 }}>
              <img
                src={selectedPlace.image_url || getFallbackImage(selectedPlace.idea)}
                alt={selectedPlace.idea}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Close button */}
              <button
                onClick={() => setSelectedPlace(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white text-sm backdrop-blur-sm"
              >
                ✕
              </button>

              {/* Idea label on image */}
              <div className="absolute bottom-3 left-4">
                <span className="text-white font-black text-lg leading-tight">
                  {selectedPlace.idea}
                </span>
                {selectedPlace.title && (
                  <p className="text-white/70 text-xs mt-0.5">{selectedPlace.title}</p>
                )}
              </div>
            </div>

            {/* Bottom action area */}
            <div
              className="p-4 flex flex-col gap-2"
              style={{ background: "linear-gradient(135deg, #1a0533, #2d1b4e)" }}
            >
              {/* Instagram button */}
              {(selectedPlace.instagram_url || (selectedPlace.url && selectedPlace.url.includes("instagram"))) && (
                <a
                  href={selectedPlace.instagram_url || selectedPlace.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
                >
                  📸 View on Instagram
                </a>
              )}

              {/* Google Maps button */}
              {selectedPlace.google_url && (
                <a
                  href={selectedPlace.google_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: "rgba(66,133,244,0.3)", border: "1px solid rgba(66,133,244,0.5)" }}
                >
                  📍 View on Google Maps
                </a>
              )}

              {/* Other URL button */}
              {(selectedPlace.other_url ||
                (selectedPlace.url &&
                 !selectedPlace.url.includes("instagram") &&
                 !selectedPlace.url.includes("google"))) && (
                <a
                  href={selectedPlace.other_url || selectedPlace.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  🔗 View Place
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default DatePlacesDisplay;
