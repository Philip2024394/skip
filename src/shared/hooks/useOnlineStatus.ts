import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Heartbeat every 60 s — keeps last_seen_at fresh while user is logged in.
// The isOnline() threshold is 3 minutes, giving a 2-minute grace window.
const UPDATE_INTERVAL_MS = 60 * 1000;

const clearLastSeen = async (userId: string) => {
  await (supabase.from("profiles").update as any)({
    last_seen_at: null,
  }).eq("id", userId);
};

const updateLastSeen = async (userId: string) => {
  await (supabase.from("profiles").update as any)({
    last_seen_at: new Date().toISOString(),
  }).eq("id", userId);
};

export const useOnlineStatus = () => {
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let currentUserId: string | null = null;

    const start = async (userId: string) => {
      currentUserId = userId;
      await updateLastSeen(userId);
      intervalId = setInterval(() => updateLastSeen(userId), UPDATE_INTERVAL_MS);
    };

    const stop = async () => {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      if (currentUserId) {
        await clearLastSeen(currentUserId);
        currentUserId = null;
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // New sign-in or token refresh — make sure heartbeat is running
        if (!intervalId) start(session.user.id);
      } else {
        // Signed out — clear the dot immediately
        stop();
      }
    });

    // Bootstrap on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) start(session.user.id);
    });

    // Also clear on browser/tab close
    const handleUnload = () => {
      if (currentUserId) {
        // Synchronous best-effort using sendBeacon via fetch keepalive
        navigator.sendBeacon && navigator.sendBeacon(
          `${(supabase as any).supabaseUrl}/rest/v1/profiles?id=eq.${currentUserId}`,
        );
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      stop();
      subscription.unsubscribe();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);
};

// 3-minute threshold — slightly larger than the 1-min heartbeat interval
// to tolerate one missed ping before the dot disappears.
export const isOnline = (lastSeenAt: string | null | undefined): boolean => {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 3 * 60 * 1000;
};
