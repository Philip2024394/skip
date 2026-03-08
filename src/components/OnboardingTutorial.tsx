import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Fingerprint } from "lucide-react";
import AppLogo from "./AppLogo";

export const ONBOARDING_STORAGE_KEY = "2dateme_hasSeenTutorial";

const STEP_DURATION_MS = 2000;
const END_SCREEN_DURATION_MS = 2000;
const TOTAL_STEPS = 9;

const STEPS: { label: string }[] = [
  { label: "Swipe right to like someone 💚" },
  { label: "Swipe left to skip ❌" },
  { label: "Swipe up to send a Rose 🌹" },
  { label: "Tap the fingerprint to connect instantly 👆" },
  { label: "See who you liked here 💛" },
  { label: "See who liked you back 💜" },
  { label: "Tap a profile to see more 👀" },
  { label: "Swipe up to view full profile 📋" },
  { label: "Find people near you on the map 📍" },
];

/** White glove hand SVG — clean illustration with drop shadow */
function WhiteGloveHand({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.35))" }}
    >
      <defs>
        <linearGradient id="glove-white" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f0f0f0" />
        </linearGradient>
      </defs>
      {/* Back of hand + palm */}
      <path
        d="M60 20 C85 22 100 50 98 75 C96 95 85 110 60 115 L60 115 C35 110 24 95 22 75 C20 50 35 22 60 20 Z"
        fill="url(#glove-white)"
        stroke="rgba(0,0,0,0.06)"
        strokeWidth="1.5"
      />
      {/* Fingers */}
      <path d="M58 22 L45 8 L48 28 Z" fill="url(#glove-white)" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      <path d="M62 18 L75 5 L72 26 Z" fill="url(#glove-white)" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      <path d="M60 25 L55 12 L65 12 Z" fill="url(#glove-white)" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      <path d="M60 30 L58 15 L68 18 Z" fill="url(#glove-white)" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      <path d="M60 35 L62 20 L70 28 Z" fill="url(#glove-white)" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      {/* Thumb */}
      <path d="M35 55 Q25 70 28 90 L42 85 Q38 68 45 58 Z" fill="url(#glove-white)" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      {/* Wrist cuff */}
      <ellipse cx="60" cy="118" rx="28" ry="10" fill="url(#glove-white)" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
    </svg>
  );
}

interface OnboardingTutorialProps {
  visible: boolean;
  onComplete: () => void;
}

