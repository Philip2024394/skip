import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Coin rewards by streak milestone
const STREAK_REWARDS: Record<number, number> = {
  1:  5,
  3:  15,
  7:  50,
  14: 100,
  30: 250,
};

function getRewardForDay(day: number): number {
  // Find highest milestone ≤ day
  const milestones = Object.keys(STREAK_REWARDS).map(Number).sort((a, b) => b - a);
  for (const m of milestones) {
    if (day >= m && day % m === 0) return STREAK_REWARDS[m];
  }
  return 0;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string | null;
  todayClaimed: boolean;
  reward: number; // coins earned today (0 if no milestone)
}

const STORAGE_KEY = "login_streak_v1";

function loadLocal(): StreakState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* silent */ }
  return { currentStreak: 0, longestStreak: 0, lastLoginDate: null, todayClaimed: false, reward: 0 };
}

function saveLocal(state: StreakState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* silent */ }
}

export function useLoginStreak(userId: string | null) {
  const [streak, setStreak] = useState<StreakState>(loadLocal);

  const claimStreak = useCallback(async () => {
    if (!userId) return;
    const today = new Date().toDateString();
    const local = loadLocal();

    if (local.lastLoginDate === today) return; // already claimed today

    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    const isConsecutive = local.lastLoginDate === yesterday;
    const newStreak = isConsecutive ? local.currentStreak + 1 : 1;
    const longest = Math.max(newStreak, local.longestStreak);
    const reward = getRewardForDay(newStreak);

    const newState: StreakState = {
      currentStreak: newStreak,
      longestStreak: longest,
      lastLoginDate: today,
      todayClaimed: true,
      reward,
    };
    setStreak(newState);
    saveLocal(newState);

    // Award coins if milestone
    if (reward > 0) {
      try {
        await (supabase.rpc as any)("award_coins", {
          p_user_id: userId,
          p_amount: reward,
          p_reason: `login_streak_day_${newStreak}`,
        });
        toast.success(`🔥 Day ${newStreak} streak! +${reward} coins`, {
          description: newStreak >= 7 ? "You're on fire! Keep it up 🚀" : "Come back tomorrow for more!",
          duration: 4500,
        });
      } catch { /* silent */ }
    } else {
      // No milestone reward but still show streak if > 1
      if (newStreak > 1) {
        toast.info(`🔥 ${newStreak} day streak!`, {
          description: `Next reward at day ${Object.keys(STREAK_REWARDS).map(Number).find(m => m > newStreak) ?? 30} `,
          duration: 3000,
        });
      }
    }

    // Sync to DB (fire and forget)
    try {
      await (supabase.from as any)("user_streaks").upsert({
        user_id: userId,
        current_streak: newStreak,
        longest_streak: longest,
        last_login_date: today,
      }, { onConflict: "user_id" });
    } catch { /* silent */ }
  }, [userId]);

  // Auto-claim on mount
  useEffect(() => {
    if (userId) claimStreak();
  }, [userId, claimStreak]);

  return { streak, claimStreak };
}
