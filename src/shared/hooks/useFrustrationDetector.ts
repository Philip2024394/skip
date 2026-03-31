import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Trigger thresholds (tuned against Tinder/Hinge data)
const FRUSTRATION_SWIPES_THRESHOLD = 40;   // swipes without match
const FRUSTRATION_COOLDOWN_MS = 60 * 60 * 1000; // 1h between triggers
const HOPE_INJECT_EVERY = 25;               // inject quality profile every N swipes

const COOLDOWN_KEY = "frustration_last_triggered";

export type FrustrationTrigger = "swipes_no_match" | "low_balance" | "vault_peek";

export interface FrustrationState {
  shouldShow: boolean;
  trigger: FrustrationTrigger | null;
  swipeCount: number;
  matchCount: number;
  shouldInjectHope: boolean;   // true when it's time for hope-inject
}

export function useFrustrationDetector(userId: string | null) {
  const swipeCountRef = useRef(0);
  const matchCountRef = useRef(0);
  const [state, setState] = useState<FrustrationState>({
    shouldShow: false,
    trigger: null,
    swipeCount: 0,
    matchCount: 0,
    shouldInjectHope: false,
  });

  const canTrigger = useCallback((): boolean => {
    try {
      const last = parseInt(localStorage.getItem(COOLDOWN_KEY) || "0");
      return Date.now() - last > FRUSTRATION_COOLDOWN_MS;
    } catch { return true; }
  }, []);

  const recordTrigger = useCallback(() => {
    try { localStorage.setItem(COOLDOWN_KEY, Date.now().toString()); } catch { /* silent */ }
  }, []);

  const onSwipe = useCallback(() => {
    swipeCountRef.current += 1;
    const count = swipeCountRef.current;
    const hopeNow = count % HOPE_INJECT_EVERY === 0;

    // Frustration check
    if (count >= FRUSTRATION_SWIPES_THRESHOLD && matchCountRef.current === 0 && canTrigger()) {
      recordTrigger();
      setState({ shouldShow: true, trigger: "swipes_no_match", swipeCount: count, matchCount: matchCountRef.current, shouldInjectHope: hopeNow });
      // Log to DB (fire and forget)
      if (userId) {
        (supabase.from as any)("frustration_events").insert({
          user_id: userId,
          swipes_count: count,
          matches_count: matchCountRef.current,
          offer_type: "boost",
        }).then(() => {});
      }
    } else {
      setState(prev => ({ ...prev, swipeCount: count, shouldInjectHope: hopeNow }));
    }
  }, [userId, canTrigger, recordTrigger]);

  const onMatch = useCallback(() => {
    matchCountRef.current += 1;
    setState(prev => ({ ...prev, matchCount: matchCountRef.current, shouldShow: false }));
    // Reset DB counter
    if (userId) {
      (supabase.rpc as any)("reset_swipes_without_match", { p_user_id: userId }).then(() => {});
    }
  }, [userId]);

  const onVaultPeek = useCallback((coinBalance: number) => {
    if (coinBalance < 10 && canTrigger()) {
      recordTrigger();
      setState(prev => ({ ...prev, shouldShow: true, trigger: "vault_peek" }));
    }
  }, [canTrigger, recordTrigger]);

  const dismiss = useCallback((converted = false) => {
    setState(prev => ({ ...prev, shouldShow: false, trigger: null }));
    // Mark converted in DB if they bought
    if (converted && userId) {
      (supabase.from as any)("frustration_events")
        .update({ converted: true })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .then(() => {});
    }
  }, [userId]);

  const clearHopeInject = useCallback(() => {
    setState(prev => ({ ...prev, shouldInjectHope: false }));
  }, []);

  return { frustration: state, onSwipe, onMatch, onVaultPeek, dismiss, clearHopeInject };
}
