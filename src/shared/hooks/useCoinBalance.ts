import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CoinBalanceState {
  balance: number;
  loading: boolean;
}

/**
 * Real-time coin balance hook.
 * Reads coins_balance from profiles table.
 * Writes via award_coins / spend_coins RPCs for atomicity.
 */
export function useCoinBalance(userId?: string | null) {
  const [state, setState] = useState<CoinBalanceState>({ balance: 0, loading: true });

  const fetchBalance = useCallback(async () => {
    if (!userId) {
      setState({ balance: 0, loading: false });
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("coins_balance")
      .eq("id", userId)
      .single();

    setState({ balance: (data as any)?.coins_balance ?? 0, loading: false });
  }, [userId]);

  // Award coins — inserts ledger row + increments balance atomically
  const awardCoins = useCallback(async (amount: number, reason: string): Promise<number> => {
    if (!userId || amount <= 0) return state.balance;
    const { data } = await supabase.rpc("award_coins" as any, {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
    });
    const newBalance = (data as number) ?? state.balance + amount;
    setState(prev => ({ ...prev, balance: newBalance }));
    return newBalance;
  }, [userId, state.balance]);

  // Spend coins — deducts only if sufficient funds
  const deductCoins = useCallback(async (amount: number, reason = "spend"): Promise<boolean> => {
    if (!userId) return false;
    const { data } = await supabase.rpc("spend_coins" as any, {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
    });
    const newBalance = data as number;
    if (newBalance === -1) return false; // insufficient
    setState(prev => ({ ...prev, balance: newBalance }));
    return true;
  }, [userId]);

  // Legacy addCoins kept for compatibility — uses award_coins under the hood
  const addCoins = useCallback((amount: number) => {
    awardCoins(amount, "manual_add");
  }, [awardCoins]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  // Realtime: listen for profile coins_balance changes
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`coins-${userId}`)
      .on("postgres_changes" as any, {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${userId}`,
      }, (payload: any) => {
        if (payload.new?.coins_balance !== undefined) {
          setState(prev => ({ ...prev, balance: payload.new.coins_balance }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return {
    balance: state.balance,
    loading: state.loading,
    awardCoins,
    deductCoins,
    addCoins,
    refetch: fetchBalance,
  };
}
