import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const UPDATE_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export const useOnlineStatus = () => {
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const updateLastSeen = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await (supabase.from("profiles").update as any)({
          last_seen_at: new Date().toISOString(),
        }).eq("id", session.user.id);
      }
    };

    const start = async () => {
      await updateLastSeen();
      intervalId = setInterval(updateLastSeen, UPDATE_INTERVAL_MS);
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        start();
      } else {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
      }
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) start();
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
      subscription.unsubscribe();
    };
  }, []);
};

export const isOnline = (lastSeenAt: string | null | undefined): boolean => {
  if (!lastSeenAt) return false;
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return new Date(lastSeenAt).getTime() > fiveMinutesAgo;
};
