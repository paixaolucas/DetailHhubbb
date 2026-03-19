import { useEffect, useRef } from "react";

/**
 * Runs `callback` every `intervalMs` milliseconds.
 * Uses a ref so changing `callback` doesn't restart the interval.
 */
export function useAutoRefresh(
  callback: () => void,
  intervalMs: number,
  enabled = true
): void {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => cbRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
