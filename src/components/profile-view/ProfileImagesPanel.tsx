import { motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Fingerprint, Heart, MapPin, BadgeCheck } from "lucide-react";
import ProfileBadge from "@/components/ProfileBadge";
import ContactPreferenceBadge from "@/components/ContactPreferenceBadge";
import { isOnline } from "@/hooks/useOnlineStatus";

interface ProfileImagesPanelProps {
  profile: any;
  imageIndex: number;
  setImageIndex: (idx: number) => void;
  onClose: () => void;
  iLiked?: any[];
  handleLike?: (p: any) => void;
}

export default function ProfileImagesPanel({ profile, imageIndex, setImageIndex, onClose, iLiked = [], handleLike }: ProfileImagesPanelProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-2xl overflow-hidden min-h-0 flex flex-col bg-black/40 backdrop-blur-xl border-2 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-white/5"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 10, right: 10, zIndex: 10,
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "rgba(255,255,255,0.8)",
        }}
        aria-label="Close"
      >
        <X size={14} />
      </button>

      {/* Image counter */}
      <div style={{
        position: "absolute", top: 12, left: 14, zIndex: 10,
        background: "rgba(0,0,0,0.5)",
        borderRadius: 12,
        padding: "3px 10px",
        color: "white",
        fontSize: 11,
        fontWeight: 700,
      }}>
        {safeIndex + 1} / {images.length}
      </div>

      {/* Full-size image */}
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
            display: "block",
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />

        {/* Badge — top-left */}
        <ProfileBadge profile={profile} />

        {/* Like button — top-right, below close button */}
        {handleLike && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike(profile);
            }}
            aria-label={`Like ${profileName}`}
            className={`absolute z-20 w-10 h-10 rounded-full flex items-center justify-center active:scale-95 hover:scale-110 transition-all top-3 right-14 ${
              isLiked
                ? "bg-pink-500/40 border border-pink-400/60 shadow-[0_0_14px_rgba(180,80,150,0.5)]"
                : "gradient-love border-0 shadow-[0_0_14px_rgba(180,80,150,0.4)]"
            }`}
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
          >
            <Heart className="w-5 h-5 text-white" fill="white" />
          </button>
        )}

        {/* Navigation arrows */}
        {canPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); setImageIndex(safeIndex - 1); }}
            style={{
              position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "white",
            }}
            aria-label="Previous image"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {canNext && (
          <button
            onClick={(e) => { e.stopPropagation(); setImageIndex(safeIndex + 1); }}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "white",
            }}
            aria-label="Next image"
          >
            <ChevronRight size={18} />
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
          {profile?.contact_preference && (
            <div className="mt-1.5">
              <ContactPreferenceBadge preference={profile.contact_preference} />
            </div>
          )}
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

        {/* Fingerprint button - bottom right */}
        <button
          style={{
            position: "absolute", bottom: 12, right: 12, zIndex: 10,
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(236,72,153,0.8), rgba(168,85,247,0.8))",
            border: "2px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "white",
            boxShadow: "0 4px 16px rgba(236,72,153,0.4)",
          }}
          aria-label="Verify"
        >
          <Fingerprint size={22} />
        </button>
      </div>
    </motion.div>
  );
}
