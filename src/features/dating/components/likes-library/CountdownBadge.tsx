import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

// ── Countdown hook ────────────────────────────────────────────────────────────
const useCountdown = (expiresAt: string | null | undefined) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) { setTimeLeft(""); return; }
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setIsExpired(true); setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
      setIsExpired(false);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return { timeLeft, isExpired };
};

const CountdownBadge = ({ expiresAt }: { expiresAt: string | null | undefined }) => {
  const { timeLeft, isExpired } = useCountdown(expiresAt);
  if (!timeLeft) return null;
  return (
    <span className={`flex items-center gap-0.5 text-[8px] font-medium ${isExpired ? "text-destructive" : "text-accent"}`}>
      <Clock className="w-2.5 h-2.5" /> {timeLeft}
    </span>
  );
};

export { useCountdown, CountdownBadge };
