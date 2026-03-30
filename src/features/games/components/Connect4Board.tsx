import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// ── Constants ──────────────────────────────────────────────────────────────────
const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const P1 = 1;
const P2 = 2;

const RED    = "#ee1c24";
const YELLOW = "#ffd700";
const GOLD   = YELLOW;
const RED_GLOW  = "rgba(238,28,36,0.65)";
const GOLD_GLOW = "rgba(255,215,0,0.65)";

const BET_OPTIONS       = [0, 5, 10, 15, 20];
const TOP5_BET_OPTIONS  = [20, 30, 40, 50];
type BetPhase = "p1-select" | "p2-respond" | "p1-counter" | "active";

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  mode: "vs-guest" | "vs-bot";
  opponentName?: string;
  opponentAvatar?: string;
  opponentId?: string;
  isTop5Opponent?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getLowestEmptyRow(board: number[][], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === EMPTY) return r;
  }
  return -1;
}
function isBoardFull(board: number[][]): boolean {
  return board[0].every(c => c !== EMPTY);
}
function checkWinner(board: number[][], row: number, col: number, player: number): [number, number][] | null {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dr, dc] of directions) {
    const cells: [number, number][] = [[row, col]];
    for (let i = 1; i < 4; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
      if (board[r][c] !== player) break;
      cells.push([r, c]);
    }
    for (let i = 1; i < 4; i++) {
      const r = row - dr * i, c = col - dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
      if (board[r][c] !== player) break;
      cells.push([r, c]);
    }
    if (cells.length >= 4) return cells;
  }
  return null;
}
function getBotMove(board: number[][]): number {
  for (let col = 0; col < COLS; col++) {
    const row = getLowestEmptyRow(board, col);
    if (row === -1) continue;
    const test = board.map(r => [...r]);
    test[row][col] = P2;
    if (checkWinner(test, row, col, P2)) return col;
  }
  for (let col = 0; col < COLS; col++) {
    const row = getLowestEmptyRow(board, col);
    if (row === -1) continue;
    const test = board.map(r => [...r]);
    test[row][col] = P1;
    if (checkWinner(test, row, col, P1)) return col;
  }
  const preference = [3, 2, 4, 1, 5, 0, 6];
  for (const col of preference) {
    if (getLowestEmptyRow(board, col) !== -1) return col;
  }
  return 0;
}

