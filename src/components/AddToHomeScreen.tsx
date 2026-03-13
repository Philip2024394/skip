import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// How long the banner stays visible before auto-hiding (ms)
const SHOW_DURATION_MS = 30_000;
// How often the banner re-appears for unauthenticated users (ms)
const REPEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.userAgent.includes("Mac") && "ontouchend" in document);

const isInStandaloneMode = () =>
  ("standalone" in navigator && (navigator as any).standalone) ||
  window.matchMedia("(display-mode: standalone)").matches;

export const AddToHomeScreen = () => {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null); // null = unknown
  const repeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check auth state — never show banner for signed-in users
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsSignedIn(!!session);
      if (session) setVisible(false); // hide immediately if user logs in
    });
    return () => subscription.unsubscribe();
  }, []);

  // Capture Android install prompt early (before auth check resolves)
  useEffect(() => {
    if (isInStandaloneMode()) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Schedule the repeating banner once we know user is NOT signed in
  useEffect(() => {
    if (isSignedIn !== false) return; // wait until we know, and skip if signed in
    if (isInStandaloneMode()) return;

    const showBanner = () => {
      // Determine platform
      if (deferredPrompt) {
        setPlatform("android");
      } else if (isIOS()) {
        setPlatform("ios");
      } else {
        // Desktop Chrome / others — still show if we have a deferred prompt
        setPlatform("android");
      }
      setVisible(true);

      // Auto-hide after SHOW_DURATION_MS
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setVisible(false), SHOW_DURATION_MS);

      // Schedule next appearance
      if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = setTimeout(showBanner, REPEAT_INTERVAL_MS);
    };

    // Show after a short initial delay so the app can finish rendering
    const initialTimer = setTimeout(showBanner, 2000);

    return () => {
      clearTimeout(initialTimer);
      if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isSignedIn, deferredPrompt]);

  const handleDismiss = () => {
    setVisible(false);
    // Clear auto-hide; repeat timer continues so it re-shows in 5 min
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
        if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      }
      setDeferredPrompt(null);
    }
  };

  // Don't render anything for signed-in users or installed app
  if (isSignedIn || isInStandaloneMode()) return null;

  return (
    <AnimatePresence mode="sync">
      {visible && (
        <motion.div
          key="pwa-banner"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-safe"
          style={{ paddingBottom: `max(1rem, env(safe-area-inset-bottom, 0px))` }}
        >
          <div className="max-w-sm mx-auto bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="h-0.5 w-full bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500" />
            <div className="p-4 flex items-start gap-3">
              <img
                src="/icon-192.png"
                alt="2DateMe"
                className="w-12 h-12 rounded-2xl flex-shrink-0 shadow-lg"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">Add 2DateMe to your home screen</p>
                <p className="text-white/50 text-xs mt-0.5 leading-snug">
                  {platform === "ios"
                    ? 'Tap the Share button below, then "Add to Home Screen" for the full app experience.'
                    : "Install for full screen experience — no browser bar."}
                </p>
                {platform === "ios" && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Share className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-blue-400 text-xs font-medium">Tap Share → Add to Home Screen</span>
                  </div>
                )}
                {platform === "android" && deferredPrompt && (
                  <button
                    onClick={handleInstall}
                    className="mt-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold"
                  >
                    Install 2DateMe
                  </button>
                )}
              </div>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddToHomeScreen;
