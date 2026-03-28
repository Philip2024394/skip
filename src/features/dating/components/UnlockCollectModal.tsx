import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const UNLOCK_IMAGE = "https://ik.imagekit.io/7grri5v7d/UntitledfsdfsdfsdfsdfDSFSDFSdssdfdasdasdfgsdfgdfssdfssasdasd.png";
export const UNLOCK_VIDEO = "https://ik.imagekit.io/7grri5v7d/2%20keys.mp4";

interface UnlockCollectModalProps {
  open: boolean;
  onCollect: () => void;
  onDismiss: () => void;
}

export default function UnlockCollectModal({ open, onCollect, onDismiss }: UnlockCollectModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [collected, setCollected] = useState(false);

  useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => setVideoFailed(true));
    }
    if (!open) setCollected(false);
  }, [open]);

  const handleCollect = () => {
    if (collected) return;
    setCollected(true);
    setTimeout(() => onCollect(), 700);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col"
        >
          {/* Full-screen background video / image */}
          <div className="absolute inset-0">
            {!videoFailed ? (
              <video
                ref={videoRef}
                src={UNLOCK_VIDEO}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                loop
                onError={() => setVideoFailed(true)}
              />
            ) : (
              <img src={UNLOCK_IMAGE} alt="2 Unlocks" className="w-full h-full object-cover" />
            )}
            {/* Dark overlay for readability */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.75) 75%, rgba(0,0,0,0.92) 100%)" }} />
          </div>

          {/* Header — top of screen */}
          <div className="relative z-10 flex flex-col items-center pt-safe px-6" style={{ paddingTop: `max(2.5rem, env(safe-area-inset-top, 2.5rem))` }}>
            <motion.p
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-white/60 text-xs font-bold tracking-widest uppercase"
            >
              Welcome Gift
            </motion.p>
            <motion.h1
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.18 }}
              className="text-white font-black text-4xl text-center leading-tight mt-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            >
              🔓 2 Free<br />Unlocks
            </motion.h1>
          </div>

          {/* Spacer — video shows through */}
          <div className="flex-1" />

          {/* Footer — pinned to bottom */}
          <div
            className="relative z-10 px-6 pb-safe flex flex-col items-center gap-3"
            style={{ paddingBottom: `max(2rem, env(safe-area-inset-bottom, 2rem))` }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/70 text-sm font-semibold text-center leading-relaxed"
            >
              A welcome gift from 2DateMe —<br />unlock any 2 matches, on us.
            </motion.p>

            {/* Collect button */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.38, type: "spring", stiffness: 260, damping: 22 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleCollect}
              disabled={collected}
              className="w-full max-w-sm py-4 rounded-2xl font-black text-black text-lg transition-opacity disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #fde68a, #f59e0b)",
                boxShadow: "0 0 32px rgba(250,204,21,0.5), 0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              {collected ? "Unlocks added! 🎉" : "🔓 Collect 2 Free Unlocks"}
            </motion.button>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              onClick={onDismiss}
              className="text-white/25 text-xs hover:text-white/50 transition-colors pb-1"
            >
              Skip for now
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
