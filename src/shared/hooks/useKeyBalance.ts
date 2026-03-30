import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface KeyBalance {
  fragments: number;
  keys: number;
  loading: boolean;
}

export function useKeyBalance(userId?: string): KeyBalance {
  const [state, setState] = useState<KeyBalance>({ fragments: 0, keys: 0, loading: true });

  useEffect(() => {
    if (!userId) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    const fetch = async () => {
      const { data } = await (supabase.from("profiles").select("key_fragments, keys_balance") as any)
        .eq("id", userId)
        .single();
      if (data) {
        setState({ fragments: data.key_fragments ?? 0, keys: data.keys_balance ?? 0, loading: false });
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    };

    fetch();

    const channel = supabase
      .channel(`key-balance-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          const p = payload.new as any;
          setState({ fragments: p.key_fragments ?? 0, keys: p.keys_balance ?? 0, loading: false });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return state;
}
