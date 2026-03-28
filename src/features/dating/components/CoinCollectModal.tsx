import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TEDDY_IMAGE = "https://ik.imagekit.io/7grri5v7d/UntitledfsdfsdfsdfsdfDSFSDFSdssdfdasdasdfgsdfgdfssdfs.png";
export const TEDDY_VIDEO = "https://ik.imagekit.io/7grri5v7d/teddy.mp4";

interface CoinCollectModalProps {
  open: boolean;
  onCollect: () => void;
  onDismiss: () => void;
  amount?: number;
}

export default function CoinCollectModal({ open, onCollect, onDismiss, amount = 10 }: CoinCollectModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [collected, setCollected] = useState(false);

  // Stable coin particle data — generated once per mount
  const coins = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: 3 + (i * 6.2) % 94,
      delay: (i * 0.18) % 1.6,
      duration: 1.8 + (i * 0.13) % 1.4,
      size: 16 + (i * 3) % 14,
    })), []
  );

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
    setTimeout(() => {
      onCollect();
    }, 700);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: "rgba(0,0,0,0.93)", backdropFilter: "blur(10px)" }}
        >
          {/* Falling coins */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {coins.map(c => (
              <motion.span
                key={c.id}
                className="absolute select-none"
                style={{ left: `${c.x}%`, top: -c.size * 2, fontSize: c.size }}
                animate={{ y: "115vh" }}
                transition={{ duration: c.duration, delay: c.delay, repeat: Infinity, ease: "linear" }}
              >
                🪙
              </motion.span>
            ))}
          </div>

          {/* Card content */}
          <div className="relative z-10 flex flex-col items-center px-6 text-center w-full max-w-xs">

            {/* Header */}
            <motion.p
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08 }}
              className="text-yellow-300 text-sm font-bold tracking-widest uppercase mb-1"
            >
              Daily Reward
            </motion.p>
            <motion.h1
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.14 }}
              className="text-white font-black text-3xl leading-tight mb-5"
            >
              You found a gift! 🎁
            </motion.h1>

            {/* Video / image */}
            <motion.div
              initial={{ scale: 0.78, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12, type: "spring", stiffness: 240, damping: 22 }}
              className="relative w-full rounded-3xl overflow-hidden mb-6"
              style={{
                height: 240,
                boxShadow: "0 0 48px rgba(250,204,21,0.28), 0 0 0 1.5px rgba(250,204,21,0.25)",
              }}
            >
              {!videoFailed ? (
                <video
                  ref={videoRef}
                  src={TEDDY_VIDEO}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  loop
                  onError={() => setVideoFailed(true)}
                />
              ) : (
                <img src={TEDDY_IMAGE} alt="Gift" className="w-full h-full object-cover" />
              )}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)" }}
              />
              {/* Coin count pill over video */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <span
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black text-black text-sm"
                  style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)", boxShadow: "0 0 16px rgba(250,204,21,0.5)" }}
                >
                  🪙 +{amount} Coins
                </span>
              </div>
            </motion.div>

            {/* Collect button */}
            <motion.button
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.28 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleCollect}
              disabled={collected}
              className="w-full py-4 rounded-2xl font-black text-black text-lg transition-opacity disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #fde68a, #f59e0b)",
                boxShadow: "0 0 28px rgba(250,204,21,0.45)",
              }}
            >
              {collected ? "Coins added! ✨" : `✨ Collect ${amount} Coins`}
            </motion.button>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.42 }}
              className="text-white/25 text-[11px] mt-3"
            >
              Limited daily gift · Comes back tomorrow
            </motion.p>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              onClick={onDismiss}
              className="text-white/20 text-xs mt-3 hover:text-white/40 transition-colors"
            >
              Skip
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
