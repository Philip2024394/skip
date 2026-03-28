import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { Heart, MapPin, Fingerprint, BadgeCheck } from "lucide-react";
import type { Profile } from "./SwipeCard";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import { isMockCurrentlyOnline } from "@/shared/utils/mockOnlineSchedule";
import { firstName } from "@/shared/utils";
// Badge rendering is centralised in ProfileBadge — do not add badge logic here
import ProfileBadge from "@/features/dating/components/ProfileBadge";
import DistanceBadge from "@/features/dating/components/DistanceBadge";
import VoicePlayer from "@/features/video/components/VoicePlayer";
import { isProfileLocked } from "@/features/dating/utils/profileLock";

const TEDDY_CARD_IMAGE = "https://ik.imagekit.io/7grri5v7d/UntitledfsdfsdfsdfsdfDSFSDFSdssdfdasdasdfgsdfgdfssdfs.png";
const UNLOCK_CARD_IMAGE = "https://ik.imagekit.io/7grri5v7d/UntitledfsdfsdfsdfsdfDSFSDFSdssdfdasdasdfgsdfgdfssdfssasdasd.png";

interface SwipeStackProps {
  profiles: Profile[];
  direction: "up" | "down";
  roseAvailable?: boolean;
  onLike: (profile: Profile) => void;
  onPass: (profile: Profile) => void;
  onRose?: (profile: Profile) => void;
  onOpenMap?: (profile: Profile) => void;
  onCoinCard?: () => void;
  onUnlockCard?: () => void;
}

const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 250;
const EXIT_DISTANCE = 700;

// Spring config for snap-back when swipe is cancelled
const SNAP_BACK = { type: "spring" as const, stiffness: 500, damping: 35 };
// Tween for exit fly-off
const EXIT_ANIM = { duration: 0.22, ease: "easeOut" as const };

