import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { ChevronRight, MapPin, Map, X, MessageCircle, Star, Flag, Globe, Heart, Crown } from "lucide-react";
import { Profile } from "./SwipeCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isOnline } from "@/hooks/useOnlineStatus";
import { Button } from "@/components/ui/button";
import { PREMIUM_FEATURES, PremiumFeature } from "@/data/premiumFeatures";
import ReportDialog from "./ReportDialog";
import DatePlacesDisplay from "./DatePlacesDisplay";
import VoicePlayer from "./VoicePlayer";
import AppLogo from "./AppLogo";
import { useLanguage } from "@/i18n/LanguageContext";

interface DetailPanelProps {
  profile: Profile;
  isMatch: boolean;
  onClose: () => void;
  onUnlock: (profile: Profile) => void;
  onLike?: (profile: Profile) => void;
  nearbyUsers?: Profile[];
  onSelectUser?: (userId: string) => void;
  likedMeProfiles?: Profile[];
  hasSuperLike?: boolean;
  onSuperLike?: (profile: Profile) => void;
  onPurchaseFeature?: (feature: PremiumFeature) => void;
  alreadyLiked?: boolean;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

let heartIdCounter = 0;

const DetailPanel = ({ profile, isMatch, onClose, onUnlock, onLike, nearbyUsers = [], onSelectUser, likedMeProfiles = [], hasSuperLike = false, onSuperLike, onPurchaseFeature, alreadyLiked = false }: DetailPanelProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [imageIndex, setImageIndex] = useState(0);
  const [showSuperLikeDialog, setShowSuperLikeDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [showPlusOneModal, setShowPlusOneModal] = useState(false);
  const [liked, setLiked] = useState(alreadyLiked);
  const images = profile.images ?? [profile.image];

  const isPlusOne = !!profile.is_plusone;

  // Auto-show Plus One modal only when user taps the chat button (no auto-open)
  // Removed auto-open so modal opens only on chat button tap

  const handleClosePlusOneModal = () => {
    setShowPlusOneModal(false);
    sessionStorage.setItem(`plusone_seen_${profile.id}`, "1");
  };

  const handlePlusOneConnect = () => {
    handleClosePlusOneModal();
    const plusOneFeature = PREMIUM_FEATURES.find((f) => f.id === "plusone");
    if (plusOneFeature && onPurchaseFeature) {
      onPurchaseFeature(plusOneFeature);
    }
  };

  const handleLikeClick = () => {
    if (liked) return;
    setLiked(true);
    spawnHearts();
    if (onLike) onLike(profile);
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
            {/* Single VIP Plus-One badge for Plus One members */}
            {isPlusOne && (
              <div className="mb-2 flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-400/20 border border-yellow-400/50 backdrop-blur-md rounded-full px-3 py-1 shadow-[0_0_16px_rgba(250,204,21,0.4)]">
                <span className="text-yellow-400 text-base leading-none">👑</span>
                <span className="text-yellow-300 text-[11px] font-bold tracking-wider uppercase">VIP Plus-One</span>
              </div>
            )}
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
          <div className="absolute bottom-6 left-0 right-0 z-30 flex flex-col items-center gap-3 px-6" style={{ overflow: "visible" }}>

            {isPlusOne ? (
              /* ── Plus-One profile: round yellow chat (opens +1 modal) + heart + close ── */
              <>
                <div className="flex items-center justify-center gap-4">
                  {/* Round yellow chat — opens +1 Plus One container with purchase button */}
                  <button
                    onClick={() => {
                      sessionStorage.removeItem(`plusone_seen_${profile.id}`);
                      setShowPlusOneModal(true);
                    }}
                    aria-label="Plus One — connect on WhatsApp"
                    className="w-14 h-14 rounded-full bg-amber-400/90 hover:bg-amber-400 border-2 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)] flex items-center justify-center text-black hover:scale-105 transition-all"
                  >
                    <MessageCircle className="w-6 h-6" fill="currentColor" />
                  </button>
                  {/* Heart like button — always shown for +1 profiles */}
                  <button
                    onClick={handleLikeClick}
                    aria-label="Like this profile"
                    className={`w-14 h-14 rounded-full backdrop-blur-md border flex items-center justify-center hover:scale-105 transition-all ${
                      liked
                        ? "bg-primary/30 border-primary/60 text-primary"
                        : "bg-black/50 border-white/10 text-white hover:bg-black/70"
                    }`}
                  >
                    <Heart className="w-6 h-6" fill={liked ? "currentColor" : "none"} />
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
              </>
            ) : (
              /* ── Normal profile: mutual-match WhatsApp + super like + close ── */
              <>
                {isMatch ? (
                  <button
                    onClick={() => { spawnHearts(); onUnlock(profile); }}
                    aria-label="Unlock WhatsApp contact"
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-green-500/20 backdrop-blur-md border border-green-400/40 text-green-300 font-semibold text-sm hover:bg-green-500/30 hover:scale-105 transition-all"
                  >
                    <MessageCircle className="w-5 h-5" fill="currentColor" />
                    Connect on WhatsApp — $1.99
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                    <MessageCircle className="w-4 h-4 text-white/30" />
                    <span className="text-white/40 text-xs">Like each other to unlock WhatsApp</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4">
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
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Super Like Purchase Dialog */}
      <Dialog open={showSuperLikeDialog} onOpenChange={setShowSuperLikeDialog}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/10 text-white max-w-xs mx-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-center text-white">
              <Star className="w-10 h-10 mx-auto mb-2" fill="hsl(45, 95%, 58%)" stroke="hsl(45, 95%, 58%)" />
              {t("detail.superLike")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/60 text-sm text-center">
            {t("detail.superLikeDesc")} {profile.name} {t("detail.seesYouFirst")}
          </p>
          <ul className="text-white/50 text-xs space-y-1 mt-1">
            <li>⭐ {t("premium.superlike.1")}</li>
            <li>🔔 {t("premium.superlike.2")}</li>
            <li>💫 {t("premium.superlike.3")}</li>
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
            {t("detail.getSuperLike")}
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
            {/* Backdrop — matches GuestAuthPrompt */}
            <motion.div
              key="plusone-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
              onClick={handleClosePlusOneModal}
            />

            {/* Sheet — matches GuestAuthPrompt exactly */}
            <motion.div
              key="plusone-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 340 }}
              className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-10 pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

              <div className="bg-black/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden relative">
                {/* Close button — 44×44 touch target */}
                <button
                  onClick={handleClosePlusOneModal}
                  aria-label="Close"
                  className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/50 hover:text-white z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Hero gradient strip — same as GuestAuthPrompt */}
                <div className="h-1.5 w-full gradient-love" />

                <div className="p-6 space-y-5">
                  {/* Logo + headline — no crown here; crown is in No Strings Attached badge below */}
                  <div className="flex items-center gap-3">
                    <AppLogo className="w-12 h-12 object-contain drop-shadow-xl flex-shrink-0" />
                    <div>
                      <h2 className="text-white font-display font-bold text-lg leading-tight">+1 Plus One</h2>
                      <p className="text-white/50 text-xs mt-0.5">
                        <span className="text-white/80 font-medium">{profile.name}</span> is available to accompany you as a guest to any function or event without relationship ties.
                      </p>
                    </div>
                  </div>

                  {/* Occasion perks list — same style as GuestAuthPrompt perks */}
                  <ul className="space-y-2">
                    {[
                      { icon: "🍽", label: "Dinners & casual meetups" },
                      { icon: "💒", label: "Weddings & formal events" },
                      { icon: "🎵", label: "Concerts & festivals" },
                      { icon: "🤝", label: "Business & networking" },
                      { icon: "✈️", label: "Travel outings" },
                      { icon: "🎉", label: "Social gatherings" },
                    ].map(({ icon, label }) => (
                      <li key={label} className="flex items-center gap-2.5">
                        <span className="flex-shrink-0 text-base">{icon}</span>
                        <span className="text-white/70 text-sm">{label}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Info badge — crown icon before No Strings Attached */}
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2.5">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-[0_0_12px_rgba(250,204,21,0.5)] flex-shrink-0">
                      <Crown className="w-4 h-4 text-black" fill="currentColor" />
                    </span>
                    <p className="text-primary text-xs font-semibold">
                      No Strings Attached
                    </p>
                  </div>

                  {/* Primary CTA — $19.99 connect */}
                  <Button
                    onClick={handlePlusOneConnect}
                    className="w-full h-13 gradient-love border-0 text-white font-bold text-base rounded-2xl shadow-[0_0_24px_rgba(180,80,150,0.35)] hover:shadow-[0_0_32px_rgba(180,80,150,0.5)] transition-shadow"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" fill="currentColor" />
                    Connect on WhatsApp — $19.99
                  </Button>

                  {/* Secondary dismiss */}
                  <button
                    onClick={handleClosePlusOneModal}
                    className="w-full py-2 text-white/40 hover:text-white/70 text-sm font-medium transition-colors text-center"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DetailPanel;