// ── Player card (vertical, flanks board on left/right) ───────────────────────
function PlayerCard({ label, score, isActive, color, glow, initial, imageUrl, showGo }: {
  label: string; score: number; isActive: boolean;
  color: string; glow: string; initial: string; imageUrl?: string; showGo?: boolean;
}) {
  return (
    <div style={{ width: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <motion.div
        animate={{ boxShadow: isActive ? `0 0 16px ${glow}` : "0 0 0px transparent" }}
        transition={{ duration: 0.3 }}
        style={{
          width: 36, height: 36, borderRadius: "50%",
          border: `2px solid ${isActive ? color : "rgba(255,255,255,0.1)"}`,
          background: imageUrl ? "transparent" : (isActive ? `radial-gradient(circle at 40% 35%, ${color}55, ${color}22)` : "rgba(255,255,255,0.06)"),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 900, color: isActive ? color : "rgba(255,255,255,0.35)",
          overflow: "hidden",
        }}
      >
        {imageUrl
          ? <img src={imageUrl} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : initial
        }
      </motion.div>

      <span style={{
        fontSize: 9, fontWeight: 800, color: isActive ? "white" : "rgba(255,255,255,0.3)",
        textAlign: "center", maxWidth: 42, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>{label}</span>

      <motion.span key={score} initial={{ scale: 1.4, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
        style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, color, textShadow: `0 0 10px ${glow}` }}
      >{score}</motion.span>

      <div style={{ height: 14, display: "flex", alignItems: "center" }}>
        {showGo && (
          <motion.span
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: 20, fontWeight: 900, color: "white", textShadow: `0 0 12px ${glow}` }}
          >Go!</motion.span>
        )}
      </div>

      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: color, opacity: isActive ? 1 : 0.25,
        boxShadow: isActive ? `0 0 7px ${glow}` : "none",
      }} />
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Connect4Board({ mode, opponentName, opponentAvatar, opponentId, isTop5Opponent = false }: Props) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);
  const [board, setBoard] = useState<number[][]>(
    () => Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY))
  );
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<0 | 1 | 2>(0);
  const [winCells, setWinCells] = useState<[number, number][]>([]);
  const [isDraw, setIsDraw] = useState(false);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [lastDrop, setLastDrop] = useState<[number, number] | null>(null);
  const [lastPlayed, setLastPlayed] = useState<{ col: number; color: string } | null>(null);
  const chipsSpawned = useRef(false);

  // ── Bet state ─────────────────────────────────────────────────────────────────
  const [betPhase, setBetPhase] = useState<BetPhase>("p1-select");
  const [activeBet, setActiveBet] = useState(0);
  const [pendingBet, setPendingBet] = useState(0);
  const [fallingCoins, setFallingCoins] = useState<{ id: number; x: number; delay: number; dur: number; spin: number }[]>([]);
  const coinSettled = useRef(false);

  // ── Win banner delay ──────────────────────────────────────────────────────────
  const [showWinBanner, setShowWinBanner] = useState(false);

  useEffect(() => {
    if (winner === 0 && !isDraw) { setShowWinBanner(false); return; }
    const t = setTimeout(() => setShowWinBanner(true), 5000);
    return () => clearTimeout(t);
  }, [winner, isDraw]);

  // ── Turn timer ────────────────────────────────────────────────────────────────
  const [turnTimeLeft, setTurnTimeLeft] = useState(15);
  const timedOut = useRef(false);

  // ── Chat state ────────────────────────────────────────────────────────────────
  interface ChatMsg {
    id: number;
    from: string;
    text: string;           // displayed text (translated if incoming)
    original?: string;      // original text before translation
    translated?: boolean;   // true = auto-translated from another language
    translating?: boolean;  // spinner while fetching
  }
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(1);

  function toggleFlip(id: number) {
    setFlipped(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  // MyMemory free translation API
  async function translate(text: string, targetLang = "en"): Promise<string | null> {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=|${targetLang}`;
      const res = await fetch(url);
      const json = await res.json();
      const translated = json?.responseData?.translatedText;
      // MyMemory returns the original if it can't detect / already same lang
      if (!translated || translated.toLowerCase() === text.toLowerCase()) return null;
      return translated;
    } catch {
      return null;
    }
  }

  function addMsg(from: string, text: string) {
    setChatMessages(prev => [...prev, { id: msgId.current++, from, text }]);
  }

  // Add an incoming message (not from "You") — auto-translate it
  async function addIncomingMsg(from: string, text: string) {
    const id = msgId.current++;
    // Add immediately with translating spinner
    setChatMessages(prev => [...prev, { id, from, text, translating: true }]);
    const translated = await translate(text);
    setChatMessages(prev => prev.map(m =>
      m.id === id
        ? translated
          ? { ...m, text: translated, original: text, translated: true, translating: false }
          : { ...m, translating: false }
        : m
    ));
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Bot chat reactions
  useEffect(() => {
    if (mode !== "vs-bot" || betPhase !== "active") return;
    if (winner === 2) addIncomingMsg("Ted 🧸", "Ha! I win this round! 😈");
    else if (winner === 1) addIncomingMsg("Ted 🧸", "Well played! You got me 🎉");
    else if (isDraw) addIncomingMsg("Ted 🧸", "A draw! I'll get you next time 🤝");
  }, [winner, isDraw, mode, betPhase]);

  function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    addMsg("You", text);
    setChatInput("");
    if (mode === "vs-bot") {
      const replies = ["Interesting move! 🤔", "I see what you're doing…", "My turn soon! 🤖", "💡 Nice try!", "You won't beat me!"];
      setTimeout(() => addIncomingMsg("Ted 🧸", replies[Math.floor(Math.random() * replies.length)]), 900);
    }
  }

  // ── Bet logic ─────────────────────────────────────────────────────────────────
  function spawnCoins() {
    const w = Math.min(typeof window !== "undefined" ? window.innerWidth : 430, 480);
    setFallingCoins(Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x: Math.random() * (w - 32),
      delay: Math.random() * 1.0,
      dur: 1.4 + Math.random() * 1.0,
      spin: (Math.random() - 0.5) * 720,
    })));
  }

  function p1SelectBet(amount: number) {
    setPendingBet(amount);
    if (amount === 0) {
      setActiveBet(0);
      setBetPhase("active");
      addMsg("system", "Free game — no coins at stake. Good luck! 🎮");
      return;
    }
    setBetPhase("p2-respond");
    if (mode !== "vs-bot") {
      addMsg("system", `You proposed ${amount} 🪙. ${opponentName || "Guest"}, accept or raise?`);
    }
  }

  function p2AcceptBet() {
    setActiveBet(pendingBet);
    setBetPhase("active");
    addMsg("system", `Bet locked: ${pendingBet} 🪙. Game on! 🎮`);
  }

  function p2CounterBet(amount: number) {
    setPendingBet(amount);
    setBetPhase("p1-counter");
    const sender = mode === "vs-bot" ? "Ted 🧸" : (opponentName || "Guest");
    addMsg(sender, `I raise to ${amount} 🪙! You in?`);
  }

  function p1AcceptCounter() {
    setActiveBet(pendingBet);
    setBetPhase("active");
    addMsg("system", `Bet locked: ${pendingBet} 🪙. Game on! 🎮`);
  }

  function p1CancelCounter() {
    const p2Label = mode === "vs-bot" ? "Ted" : (opponentName || "Guest");
    addMsg("system", `You declined — ${p2Label} wins ${pendingBet} 🪙 by forfeit!`);
    spawnCoins();
    setTimeout(() => navigate("/games"), 3200);
  }

  function quitGame() {
    if (activeBet > 0) {
      const p2Label = mode === "vs-bot" ? "Ted" : (opponentName || "Guest");
      addMsg("system", `You quit — ${p2Label} wins ${activeBet} 🪙!`);
      spawnCoins();
      setTimeout(() => navigate("/games"), 3200);
    } else {
      navigate("/games");
    }
  }

  // Ted auto-responds to bet
  useEffect(() => {
    if (mode !== "vs-bot" || betPhase !== "p2-respond") return;
    const t = setTimeout(() => {
      if (pendingBet === 0) {
        p2CounterBet(5); // Ted raises free to 5
      } else if (pendingBet === 15) {
        p2CounterBet(20); // Ted raises 15 to 20
      } else {
        // Ted accepts
        setActiveBet(pendingBet);
        setBetPhase("active");
        addMsg("Ted 🧸", `Challenge accepted! ${pendingBet} 🪙. Bring it on! 😤`);
      }
    }, 1600);
    return () => clearTimeout(t);
  }, [betPhase, mode, pendingBet]);

  // Coin settle on game end with active bet
  useEffect(() => {
    if ((winner !== 0 || isDraw) && activeBet > 0 && !coinSettled.current) {
      coinSettled.current = true;
      const p1Label = "You";
      const p2Label = mode === "vs-bot" ? "Ted" : (opponentName || "Guest");
      if (winner !== 0) {
        const winnerName = winner === 1 ? p1Label : p2Label;
        addMsg("system", `${winnerName} wins ${activeBet} 🪙!`);
      } else {
        addMsg("system", "Draw — no coins awarded.");
      }
      spawnCoins();

      // ── Persist coin movement to Supabase ────────────────────────────────────
      if (userId) {
        if (winner !== 0) {
          if (mode === "vs-bot") {
            // vs Ted: user wins → award, user loses → spend
            if (winner === 1) {
              supabase.rpc("award_coins" as any, { p_user_id: userId, p_amount: activeBet, p_reason: "connect4_win" }).then();
            } else {
              supabase.rpc("spend_coins" as any, { p_user_id: userId, p_amount: activeBet, p_reason: "connect4_loss" }).then();
            }
          } else {
            // vs guest: P1 = current user
            if (winner === 1) {
              supabase.rpc("award_coins" as any, { p_user_id: userId, p_amount: activeBet, p_reason: "connect4_win" }).then();
              if (opponentId) supabase.rpc("spend_coins" as any, { p_user_id: opponentId, p_amount: activeBet, p_reason: "connect4_loss" }).then();
            } else {
              supabase.rpc("spend_coins" as any, { p_user_id: userId, p_amount: activeBet, p_reason: "connect4_loss" }).then();
              if (opponentId) supabase.rpc("award_coins" as any, { p_user_id: opponentId, p_amount: activeBet, p_reason: "connect4_win" }).then();
            }
          }
        }

        // ── Save game record ─────────────────────────────────────────────────────
        (supabase as any).from("connect4_games").insert({
          player1_id: userId,
          player2_id: mode === "vs-guest" ? (opponentId ?? null) : null,
          mode,
          winner_player: winner === 0 ? null : winner,
          is_draw: isDraw,
          bet_amount: activeBet,
        }).then();
      }
    }
    if (!winner && !isDraw) coinSettled.current = false;
  }, [winner, isDraw, activeBet, mode, opponentName, userId, opponentId]);

  // ── Turn countdown — resets each time currentPlayer changes or game becomes active ──
  useEffect(() => {
    if (betPhase !== "active" || winner || isDraw) return;
    setTurnTimeLeft(15);
    timedOut.current = false;
    const interval = setInterval(() => {
      setTurnTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPlayer, betPhase, winner, isDraw]);

  // ── Handle timeout ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (turnTimeLeft !== 0 || betPhase !== "active" || winner || isDraw || timedOut.current) return;
    timedOut.current = true;
    const w = (currentPlayer === 1 ? 2 : 1) as 1 | 2;
    const loserName = currentPlayer === 1 ? "You" : (mode === "vs-bot" ? "Ted" : (opponentName || "Guest"));
    const winnerName = w === 1 ? "You" : (mode === "vs-bot" ? "Ted" : (opponentName || "Guest"));
    setWinner(w);
    setWinCells([]);
    setScores(s => w === 1 ? { ...s, p1: s.p1 + 1 } : { ...s, p2: s.p2 + 1 });
    addMsg("system", `⏱ ${loserName} ran out of time! ${winnerName} wins!`);
    if (activeBet > 0 && !coinSettled.current) {
      coinSettled.current = true;
      addMsg("system", `${winnerName} wins ${activeBet} 🪙!`);
      spawnCoins();
    }
  }, [turnTimeLeft]);

  // ── Cell size ─────────────────────────────────────────────────────────────────
  const gap = 4;
  const boardPad = 8;
  const cardW = 44;
  const screenW = Math.min(typeof window !== "undefined" ? window.innerWidth : 430, 480);
  const boardAvail = screenW - 24 - (cardW + 6) * 2 - boardPad * 2;
  const cellSize = Math.min(34, Math.max(24, Math.floor((boardAvail - gap * (COLS - 1)) / COLS)));

  const p1Label = "You";
  const p2Label = mode === "vs-bot" ? "Ted" : (opponentName || "Guest");
  const p2Initial = mode === "vs-bot" ? "T" : (opponentName?.[0]?.toUpperCase() || "G");
  const p2Image = mode === "vs-bot"
    ? "https://ik.imagekit.io/dateme/Teddy%20bear%20in%20a%20cozy%20office.png?updatedAt=1774818471382"
    : opponentAvatar ?? undefined;
  const activeBetOptions = isTop5Opponent ? TOP5_BET_OPTIONS : BET_OPTIONS;

  // ── Drop disc ────────────────────────────────────────────────────────────────
  const dropDisc = useCallback((col: number) => {
    if (betPhase !== "active") return;
    if (winner || isDraw || isDropping) return;
    if (mode === "vs-bot" && currentPlayer === 2) return;
    const row = getLowestEmptyRow(board, col);
    if (row === -1) return;
    setIsDropping(true);
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);
    setLastDrop([row, col]);
    setLastPlayed({ col, color: currentPlayer === 1 ? RED : YELLOW });
    const win = checkWinner(newBoard, row, col, currentPlayer);
    if (win) {
      setWinner(currentPlayer as 1 | 2);
      setWinCells(win);
      setScores(s => currentPlayer === 1 ? { ...s, p1: s.p1 + 1 } : { ...s, p2: s.p2 + 1 });
      setIsDropping(false);
      return;
    }
    if (isBoardFull(newBoard)) { setIsDraw(true); setIsDropping(false); return; }
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setIsDropping(false);
  }, [board, currentPlayer, winner, isDraw, isDropping, mode, betPhase]);

  // ── Bot move ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "vs-bot" || currentPlayer !== 2 || winner || isDraw || betPhase !== "active") return;
    const t = setTimeout(() => {
      const col = getBotMove(board);
      const row = getLowestEmptyRow(board, col);
      if (row === -1) return;
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = P2;
      setBoard(newBoard);
      setLastDrop([row, col]);
      setLastPlayed({ col, color: YELLOW });
      const win = checkWinner(newBoard, row, col, P2);
      if (win) { setWinner(2); setWinCells(win); setScores(s => ({ ...s, p2: s.p2 + 1 })); return; }
      if (isBoardFull(newBoard)) { setIsDraw(true); return; }
      setCurrentPlayer(1);
    }, 1400 + Math.random() * 1600); // 1.4–3s natural pace
    return () => clearTimeout(t);
  }, [currentPlayer, board, mode, winner, isDraw, betPhase]);

  // ── Falling chips on game end ────────────────────────────────────────────────
  useEffect(() => {
    if (!winner && !isDraw) chipsSpawned.current = false;
  }, [winner, isDraw]);

  // ── Reset ────────────────────────────────────────────────────────────────────
  function resetGame() {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)));
    setCurrentPlayer(1); setWinner(0); setWinCells([]);
    setIsDraw(false); setLastDrop(null); setLastPlayed(null); setIsDropping(false);
    chipsSpawned.current = false;
    setBetPhase("p1-select"); setActiveBet(0); setPendingBet(0);
    setFallingCoins([]); coinSettled.current = false;
    setTurnTimeLeft(15); timedOut.current = false;
    setShowWinBanner(false);
    setChatMessages([]);
  }

  const winCellSet = new Set(winCells.map(([r, c]) => `${r}-${c}`));
  const activeColor = currentPlayer === 1 ? RED : GOLD;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", padding: "0 0 env(safe-area-inset-bottom, 8px)", position: "relative" }}>

      {/* ── Bet badge header ─────────────────────────────────────────── */}
      {betPhase === "active" && activeBet > 0 && (
        <div style={{ display: "flex", justifyContent: "center", padding: "6px 16px 0" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.35)",
              borderRadius: 20, padding: "4px 16px",
              fontSize: 12, fontWeight: 900, color: GOLD, letterSpacing: "0.05em",
            }}
          >🪙 {activeBet} coins at stake</motion.div>
        </div>
      )}

      {/* ── Board row: P1 | board | P2 ──────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "0 12px", gap: 6 }}>

        {/* P1 left */}
        <PlayerCard label={p1Label} score={scores.p1}
          isActive={betPhase === "active" && !winner && !isDraw && currentPlayer === 1}
          color={RED} glow={RED_GLOW} initial="Y"
          showGo={betPhase === "active" && !winner && !isDraw && currentPlayer === 1} />

        {/* Board column */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", paddingBottom: 44 }}>

          {/* Board frame */}
          <div style={{
            background: "linear-gradient(180deg, #0060e0 0%, #0044bb 100%)",
            borderRadius: "14px 14px 6px 6px", padding: boardPad,
            border: "2px solid #003aaa",
            boxShadow: "0 8px 32px rgba(0,68,187,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
            position: "relative",
          }}>
            {/* Column numbers */}
            <div style={{ display: "flex", gap }}>
              {Array(COLS).fill(0).map((_, col) => (
                <div key={col} onClick={() => dropDisc(col)}
                  onMouseEnter={() => setHoverCol(col)} onMouseLeave={() => setHoverCol(null)}
                  style={{ width: cellSize, height: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 900, userSelect: "none",
                    color: hoverCol === col && !winner && !isDraw ? activeColor : "rgba(255,255,255,0.3)",
                    transition: "color 0.12s",
                  }}>{col + 1}</span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap, marginTop: 4 }}>
              {board.map((row, r) => (
                <div key={r} style={{ display: "flex", gap }}>
                  {row.map((cell, c) => {
                    const isWin = winCellSet.has(`${r}-${c}`);
                    const isLast = lastDrop?.[0] === r && lastDrop?.[1] === c;
                    const cellGlow = cell === P1 ? RED_GLOW : GOLD_GLOW;
                    return (
                      <div key={c} onClick={() => dropDisc(c)}
                        style={{ width: cellSize, height: cellSize, borderRadius: "50%", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                        <AnimatePresence mode="wait">
                          {cell !== EMPTY ? (
                            <motion.div
                              key={`filled-${r}-${c}-${cell}`}
                              initial={isLast ? { y: -(r + 1) * (cellSize + gap) - 60 } : { y: 0 }}
                              animate={isWin
                                ? { y: 0, scale: [1, 1.12, 1], boxShadow: [`0 0 12px ${cellGlow}`, `0 0 24px ${cellGlow}`, `0 0 12px ${cellGlow}`] }
                                : { y: 0 }}
                              transition={isWin
                                ? { type: "tween", duration: 0.7, repeat: Infinity, repeatType: "reverse" }
                                : isLast ? { type: "spring", stiffness: 400, damping: 28 } : { duration: 0 }}
                              style={{
                                width: "100%", height: "100%", borderRadius: "50%",
                                background: cell === P1
                                  ? `radial-gradient(circle at 35% 32%, #ff5a5a, ${RED} 55%, #8b0000)`
                                  : `radial-gradient(circle at 35% 32%, #fff176, ${YELLOW} 55%, #b8860b)`,
                                boxShadow: `0 0 12px ${cellGlow}, inset 0 1px 4px rgba(255,255,255,0.3)`,
                              }} />
                          ) : (
                            <motion.div key={`empty-${r}-${c}`}
                              style={{
                                width: "100%", height: "100%", borderRadius: "50%",
                                background: "radial-gradient(circle at 40% 35%, #0a1e5e, #060f38)",
                                boxShadow: "inset 0 3px 8px rgba(0,0,0,0.8)",
                              }} />
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* ── Win line SVG ─────────────────────────────────────── */}
            {winCells.length >= 2 && !isDraw && (() => {
              const sorted = [...winCells].sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
              const [r1, c1] = sorted[0];
              const [r2, c2] = sorted[sorted.length - 1];
              const cx = (c: number) => boardPad + c * (cellSize + gap) + cellSize / 2;
              const cy = (r: number) => boardPad + 20 + r * (cellSize + gap) + cellSize / 2;
              const color = winner === 1 ? RED : GOLD;
              const glow = winner === 1 ? RED_GLOW : GOLD_GLOW;
              return (
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 30, overflow: "visible" }}>
                  <defs>
                    <filter id="lineglow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  {/* Glow shadow line */}
                  <motion.line
                    x1={cx(c1)} y1={cy(r1)} x2={cx(c2)} y2={cy(r2)}
                    stroke={color} strokeWidth={cellSize * 0.55} strokeLinecap="round"
                    strokeOpacity={0.35}
                    animate={{ strokeOpacity: [0.15, 0.5, 0.15] }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
                    filter="url(#lineglow)"
                  />
                  {/* Core bright line */}
                  <motion.line
                    x1={cx(c1)} y1={cy(r1)} x2={cx(c2)} y2={cy(r2)}
                    stroke="white" strokeWidth={cellSize * 0.18} strokeLinecap="round"
                    animate={{ strokeOpacity: [0.4, 1, 0.4], stroke: [color, "white", color] }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Dot caps on each end */}
                  {[[cx(c1), cy(r1)], [cx(c2), cy(r2)]].map(([x, y], i) => (
                    <motion.circle key={i} cx={x} cy={y} r={cellSize * 0.22}
                      fill={color}
                      animate={{ r: [cellSize * 0.18, cellSize * 0.28, cellSize * 0.18], fillOpacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
                      style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
                    />
                  ))}
                </svg>
              );
            })()}
          </div>

          {/* Yellow legs */}
          {[{ side: "left", pos: { left: -14 } }, { side: "right", pos: { right: -14 } }].map(({ side, pos }) => (
            <div key={side} style={{
              position: "absolute", bottom: 40, ...pos,
              width: 18, height: 80,
              background: "linear-gradient(180deg, #ffe040 0%, #ffd700 40%, #e6c000 100%)",
              borderRadius: "6px 6px 10px 10px",
              boxShadow: "0 6px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,230,80,0.5)",
            }} />
          ))}


          {/* Turn timer */}
          {betPhase === "active" && !winner && !isDraw && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none", zIndex: 40,
            }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={turnTimeLeft}
                  initial={{ scale: 1.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: turnTimeLeft <= 5 ? 1 : 0 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    fontSize: 88, fontWeight: 900, lineHeight: 1,
                    color: currentPlayer === 1 ? RED : GOLD,
                    textShadow: `0 0 40px ${currentPlayer === 1 ? RED_GLOW : GOLD_GLOW}, 0 0 80px ${currentPlayer === 1 ? RED_GLOW : GOLD_GLOW}`,
                    filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.9))",
                  }}
                >{turnTimeLeft}</motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Win / Draw overlay — delayed 5s so player sees the winning line */}
          <AnimatePresence>
            {showWinBanner && (winner !== 0 || isDraw) && (
              <motion.div key="result"
                initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ type: "spring", damping: 22, stiffness: 280 }}
                style={{
                  position: "absolute", inset: 0,
                  background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)",
                  borderRadius: 20, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 12,
                }}>
                <span style={{ fontSize: 48 }}>{winner ? "🏆" : "🤝"}</span>
                <p style={{
                  fontSize: 22, fontWeight: 900, margin: 0,
                  color: isDraw ? "white" : winner === 1 ? RED : GOLD,
                  textShadow: isDraw ? "none" : `0 0 24px ${winner === 1 ? RED_GLOW : GOLD_GLOW}`,
                }}>{isDraw ? "It's a Draw!" : `${winner === 1 ? p1Label : p2Label} Wins!`}</p>
                {activeBet > 0 && (
                  <p style={{ fontSize: 14, fontWeight: 900, color: GOLD, margin: 0 }}>
                    🪙 {isDraw ? "No coins awarded" : `+${activeBet} coins`}
                  </p>
                )}
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{scores.p1} — {scores.p2}</p>
                <motion.button whileTap={{ scale: 0.95 }} onClick={resetGame} style={{
                  marginTop: 8, padding: "12px 36px", borderRadius: 16, border: "none",
                  background: "linear-gradient(135deg, #b8860b, #ffd700, #fffacd)",
                  color: "#000", fontWeight: 900, fontSize: 15, cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(255,215,0,0.4)",
                }}>Play Again</motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>{/* end position:relative */}
        </div>{/* end board column */}

        {/* P2 right */}
        <PlayerCard label={p2Label} score={scores.p2}
          isActive={betPhase === "active" && !winner && !isDraw && currentPlayer === 2}
          color={GOLD} glow={GOLD_GLOW} initial={p2Initial} imageUrl={p2Image}
          showGo={betPhase === "active" && !winner && !isDraw && currentPlayer === 2} />

      </div>{/* end board row */}

      {/* ── Column buttons ───────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 6, padding: "8px 16px 0", opacity: betPhase === "active" ? 1 : 0.3, pointerEvents: betPhase === "active" ? "auto" : "none" }}>
        {Array(COLS).fill(0).map((_, col) => (
          <motion.button key={col}
            whileTap={{ scale: 0.88 }}
            onClick={() => dropDisc(col)}
            disabled={!!(winner || isDraw)}
            onMouseEnter={() => setHoverCol(col)}
            onMouseLeave={() => setHoverCol(null)}
            style={{
              flex: 1, height: 44, borderRadius: 10,
              border: lastPlayed?.col === col
                ? `2px solid ${lastPlayed.color}`
                : `1px solid ${activeColor}44`,
              background: lastPlayed?.col === col
                ? `${lastPlayed.color}33`
                : `${activeColor}18`,
              color: lastPlayed?.col === col ? lastPlayed.color : activeColor,
              fontSize: 15, fontWeight: 900, cursor: winner || isDraw ? "default" : "pointer",
              boxShadow: lastPlayed?.col === col
                ? `0 0 14px ${lastPlayed.color === RED ? RED_GLOW : GOLD_GLOW}`
                : "none",
              transition: "all 0.18s",
            }}
          >{col + 1}</motion.button>
        ))}
      </div>

      {/* ── Chat / Bet window ─────────────────────────────────────────── */}
      <div style={{
        margin: "8px 16px 12px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", flexDirection: "column",
        overflow: "hidden", flex: 1, minHeight: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
            {betPhase === "active" ? "GAME CHAT" : "SET COIN BET"}
          </span>
          <button onClick={quitGame} style={{
            background: "rgba(238,28,36,0.12)", border: "1px solid rgba(238,28,36,0.3)",
            borderRadius: 8, padding: "3px 10px",
            color: RED, fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: "0.04em",
          }}>Quit Game</button>
        </div>

        {/* ── P1 bet selection ─────────────────────────────────────────── */}
        {betPhase === "p1-select" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px", gap: 12 }}>
            <span style={{ fontSize: 32 }}>🪙</span>
            <div style={{ color: "white", fontWeight: 900, fontSize: 15, textAlign: "center" }}>Set your coin bet</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center" }}>
              {isTop5Opponent
                ? `🏆 Top 5 player — minimum bet 20 🪙`
                : `Challenge ${p2Label} for coins, or play free`}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
              {activeBetOptions.map(amount => (
                <motion.button key={amount} whileTap={{ scale: 0.9 }}
                  onClick={() => p1SelectBet(amount)}
                  style={{
                    width: 58, height: 48, borderRadius: 12,
                    background: amount === 0 ? "rgba(255,255,255,0.06)" : "rgba(255,215,0,0.1)",
                    border: amount === 0 ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,215,0,0.35)",
                    color: amount === 0 ? "rgba(255,255,255,0.45)" : GOLD,
                    fontWeight: 900, fontSize: 14, cursor: "pointer",
                  }}
                >{amount === 0 ? "Free" : `${amount}`}</motion.button>
              ))}
            </div>
          </div>
        )}

        {/* ── P2 respond ───────────────────────────────────────────────── */}
        {betPhase === "p2-respond" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px", gap: 12 }}>
            <span style={{ fontSize: 32 }}>🪙</span>
            <div style={{ color: GOLD, fontWeight: 900, fontSize: 22 }}>{pendingBet} coins</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center" }}>
              {mode === "vs-bot" ? `Ted is thinking…` : `${opponentName || "Guest"}, accept or raise?`}
            </div>
            {mode !== "vs-bot" && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={p2AcceptBet}
                  style={{
                    padding: "10px 22px", borderRadius: 12,
                    background: "rgba(0,200,100,0.14)", border: "1px solid rgba(0,200,100,0.35)",
                    color: "#00e676", fontWeight: 900, fontSize: 14, cursor: "pointer",
                  }}>✓ Accept</motion.button>
                {activeBetOptions.filter(a => a > pendingBet).map(amount => (
                  <motion.button key={amount} whileTap={{ scale: 0.9 }} onClick={() => p2CounterBet(amount)}
                    style={{
                      padding: "10px 18px", borderRadius: 12,
                      background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)",
                      color: GOLD, fontWeight: 900, fontSize: 14, cursor: "pointer",
                    }}>↑ {amount}</motion.button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── P1 counter respond ───────────────────────────────────────── */}
        {betPhase === "p1-counter" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px", gap: 12 }}>
            <span style={{ fontSize: 32 }}>🪙</span>
            <div style={{ color: GOLD, fontWeight: 900, fontSize: 22 }}>{pendingBet} coins</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center" }}>
              {p2Label} raised to {pendingBet} 🪙 — accept or walk away?
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <motion.button whileTap={{ scale: 0.9 }} onClick={p1AcceptCounter}
                style={{
                  padding: "10px 22px", borderRadius: 12,
                  background: "rgba(0,200,100,0.14)", border: "1px solid rgba(0,200,100,0.35)",
                  color: "#00e676", fontWeight: 900, fontSize: 14, cursor: "pointer",
                }}>✓ Accept {pendingBet} 🪙</motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={p1CancelCounter}
                style={{
                  padding: "10px 22px", borderRadius: 12,
                  background: "rgba(238,28,36,0.12)", border: "1px solid rgba(238,28,36,0.3)",
                  color: RED, fontWeight: 900, fontSize: 14, cursor: "pointer",
                }}>✗ Cancel</motion.button>
            </div>
          </div>
        )}

        {/* ── Active chat ──────────────────────────────────────────────── */}
        {betPhase === "active" && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
              {chatMessages.map(msg => {
                const isMe = msg.from === "You";
                const isFlipped = flipped.has(msg.id);
                const showOriginal = isFlipped && msg.translated && msg.original;
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                    {msg.from === "system" ? (
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic", textAlign: "center", width: "100%" }}>{msg.text}</span>
                    ) : (
                      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 3 }}>
                        {/* Bubble */}
                        <motion.div
                          animate={{ rotateY: isFlipped ? 180 : 0 }}
                          transition={{ duration: 0.35, ease: "easeInOut" }}
                          style={{
                            background: isMe ? "rgba(238,28,36,0.18)" : "rgba(255,215,0,0.12)",
                            border: `1px solid ${isMe ? "rgba(238,28,36,0.25)" : "rgba(255,215,0,0.2)"}`,
                            borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                            padding: "6px 10px",
                            cursor: msg.translated ? "pointer" : "default",
                            backfaceVisibility: "hidden",
                          }}
                          onClick={() => msg.translated && toggleFlip(msg.id)}
                        >
                          <div style={{ fontSize: 10, fontWeight: 800, marginBottom: 2, color: isMe ? RED : GOLD }}>{msg.from}</div>
                          {msg.translating ? (
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>translating…</div>
                          ) : (
                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                              {showOriginal ? msg.original : msg.text}
                            </div>
                          )}
                        </motion.div>
                        {/* Translation badge */}
                        {msg.translated && (
                          <div
                            onClick={() => toggleFlip(msg.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
                              fontSize: 10, color: "rgba(255,255,255,0.3)",
                              padding: "0 4px",
                            }}
                          >
                            <span>🌐</span>
                            <span>{isFlipped ? "Show translation" : "Show original"}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", gap: 8, padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Say something…"
                style={{
                  flex: 1, background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, padding: "8px 12px",
                  color: "white", fontSize: 13, outline: "none",
                }}
              />
              <motion.button whileTap={{ scale: 0.92 }} onClick={sendChat} style={{
                background: "linear-gradient(135deg, #b8860b, #ffd700)",
                border: "none", borderRadius: 10, padding: "8px 16px",
                color: "#000", fontWeight: 900, fontSize: 13, cursor: "pointer", flexShrink: 0,
              }}>Send</motion.button>
            </div>
          </>
        )}
      </div>

      {/* ── Ted wins — full-page frosted screen ──────────────────────── */}
      <AnimatePresence>
        {showWinBanner && winner === 2 && mode === "vs-bot" && (
          <motion.div
            key="ted-wins"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "absolute", inset: 0, zIndex: 300,
              borderRadius: 0, overflow: "hidden",
            }}
          >
            {/* Ted image background */}
            <img
              src="https://ik.imagekit.io/dateme/Teddy%20bear%20in%20a%20cozy%20office.png?updatedAt=1774818471382"
              alt="Ted wins"
              style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
            />
            {/* Frosted overlay */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.2) 100%)",
              backdropFilter: "blur(4px)",
            }} />
            {/* Content */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "0 24px max(36px,env(safe-area-inset-bottom,36px))",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            }}>
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                style={{ fontSize: 56, lineHeight: 1 }}
              >🏆</motion.div>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: 28, fontWeight: 900, color: GOLD, margin: 0, textAlign: "center",
                  textShadow: `0 0 32px ${GOLD_GLOW}` }}
              >Ted Wins!</motion.p>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", margin: 0, textAlign: "center" }}
              >Better luck next time! Ted's still unbeaten. 🧸</motion.p>
              {activeBet > 0 && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  style={{ fontSize: 15, fontWeight: 900, color: GOLD, margin: 0 }}
                >🪙 −{activeBet} coins</motion.p>
              )}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.55 }}
                style={{ display: "flex", gap: 10, width: "100%", marginTop: 6 }}
              >
                <motion.button whileTap={{ scale: 0.95 }} onClick={resetGame}
                  style={{
                    flex: 1, height: 54, borderRadius: 16, border: "none",
                    background: "linear-gradient(135deg, #92400e, #d4af37, #f0d060)",
                    color: "#000", fontWeight: 900, fontSize: 15, cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(212,175,55,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <img src="https://ik.imagekit.io/dateme/Teddy%20bear%20in%20a%20cozy%20office.png?updatedAt=1774818471382"
                    style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }} />
                  Play Ted Again
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/games")}
                  style={{
                    width: 54, height: 54, borderRadius: 16,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white", fontSize: 20, cursor: "pointer",
                  }}
                >🏠</motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Falling coins overlay ─────────────────────────────────────── */}
      {fallingCoins.map(coin => (
        <motion.div key={coin.id}
          initial={{ y: -40, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: screenW * 2, opacity: [1, 1, 0.6, 0], rotate: coin.spin, scale: [1, 1.1, 0.8] }}
          transition={{ duration: coin.dur, delay: coin.delay, ease: [0.25, 0, 0.75, 1] }}
          style={{
            position: "absolute", top: 0, left: coin.x,
            width: 28, height: 28, borderRadius: "50%",
            pointerEvents: "none", zIndex: 200,
            background: "radial-gradient(circle at 35% 30%, #fff9c4, #ffd700 50%, #b8860b)",
            boxShadow: "0 0 14px rgba(255,215,0,0.8), inset 0 1px 3px rgba(255,255,255,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, lineHeight: 1,
          }}>🪙</motion.div>
      ))}

    </div>
  );
}
