import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Mic } from "lucide-react";

interface VoicePlayerProps {
  url: string;
  /** "sm" = inline pill on swipe card  |  "md" = full featured player in DetailPanel */
  size?: "sm" | "md";
  profileName?: string;
}

// Number of bars in the animated waveform
const BAR_COUNT = 20;

const VoicePlayer = ({ url, size = "sm", profileName }: VoicePlayerProps) => {
  const [playing, setPlaying]       = useState(false);
  const [progress, setProgress]     = useState(0);   // 0–100
  const [duration, setDuration]     = useState(0);   // seconds
  const [currentTime, setCurrentTime] = useState(0); // seconds
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    // Create fresh audio instance each play so URL cache-busters work
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(Math.round(audio.duration));
    };

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(Math.floor(audio.currentTime));
      }
    };

    audio.onended = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.onerror = () => {
      setPlaying(false);
    };

    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Small pill (teaser on swipe card) ──────────────────────────
  if (size === "sm") {
    return (
      <button
        onClick={toggle}
        aria-label={playing ? "Pause voice intro" : "Play voice intro"}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 hover:bg-black/80 transition-all active:scale-95"
      >
        <div className={`w-5 h-5 rounded-full gradient-fresh flex items-center justify-center flex-shrink-0 ${playing ? "" : ""}`}>
          {playing
            ? <Pause className="w-2.5 h-2.5 text-white" />
            : <Play  className="w-2.5 h-2.5 text-white ml-0.5" />
          }
        </div>

        {/* Mini waveform bars */}
        <div className="flex items-center gap-[2px] h-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-[2px] rounded-full bg-white/80"
              animate={playing
                ? { height: [4, 8 + (i % 3) * 4, 4], transition: { repeat: Infinity, duration: 0.5 + i * 0.07, ease: "easeInOut" } }
                : { height: 4 }
              }
            />
          ))}
        </div>

        <span className="text-white/70 text-[9px] font-medium">
          {playing ? fmt(currentTime) : "Voice"}
        </span>
      </button>
    );
  }

  // ── Full player (DetailPanel) ───────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white/8 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-3"
      >
        {/* Header row */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full gradient-fresh flex items-center justify-center flex-shrink-0 shadow-glow">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-none">
              {profileName ? `${profileName}'s Voice Intro` : "Voice Intro"}
            </p>
            <p className="text-white/50 text-[10px] mt-0.5">Tap to hear their voice</p>
          </div>
          {/* Duration badge */}
          {duration > 0 && (
            <span className="text-white/50 text-[10px] tabular-nums">
              {playing ? fmt(currentTime) : fmt(duration)}
            </span>
          )}
        </div>

        {/* Waveform + play button row */}
        <div className="flex items-center gap-3">
          {/* Play / Pause */}
          <button
            onClick={toggle}
            aria-label={playing ? "Pause voice intro" : "Play voice intro"}
            className="w-11 h-11 rounded-full gradient-fresh flex items-center justify-center flex-shrink-0 shadow-glow active:scale-90 hover:scale-105 transition-transform"
          >
            {playing
              ? <Pause className="w-5 h-5 text-white" />
              : <Play  className="w-5 h-5 text-white ml-0.5" />
            }
          </button>

          {/* Animated waveform bars */}
          <div className="flex-1 flex items-center justify-between h-10 gap-[2px]">
            {Array.from({ length: BAR_COUNT }).map((_, i) => {
              // Bars that have been "played" are highlighted
              const played = (i / BAR_COUNT) * 100 <= progress;
              // Vary natural heights for a realistic waveform shape
              const naturalH = 20 + Math.sin(i * 0.9) * 14 + Math.cos(i * 1.7) * 8;

              return (
                <motion.div
                  key={i}
                  className={`flex-1 rounded-full transition-colors duration-200 ${
                    played ? "bg-emerald-400" : "bg-white/25"
                  }`}
                  animate={playing
                    ? {
                        height: [
                          `${naturalH}%`,
                          `${Math.min(100, naturalH * (1 + Math.sin(i * 0.5 + Date.now() * 0.001) * 0.5))}%`,
                          `${naturalH}%`,
                        ],
                        transition: {
                          repeat: Infinity,
                          duration: 0.4 + (i % 5) * 0.08,
                          ease: "easeInOut",
                          delay: i * 0.02,
                        },
                      }
                    : { height: `${naturalH}%` }
                  }
                />
              );
            })}
          </div>
        </div>

        {/* Progress track */}
        <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-fresh rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoicePlayer;
