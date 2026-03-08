import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, X, MapPin, ExternalLink, Sparkles, ShieldCheck,
  Heart, Zap, Calendar, Gift, CalendarDays, MoonStar, Share2,
} from "lucide-react";
import { Profile } from "./SwipeCard";
import { isOnline } from "@/hooks/useOnlineStatus";
import { useLanguage } from "@/i18n/LanguageContext";
import type { DatePlace } from "./DatePlacesEditor";

const CATEGORY_IMAGES: Record<string, string> = {
  "☕": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=300&fit=crop",
  "🌅": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
  "🍝": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
  "🍸": "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop",
  "🎵": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
  "🌸": "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop",
  "✨": "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop",
};

const getEmojiFromIdea = (idea: string): string => {
  const match = idea.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);
  return match?.[match.length - 1] || "☕";
};

const getFallbackImage = (idea: string): string => {
  const emoji = getEmojiFromIdea(idea);
  return CATEGORY_IMAGES[emoji] || CATEGORY_IMAGES["☕"];
};

interface ProfileSecondPageProps {
  profile: Profile;
  onBack: () => void;
}

export default function ProfileSecondPage({ profile, onBack }: ProfileSecondPageProps) {
  const { t } = useLanguage();
  const images = (profile.images ?? [profile.image]).filter(Boolean).slice(0, 4);
  const backgroundImage = images[0] || profile.image || "";
  const places = (profile.first_date_places ?? []).slice(0, 3) as DatePlace[];
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(null);
  const [enlargedPlaceIndex, setEnlargedPlaceIndex] = useState<number | null>(null);

  const activeOn2DateMe = isOnline(profile.last_seen_at);

  const shareProfileViaWhatsApp = () => {
    const appUrl = window.location.origin;
    const text = `${profile.name}, ${profile.age} — ${profile.city}, ${profile.country}. Check out on 2DateMe: ${appUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[55] flex flex-col overflow-hidden"
    >
      {/* Background: one of the profile images with dark overlay */}
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-black/75" />
        </>
      )}
      {!backgroundImage && <div className="absolute inset-0 bg-black" />}

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-xl shrink-0">
        <button
          onClick={onBack}
          aria-label="Back to profile"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white/80 text-sm font-medium">Full profile</span>
        <button
          onClick={shareProfileViaWhatsApp}
          aria-label={t("detail.shareProfile")}
          className="w-10 h-10 rounded-full bg-green-500/20 hover:bg-green-500/30 border border-green-400/40 flex items-center justify-center text-green-400 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
        {/* Hero name strip */}
        <div className="px-4 pt-6 pb-4">
          <h1 className="font-display font-bold text-2xl text-white">
            {profile.name}, <span className="text-white/70 font-normal">{profile.age}</span>
          </h1>
          <p className="text-white/50 text-sm flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" /> {profile.city}, {profile.country}
          </p>
        </div>

        {/* Pro / trust badges — safe, positive only */}
        <div className="px-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {activeOn2DateMe && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
                <Zap className="w-3.5 h-3.5" />
                Active on 2DateMe
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified profile
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/25 text-amber-300 text-xs font-medium">
              <Heart className="w-3.5 h-3.5" />
              Clean dating record
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5" />
              Has dated on 2DateMe
            </span>
            {profile.generous_lifestyle && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/25 text-amber-300 text-xs font-medium">
                <Gift className="w-3.5 h-3.5" />
                Generous Lifestyle
              </span>
            )}
            {profile.weekend_plans && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-medium">
                <CalendarDays className="w-3.5 h-3.5" />
                Weekend Plans
              </span>
            )}
            {profile.late_night_chat && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 text-xs font-medium">
                <MoonStar className="w-3.5 h-3.5" />
                Late Night Chat
              </span>
            )}
            {profile.no_drama && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-400/25 text-teal-300 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                No Drama
              </span>
            )}
          </div>
          {/* Activity / profile strength — visual only, pro look */}
          <div className="mt-4 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-white/70 text-xs font-medium mb-2">2DateMe activity</p>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: activeOn2DateMe ? "85%" : "60%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
              />
            </div>
            <p className="text-white/50 text-[10px] mt-1.5">
              {activeOn2DateMe ? "Highly active profile" : "Active profile"}
            </p>
          </div>
        </div>

        {/* Photos — up to 4, 2x2 grid, tap to enlarge */}
        <section className="px-4 mb-8">
          <h2 className="text-white/90 text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Photos
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {images.map((src, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setEnlargedImageIndex(idx)}
                className="aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <img
                  src={src}
                  alt={`${profile.name} ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        </section>

        {/* First date places — up to 3 */}
        {places.length > 0 && (
          <section className="px-4 mb-8">
            <h2 className="text-white/90 text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              First date ideas
            </h2>
            <div className="space-y-3">
              {places.map((place, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  onClick={() => setEnlargedPlaceIndex(idx)}
                  className="w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 text-left focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <div className="relative aspect-[2/1]">
                    <img
                      src={place.image_url || getFallbackImage(place.idea)}
                      alt={place.idea}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white font-semibold text-sm">{place.idea}</p>
                      {place.title && (
                        <p className="text-white/70 text-xs mt-0.5">{place.title}</p>
                      )}
                    </div>
                    {place.url && (
                      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 text-white/80" />
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* First date idea one-liner if present */}
        {profile.first_date_idea && (
          <section className="px-4 mb-8">
            <div className="rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3">
              <p className="text-primary text-sm font-medium">💕 {profile.first_date_idea}</p>
            </div>
          </section>
        )}

        {/* Languages */}
        {profile.languages && profile.languages.length > 0 && (
          <section className="px-4 mb-10">
            <h2 className="text-white/90 text-sm font-semibold mb-2">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((lang) => (
                <span
                  key={lang}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs"
                >
                  {lang}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Fullscreen image lightbox */}
      <AnimatePresence>
        {enlargedImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black flex items-center justify-center"
            onClick={() => setEnlargedImageIndex(null)}
          >
            <button
              onClick={() => setEnlargedImageIndex(null)}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/80"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={images[enlargedImageIndex]}
              alt={`${profile.name} photo ${enlargedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen place detail */}
      <AnimatePresence>
        {enlargedPlaceIndex !== null && places[enlargedPlaceIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col"
            onClick={() => setEnlargedPlaceIndex(null)}
          >
            <div className="flex-1 overflow-y-auto p-4">
              <button
                onClick={() => setEnlargedPlaceIndex(null)}
                aria-label="Close"
                className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <X className="w-6 h-6" />
              </button>
              {(() => {
                const place = places[enlargedPlaceIndex!];
                return (
                  <div className="pt-12 max-w-md mx-auto">
                    <div className="rounded-2xl overflow-hidden border border-white/10 mb-4">
                      <img
                        src={place.image_url || getFallbackImage(place.idea)}
                        alt={place.idea}
                        className="w-full aspect-video object-cover"
                      />
                    </div>
                    <h3 className="text-white text-xl font-display font-bold">{place.idea}</h3>
                    {place.title && (
                      <p className="text-white/60 text-sm mt-1 flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {place.title}
                      </p>
                    )}
                    {place.url && (
                      <a
                        href={place.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white text-sm font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                        View place
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
