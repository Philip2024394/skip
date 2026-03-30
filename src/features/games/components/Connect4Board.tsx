import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Constants ──────────────────────────────────────────────────────────────────
const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const P1 = 1;
const P2 = 2;

const RED   = "#e01010";
const GOLD  = "#d4af37";
const RED_GLOW  = "rgba(224,16,16,0.6)";
const GOLD_GLOW = "rgba(212,175,55,0.6)";

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  mode: "vs-guest" | "vs-bot";
  opponentName?: string;
  onBack: () => void;
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

function checkWinner(
  board: number[][], row: number, col: number, player: number
): [number, number][] | null {
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
  // 1. Win if possible
  for (let col = 0; col < COLS; col++) {
    const row = getLowestEmptyRow(board, col);
    if (row === -1) continue;
    const test = board.map(r => [...r]);
    test[row][col] = P2;
    if (checkWinner(test, row, col, P2)) return col;
  }
  // 2. Block player 1 winning
  for (let col = 0; col < COLS; col++) {
    const row = getLowestEmptyRow(board, col);
    if (row === -1) continue;
    const test = board.map(r => [...r]);
    test[row][col] = P1;
    if (checkWinner(test, row, col, P1)) return col;
  }
  // 3. Prefer centre columns
  const preference = [3, 2, 4, 1, 5, 0, 6];
  for (const col of preference) {
    if (getLowestEmptyRow(board, col) !== -1) return col;
  }
  return 0;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Connect4Board({ mode, opponentName, onBack }: Props) {
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

  // Responsive cell size
  const cellSize = Math.min(44, (Math.min(typeof window !== "undefined" ? window.innerWidth : 480, 480) - 56) / COLS);
  const gap = 5;

  // Player labels
  const p1Label = "You";
  const p2Label = mode === "vs-bot" ? "Bot" : (opponentName || "Guest");

  // ── Drop disc ────────────────────────────────────────────────────────────────
  const dropDisc = useCallback((col: number) => {
    if (winner || isDraw || isDropping) return;
    if (mode === "vs-bot" && currentPlayer === 2) return;

    const row = getLowestEmptyRow(board, col);
    if (row === -1) return;

    setIsDropping(true);
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);
    setLastDrop([row, col]);

    const win = checkWinner(newBoard, row, col, currentPlayer);
    if (win) {
      setWinner(currentPlayer as 1 | 2);
      setWinCells(win);
      setScores(s => currentPlayer === 1 ? { ...s, p1: s.p1 + 1 } : { ...s, p2: s.p2 + 1 });
      setIsDropping(false);
      return;
    }
    if (isBoardFull(newBoard)) {
      setIsDraw(true);
      setIsDropping(false);
      return;
    }
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setIsDropping(false);
  }, [board, currentPlayer, winner, isDraw, isDropping, mode]);

  // ── Bot move ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "vs-bot" || currentPlayer !== 2 || winner || isDraw) return;
    const t = setTimeout(() => {
      const col = getBotMove(board);
      const row = getLowestEmptyRow(board, col);
      if (row === -1) return;

      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = P2;
      setBoard(newBoard);
      setLastDrop([row, col]);

      const win = checkWinner(newBoard, row, col, P2);
      if (win) {
        setWinner(2);
        setWinCells(win);
        setScores(s => ({ ...s, p2: s.p2 + 1 }));
        return;
      }
      if (isBoardFull(newBoard)) { setIsDraw(true); return; }
      setCurrentPlayer(1);
    }, 650);
    return () => clearTimeout(t);
  }, [currentPlayer, board, mode, winner, isDraw]);

  // ── Reset ────────────────────────────────────────────────────────────────────
  function resetGame() {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)));
    setCurrentPlayer(1);
    setWinner(0);
    setWinCells([]);
    setIsDraw(false);
    setLastDrop(null);
    setIsDropping(false);
  }

  const winCellSet = new Set(winCells.map(([r, c]) => `${r}-${c}`));
  const activeColor = currentPlayer === 1 ? RED : GOLD;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 12px 12px" }}>

      {/* ── Score bar ────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 4px 16px",
      }}>
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20, padding: "6px 14px", color: "rgba(255,255,255,0.6)",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >← Back</button>

        {/* Score */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: RED, boxShadow: `0 0 8px ${RED_GLOW}` }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{p1Label}</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>
            {scores.p1}
            <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 4px" }}>—</span>
            {scores.p2}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{p2Label}</span>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: GOLD, boxShadow: `0 0 8px ${GOLD_GLOW}` }} />
          </div>
        </div>

        {/* Mode badge */}
        <div style={{
          background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)",
          borderRadius: 10, padding: "4px 10px",
          fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: "0.06em",
        }}>
          {mode === "vs-bot" ? "VS BOT" : "VS GUEST"}
        </div>
      </div>

      {/* ── Turn indicator ───────────────────────────────────────────── */}
      {!winner && !isDraw && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <motion.div
            key={currentPlayer}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: currentPlayer === 1 ? "rgba(224,16,16,0.12)" : "rgba(212,175,55,0.12)",
              border: `1px solid ${currentPlayer === 1 ? "rgba(224,16,16,0.3)" : "rgba(212,175,55,0.3)"}`,
              borderRadius: 20, padding: "7px 16px",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                width: 12, height: 12, borderRadius: "50%",
                background: activeColor,
                boxShadow: `0 0 10px ${currentPlayer === 1 ? RED_GLOW : GOLD_GLOW}`,
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: activeColor }}>
              {currentPlayer === 1 ? `${p1Label}'s Turn` : (mode === "vs-bot" ? "Bot is thinking…" : `${p2Label}'s Turn`)}
            </span>
          </motion.div>
        </div>
      )}

      {/* ── Board ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative" }}>

          {/* Board frame */}
          <div style={{
            background: "rgba(10,6,20,0.95)",
            borderRadius: 20, padding: 12,
            border: "1px solid rgba(212,175,55,0.15)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(212,175,55,0.08)",
          }}>

            {/* Column drop zones */}
            <div style={{ display: "flex", gap, marginBottom: 4 }}>
              {Array(COLS).fill(0).map((_, col) => (
                <div
                  key={col}
                  onMouseEnter={() => setHoverCol(col)}
                  onMouseLeave={() => setHoverCol(null)}
                  onClick={() => dropDisc(col)}
                  style={{
                    width: cellSize, height: 32,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: winner || isDraw ? "default" : "pointer",
                    flexShrink: 0,
                  }}
                >
                  <motion.div
                    animate={{ opacity: hoverCol === col && !winner && !isDraw ? 1 : 0, y: hoverCol === col ? 0 : -5 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: activeColor,
                      boxShadow: `0 0 8px ${currentPlayer === 1 ? RED_GLOW : GOLD_GLOW}`,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap }}>
              {board.map((row, r) => (
                <div key={r} style={{ display: "flex", gap }}>
                  {row.map((cell, c) => {
                    const isWin = winCellSet.has(`${r}-${c}`);
                    const isLast = lastDrop?.[0] === r && lastDrop?.[1] === c;
                    const cellColor = cell === P1 ? RED : cell === P2 ? GOLD : null;
                    const cellGlow = cell === P1 ? RED_GLOW : GOLD_GLOW;

                    return (
                      <div
                        key={c}
                        style={{ width: cellSize, height: cellSize, borderRadius: "50%", overflow: "hidden", flexShrink: 0, position: "relative" }}
                        onClick={() => dropDisc(c)}
                      >
                        <AnimatePresence mode="wait">
                          {cell !== EMPTY ? (
                            <motion.div
                              key={`filled-${r}-${c}-${cell}`}
                              initial={isLast ? { y: -(r + 1) * (cellSize + gap) - 60 } : { y: 0 }}
                              animate={isWin
                                ? { y: 0, scale: [1, 1.12, 1], boxShadow: [`0 0 12px ${cellGlow}`, `0 0 24px ${cellGlow}`, `0 0 12px ${cellGlow}`] }
                                : { y: 0 }
                              }
                              transition={isLast
                                ? { type: "spring", stiffness: 400, damping: 28 }
                                : isWin
                                  ? { duration: 0.7, repeat: Infinity, repeatType: "reverse" }
                                  : { duration: 0 }
                              }
                              style={{
                                width: "100%", height: "100%", borderRadius: "50%",
                                background: cell === P1
                                  ? `radial-gradient(circle at 35% 32%, #ff5a5a, ${RED} 55%, #8b0000)`
                                  : `radial-gradient(circle at 35% 32%, #f5e070, ${GOLD} 55%, #7a5c00)`,
                                boxShadow: `0 0 12px ${cellGlow}, inset 0 1px 4px rgba(255,255,255,0.3)`,
                              }}
                            />
                          ) : (
                            <motion.div
                              key={`empty-${r}-${c}`}
                              style={{
                                width: "100%", height: "100%", borderRadius: "50%",
                                background: "rgba(255,255,255,0.07)",
                                boxShadow: "inset 0 2px 5px rgba(0,0,0,0.6)",
                              }}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* ── Win / Draw overlay ─────────────────────────────────── */}
          <AnimatePresence>
            {(winner !== 0 || isDraw) && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", damping: 22, stiffness: 280 }}
                style={{
                  position: "absolute", inset: 0,
                  background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)",
                  borderRadius: 20,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 12,
                }}
              >
                <span style={{ fontSize: 50 }}>{winner ? "🏆" : "🤝"}</span>
                <p style={{
                  fontSize: 24, fontWeight: 900, margin: 0,
                  color: isDraw ? "white" : winner === 1 ? RED : GOLD,
                  textShadow: isDraw ? "none" : `0 0 24px ${winner === 1 ? RED_GLOW : GOLD_GLOW}`,
                }}>
                  {isDraw ? "It's a Draw!" : `${winner === 1 ? p1Label : p2Label} Wins!`}
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                  {scores.p1} — {scores.p2}
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={resetGame}
                  style={{
                    marginTop: 8, padding: "12px 36px", borderRadius: 16, border: "none",
                    background: "linear-gradient(135deg, #92400e, #d4af37, #f0d060)",
                    color: "#000", fontWeight: 900, fontSize: 15, cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(212,175,55,0.4)",
                  }}
                >
                  Play Again
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
