import { motion } from "framer-motion";
import { Coins, Plus } from "lucide-react";

interface CoinHubProps {
  balance: number;
  loading?: boolean;
  onClick?: () => void;
}

const LOW_THRESHOLD = 10; // turns red below this

/**
 * Coin Balance HUD — always visible when signed in.
 * - Normal  (> 10):  yellow icon + yellow digits
 * - Low     (1–10):  red icon + red digits
 * - Zero    (0):     "Top Up" badge in yellow with plus icon
 */
export default function CoinHub({ balance, loading, onClick }: CoinHubProps) {
  const isZero = !loading && balance === 0;
  const isLow  = !loading && balance > 0 && balance <= LOW_THRESHOLD;

  if (isZero) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-yellow-400/50 hover:border-yellow-400/80 transition-colors"
        title="No coins — Top Up"
        aria-label="No coins — tap to top up"
      >
        <Plus className="w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]" />
        <span className="text-yellow-400 text-xs font-black tracking-wide">Top Up</span>
      </motion.button>
    );
  }

  const colour = isLow ? "text-red-400" : "text-yellow-400";
  const glow   = isLow
    ? "drop-shadow-[0_0_4px_rgba(248,113,113,0.6)]"
    : "drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]";
  const border = isLow ? "border-red-400/40 hover:border-red-400/70" : "border-yellow-400/30 hover:border-yellow-400/50";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border transition-colors ${border}`}
      title={`${balance} Coins`}
      aria-label={`Coin balance: ${balance}`}
    >
      <Coins className={`w-4 h-4 ${colour} ${glow}`} />
      {loading ? (
        <span className="text-yellow-400/60 text-xs font-bold animate-pulse">···</span>
      ) : (
        <motion.span
          key={balance}
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`${colour} text-xs font-bold tabular-nums`}
        >
          {Number(balance || 0).toLocaleString()}
        </motion.span>
      )}
    </motion.button>
  );
}
