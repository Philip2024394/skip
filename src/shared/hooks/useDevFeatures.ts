import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "dev_features";

/** Only available in dev build (import.meta.env.DEV). When off, animations still run from real events in production. */
export function useDevFeatures(): [boolean, (on: boolean) => void] {
  const isDev = import.meta.env.DEV;
  const [enabled, setEnabledState] = useState(() => {
    if (!isDev) return false;
    try {
      return localStorage.getItem(STORAGE_KEY) !== "false";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!isDev) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setEnabledState(true);
      if (stored === "false") setEnabledState(false);
    } catch {
      // ignore
    }
  }, [isDev]);

  const setEnabled = useCallback(
    (on: boolean) => {
      if (!isDev) return;
      setEnabledState(on);
      try {
        localStorage.setItem(STORAGE_KEY, String(on));
      } catch {
        // ignore
      }
    },
    [isDev]
  );

  return [isDev ? enabled : false, setEnabled];
}

export const isDevBuild = (): boolean => !!import.meta.env.DEV;