export default function OnboardingTutorial({ visible, onComplete }: OnboardingTutorialProps) {
  const [step, setStep] = useState(0);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [exiting, setExiting] = useState(false);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      setShowEndScreen(true);
    }
  }, [step]);

  const skip = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  }, [onComplete]);

  // Auto-advance each step
  useEffect(() => {
    if (!visible || showEndScreen || exiting) return;
    const t = setTimeout(goNext, STEP_DURATION_MS);
    return () => clearTimeout(t);
  }, [visible, step, showEndScreen, exiting, goNext]);

  // End screen: wait 2s then complete
  useEffect(() => {
    if (!showEndScreen || exiting) return;
    const t = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onComplete(), 400);
    }, END_SCREEN_DURATION_MS);
    return () => clearTimeout(t);
  }, [showEndScreen, exiting, onComplete]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black/75 backdrop-blur-sm"
          style={{ contain: "layout paint" }}
        >
          {/* Progress dots */}
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 px-12 pt-safe" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i === step && !showEndScreen ? "rgba(236, 72, 153, 0.95)" : "rgba(255,255,255,0.35)",
                  transform: i === step && !showEndScreen ? "scale(1.4)" : "scale(1)",
                }}
              />
            ))}
          </div>

          {/* Skip */}
          <button
            onClick={skip}
            className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-white/15 text-white text-sm font-medium hover:bg-white/25 transition-colors pt-safe"
            style={{ marginTop: "max(1rem, env(safe-area-inset-top))" }}
          >
            Skip
          </button>

          {showEndScreen ? (
            <motion.div
              key="end"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 px-6"
            >
              <AppLogo className="w-28 h-28 object-contain drop-shadow-2xl" />
              <p className="text-white text-xl font-display font-bold text-center">
                You're ready! Start swiping 🚀
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Label above hand */}
              <div className="flex-1 flex items-end justify-center pb-2 px-4">
                <p className="text-white text-center font-medium text-sm drop-shadow-lg max-w-[280px]">
                  {STEPS[step].label}
                </p>
              </div>

              {/* Center-bottom: mock UI + hand */}
              <div className="flex-1 flex items-end justify-center min-h-0 pb-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
                <StepContent step={step} />
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepContent({ step }: { step: number }) {
  const isSwipeRight = step === 0;
  const isSwipeLeft = step === 1;
  const isSwipeUp = step === 2;
  const isFingerprint = step === 3;
  const isLikesLibrary = step === 4;
  const isLikedMe = step === 5;
  const isOpenProfile = step === 6;
  const isProfileSwipeUp = step === 7;
  const isMap = step === 8;

  const handSize = "w-16 h-[85px] sm:w-20 sm:h-[106px]";

  return (
    <div className="relative w-full max-w-[340px] h-[200px] flex items-end justify-center">
      {/* Mock card (steps 0–3, 6–7) */}
      {(isSwipeRight || isSwipeLeft || isSwipeUp || isFingerprint || isOpenProfile || isProfileSwipeUp) && (
        <motion.div
          className="absolute inset-x-4 top-0 bottom-12 rounded-2xl overflow-hidden bg-neutral-800 border border-white/10 shadow-xl"
          style={{ maxHeight: 160 }}
          animate={{
            x: isSwipeRight ? 80 : isSwipeLeft ? -80 : 0,
            y: isSwipeUp ? -60 : 0,
            rotate: isSwipeRight ? 12 : isSwipeLeft ? -12 : 0,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 22, duration: 0.6 }}
        >
          <div className="w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center">
            <span className="text-white/40 text-xs">Profile</span>
          </div>
        </motion.div>
      )}

      {/* Mock fingerprint button (step 3) */}
      {isFingerprint && (
        <motion.div
          className="absolute right-6 bottom-14 w-12 h-12 rounded-full bg-black/50 border border-white/20 flex items-center justify-center"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.2, repeatDelay: 0.3 }}
        >
          <Fingerprint className="w-6 h-6 text-white/80" />
        </motion.div>
      )}

      {/* Mock likes strip (steps 4–5) */}
      {(isLikesLibrary || isLikedMe) && (
        <div className="absolute inset-x-4 top-2 bottom-20 rounded-xl bg-black/50 border border-white/10 flex gap-2 p-2 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="flex-shrink-0 w-14 h-20 rounded-lg bg-neutral-700"
              initial={{ x: 0 }}
              animate={isLikesLibrary ? { x: step === 4 ? -30 : 0 } : {}}
              transition={{ repeat: isLikesLibrary && step === 4 ? Infinity : 0, duration: 1.5, repeatDelay: 0.5 }}
            />
          ))}
          {isLikedMe && (
            <div className="absolute bottom-1 left-2 right-2 flex gap-1">
              <span className="flex-1 py-0.5 rounded text-[10px] text-center bg-white/20 text-white">Likes</span>
              <span className="flex-1 py-0.5 rounded text-[10px] text-center bg-primary/80 text-white">Liked Me</span>
            </div>
          )}
        </div>
      )}

      {/* Mock profile open (step 6–7) */}
      {(isOpenProfile || isProfileSwipeUp) && (
        <motion.div
          className="absolute inset-x-4 top-0 rounded-2xl overflow-hidden bg-neutral-800 border border-white/10"
          style={{ height: isProfileSwipeUp ? 180 : 120 }}
          animate={{ height: isProfileSwipeUp ? 180 : 120 }}
          transition={{ duration: 0.4 }}
        >
          <div className="h-full bg-gradient-to-b from-neutral-700 to-neutral-800 flex items-center justify-center">
            <span className="text-white/50 text-xs">Full profile</span>
          </div>
        </motion.div>
      )}

      {/* Mock map (step 8) */}
      {isMap && (
        <motion.div
          className="absolute inset-x-4 top-2 bottom-16 rounded-xl overflow-hidden bg-neutral-800 border border-white/10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-neutral-800 flex items-center justify-center relative">
            <MapPin className="w-8 h-8 text-primary/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white/80" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Animated hand — center-bottom; uses transform for 60fps */}
      <motion.div
        className={`relative z-10 ${handSize}`}
        style={{ transformOrigin: "50% 90%" }}
        initial={false}
        animate={{
          x: isSwipeRight ? 100 : isSwipeLeft ? -100 : isFingerprint ? 50 : isLikesLibrary || isLikedMe ? 0 : isOpenProfile ? -20 : isProfileSwipeUp ? 0 : isMap ? 60 : 0,
          y: isSwipeUp ? -70 : isFingerprint ? -20 : isLikesLibrary || isLikedMe ? -40 : isOpenProfile ? -30 : isProfileSwipeUp ? -50 : isMap ? -30 : 0,
          scale: isFingerprint ? 1.08 : 1,
          rotate: isSwipeRight ? -15 : isSwipeLeft ? 15 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 180,
          damping: 24,
        }}
      >
        <WhiteGloveHand className="w-full h-full" />
      </motion.div>
    </div>
  );
}
