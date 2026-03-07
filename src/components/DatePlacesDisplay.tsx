import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DatePlace } from "./DatePlacesEditor";

const CATEGORY_IMAGES: Record<string, string> = {
  "☕": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=300&fit=crop",
  "🌅": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
  "🍝": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
  "🌮": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop",
  "🍸": "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop",
  "🎵": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
  "🧺": "https://images.unsplash.com/photo-1526662092594-e98c1e356d28?w=400&h=300&fit=crop",
  "🌃": "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop",
};

const getEmojiFromIdea = (idea: string): string => {
  const match = idea.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);
  return match?.[match.length - 1] || "☕";
};

const getFallbackImage = (idea: string): string => {
  const emoji = getEmojiFromIdea(idea);
  return CATEGORY_IMAGES[emoji] || CATEGORY_IMAGES["☕"];
};

interface DatePlacesDisplayProps {
  places: DatePlace[];
  profileName: string;
}

const DatePlacesDisplay = ({ places, profileName }: DatePlacesDisplayProps) => {
  const [selectedPlace, setSelectedPlace] = useState<DatePlace | null>(null);

  if (!places || places.length === 0) return null;

  return (
    <>
      {/* Horizontal cards row */}
      <div className="flex items-center gap-2 mt-3 w-full overflow-x-auto pb-1 px-1">
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

      {/* Place detail modal */}
      <AnimatePresence>
        {selectedPlace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedPlace(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card border border-border rounded-2xl overflow-hidden max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Large image */}
              <div className="relative aspect-[16/10]">
                <img
                  src={selectedPlace.image_url || getFallbackImage(selectedPlace.idea)}
                  alt={selectedPlace.idea}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-foreground font-display font-bold text-lg">
                    {selectedPlace.idea}
                  </h3>
                  {selectedPlace.title && (
                    <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {selectedPlace.title}
                    </p>
                  )}
                </div>

                {selectedPlace.url && (
                  <a
                    href={selectedPlace.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full gradient-love text-primary-foreground border-0 font-bold">
                      <ExternalLink className="w-4 h-4 mr-2" /> View Place
                    </Button>
                  </a>
                )}

                <Button
                  variant="outline"
                  className="w-full border-border text-xs"
                  onClick={() => setSelectedPlace(null)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DatePlacesDisplay;
