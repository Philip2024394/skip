// /c/Users/Victus/skip-1/src/features/gifts/components/MatchPopup.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X } from "lucide-react";
import { Button } from "@/shared/components/button";
import DiamondConnectionFlow from "./DiamondConnectionFlow";

interface MatchPopupProps {
  matchedProfileId: string;
  matchedProfileName: string;
  matchedProfileAvatar?: string;
  matchedContactPref?: "whatsapp" | "video" | "both";
  currentUserName: string;
  onClose: () => void;
}

function FloatingHearts() {
  const hearts = Array.from({ length: 18 }, (_, i) => ({
    left: `${5 + i * 5.5}%`,
    delay: i * 0.18,
    duration: 2.8 + (i % 4) * 0.5,
    size: 14 + (i % 5) * 6,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {hearts.map((h, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0"
          style={{ left: h.left }}
          animate={{ y: [0, -window.innerHeight - 80], opacity: [0.8, 0] }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: "easeOut" }}
        >
          <Heart className="text-pink-500 fill-pink-500" style={{ width: h.size, height: h.size }} />
        </motion.div>
      ))}
    </div>
  );
}

export default function MatchPopup({
  matchedProfileId,
  matchedProfileName,
  matchedProfileAvatar,
  matchedContactPref = "whatsapp",
  currentUserName,
  onClose,
}: MatchPopupProps) {
  const [showConnect, setShowConnect] = useState(false);

  if (showConnect) {
    return (
      <DiamondConnectionFlow
        matchedProfileId={matchedProfileId}
        matchedProfileName={matchedProfileName}
        matchedContactPref={matchedContactPref}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <FloatingHearts />
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="relative z-10 bg-gradient-to-br from-pink-900/95 via-black/95 to-violet-900/95 rounded-3xl border-2 border-pink-400/40 shadow-[0_20px_80px_rgba(236,72,153,0.4)] max-w-sm w-full p-6 text-center"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Hearts icon */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="text-6xl mb-3"
        >
          💘
        </motion.div>

        <h2 className="text-white text-3xl font-black mb-1 tracking-tight">It's a Match!</h2>
        <p className="text-pink-300/80 text-sm mb-5">
          You and <span className="text-pink-300 font-semibold">{matchedProfileName}</span> liked each other
        </p>

        {/* Avatars row */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center border-2 border-pink-400/50 text-white text-xl font-bold">
            {currentUserName.charAt(0).toUpperCase()}
          </div>
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="text-2xl"
          >
            💕
          </motion.div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center border-2 border-violet-400/50 overflow-hidden">
            {matchedProfileAvatar ? (
              <img src={matchedProfileAvatar} alt={matchedProfileName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xl font-bold">{matchedProfileName.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>

        <Button
          onClick={() => setShowConnect(true)}
          className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white font-bold h-12 text-base shadow-[0_4px_24px_rgba(236,72,153,0.4)] mb-2"
        >
          💎 Connect Now
        </Button>
        <button onClick={onClose} className="text-white/40 text-xs hover:text-white/60 transition-colors">
          Maybe later
        </button>
      </motion.div>
    </div>
  );
}
