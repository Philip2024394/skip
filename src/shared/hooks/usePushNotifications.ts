import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const ASKED_KEY = "2dm_push_asked";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function saveSubscription(userId: string, sub: PushSubscription) {
  const token = JSON.stringify(sub);
  await supabase.from("profiles").update({ push_token: token, push_enabled: true } as any).eq("id", userId);
}

export function usePushNotifications(userId: string | null) {
  useEffect(() => {
    if (!userId) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!VAPID_PUBLIC_KEY) return; // VAPID key not configured yet
    if (sessionStorage.getItem(ASKED_KEY)) return; // only ask once per session

    // Wait 30s before asking — don't interrupt new users immediately
    const timer = setTimeout(async () => {
      sessionStorage.setItem(ASKED_KEY, "1");

      try {
        // Check existing permission
        if (Notification.permission === "denied") return;

        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          await saveSubscription(userId, existing);
          return;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        // Subscribe
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        await saveSubscription(userId, sub);
      } catch {
        // Silently fail — push is enhancement only
      }
    }, 30_000);

    return () => clearTimeout(timer);
  }, [userId]);
}
