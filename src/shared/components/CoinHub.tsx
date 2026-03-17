import { motion } from "framer-motion";
import { Coins } from "lucide-react";

interface CoinHubProps {
  balance: number;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * Coin Balance HUD — displays current coin total in the header.
 * Pink-on-black premium aesthetic with coin icon and animated balance.
 */
export default function CoinHub({ balance, loading, onClick }: CoinHubProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-yellow-400/30 hover:border-yellow-400/50 transition-colors"
      title={`${balance} Coins`}
      aria-label={`Coin balance: ${balance}`}
    >
      <Coins className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]" />
      {loading ? (
        <span className="text-yellow-400/60 text-xs font-bold animate-pulse">···</span>
      ) : (
        <motion.span
          key={balance}
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-yellow-400 text-xs font-bold tabular-nums"
        >
          {Number(balance || 0).toLocaleString()}
        </motion.span>
      )}
    </motion.button>
  );
}
