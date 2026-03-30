import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────────
type Cell = null | "yellow" | "red";
type Phase = "betting" | "negotiating" | "playing" | "round_over" | "game_over";

interface ChatMsg { id: string; from: "me" | "opp"; text: string; }
interface Player { id: string; name: string; photo: string; color: "yellow" | "red"; }

const COLS = 7;
const ROWS = 6;
const TURN_SECONDS = 15;
const BOARD_COLOR = "#1e0a4e";
const BOARD_BORDER = "#4c1d95";
const BET_OPTIONS = [5, 10, 15, 20];

// ── Board helpers ──────────────────────────────────────────────────────────────
function emptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function dropPiece(board: Cell[][], col: number, color: Cell): { newBoard: Cell[][] | null; row: number } {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) {
      const b = board.map(row => [...row]);
      b[r][col] = color;
      return { newBoard: b, row: r };
    }
  }
  return { newBoard: null, row: -1 };
}

function findWin(board: Cell[][], row: number, col: number, color: Cell): [number, number][] | null {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dr, dc] of dirs) {
    const cells: [number, number][] = [[row, col]];
    for (let i = 1; i < 4; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== color) break;
      cells.push([r, c]);
    }
    for (let i = 1; i < 4; i++) {
      const r = row - dr * i, c = col - dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== color) break;
      cells.push([r, c]);
    }
    if (cells.length >= 4) return cells;
  }
  return null;
}

function isBoardFull(board: Cell[][]): boolean {
  return board[0].every(c => c !== null);
}

function getBestCPUMove(board: Cell[][]): number {
  // Try to win
  for (let c = 0; c < COLS; c++) {
    const { newBoard, row } = dropPiece(board, c, "red");
    if (newBoard && findWin(newBoard, row, c, "red")) return c;
  }
  // Block player win
  for (let c = 0; c < COLS; c++) {
    const { newBoard, row } = dropPiece(board, c, "yellow");
    if (newBoard && findWin(newBoard, row, c, "yellow")) return c;
  }
  // Prefer centre
  const prefs = [3, 2, 4, 1, 5, 0, 6];
  for (const c of prefs) {
    if (board[0][c] === null) return c;
  }
  return 0;
}

// ── Coin fall animation ────────────────────────────────────────────────────────
function CoinFall({ color }: { color: "yellow" | "red" }) {
  const coins = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200, overflow: "hidden" }}>
      {coins.map((i) => (
        <motion.div
          key={i}
          initial={{ y: "30vh", x: `${10 + (i * 3.5) % 80}vw`, opacity: 1, scale: 0.8 }}
          animate={{ y: "110vh", opacity: 0, rotate: 360 * (i % 2 === 0 ? 1 : -1) }}
          transition={{ duration: 1.4 + (i % 5) * 0.2, delay: i * 0.04, ease: "easeIn" }}
          style={{ position: "absolute", fontSize: 24 }}
        >
          {color === "yellow" ? "🪙" : "❤️"}
        </motion.div>
      ))}
    </div>
  );
}

// ── Flashing GO ────────────────────────────────────────────────────────────────
function FlashGo({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="go"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: [1, 0.2, 1], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.7, repeat: Infinity }}
          style={{ fontSize: 13, fontWeight: 900, color: "#4ade80", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}
        >
          ▶ GO
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Player Panel ───────────────────────────────────────────────────────────────
function PlayerPanel({ player, score, isActive, wins }: { player: Player; score: number; isActive: boolean; wins: number }) {
  const isYellow = player.color === "yellow";
  const glow = isYellow ? "rgba(245,158,11,0.6)" : "rgba(239,68,68,0.6)";
  const ring = isYellow ? "#f59e0b" : "#ef4444";
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      flex: 1, padding: "8px 4px",
    }}>
      {/* Photo */}
      <div style={{
        width: 52, height: 52, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
        border: `3px solid ${isActive ? ring : "rgba(255,255,255,0.15)"}`,
        boxShadow: isActive ? `0 0 14px ${glow}` : "none",
        transition: "all 0.3s",
      }}>
        <img src={player.photo} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
      </div>
      {/* Name */}
      <div style={{ fontSize: 12, fontWeight: 800, color: "white", textAlign: "center", lineHeight: 1.2 }}>{player.name}</div>
      {/* Wins */}
      <div style={{ display: "flex", gap: 3 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: "50%",
            background: i < wins ? ring : "rgba(255,255,255,0.15)",
            boxShadow: i < wins ? `0 0 6px ${glow}` : "none",
          }} />
        ))}
      </div>
      {/* Flashing GO */}
      <FlashGo active={isActive} />
    </div>
  );
}

