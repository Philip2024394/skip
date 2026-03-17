import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CoinBalanceState {
  balance: number;
  loading: boolean;
  error: string | null;
}

/**
 * Real-time coin balance hook.
 * Fetches from user_wallets table, falls back to localStorage for dev/admin.
 * Subscribes to realtime updates when a user is authenticated.
 */
export function useCoinBalance(userId?: string | null) {
  const [state, setState] = useState<CoinBalanceState>({
    balance: 0,
    loading: true,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    if (!userId) {
      // Check localStorage for admin/dev session
      const adminSession = localStorage.getItem("admin-12345");
      if (adminSession) {
        const stored = localStorage.getItem("coin_balance_admin");
        setState({ balance: stored ? parseInt(stored, 10) : 500, loading: false, error: null });
        return;
      }
      setState({ balance: 0, loading: false, error: null });
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from("user_wallets")
        .select("current_balance")
        .eq("user_id", userId)
        .single();

      if (error) {
        // Table may not exist yet — use localStorage fallback
        const stored = localStorage.getItem(`coin_balance_${userId}`);
        setState({
          balance: stored ? parseInt(stored, 10) : 500,
          loading: false,
          error: null,
        });
        return;
      }

      setState({
        balance: data?.current_balance ?? 0,
        loading: false,
        error: null,
      });
    } catch {
      // Fallback for any error
      const stored = localStorage.getItem(`coin_balance_${userId || "admin"}`);
      setState({
        balance: stored ? parseInt(stored, 10) : 500,
        loading: false,
        error: null,
      });
    }
  }, [userId]);

  // Deduct coins locally (optimistic) and persist
  const deductCoins = useCallback(
    async (amount: number): Promise<boolean> => {
      if (state.balance < amount) return false;

      const newBalance = state.balance - amount;
      setState((prev) => ({ ...prev, balance: newBalance }));

      // Persist to localStorage as fallback
      const key = userId ? `coin_balance_${userId}` : "coin_balance_admin";
      localStorage.setItem(key, newBalance.toString());

      // Try to update Supabase
      if (userId) {
        try {
          await (supabase as any)
            .from("user_wallets")
            .update({ current_balance: newBalance })
            .eq("user_id", userId);
        } catch {
          // localStorage fallback already persisted
        }
      }

      return true;
    },
    [state.balance, userId]
  );

  // Add coins (after purchase)
  const addCoins = useCallback(
    (amount: number) => {
      const newBalance = state.balance + amount;
      setState((prev) => ({ ...prev, balance: newBalance }));
      const key = userId ? `coin_balance_${userId}` : "coin_balance_admin";
      localStorage.setItem(key, newBalance.toString());
    },
    [state.balance, userId]
  );

  // Fetch on mount and userId change
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Subscribe to realtime changes on user_wallets
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`wallet-${userId}`)
      .on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "user_wallets",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new?.current_balance !== undefined) {
            setState((prev) => ({
              ...prev,
              balance: payload.new.current_balance,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    balance: state.balance,
    loading: state.loading,
    error: state.error,
    deductCoins,
    addCoins,
    refetch: fetchBalance,
  };
}
