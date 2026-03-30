import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import Connect4Board from "../components/Connect4Board";
import Connect4HowToPlay from "../components/Connect4HowToPlay";

type GameMode = "menu" | "vs-guest" | "vs-bot";

// Mini decorative empty board preview
function MiniBoard() {
  const ROWS = 6, COLS = 7, SIZE = 26, GAP = 4;
  return (
    <div style={{
      background: "rgba(10,6,20,0.9)", borderRadius: 14, padding: 8,
      border: "1px solid rgba(212,175,55,0.15)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      display: "inline-block",
    }}>
      {Array(ROWS).fill(0).map((_, r) => (
        <div key={r} style={{ display: "flex", gap: GAP, marginBottom: r < ROWS - 1 ? GAP : 0 }}>
          {Array(COLS).fill(0).map((_, c) => {
            // Sprinkle a few sample discs for decoration
            const filled =
              (r === 5 && c === 3) ? "#e01010" :
              (r === 5 && c === 4) ? "#d4af37" :
              (r === 4 && c === 3) ? "#d4af37" :
              (r === 5 && c === 2) ? "#e01010" :
              null;
            return (
              <div key={c} style={{
                width: SIZE, height: SIZE, borderRadius: "50%",
                background: filled
                  ? filled === "#e01010"
                    ? "radial-gradient(circle at 35% 32%, #ff5a5a, #e01010 55%, #8b0000)"
                    : "radial-gradient(circle at 35% 32%, #f5e070, #d4af37 55%, #7a5c00)"
                  : "rgba(255,255,255,0.07)",
                boxShadow: filled ? `0 0 10px ${filled === "#e01010" ? "rgba(224,16,16,0.5)" : "rgba(212,175,55,0.5)"}` : "inset 0 1px 3px rgba(0,0,0,0.5)",
              }} />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function Connect4Page() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [gameMode, setGameMode] = useState<GameMode>("menu");
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const opponentName = searchParams.get("name") || undefined;

  function selectMode(mode: "vs-guest" | "vs-bot") {
    setGameMode(mode);
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#08060a",
      display: "flex", flexDirection: "column",
      maxWidth: 480, margin: "0 auto",
      position: "relative", overflow: "hidden",
    }}>

      <AnimatePresence mode="wait">

        {/* ── MENU ──────────────────────────────────────────────────── */}
        {gameMode === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "max(60px,env(safe-area-inset-top,60px)) 28px max(40px,env(safe-area-inset-bottom,40px))",
              gap: 0,
            }}
          >
            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              style={{
                position: "absolute", top: "max(18px,env(safe-area-inset-top,18px))", left: 18,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20, padding: "7px 14px",
                color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >← Back</button>

            {/* Gold bar */}
            <div style={{ height: 2, width: 80, background: "linear-gradient(90deg, transparent, #d4af37, transparent)", marginBottom: 14 }} />

            {/* Label */}
            <div style={{
              fontSize: 9, fontWeight: 800, color: "rgba(212,175,55,0.7)",
              letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12,
            }}>
              2DATEME · GAMES
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: 38, fontWeight: 900, color: "white",
              margin: "0 0 8px", letterSpacing: "-0.02em", textAlign: "center",
            }}>
              Connect 4
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: 13, color: "rgba(255,255,255,0.45)",
              margin: "0 0 36px", textAlign: "center",
            }}>
              Challenge a match. First to four wins.
            </p>

            {/* Mini board preview */}
            <div style={{ marginBottom: 40 }}>
              <MiniBoard />
            </div>

            {/* Buttons */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => selectMode("vs-guest")}
                style={{
                  width: "100%", height: 56, borderRadius: 16, border: "none",
                  background: "linear-gradient(135deg, #92400e, #d4af37, #f0d060)",
                  color: "#000", fontWeight: 900, fontSize: 16, cursor: "pointer",
                  boxShadow: "0 6px 28px rgba(212,175,55,0.4)",
                  letterSpacing: "-0.01em",
                }}
              >
                🎮 Play vs Guest
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => selectMode("vs-bot")}
                style={{
                  width: "100%", height: 56, borderRadius: 16,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  color: "#d4af37", fontWeight: 900, fontSize: 16, cursor: "pointer",
                  letterSpacing: "-0.01em",
                }}
              >
                🤖 Play vs Bot
              </motion.button>
            </div>

            {/* How to play */}
            <button
              onClick={() => setShowHowToPlay(true)}
              style={{
                background: "none", border: "none",
                color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer",
                textDecoration: "underline", textUnderlineOffset: 3,
              }}
            >
              How to Play
            </button>
          </motion.div>
        )}

        {/* ── GAME BOARD ────────────────────────────────────────────── */}
        {(gameMode === "vs-guest" || gameMode === "vs-bot") && (
          <motion.div
            key="board"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.28 }}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              paddingTop: "max(14px,env(safe-area-inset-top,14px))",
            }}
          >
            <Connect4Board
              mode={gameMode}
              opponentName={opponentName}
              onBack={() => setGameMode("menu")}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── How to Play popup ──────────────────────────────────────── */}
      <Connect4HowToPlay open={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </div>
  );
}
