import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Heart, MapPin, Fingerprint } from "lucide-react";
import availableTonightBadge from "@/assets/available-tonight-badge.png";
import type { Profile } from "./SwipeCard";
import { isOnline } from "@/hooks/useOnlineStatus";
import VoicePlayer from "./VoicePlayer";

interface SwipeStackProps {
  profiles: Profile[];
  direction: "up" | "down";
  roseAvailable?: boolean;
  onLike: (profile: Profile) => void;
  onPass: () => void;
  onRose?: (profile: Profile) => void;
}

const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 250;
const EXIT_DISTANCE = 700;

// Spring config for snap-back when swipe is cancelled
const SNAP_BACK = { type: "spring" as const, stiffness: 500, damping: 35 };
// Tween for exit fly-off
const EXIT_ANIM = { duration: 0.22, ease: "easeOut" as const };

const SwipeStack = ({
  profiles,
  direction,
  roseAvailable,
  onLike,
  onPass,
  onRose,
}: SwipeStackProps) => {
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

  // Clamp index if profiles shrink
  useEffect(() => {
    if (len > 0 && indexRef.current >= len) {
      indexRef.current = 0;
      setDisplayIndex(0);
    }
  }, [len]);

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
  const likeOpacity  = useTransform(x, [0, 50, 100], [0, 0.6, 1]);
  const nopeOpacity  = useTransform(x, [-100, -50, 0], [1, 0.6, 0]);

  // Vertical stamp: only respond when y is dominant axis
  // We derive a "vertical-dominant" opacity in the commit logic,
  // but for the motion value we clamp to y axis only.
  const verticalOpacity = useTransform(
    y,
    direction === "up"   ? [-100, -50, 0, 50] : [-50, 0, 50, 100],
    direction === "up"   ? [1, 0.7, 0, 0]     : [0, 0, 0.7, 1]
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
        else onPass();
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

      const isVerticalUp   = direction === "up"   && !horizontalDominant && (oy < -SWIPE_THRESHOLD || vy < -VELOCITY_THRESHOLD);
      const isVerticalDown = direction === "down"  && !horizontalDominant && (oy >  SWIPE_THRESHOLD || vy >  VELOCITY_THRESHOLD);
      const isRight        = horizontalDominant && (ox >  SWIPE_THRESHOLD || vx >  VELOCITY_THRESHOLD);
      const isLeft         = horizontalDominant && (ox < -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD);

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
        action = "pass";
      } else {
        exitX = -EXIT_DISTANCE;
        exitY = oy * 0.2;
        action = "pass";
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

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
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
        }}
        className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
      >
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-card">

          {/* ── Photo ─────────────────────────────────────────── */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              key={profile.image}
              src={profile.image}
              alt={profile.name}
              className="absolute w-full h-full object-cover"
              style={{
                objectPosition: profile.main_image_pos || "50% 50%",
                transform: `scale(${(profile.main_image_zoom || 100) / 100})`,
                transformOrigin: profile.main_image_pos || "center center",
              }}
              draggable={false}
            />
          </div>

          {/* ── Swipe colour overlay ───────────────────────────── */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: bgOverlay }}
          />

          {/* ── Bottom gradient ───────────────────────────────── */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

          {/* ── Available Tonight badge ───────────────────────── */}
          {profile.available_tonight && (
            <div className="absolute top-3 left-3 z-10">
              <img src={availableTonightBadge} alt="Available Tonight" className="h-8 drop-shadow-lg" />
            </div>
          )}

          {/* ── Swipe stamps ──────────────────────────────────── */}
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 right-6 px-5 py-2 rounded-lg border-[3px] border-green-400 rotate-[-15deg] pointer-events-none"
          >
            <span className="text-green-400 font-display font-extrabold text-2xl tracking-wider">NEXT</span>
          </motion.div>

          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-8 left-6 px-5 py-2 rounded-lg border-[3px] border-red-400 rotate-[15deg] pointer-events-none"
          >
            <span className="text-red-400 font-display font-extrabold text-2xl tracking-wider">PREV</span>
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
          {/* Fingerprint / next */}
          <button
            onClick={handleNextBtn}
            aria-label="Next profile"
            className={`absolute z-20 w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 hover:scale-110 transition-transform ${
              direction === "up" ? "bottom-3 right-3" : "top-3 right-3"
            }`}
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
          >
            <Fingerprint className="w-7 h-7 text-white/80" />
          </button>

          {/* Like */}
          <button
            onClick={handleLikeBtn}
            aria-label="Like"
            className={`absolute z-20 w-10 h-10 rounded-full gradient-love border-0 shadow-[0_0_14px_rgba(180,80,150,0.4)] flex items-center justify-center active:scale-95 hover:scale-110 transition-transform ${
              direction === "up" ? "top-3 right-3" : "bottom-3 right-3"
            }`}
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
          >
            <Heart className="w-5 h-5 text-white" fill="white" />
          </button>

          {/* ── Name / location ───────────────────────────────── */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-xl text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                {profile.name}, {profile.age}
              </h3>
              {isOnline(profile.last_seen_at) && (
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
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

export default SwipeStack;
