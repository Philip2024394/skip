import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserScore {
  total_score: number;           // 0–1 base score
  desirability: number;          // likes received / views
  activity: number;              // recency of last_seen
  profile_quality: number;       // photos + bio + verified
  chat_score: number;            // reply rate
  boost_multiplier: number;      // active boost (1x–8x)
  boost_expires_at: string | null;
  daily_boost_claimed_today: boolean;
  is_new_user: boolean;
  new_user_boost_expires_at: string | null;
  swipes_since_last_match: number;
  // computed
  effective_score: number;       // total_score * boost_multiplier
  score_label: "Rising" | "Active" | "Popular" | "Hot" | "On Fire";
  score_percent: number;         // 0–100 for UI ring
}

const SCORE_LABEL = (s: number): UserScore["score_label"] => {
  if (s >= 0.85) return "On Fire";
  if (s >= 0.65) return "Hot";
  if (s >= 0.45) return "Popular";
  if (s >= 0.25) return "Active";
  return "Rising";
};

export function useUserScore(userId: string | null) {
  const [score, setScore] = useState<UserScore | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await (supabase.rpc as any)("get_my_score", { p_user_id: userId });
      if (data) {
        const effective = Math.min(1, (data.total_score ?? 0.3) * (data.boost_multiplier ?? 1));
        setScore({
          ...data,
          effective_score: effective,
          score_label: SCORE_LABEL(effective),
          score_percent: Math.round(effective * 100),
        });
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  // Increment swipes without match (frustration tracking)
  const incrementSwipes = useCallback(async (): Promise<number> => {
    if (!userId) return 0;
    try {
      const { data } = await (supabase.rpc as any)("increment_swipes_without_match", { p_user_id: userId });
      return (data as number) ?? 0;
    } catch { return 0; }
  }, [userId]);

  const resetSwipes = useCallback(async () => {
    if (!userId) return;
    try { await (supabase.rpc as any)("reset_swipes_without_match", { p_user_id: userId }); } catch { /* silent */ }
  }, [userId]);

  // Claim daily free boost
  const claimDailyBoost = useCallback(async (): Promise<{ success: boolean; reason?: string; expires_at?: string }> => {
    if (!userId) return { success: false, reason: "no_user" };
    try {
      const { data } = await (supabase.rpc as any)("claim_daily_boost", { p_user_id: userId });
      if (data?.success) await fetch(); // refresh score
      return data ?? { success: false };
    } catch { return { success: false, reason: "error" }; }
  }, [userId, fetch]);

  return { score, loading, refresh: fetch, incrementSwipes, resetSwipes, claimDailyBoost };
}
