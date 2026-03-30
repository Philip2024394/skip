import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Connect4Board from "../components/Connect4Board";
import Connect4HowToPlay from "../components/Connect4HowToPlay";
import SelectPlayerScreen from "../components/SelectPlayerScreen";

type GameMode = "menu" | "select-player" | "vs-guest" | "vs-bot";

interface SelectedOpponent {
  id: string;
  name: string;
  avatar_url?: string | null;
  isTop5: boolean;
}

export default function Connect4Page() {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState<GameMode>("menu");
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [opponent, setOpponent] = useState<SelectedOpponent | null>(null);

  return (
    <div style={{
      height: "100dvh",
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
              onClick={() => navigate("/games")}
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
              margin: "0 0 24px", textAlign: "center",
            }}>
              Challenge a match. First to four wins.
            </p>

            {/* Landing image */}
            <div style={{ marginBottom: 28, width: "100%", borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
              <img
                src="https://ik.imagekit.io/dateme/Untitledfgdsfgdsfsdf.png"
                alt="Connect 4"
                style={{ width: "100%", display: "block", objectFit: "cover" }}
              />
            </div>

            {/* Buttons */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>

              {/* Select Player */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setGameMode("select-player")}
                style={{
                  width: "100%", height: 56, borderRadius: 16, border: "none",
                  background: "linear-gradient(135deg, #92400e, #d4af37, #f0d060)",
                  color: "#000", fontWeight: 900, fontSize: 16, cursor: "pointer",
                  boxShadow: "0 6px 28px rgba(212,175,55,0.4)",
                  letterSpacing: "-0.01em",
                }}
              >
                🌍 Select Player
              </motion.button>

              {/* Play Ted */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setOpponent(null); setGameMode("vs-bot"); }}
                style={{
                  width: "100%", height: 56, borderRadius: 16,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  color: "#d4af37", fontWeight: 900, fontSize: 16, cursor: "pointer",
                  letterSpacing: "-0.01em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                }}
              >
                <img
                  src="https://ik.imagekit.io/dateme/Teddy%20bear%20in%20a%20cozy%20office.png?updatedAt=1774818471382"
                  alt="Ted"
                  style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(212,175,55,0.4)" }}
                />
                Play Ted
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

        {/* ── SELECT PLAYER ─────────────────────────────────────────── */}
        {gameMode === "select-player" && (
          <motion.div
            key="select-player"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
              paddingTop: "max(0px,env(safe-area-inset-top,0px))" }}
          >
            <SelectPlayerScreen
              onBack={() => setGameMode("menu")}
              onChallenge={(player) => {
                setOpponent({
                  id: player.id,
                  name: player.name,
                  avatar_url: player.avatar_url,
                  isTop5: !!player.rank,
                });
                setGameMode("vs-guest");
              }}
            />
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
              flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
              paddingTop: "max(14px,env(safe-area-inset-top,14px))",
            }}
          >
            <Connect4Board
              mode={gameMode}
              opponentName={opponent?.name}
              opponentAvatar={opponent?.avatar_url ?? undefined}
              isTop5Opponent={opponent?.isTop5 ?? false}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── How to Play popup ──────────────────────────────────────── */}
      <AnimatePresence>
        {showHowToPlay && <Connect4HowToPlay onClose={() => setShowHowToPlay(false)} />}
      </AnimatePresence>
    </div>
  );
}