// ── Board ──────────────────────────────────────────────────────────────────────
function Board({
  board, onDrop, currentColor, disabled, winCells, lastDrop,
}: {
  board: Cell[][];
  onDrop: (col: number) => void;
  currentColor: Cell;
  disabled: boolean;
  winCells: Set<string>;
  lastDrop: [number, number] | null;
}) {
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  return (
    <div style={{ position: "relative", userSelect: "none" }}>
      {/* Left leg */}
      <div style={{
        position: "absolute", bottom: -36, left: 8,
        width: 18, height: 40,
        background: `linear-gradient(180deg, ${BOARD_COLOR}, #0d0630)`,
        border: `2px solid ${BOARD_BORDER}`,
        borderRadius: "0 0 6px 6px",
        transform: "skewX(-12deg)",
        zIndex: 0,
      }} />
      {/* Right leg */}
      <div style={{
        position: "absolute", bottom: -36, right: 8,
        width: 18, height: 40,
        background: `linear-gradient(180deg, ${BOARD_COLOR}, #0d0630)`,
        border: `2px solid ${BOARD_BORDER}`,
        borderRadius: "0 0 6px 6px",
        transform: "skewX(12deg)",
        zIndex: 0,
      }} />

      {/* Board frame */}
      <div style={{
        position: "relative", zIndex: 1,
        background: `linear-gradient(160deg, ${BOARD_COLOR} 0%, #0d0630 100%)`,
        border: `3px solid ${BOARD_BORDER}`,
        borderRadius: 14,
        padding: "6px 6px 10px",
        boxShadow: "0 8px 32px rgba(76,29,149,0.6), 0 2px 8px rgba(0,0,0,0.8)",
      }}>
        {/* Drop targets row */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 4, marginBottom: 4 }}>
          {Array.from({ length: COLS }, (_, c) => (
            <button
              key={c}
              onMouseEnter={() => setHoverCol(c)}
              onMouseLeave={() => setHoverCol(null)}
              onClick={() => !disabled && onDrop(c)}
              style={{
                height: 18, background: "transparent", border: "none",
                cursor: disabled ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <AnimatePresence>
                {!disabled && hoverCol === c && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: currentColor === "yellow" ? "#f59e0b" : "#ef4444",
                      boxShadow: currentColor === "yellow" ? "0 0 8px rgba(245,158,11,0.9)" : "0 0 8px rgba(239,68,68,0.9)",
                    }}
                  />
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 4 }}>
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isWin = winCells.has(`${r}-${c}`);
              const isLast = lastDrop && lastDrop[0] === r && lastDrop[1] === c;
              return (
                <motion.div
                  key={`${r}-${c}`}
                  animate={isWin ? { scale: [1, 1.18, 1], boxShadow: ["0 0 0px transparent", "0 0 18px rgba(255,255,255,0.8)", "0 0 10px rgba(255,255,255,0.5)"] } : {}}
                  transition={isWin ? { duration: 0.6, repeat: Infinity, repeatType: "reverse" } : {}}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: "50%",
                    background: cell === "yellow"
                      ? "radial-gradient(circle at 35% 35%, #fde68a, #f59e0b 60%, #b45309)"
                      : cell === "red"
                        ? "radial-gradient(circle at 35% 35%, #fca5a5, #ef4444 60%, #991b1b)"
                        : "radial-gradient(circle at 35% 35%, rgba(0,0,0,0.6), rgba(0,0,0,0.85))",
                    border: cell
                      ? `2px solid ${cell === "yellow" ? "rgba(251,191,36,0.6)" : "rgba(248,113,113,0.6)"}`
                      : "2px solid rgba(0,0,0,0.5)",
                    boxShadow: cell
                      ? `0 3px 10px rgba(0,0,0,0.6), inset 0 1px 3px rgba(255,255,255,0.35)`
                      : "inset 0 2px 5px rgba(0,0,0,0.6)",
                    transition: cell && isLast ? "none" : "background 0.15s",
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Connect4Page() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Session user
  const [userId, setUserId] = useState<string | null>(null);
  const [myPhoto, setMyPhoto] = useState("https://i.pravatar.cc/100?img=1");
  const [myName, setMyName] = useState("You");

  // Opponent (mock for now — wire to Supabase matchmaking later)
  const opponent: Player = {
    id: "cpu", name: searchParams.get("name") || "Sari", age: 24,
    photo: searchParams.get("photo") || "https://i.pravatar.cc/100?img=9",
    color: "red",
  };

  // Game state
  const [board, setBoard] = useState<Cell[][]>(emptyBoard());
  const [currentTurn, setCurrentTurn] = useState<"yellow" | "red">("yellow");
  const [phase, setPhase] = useState<Phase>("betting");
  const [winCells, setWinCells] = useState<Set<string>>(new Set());
  const [lastDrop, setLastDrop] = useState<[number, number] | null>(null);
  const [roundWinner, setRoundWinner] = useState<"yellow" | "red" | "draw" | null>(null);
  const [wins, setWins] = useState({ yellow: 0, red: 0 });
  const [gameWinner, setGameWinner] = useState<"yellow" | "red" | null>(null);
  const [showCoins, setShowCoins] = useState(false);

  // Betting
  const [betAmount, setBetAmount] = useState<number>(10);
  const [oppBet, setOppBet] = useState<number | null>(null);
  const [betStatus, setBetStatus] = useState<"setting" | "waiting" | "accepted">("setting");

  // Timer
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "1", from: "opp", text: "Ready to play? 😏" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Coins
  const [myCoins, setMyCoins] = useState(80);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        supabase.from("profiles").select("name, avatar_url").eq("id", session.user.id).single()
          .then(({ data }) => {
            if (data) {
              if ((data as any).name) setMyName((data as any).name);
              if ((data as any).avatar_url) setMyPhoto((data as any).avatar_url);
            }
          });
      }
    });
  }, []);

  const me: Player = { id: userId || "me", name: myName, photo: myPhoto, color: "yellow" };

  // ── Timer ───────────────────────────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(TURN_SECONDS);
  }, []);

  useEffect(() => {
    if (phase !== "playing") { resetTimer(); return; }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Timeout — other player wins round
          const loser = currentTurn;
          const winner = loser === "yellow" ? "red" : "yellow";
          endRound(winner, "timeout");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentTurn]);

  // ── CPU move ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing" || currentTurn !== "red") return;
    const t = setTimeout(() => {
      const col = getBestCPUMove(board);
      handleDrop(col, true);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentTurn, board]);

  // ── End round ───────────────────────────────────────────────────────────────
  function endRound(winner: "yellow" | "red" | "draw", reason?: string) {
    resetTimer();
    setPhase("round_over");
    setRoundWinner(winner);
    if (winner !== "draw") {
      setShowCoins(true);
      setTimeout(() => setShowCoins(false), 2200);
      setWins(prev => {
        const next = { ...prev, [winner]: prev[winner] + 1 };
        // Check best of 3
        if (next[winner] >= 2) {
          setTimeout(() => {
            setGameWinner(winner);
            setPhase("game_over");
            if (winner === "yellow") setMyCoins(c => c + betAmount);
            else setMyCoins(c => c - betAmount);
          }, 2000);
        }
        return next;
      });
    }
    if (reason === "timeout") {
      const msg = winner === "yellow" ? `${opponent.name} ran out of time! ⏱` : "You ran out of time! ⏱";
      addSystemMsg(msg);
    }
  }

  // ── Drop piece ──────────────────────────────────────────────────────────────
  function handleDrop(col: number, isCpu = false) {
    if (phase !== "playing") return;
    if (!isCpu && currentTurn !== "yellow") return;
    const { newBoard, row } = dropPiece(board, col, currentTurn);
    if (!newBoard) return;

    resetTimer();
    setBoard(newBoard);
    setLastDrop([row, col]);

    const win = findWin(newBoard, row, col, currentTurn);
    if (win) {
      const ws = new Set(win.map(([r, c]) => `${r}-${c}`));
      setWinCells(ws);
      setTimeout(() => endRound(currentTurn), 600);
    } else if (isBoardFull(newBoard)) {
      setTimeout(() => endRound("draw"), 400);
    } else {
      setCurrentTurn(ct => ct === "yellow" ? "red" : "yellow");
    }
  }

  // ── Next round ──────────────────────────────────────────────────────────────
  function startNextRound() {
    setBoard(emptyBoard());
    setWinCells(new Set());
    setLastDrop(null);
    setRoundWinner(null);
    setCurrentTurn("yellow");
    setPhase("playing");
  }

  // ── Betting flow ────────────────────────────────────────────────────────────
  function handleChallenge() {
    setBetStatus("waiting");
    setPhase("negotiating");
    // Simulate opponent responding after 2s
    setTimeout(() => {
      const rand = Math.random();
      if (rand < 0.6) {
        // Accept
        setBetStatus("accepted");
        addSystemMsg(`${opponent.name} accepted the ${betAmount} 🪙 bet!`);
        setTimeout(() => setPhase("playing"), 1200);
      } else {
        // Counter with different amount
        const counters = BET_OPTIONS.filter(b => b !== betAmount);
        const counter = counters[Math.floor(Math.random() * counters.length)];
        setOppBet(counter);
        addSystemMsg(`${opponent.name} countered with ${counter} 🪙`);
        setBetStatus("setting");
      }
    }, 2000);
  }

  function handleAcceptCounter() {
    if (!oppBet) return;
    setBetAmount(oppBet);
    setOppBet(null);
    setBetStatus("accepted");
    addSystemMsg(`You accepted! Game starts now — good luck 🎮`);
    setTimeout(() => setPhase("playing"), 800);
  }

  // ── Chat ────────────────────────────────────────────────────────────────────
  function addSystemMsg(text: string) {
    setMessages(m => [...m, { id: Date.now().toString(), from: "opp", text }]);
  }

  function sendChat() {
    if (!chatInput.trim()) return;
    setMessages(m => [...m, { id: Date.now().toString(), from: "me", text: chatInput.trim() }]);
    setChatInput("");
    // Simulate reply
    const replies = ["Good move 😤", "You're going down!", "Lucky...", "Let's go!! 🔥", "Hmm 🤔"];
    setTimeout(() => {
      setMessages(m => [...m, { id: Date.now().toString() + "r", from: "opp", text: replies[Math.floor(Math.random() * replies.length)] }]);
    }, 1500);
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const roundNum = wins.yellow + wins.red + (phase === "playing" || phase === "round_over" ? 1 : 0);

  return (
    <div style={{
      minHeight: "100dvh",
      backgroundImage: "url('/images/app-background.png')",
      backgroundSize: "cover", backgroundPosition: "center",
      display: "flex", flexDirection: "column",
      maxWidth: 480, margin: "0 auto",
    }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingTop: "max(44px,env(safe-area-inset-top,44px))",
        paddingLeft: 14, paddingRight: 14, paddingBottom: 10,
        background: "rgba(10,4,30,0.85)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(76,29,149,0.4)",
        flexShrink: 0,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, width: 34, height: 34, cursor: "pointer", color: "white", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "white" }}>🔴 Connect 4 🟡</div>
          {phase !== "betting" && phase !== "negotiating" && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>
              Best of 3 · Round {Math.min(roundNum, 3)} · Bet: {betAmount} 🪙
            </div>
          )}
        </div>

        {/* Coins */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "5px 10px" }}>
          <span style={{ fontSize: 12 }}>🪙</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b" }}>{myCoins}</span>
        </div>
      </div>

      {/* ── BETTING PHASE ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {(phase === "betting" || phase === "negotiating") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", gap: 24 }}
          >
            {/* Opponent */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", margin: "0 auto 10px", border: "3px solid #ef4444", boxShadow: "0 0 20px rgba(239,68,68,0.5)" }}>
                <img src={opponent.photo} alt={opponent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "white" }}>{opponent.name} challenges you!</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Set your coin bet to start the game</div>
            </div>

            {/* Counter offer banner */}
            <AnimatePresence>
              {oppBet && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ width: "100%", background: "rgba(239,68,68,0.12)", border: "1.5px solid rgba(239,68,68,0.4)", borderRadius: 16, padding: "14px 16px", textAlign: "center" }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fca5a5", marginBottom: 10 }}>
                    {opponent.name} countered with {oppBet} 🪙
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={handleAcceptCounter}
                      style={{ flex: 1, height: 42, borderRadius: 50, background: "linear-gradient(135deg,#c2185b,#e91e8c)", border: "none", color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                    >
                      ✓ Accept {oppBet} 🪙
                    </button>
                    <button
                      onClick={() => { setOppBet(null); setBetStatus("setting"); }}
                      style={{ flex: 1, height: 42, borderRadius: 50, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                    >
                      Set new bet
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bet selector */}
            {!oppBet && (
              <>
                <div style={{ width: "100%" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, textAlign: "center" }}>Choose your bet</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                    {BET_OPTIONS.map(b => (
                      <button
                        key={b}
                        onClick={() => setBetAmount(b)}
                        style={{
                          height: 54, borderRadius: 14,
                          background: betAmount === b ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "rgba(255,255,255,0.07)",
                          border: betAmount === b ? "none" : "1.5px solid rgba(255,255,255,0.12)",
                          color: "white", fontWeight: 900, fontSize: 16, cursor: "pointer",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                          boxShadow: betAmount === b ? "0 4px 20px rgba(194,24,91,0.4)" : "none",
                          transition: "all 0.2s",
                        }}
                      >
                        <span>🪙</span>
                        <span style={{ fontSize: 13 }}>{b}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleChallenge}
                  disabled={betStatus === "waiting"}
                  style={{
                    width: "100%", height: 54, borderRadius: 50,
                    background: betStatus === "waiting" ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#c2185b,#e91e8c)",
                    border: "none", color: "white", fontSize: 15, fontWeight: 900, cursor: betStatus === "waiting" ? "not-allowed" : "pointer",
                    boxShadow: betStatus !== "waiting" ? "0 6px 28px rgba(194,24,91,0.45)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  }}
                >
                  {betStatus === "waiting" ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: "inline-block", fontSize: 18 }}>⏳</motion.span>
                      Waiting for {opponent.name}...
                    </>
                  ) : (
                    `🎮 Challenge for ${betAmount} 🪙`
                  )}
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GAME PHASE ──────────────────────────────────────────────────── */}
      {(phase === "playing" || phase === "round_over" || phase === "game_over") && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 12px 0", gap: 8, minHeight: 0 }}>

          {/* Players + Board row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PlayerPanel player={me} score={0} isActive={phase === "playing" && currentTurn === "yellow"} wins={wins.yellow} />

            {/* Board + timer */}
            <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              {/* Timer bar */}
              {phase === "playing" && (
                <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    <motion.div
                      style={{ height: "100%", borderRadius: 2 }}
                      animate={{ width: `${(timeLeft / TURN_SECONDS) * 100}%`, background: timeLeft <= 5 ? "#ef4444" : "#c2185b" }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  {/* Countdown */}
                  <AnimatePresence>
                    {timeLeft <= 5 && (
                      <motion.span
                        key={timeLeft}
                        initial={{ scale: 1.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ fontSize: 16, fontWeight: 900, color: "#ef4444", minWidth: 18, textAlign: "center" }}
                      >
                        {timeLeft}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <Board
                board={board}
                onDrop={handleDrop}
                currentColor={currentTurn}
                disabled={phase !== "playing" || currentTurn !== "yellow"}
                winCells={winCells}
                lastDrop={lastDrop}
              />
            </div>

            <PlayerPanel player={opponent} score={0} isActive={phase === "playing" && currentTurn === "red"} wins={wins.red} />
          </div>

          {/* Round / Game over banner */}
          <AnimatePresence>
            {phase === "round_over" && roundWinner && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  textAlign: "center", padding: "12px 16px",
                  background: roundWinner === "yellow" ? "rgba(245,158,11,0.15)" : roundWinner === "red" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.07)",
                  border: `1.5px solid ${roundWinner === "yellow" ? "rgba(245,158,11,0.4)" : roundWinner === "red" ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.15)"}`,
                  borderRadius: 14,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 900, color: "white", marginBottom: 8 }}>
                  {roundWinner === "draw" ? "🤝 Draw!" : roundWinner === "yellow" ? `🏆 ${me.name} wins round!` : `🏆 ${opponent.name} wins round!`}
                </div>
                {phase === "round_over" && wins.yellow < 2 && wins.red < 2 && (
                  <button
                    onClick={startNextRound}
                    style={{ height: 38, paddingInline: 24, borderRadius: 50, background: "linear-gradient(135deg,#c2185b,#e91e8c)", border: "none", color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                  >
                    Next Round →
                  </button>
                )}
              </motion.div>
            )}
            {phase === "game_over" && gameWinner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: "center", padding: "16px",
                  background: "rgba(194,24,91,0.12)", border: "2px solid rgba(194,24,91,0.5)",
                  borderRadius: 16,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>{gameWinner === "yellow" ? "🏆" : "😔"}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "white", marginBottom: 4 }}>
                  {gameWinner === "yellow" ? `You won ${betAmount} 🪙!` : `${opponent.name} wins — you lost ${betAmount} 🪙`}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button onClick={() => { setBoard(emptyBoard()); setWins({ yellow: 0, red: 0 }); setPhase("betting"); setBetStatus("setting"); setOppBet(null); setGameWinner(null); setWinCells(new Set()); setCurrentTurn("yellow"); }}
                    style={{ flex: 1, height: 42, borderRadius: 50, background: "linear-gradient(135deg,#c2185b,#e91e8c)", border: "none", color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                    🔄 Rematch
                  </button>
                  <button onClick={() => navigate(-1)}
                    style={{ flex: 1, height: 42, borderRadius: 50, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    Leave
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Chat ──────────────────────────────────────────────────── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "rgba(10,4,30,0.7)", borderRadius: "14px 14px 0 0", border: "1px solid rgba(76,29,149,0.3)", borderBottom: "none", overflow: "hidden" }}>
            <div style={{ padding: "8px 12px 4px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              💬 Game Chat
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === "me" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "75%", padding: "7px 12px", borderRadius: msg.from === "me" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: msg.from === "me" ? "linear-gradient(135deg,#c2185b,#e91e8c)" : "rgba(255,255,255,0.09)",
                    fontSize: 12, color: "white", lineHeight: 1.4,
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", gap: 8, padding: "8px 10px", paddingBottom: "max(12px,env(safe-area-inset-bottom,12px))", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,4,30,0.85)" }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Say something..."
                style={{
                  flex: 1, height: 36, borderRadius: 20, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                  color: "white", fontSize: 13, padding: "0 14px", outline: "none",
                }}
              />
              <button onClick={sendChat} style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#c2185b,#e91e8c)", border: "none", color: "white", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ➤
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── Coin fall ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCoins && roundWinner && roundWinner !== "draw" && (
          <CoinFall key="coins" color={roundWinner} />
        )}
      </AnimatePresence>
    </div>
  );
}
