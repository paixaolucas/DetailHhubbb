import { useEffect, useRef, useCallback } from "react";

/**
 * Runs `callback` every `intervalMs` milliseconds.
 * Pauses automatically when the tab is hidden; resumes (with an immediate call)
 * when the tab becomes visible again.
 */
export function useAutoRefresh(
  callback: () => void,
  intervalMs: number,
  enabled = true
): void {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => cbRef.current(), intervalMs);
  }, [intervalMs]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    start();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        cbRef.current(); // immediate fetch on return
        start();
      } else {
        stop();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [intervalMs, enabled, start, stop]);
}
