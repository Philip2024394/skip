import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share } from "lucide-react";

const DISMISS_KEY = "2DateMe_pwa_prompt_dismissed";

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.userAgent.includes("Mac") && "ontouchend" in document);

const isAndroid = () => /android/i.test(navigator.userAgent);

const isInStandaloneMode = () =>
  ("standalone" in navigator && (navigator as any).standalone) ||
  window.matchMedia("(display-mode: standalone)").matches;

export const AddToHomeScreen = () => {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (isInStandaloneMode()) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    // Capture Android/Chrome install prompt — single handler
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      clearTimeout(timer);
      if (!sessionStorage.getItem(DISMISS_KEY)) {
        setPlatform("android");
        setVisible(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS / delayed fallback — show after 30s if no prompt fired
    const timer = setTimeout(() => {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
      if (isIOS()) {
        setPlatform("ios");
        setVisible(true);
      }
    }, 30000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
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
