// =============================================================================
// IN-MEMORY RATE LIMITER (sliding window)
// No Redis required for MVP — uses a module-level Map
// =============================================================================

import { NextResponse } from "next/server";

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Clean up old entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    store.forEach((entry, key) => {
      if (entry.timestamps.length === 0 || now - entry.timestamps[0] > 600_000) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => store.delete(key));
  }, 300_000);
}

/**
 * Check rate limit for a given key.
 * @param key      Unique identifier (IP address, userId, etc.)
 * @param windowMs Time window in milliseconds
 * @param max      Maximum requests allowed within the window
 * @returns `null` if within limit, or a 429 NextResponse if exceeded
 */
export function checkRateLimit(
  key: string,
  windowMs: number,
  max: number
): NextResponse | null {
  const now = Date.now();
  const windowStart = now - windowMs;

  const entry = store.get(key) ?? { timestamps: [] };

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= max) {
    store.set(key, entry);
    const retryAfter = Math.ceil(
      (entry.timestamps[0] + windowMs - now) / 1000
    );
    return NextResponse.json(
      {
        success: false,
        error: "Muitas requisições. Tente novamente em alguns instantes.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(max),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return null;
}
