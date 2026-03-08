import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

const APP_NAME = "2DateMe";

/**
 * Registers the service worker and listens for updates.
 * When a new version is available, shows a toast with "Refresh" so the user
 * gets the latest app without reinstalling.
 */
export function useServiceWorkerUpdate() {
  const { t } = useLanguage();
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          registration = reg;
          if (reg.waiting) setWaitingWorker(reg.waiting);
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
              }
            });
          });
        })
        .catch(() => {});
    };

    const onControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }

    // Check for updates when the app gains focus (e.g. user returns to tab)
    const onFocus = () => {
      registration?.update().catch(() => {});
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("load", register);
      window.removeEventListener("focus", onFocus);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  useEffect(() => {
    if (!waitingWorker) return;

    toast.info(t("popup.updateAvailable"), {
      description: t("popup.updateDescription"),
      duration: Infinity,
      action: {
        label: t("popup.refresh"),
        onClick: () => {
          waitingWorker.postMessage({ type: "SKIP_WAITING" });
        },
      },
    });
  }, [waitingWorker, t]);
}
