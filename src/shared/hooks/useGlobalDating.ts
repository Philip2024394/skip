import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GlobalDatingState {
  isGlobalDater: boolean;
  expiresAt: string | null;
  loading: boolean;
}

export function useGlobalDating(userId: string | undefined): GlobalDatingState {
  const [state, setState] = useState<GlobalDatingState>({ isGlobalDater: false, expiresAt: null, loading: true });

  useEffect(() => {
    if (!userId) { setState({ isGlobalDater: false, expiresAt: null, loading: false }); return; }

    supabase
      .from("profiles")
      .select("global_dating_active, global_dating_expires_at")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        const active = (data as any)?.global_dating_active === true;
        const expires = (data as any)?.global_dating_expires_at ?? null;
        // Double-check expiry in case webhook missed cancellation
        const notExpired = !expires || new Date(expires) > new Date();
        setState({ isGlobalDater: active && notExpired, expiresAt: expires, loading: false });
      });
  }, [userId]);

  return state;
}
