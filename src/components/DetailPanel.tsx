import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { ChevronRight, MapPin, Map, X, MessageCircle, Star, Flag, Globe } from "lucide-react";
import { Profile } from "./SwipeCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isOnline } from "@/hooks/useOnlineStatus";
import { Button } from "@/components/ui/button";
import { PREMIUM_FEATURES, PremiumFeature } from "@/data/premiumFeatures";
import ReportDialog from "./ReportDialog";
import DatePlacesDisplay from "./DatePlacesDisplay";
import VoicePlayer from "./VoicePlayer";

interface DetailPanelProps {
  profile: Profile;
  isMatch: boolean;
  onClose: () => void;
  onUnlock: (profile: Profile) => void;
  nearbyUsers?: Profile[];
  onSelectUser?: (userId: string) => void;
  likedMeProfiles?: Profile[];
  hasSuperLike?: boolean;
  onSuperLike?: (profile: Profile) => void;
  onPurchaseFeature?: (feature: PremiumFeature) => void;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

let heartIdCounter = 0;

const DetailPanel = ({ profile, isMatch, onClose, onUnlock, nearbyUsers = [], onSelectUser, likedMeProfiles = [], hasSuperLike = false, onSuperLike, onPurchaseFeature }: DetailPanelProps) => {
  const navigate = useNavigate();
  const [imageIndex, setImageIndex] = useState(0);
  const [showSuperLikeDialog, setShowSuperLikeDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [showPlusOneModal, setShowPlusOneModal] = useState(false);
  const images = profile.images ?? [profile.image];
  const autoShownRef = useRef(false);

  // Auto-show Plus One modal once per profile per session
  useEffect(() => {
    if (!profile.is_plusone) return;
    const key = `plusone_seen_${profile.id}`;
    if (sessionStorage.getItem(key)) return;
    if (autoShownRef.current) return;
    autoShownRef.current = true;
    const timer = setTimeout(() => {
      setShowPlusOneModal(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [profile.id, profile.is_plusone]);

  const handleClosePlusOneModal = () => {
    setShowPlusOneModal(false);
    sessionStorage.setItem(`plusone_seen_${profile.id}`, "1");
  };

  const dragX = useMotionValue(0);
  const imageRotate = useTransform(dragX, [-200, 0, 200], [-8, 0, 8]);
  const imageScale = useTransform(dragX, [-200, 0, 200], [0.95, 1, 0.95]);

  const handleImageDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -80) {
      setImageIndex((i) => (i + 1) % images.length);
    } else if (info.offset.x > 80) {
      setImageIndex((i) => (i - 1 + images.length) % images.length);
    }
  };

  const prevImage = () => setImageIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setImageIndex((i) => (i + 1) % images.length);

  const spawnHearts = useCallback(() => {
    const newHearts: FloatingHeart[] = Array.from({ length: 6 }, () => ({
      id: ++heartIdCounter,
      x: (Math.random() - 0.5) * 80,
      y: -(Math.random() * 60 + 40),
      size: Math.random() * 10 + 10,
      delay: Math.random() * 0.3,
    }));
    setFloatingHearts((prev) => [...prev, ...newHearts]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => !newHearts.includes(h)));
    }, 1500);
  }, []);

  const hasLocation = profile.latitude && profile.longitude;

  return (
    <>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        {/* Header: prev/next buttons + liked-me avatars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={() => setShowReportDialog(true)}
            aria-label="Report this profile"
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50 hover:text-red-400 hover:bg-black/70 transition-all"
          >
            <Flag className="w-5 h-5" />
          </button>

          <div className="flex items-center -space-x-2">
            {likedMeProfiles.slice(0, 5).map((p) => (
              <div key={p.id} className="w-8 h-8 rounded-full border-2 border-black/60 overflow-hidden ring-1 ring-white/20">
                <img src={p.avatar_url || p.image} alt={p.name} className="w-full h-full object-cover" />
              </div>
            ))}
            {likedMeProfiles.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border-2 border-black/60 ring-1 ring-white/20 flex items-center justify-center">
                <span className="text-white/80 text-[9px] font-bold">+{likedMeProfiles.length - 5}</span>
              </div>
            )}
            {likedMeProfiles.length === 0 && (
              <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-white/50 text-[10px]">No likes yet</span>
              </div>
            )}
          </div>

          <button
            onClick={nextImage}
            aria-label="Next photo"
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Full-screen image */}
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={imageIndex}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              onDragEnd={handleImageDrag}
              style={{ x: dragX, rotate: imageRotate, scale: imageScale }}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <img
                src={images[imageIndex]}
                alt={`${profile.name} photo ${imageIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

          {/* Image indicators */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === imageIndex ? "w-6 bg-white" : "w-2 bg-white/40"
                }`}
              />
            ))}
          </div>

          {/* Profile info — centered, raised */}
          <div className="absolute bottom-[140px] left-0 right-0 z-10 flex flex-col items-center text-center px-6">
            <h2 className="font-display font-bold text-3xl text-white drop-shadow-lg flex items-center gap-2 justify-center">
              {profile.name}, <span className="font-normal text-white/80">{profile.age}</span>
              {isOnline(profile.last_seen_at) && (
                <span className="relative flex h-3 w-3 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                </span>
              )}
            </h2>
            <p className="text-white/70 text-sm flex items-center gap-1 mt-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" /> {profile.city}, {profile.country}
            </p>

            {/* Activity badges */}
            <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
              {profile.gender && (
                <span className="bg-black/50 backdrop-blur-md border border-white/10 text-white/80 text-[10px] px-3 py-1 rounded-full">
                  {profile.gender}
                </span>
              )}
              {profile.is_plusone ? (
                <button
                  onClick={() => {
                    const key = `plusone_seen_${profile.id}`;
                    sessionStorage.removeItem(key);
                    setShowPlusOneModal(true);
                  }}
                  className="bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 hover:bg-black/90 transition-colors"
                >
                  <span className="font-black text-[11px]">+1</span>
                  <span className="text-white/80">Plus-One</span>
                </button>
              ) : profile.available_tonight ? (
                <span className="bg-black/80 backdrop-blur-md border border-yellow-400/70 text-white text-[10px] font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-[0_0_8px_rgba(250,204,21,0.4)]">
                  <span className="text-yellow-400">🌙</span> Free Tonight
                </span>
              ) : null}
              {profile.bio && (
                <span className="bg-black/50 backdrop-blur-md border border-white/10 text-white/70 text-[10px] px-3 py-1 rounded-full max-w-[200px] truncate">
                  {profile.bio}
                </span>
              )}
              {profile.first_date_idea && (
                <span className="bg-black/50 backdrop-blur-md border border-white/10 text-white/80 text-[10px] px-3 py-1 rounded-full">
                  💕 {profile.first_date_idea}
                </span>
              )}
              {hasLocation && (
                <button
                  onClick={() => navigate(`/map?profile=${profile.id}`)}
                  className="bg-black/50 backdrop-blur-md border border-white/10 text-white/80 text-[10px] px-3 py-1 rounded-full flex items-center gap-1 hover:bg-black/70 transition-colors"
                >
                  <Map className="w-3 h-3" /> View Map
                </button>
               )}
              {profile.languages && profile.languages.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap justify-center mt-1">
                  <Globe className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
                  {profile.languages.map((lang) => (
                    <span key={lang} className="bg-black/50 backdrop-blur-md border border-white/10 text-white/80 text-[10px] px-2.5 py-1 rounded-full">
                      {lang}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Date Places Cards */}
            {profile.first_date_places && profile.first_date_places.length > 0 && (
              <DatePlacesDisplay places={profile.first_date_places} profileName={profile.name} />
            )}

            {/* Voice Intro Player */}
            {profile.voice_intro_url && (
              <div className="w-full mt-3 px-2">
                <VoicePlayer
                  url={profile.voice_intro_url}
                  size="md"
                  profileName={profile.name}
                />
              </div>
            )}
          </div>

          {/* Floating hearts animation */}
          <AnimatePresence>
            {floatingHearts.map((heart) => (
              <motion.div
                key={heart.id}
                className="absolute bottom-24 left-1/2 pointer-events-none z-40"
                initial={{ x: heart.x, y: 0, opacity: 1, scale: 0.6 }}
                animate={{ x: heart.x * 1.5, y: heart.y * 2.5, opacity: 0, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, delay: heart.delay, ease: "easeOut" }}
                style={{ fontSize: heart.size }}
              >
                ❤️
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Bottom action buttons */}
          <div className="absolute bottom-6 left-0 right-0 z-30 flex items-center justify-center gap-4 px-6" style={{ overflow: "visible" }}>
            {/* Chat / Unlock WhatsApp */}
            <button
              onClick={() => { spawnHearts(); onUnlock(profile); }}
              aria-label="Unlock WhatsApp contact"
              className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/70 hover:scale-105 transition-all"
            >
              <MessageCircle className="w-6 h-6" fill="currentColor" />
            </button>

            {/* Super Like */}
            <button
              onClick={() => {
                spawnHearts();
                if (hasSuperLike && onSuperLike) {
                  onSuperLike(profile);
                } else {
                  setShowSuperLikeDialog(true);
                }
              }}
              aria-label="Super Like"
              className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/70 hover:scale-105 transition-all"
              style={{ color: hasSuperLike ? "hsl(45, 95%, 58%)" : "white" }}
            >
              <Star className="w-6 h-6" fill="currentColor" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Close profile"
              className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/70 hover:scale-105 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Super Like Purchase Dialog */}
      <Dialog open={showSuperLikeDialog} onOpenChange={setShowSuperLikeDialog}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/10 text-white max-w-xs mx-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-center text-white">
              <Star className="w-10 h-10 mx-auto mb-2" fill="hsl(45, 95%, 58%)" stroke="hsl(45, 95%, 58%)" />
              Super Like
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/60 text-sm text-center">
            Stand out from the crowd! Send a Super Like so {profile.name} sees you first.
          </p>
          <ul className="text-white/50 text-xs space-y-1 mt-1">
            <li>⭐ Appears first in their library</li>
            <li>🔔 They get notified instantly</li>
            <li>💫 Highlighted with a star</li>
          </ul>
          <Button
            onClick={() => {
              setShowSuperLikeDialog(false);
              const superLikeFeature = PREMIUM_FEATURES.find((f) => f.id === "superlike");
              if (superLikeFeature && onPurchaseFeature) {
                onPurchaseFeature(superLikeFeature);
              }
            }}
            className="w-full gradient-gold text-primary-foreground border-0 font-bold mt-2"
          >
            Get Super Like — $1.99
          </Button>
        </DialogContent>
      </Dialog>

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reportedUserId={profile.id}
        reportedUserName={profile.name}
      />

      {/* ── Plus-One Info Modal ─────────────────────────────── */}
      <AnimatePresence>
        {showPlusOneModal && (
          <>
            {/* Backdrop */}
            <motion.div
              key="plusone-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={handleClosePlusOneModal}
            />

            {/* Sheet */}
            <motion.div
              key="plusone-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[61] rounded-t-3xl bg-[#0d0d0d] border-t border-white/10 overflow-hidden"
              style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Close button — 44×44 touch target */}
              <button
                onClick={handleClosePlusOneModal}
                aria-label="Close"
                className="absolute top-3 right-4 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="px-6 pt-2 pb-2">
                {/* Badge icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-white/8 border border-white/15 flex items-center justify-center">
                    <span className="text-white font-black text-2xl leading-none">+1</span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-white font-bold text-xl text-center leading-tight mb-2">
                  Plus One
                </h2>

                {/* Explanation */}
                <p className="text-white/60 text-sm text-center leading-relaxed mb-5">
                  <span className="text-white font-medium">{profile.name}</span> is looking for someone to accompany them as a guest to events and social occasions — this is <span className="text-white font-medium">not</span> for relationships or dating.
                </p>

                {/* Occasion pills */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {[
                    { icon: "🍽", label: "Dinners & meetups" },
                    { icon: "💒", label: "Weddings & events" },
                    { icon: "🎵", label: "Concerts & festivals" },
                    { icon: "🤝", label: "Business & networking" },
                    { icon: "✈️", label: "Travel outings" },
                    { icon: "🎉", label: "Social gatherings" },
                  ].map(({ icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5"
                    >
                      <span className="text-sm">{icon}</span>
                      <span className="text-white/70 text-xs leading-tight">{label}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  onClick={handleClosePlusOneModal}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold text-sm border-0 shadow-lg"
                >
                  Got it
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DetailPanel;
