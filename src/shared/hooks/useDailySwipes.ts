import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FREE_SWIPES_PER_DAY = 50;
const COINS_PER_REFILL = 5;
const SWIPES_PER_REFILL = 10;
const STORAGE_KEY_PREFIX = "daily_swipes_";

function todayKey(): string {
  return new Date().toDateString();
}

function getStoredCount(userId: string): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + userId);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    if (date !== todayKey()) return 0; // new day
    return count as number;
  } catch { return 0; }
}

function setStoredCount(userId: string, count: number) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify({ date: todayKey(), count }));
  } catch { /* silent */ }
}

export function useDailySwipes(userId: string | null, coinBalance: number, onSpendCoins: (amount: number) => Promise<boolean>) {
  const [swipesUsed, setSwipesUsed] = useState(() => userId ? getStoredCount(userId) : 0);
  const [refilling, setRefilling] = useState(false);

  // Reload from storage if userId changes
  useEffect(() => {
    if (userId) setSwipesUsed(getStoredCount(userId));
  }, [userId]);

  const swipesLeft = Math.max(0, FREE_SWIPES_PER_DAY - swipesUsed);
  const isLocked = swipesLeft === 0;
  const canRefillWithCoins = coinBalance >= COINS_PER_REFILL;

  // Call on every swipe (like or pass)
  const recordSwipe = useCallback(() => {
    if (!userId) return;
    const next = swipesUsed + 1;
    setSwipesUsed(next);
    setStoredCount(userId, next);

    // Warn at 5 remaining
    if (FREE_SWIPES_PER_DAY - next === 5) {
      toast.info("5 free swipes left today 🎯", {
        description: `Top up with coins or come back tomorrow`,
        duration: 4000,
      });
    }
  }, [userId, swipesUsed]);

  // Spend coins to unlock more swipes
  const refillWithCoins = useCallback(async (): Promise<boolean> => {
    if (!userId || !canRefillWithCoins || refilling) return false;
    setRefilling(true);
    const success = await onSpendCoins(COINS_PER_REFILL);
    if (success) {
      // Give back SWIPES_PER_REFILL by reducing the count
      const newUsed = Math.max(0, swipesUsed - SWIPES_PER_REFILL);
      setSwipesUsed(newUsed);
      setStoredCount(userId, newUsed);
      toast.success(`+${SWIPES_PER_REFILL} swipes unlocked! ⚡`, {
        description: `${COINS_PER_REFILL} coins spent`,
      });
    }
    setRefilling(false);
    return success;
  }, [userId, canRefillWithCoins, refilling, swipesUsed, onSpendCoins]);

  // Reset at midnight (poll once a minute)
  useEffect(() => {
    const check = () => {
      if (!userId) return;
      const stored = getStoredCount(userId);
      setSwipesUsed(stored); // will be 0 if new day
    };
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [userId]);

  return {
    swipesLeft,
    swipesUsed,
    isLocked,
    freeLimit: FREE_SWIPES_PER_DAY,
    recordSwipe,
    refillWithCoins,
    refilling,
    canRefillWithCoins,
    coinsPerRefill: COINS_PER_REFILL,
    swipesPerRefill: SWIPES_PER_REFILL,
  };
}
