import { motion } from "framer-motion";
import { Heart, MapPin, BadgeCheck, Fingerprint } from "lucide-react";
import DistanceBadge from "@/components/DistanceBadge";
import { isOnline } from "@/hooks/useOnlineStatus";

// Mock male likers — always shown so female profiles appear popular
const MOCK_MALE_LIKERS = [
  { id: "mock-liker-1", name: "Rian", avatar_url: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: "mock-liker-2", name: "Adi", avatar_url: "https://randomuser.me/api/portraits/men/45.jpg" },
  { id: "mock-liker-3", name: "Bayu", avatar_url: "https://randomuser.me/api/portraits/men/22.jpg" },
  { id: "mock-liker-4", name: "Dimas", avatar_url: "https://randomuser.me/api/portraits/men/67.jpg" },
  { id: "mock-liker-5", name: "Farel", avatar_url: "https://randomuser.me/api/portraits/men/11.jpg" },
];

interface ProfileImagesPanelProps {
  profile: any;
  imageIndex: number;
  setImageIndex: (idx: number) => void;
  onClose: () => void;
  iLiked?: any[];
  handleLike?: (p: any) => void;
  likedMe?: any[];
  onOpenMap?: (profile: any) => void;
}

export default function ProfileImagesPanel({ profile, imageIndex, setImageIndex, onClose, iLiked = [], handleLike, likedMe = [], onOpenMap }: ProfileImagesPanelProps) {
  const images: string[] =
    Array.isArray(profile?.images) && profile.images.length > 0
      ? profile.images
      : profile?.avatar_url
        ? [profile.avatar_url]
        : ["/placeholder.svg"];

  const safeIndex = Math.min(imageIndex, images.length - 1);
  const canPrev = safeIndex > 0;
  const canNext = safeIndex < images.length - 1;

  const profileName = profile?.name || profile?.full_name || profile?.first_name || "Profile";
  const isLiked = iLiked.some((p: any) => p.id === profile?.id);

  // Combine real likers with mock male likers — always show at least some
  const realLikers = likedMe.filter((p: any) => p.id !== profile?.id);
  const mockToAdd = MOCK_MALE_LIKERS.filter((m) => !realLikers.some((r: any) => r.id === m.id));
  const likers = [...realLikers, ...mockToAdd].slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-2xl overflow-hidden min-h-0 flex flex-col bg-black/40 backdrop-blur-xl border-2 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-white/5"
    >
      {/* Liked section — top-left */}
      <div style={{
        position: "absolute", top: 10, left: 12, zIndex: 10,
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        <p style={{
          color: "rgba(236,72,153,0.95)",
          fontSize: 13,
          fontWeight: 800,
          margin: 0,
          textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          letterSpacing: "0.02em",
        }}>
          Liked
        </p>
        {likers.length > 0 && (
          <div style={{ display: "flex", gap: -4 }}>
            {likers.map((liker: any, i: number) => (
              <img
                key={liker.id}
                src={liker.avatar_url || liker.image || "/placeholder.svg"}
                alt={liker.name || ""}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(0,0,0,0.6)",
                  marginLeft: i > 0 ? -6 : 0,
                  position: "relative",
                  zIndex: likers.length - i,
                }}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.src !== window.location.origin + "/placeholder.svg") img.src = "/placeholder.svg";
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Image counter — top-right */}
      <div style={{
        position: "absolute", top: 12, right: 14, zIndex: 10,
        background: "rgba(0,0,0,0.5)",
        borderRadius: 12,
        padding: "3px 10px",
        color: "white",
        fontSize: 11,
        fontWeight: 700,
      }}>
        {safeIndex + 1} / {images.length}
      </div>

      {/* Full-size image — tap left/right to navigate */}
      <div
        style={{ flex: 1, position: "relative", minHeight: 0 }}
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 2) {
            if (canPrev) setImageIndex(safeIndex - 1);
          } else {
            if (canNext) setImageIndex(safeIndex + 1);
          }
        }}
      >
        <motion.img
          key={safeIndex}
          src={images[safeIndex]}
          alt={`${profileName} photo ${safeIndex + 1}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 0%", // Always show top part
            display: "block",
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />

        {/* Distance badge — top-right */}
        <DistanceBadge 
          profile={profile} 
          onClick={() => {
            if (onOpenMap) {
              onOpenMap(profile);
            }
          }}
        />

        {/* Like button — top-right, below counter */}
        {handleLike && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike(profile);
            }}
            aria-label={`Like ${profileName}`}
            className={`absolute z-20 w-10 h-10 rounded-full flex items-center justify-center active:scale-95 hover:scale-110 transition-all top-12 right-3 ${
              isLiked
                ? "bg-pink-500/40 border border-pink-400/60 shadow-[0_0_14px_rgba(180,80,150,0.5)]"
                : "gradient-love border-0 shadow-[0_0_14px_rgba(180,80,150,0.4)]"
            }`}
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
          >
            <Heart className="w-5 h-5 text-white" fill="white" />
          </button>
        )}

        {/* Fingerprint — next image button, bottom-right */}
        {canNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setImageIndex(safeIndex + 1);
            }}
            aria-label="Next image"
            className="absolute z-20 w-10 h-10 rounded-full flex items-center justify-center active:scale-95 hover:scale-110 transition-all"
            style={{
              bottom: 14,
              right: 14,
              background: "rgba(236,72,153,0.25)",
              border: "1.5px solid rgba(236,72,153,0.5)",
              boxShadow: "0 0 14px rgba(236,72,153,0.3)",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Fingerprint className="w-7 h-7 text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
          </button>
        )}

        {/* Name, age, verified, online — bottom-left */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-[5] pointer-events-none">
          <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
            {profile?.is_verified && (
              <BadgeCheck className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)] flex-shrink-0" />
            )}
            {profileName}, {profile?.age}
            {isOnline(profile?.last_seen_at) && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
              </span>
            )}
          </h3>
          <p className="text-white/60 text-sm flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" /> {profile?.city}, {profile?.country}
          </p>
        </div>

        {/* Dot indicators */}
        {images.length > 1 && (
          <div style={{
            position: "absolute", bottom: 70, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 6, zIndex: 5,
          }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setImageIndex(i); }}
                style={{
                  width: i === safeIndex ? 18 : 7,
                  height: 7,
                  borderRadius: 4,
                  background: i === safeIndex ? "rgba(236,72,153,0.9)" : "rgba(255,255,255,0.4)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  padding: 0,
                }}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
