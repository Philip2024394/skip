import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// ── Anonymous session ID (resets each browser session) ────────────────────────
const getSessionId = (): string => {
  let id = sessionStorage.getItem("_2dm_sid");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("_2dm_sid", id);
  }
  return id;
};

const getDevice = (): "mobile" | "tablet" | "desktop" => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|mini|windows ce|palm/i.test(ua)) return "mobile";
  return "desktop";
};

// Normalise dynamic routes to a stable page key for analytics
const normalisePage = (path: string): string => {
  if (/^\/profile\/[^/]+/.test(path)) return "/profile/:id";
  if (/^\/games\//.test(path)) return "/games";
  return path;
};

/**
 * Drop into any component that's inside <BrowserRouter>.
 * Logs a row to page_events on every unique page navigation.
 * userId / country are optional — pass them once you know them.
 */
export function usePageTracking(userId?: string | null, country?: string | null) {
  const location = useLocation();
  const lastPage = useRef<string>("");

  useEffect(() => {
    const page = normalisePage(location.pathname);
    if (page === lastPage.current) return;
    lastPage.current = page;

    // Fire-and-forget — never block the UI
    (async () => {
      try {
        await (supabase.from as any)("page_events").insert({
          session_id: getSessionId(),
          page,
          country: country ?? null,
          device: getDevice(),
          user_id: userId ?? null,
        });
      } catch {
        // Silent — analytics must never break the app
      }
    })();
  }, [location.pathname, userId, country]);
}