export default function SwipeStack({
  profiles,
  direction,
  roseAvailable,
  onLike,
  onPass,
  onRose,
  onOpenMap,
  onCoinCard,
  onUnlockCard,
}: SwipeStackProps) {
  // Index as a ref AND state — ref for synchronous reads inside callbacks,
  // state to trigger re-renders.
  const indexRef = useRef(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const isAnimating = useRef(false);
  const preloadedImages = useRef(new Set<string>());

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const len = profiles.length;

  // Keep indexRef in sync whenever state-driven displayIndex changes
  useEffect(() => {
    indexRef.current = displayIndex;
  }, [displayIndex]);

  // Clamp index if profiles shrink; only reset to 0 when current profile is no longer in list
  // (so the other stack advancing doesn't reset this stack — top and bottom operate 100% independently)
  const prevLenRef = useRef(len);
  useEffect(() => {
    if (len === 0) return;
    const currentProfile = profiles[displayIndex % len] ?? null;
    const currentId = currentProfile?.id;
    const stillInList = currentId && profiles.some((p) => p.id === currentId);
    if (!stillInList) {
      indexRef.current = 0;
      setDisplayIndex(0);
    } else if (displayIndex >= len) {
      const newIndex = Math.max(0, len - 1);
      indexRef.current = newIndex;
      setDisplayIndex(newIndex);
    }
    prevLenRef.current = len;
  }, [profiles, len, displayIndex]);

  // Preload next image in memory (no DOM render)
  const preload = useCallback((url: string) => {
    if (!url || preloadedImages.current.has(url)) return;
    preloadedImages.current.add(url);
    const img = new Image();
    img.src = url;
  }, []);

  // Preload 3 cards ahead whenever current index changes
  useEffect(() => {
    if (len === 0) return;
    for (let offset = 1; offset <= 3; offset++) {
      const p = profiles[(indexRef.current + offset) % len];
      if (p) preload(p.image);
    }
  }, [displayIndex, profiles, len, preload]);

  const profile = len > 0 ? profiles[displayIndex % len] : null;

  // ── Transforms ────────────────────────────────────────────────
  const rotate = useTransform(x, [-300, 0, 300], [-14, 0, 14]);

  // Horizontal stamps only respond to horizontal movement
  const likeOpacity = useTransform(x, [0, 50, 100], [0, 0.6, 1]);
  const nopeOpacity = useTransform(x, [-100, -50, 0], [1, 0.6, 0]);

  // Vertical stamp: show LIKE when swiping up (negative y) on both stacks, or when swiping down on bottom stack.
  const verticalOpacity = useTransform(
    y,
    direction === "up" ? [-100, -50, 0, 50] : [-100, -50, 0, 50, 100],
    direction === "up" ? [1, 0.7, 0, 0] : [1, 0.7, 0, 0, 0.7]
  );

  const bgOverlay = useTransform(
    x,
    [-200, -60, 0, 60, 200],
    [
      "rgba(239,68,68,0.15)",
      "rgba(239,68,68,0.04)",
      "rgba(0,0,0,0)",
      "rgba(34,197,94,0.04)",
      "rgba(34,197,94,0.15)",
    ]
  );

  // ── Core advance logic ────────────────────────────────────────
  const advance = useCallback(
    (action: "like" | "pass", capturedProfile: Profile) => {
      // Reset position first so next card starts at center
      x.jump(0);
      y.jump(0);

      const nextIndex = indexRef.current + 1;
      indexRef.current = nextIndex;
      setDisplayIndex(nextIndex);

      // Notify parent after paint so state is stable
      requestAnimationFrame(() => {
        if (action === "like") onLike(capturedProfile);
        else onPass(capturedProfile);
      });
    },
    [onLike, onPass, x, y]
  );

  // ── Commit swipe after drag ends ──────────────────────────────
  const commitSwipe = useCallback(
    async (ox: number, oy: number, vx = 0, vy = 0) => {
      if (isAnimating.current || !profile) return;

      // Determine dominant axis to avoid diagonal mis-fires
      const absX = Math.abs(ox), absY = Math.abs(oy);
      const absVx = Math.abs(vx), absVy = Math.abs(vy);
      const horizontalDominant = absX >= absY || absVx >= absVy;

      // Swipe UP = like on both stacks (top and bottom). Swipe DOWN = like only on bottom stack.
      const isVerticalUp = !horizontalDominant && (oy < -SWIPE_THRESHOLD || vy < -VELOCITY_THRESHOLD);
      const isVerticalDown = direction === "down" && !horizontalDominant && (oy > SWIPE_THRESHOLD || vy > VELOCITY_THRESHOLD);
      const isRight = horizontalDominant && (ox > SWIPE_THRESHOLD || vx > VELOCITY_THRESHOLD);
      const isLeft = horizontalDominant && (ox < -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD);

      // Not enough movement — snap back
      if (!isVerticalUp && !isVerticalDown && !isRight && !isLeft) {
        animate(x, 0, SNAP_BACK);
        animate(y, 0, SNAP_BACK);
        return;
      }

      isAnimating.current = true;
      const capturedProfile = profile;

      let exitX = 0, exitY = 0;
      let action: "like" | "pass" = "pass";

      if (isVerticalUp) {
        exitY = -EXIT_DISTANCE;
        exitX = ox * 0.2;
        action = "like";
      } else if (isVerticalDown) {
        exitY = EXIT_DISTANCE;
        exitX = ox * 0.2;
        action = "like";
      } else if (isRight) {
        exitX = EXIT_DISTANCE;
        exitY = oy * 0.2;
        action = "like";   // right swipe = Like ❤️
      } else {
        exitX = -EXIT_DISTANCE;
        exitY = oy * 0.2;
        action = "pass";   // left swipe = Pass ✗
      }

      // Fly off screen
      await Promise.all([
        animate(x, exitX, EXIT_ANIM),
        animate(y, exitY, EXIT_ANIM),
      ]);

      advance(action, capturedProfile);
      isAnimating.current = false;
    },
    [profile, direction, x, y, advance]
  );

  // ── Event handlers ────────────────────────────────────────────
  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (isAnimating.current) return;
      void commitSwipe(info.offset.x, info.offset.y, info.velocity.x, info.velocity.y);
    },
    [commitSwipe]
  );

  const handleDrag = useCallback(
    (_: unknown, info: PanInfo) => {
      // Eagerly preload next card as soon as user starts dragging
      if (Math.abs(info.offset.x) > 40 || Math.abs(info.offset.y) > 40) {
        if (len > 0) {
          const nextP = profiles[(indexRef.current + 1) % len];
          if (nextP) preload(nextP.image);
        }
      }
    },
    [len, preload, profiles]
  );

  // ── Button handlers ───────────────────────────────────────────
  const handleNextBtn = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isAnimating.current || !profile) return;
      isAnimating.current = true;
      const captured = profile;
      // Animate off to the right then advance
      animate(x, EXIT_DISTANCE, EXIT_ANIM).then(() => {
        advance("pass", captured);
        isAnimating.current = false;
      });
    },
    [profile, x, advance]
  );

  const handleLikeBtn = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isAnimating.current || !profile) return;
      isAnimating.current = true;
      const captured = profile;
      const exitY = direction === "up" ? -EXIT_DISTANCE : EXIT_DISTANCE;
      animate(y, exitY, EXIT_ANIM).then(() => {
        advance("like", captured);
        isAnimating.current = false;
      });
    },
    [profile, y, direction, advance]
  );

  // ── Render ────────────────────────────────────────────────────
  if (!profile) return null;

  // ── Coin card ─────────────────────────────────────────────────
  if ((profile as any)._coinCard) {
    return (
      <div
        className="relative w-full h-full overflow-hidden select-none"
        style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none", touchAction: "none" }}
      >
        <motion.div
          key={displayIndex}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.9}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          onTap={() => onCoinCard?.()}
          style={{ x, y, rotate, willChange: "transform", touchAction: "none" }}
          className="absolute inset-0 cursor-pointer touch-none"
        >
          <div
            className="relative w-full h-full rounded-2xl overflow-hidden"
            style={{ border: "2px solid rgba(250,204,21,0.45)", boxShadow: "0 0 32px rgba(250,204,21,0.18)" }}
          >
            <img
              src={TEDDY_CARD_IMAGE}
              alt="Daily Gift"
              className="absolute w-full h-full object-cover"
              draggable={false}
            />
            {/* Dark gradient bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
            {/* Gold shimmer top */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(135deg, rgba(250,204,21,0.10) 0%, transparent 50%)" }}
            />
            {/* Center badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="rounded-2xl px-6 py-3 text-center"
                style={{ background: "rgba(0,0,0,0.62)", border: "1.5px solid rgba(250,204,21,0.5)", boxShadow: "0 0 20px rgba(250,204,21,0.2)" }}
              >
                <p className="text-yellow-400 font-black text-2xl">🎁 Daily Gift</p>
                <p className="text-white/80 text-sm font-semibold mt-1">Tap to collect 10 coins</p>
              </motion.div>
            </div>
            {/* Bottom label */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
              <p className="text-yellow-400 font-black text-lg drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">🪙 Free Reward</p>
              <p className="text-white/60 text-sm">Tap the card to collect</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Unlock card ───────────────────────────────────────────────
  if ((profile as any)._unlockCard) {
    return (
      <div
        className="relative w-full h-full overflow-hidden select-none"
        style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none", touchAction: "none" }}
      >
        <motion.div
          key={displayIndex}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.9}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          onTap={() => onUnlockCard?.()}
          style={{ x, y, rotate, willChange: "transform", touchAction: "none" }}
          className="absolute inset-0 cursor-pointer touch-none"
        >
          <div
            className="relative w-full h-full rounded-2xl overflow-hidden"
            style={{ border: "2px solid rgba(99,102,241,0.5)", boxShadow: "0 0 32px rgba(99,102,241,0.2)" }}
          >
            <img
              src={UNLOCK_CARD_IMAGE}
              alt="2 Free Unlocks"
              className="absolute w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, transparent 55%)" }}
            />
            {/* Center badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="rounded-2xl px-6 py-3 text-center"
                style={{ background: "rgba(0,0,0,0.65)", border: "1.5px solid rgba(99,102,241,0.55)", boxShadow: "0 0 24px rgba(99,102,241,0.25)" }}
              >
                <p className="text-indigo-300 font-black text-2xl">🔓 Welcome Gift</p>
                <p className="text-white/80 text-sm font-semibold mt-1">Tap to collect 2 free unlocks</p>
              </motion.div>
            </div>
            {/* Bottom label */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
              <p className="text-indigo-300 font-black text-lg drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">🔓 2 Free Unlocks</p>
              <p className="text-white/60 text-sm">A welcome gift — tap to collect</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const isLocked = isProfileLocked(profile.id, (profile as any).is_mock);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none", touchAction: "none" }}
    >
      {/* Key on displayIndex so React fully replaces the node on each card change,
          preventing any stale transform leaking onto the next card */}
      <motion.div
        key={displayIndex}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.9}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{
          x,
          y,
          rotate,
          willChange: "transform",
          backfaceVisibility: "hidden",
          touchAction: "none",
        }}
        className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
      >
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-card">

          {/* ── Photo ─────────────────────────────────────────── */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              key={profile.image}
              src={profile.image || profile.avatar_url || "/placeholder.svg"}
              alt={profile.name}
              className="absolute w-full h-full object-cover"
              style={{
                objectPosition: "50% 0%", // Always show top part
                transform: `scale(${(profile.main_image_zoom || 100) / 100})`,
                transformOrigin: "50% 0%", // Anchor from top center
              }}
              draggable={false}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.src !== window.location.origin + "/placeholder.svg") {
                  img.src = profile.avatar_url && img.src !== profile.avatar_url
                    ? profile.avatar_url
                    : "/placeholder.svg";
                }
              }}
            />
          </div>

          {/* ── WA lock badge overlay ─────────────────────────── */}
          {isLocked && (
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.38)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <img
                  src="https://ik.imagekit.io/7grri5v7d/Profile%20locked%20with%20heart-shaped%20padlock.png"
                  alt="Locked"
                  style={{ width: 72, height: 72, objectFit: "contain", filter: "drop-shadow(0 0 16px rgba(236,72,153,0.6))" }}
                />
                <span style={{
                  color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: 800,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  background: "rgba(0,0,0,0.55)", padding: "3px 10px", borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.15)",
                }}>In WhatsApp Connection</span>
              </div>
            </div>
          )}

          {/* ── Swipe colour overlay ───────────────────────────── */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: bgOverlay }}
          />

          {/* ── Bottom gradient ───────────────────────────────── */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

          {/* ── Single badge — moved to name area (no longer top-left) ── */}

          {/* ── Distance badge — top-right, opens map ── */}
          <DistanceBadge
            profile={profile}
            onClick={() => {
              if (onOpenMap) {
                onOpenMap(profile);
              }
            }}
          />

          {/* ── Swipe stamps ──────────────────────────────────── */}
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 right-6 px-5 py-2 rounded-lg border-[3px] border-green-400 rotate-[-15deg] pointer-events-none"
          >
            <span className="text-green-400 font-display font-extrabold text-2xl tracking-wider flex items-center gap-1">❤️ LIKE</span>
          </motion.div>

          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-8 left-6 px-5 py-2 rounded-lg border-[3px] border-red-400 rotate-[15deg] pointer-events-none"
          >
            <span className="text-red-400 font-display font-extrabold text-2xl tracking-wider">NOPE</span>
          </motion.div>

          <motion.div
            style={{ opacity: verticalOpacity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-4 rounded-2xl gradient-love shadow-glow pointer-events-none"
          >
            <span className="text-primary-foreground font-display font-extrabold text-2xl flex items-center gap-2">
              <Heart className="w-6 h-6" fill="currentColor" /> LIKE
            </span>
          </motion.div>

          {/* ── Buttons ───────────────────────────────────────── */}
          {/* Fingerprint / next — glow */}
          <button
            onClick={handleNextBtn}
            aria-label="Next profile"
            className={`absolute z-20 w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 hover:scale-110 transition-transform shadow-[0_0_12px_rgba(255,255,255,0.25)] ${direction === "up" ? "bottom-3 right-3" : "top-3 right-3"
              }`}
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
          >
            <Fingerprint className="w-7 h-7 text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
          </button>

          {/* Like */}
          <button
            onClick={handleLikeBtn}
            aria-label="Like"
            className={`absolute z-20 w-10 h-10 rounded-full gradient-love border-0 shadow-[0_0_14px_rgba(180,80,150,0.4)] flex items-center justify-center active:scale-95 hover:scale-110 transition-transform ${direction === "up" ? "top-3 right-3" : "bottom-3 right-3"
              }`}
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
          >
            <Heart className="w-5 h-5 text-white" fill="white" />
          </button>

          {/* ── Name / location ───────────────────────────────── */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
            <div className="flex items-center gap-2">
              {/* No badge here — badge is locked to top-left via ProfileBadge only */}
              <h3 className="font-display font-bold text-xl text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] flex items-center gap-1.5">
                {profile.is_verified && (
                  <BadgeCheck className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)] flex-shrink-0" />
                )}
                {firstName(profile.name)}, {profile.age}
                <ProfileBadge profile={profile} isProfilePage={false} />
              </h3>
              {(profile.is_mock && (profile as any).mock_online_hours
                ? isMockCurrentlyOnline(profile.id, profile.country, (profile as any).mock_online_hours, (profile as any).mock_offline_days)
                : isOnline(profile.last_seen_at)) && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                  </span>
                )}
            </div>
            <p className="text-white/80 text-sm flex items-center gap-1 mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              <MapPin className="w-3 h-3" /> {profile.city}, {profile.country}
            </p>
            {/* Voice intro teaser — pointer-events-auto so it's tappable */}
            {profile.voice_intro_url && (
              <div className="mt-2 pointer-events-auto">
                <VoicePlayer url={profile.voice_intro_url} size="sm" />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

