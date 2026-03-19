// =============================================================================
// RATE LIMITER — Upstash Redis em produção, in-memory fallback em dev
// =============================================================================

import { NextResponse } from "next/server";

const hasUpstash =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

// --- In-memory fallback (desenvolvimento local sem Redis) ---

const memStore = new Map<string, number[]>();

function checkMemory(
  key: string,
  windowMs: number,
  max: number
): NextResponse | null {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (memStore.get(key) ?? []).filter(
    (ts) => ts > windowStart
  );

  if (timestamps.length >= max) {
    const retryAfter = Math.ceil(
      (timestamps[0] + windowMs - now) / 1000
    );
    return NextResponse.json(
      {
        success: false,
        error: "Muitas requisições. Tente novamente em alguns instantes.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, retryAfter)),
          "X-RateLimit-Limit": String(max),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  timestamps.push(now);
  memStore.set(key, timestamps);
  return null;
}

// --- Upstash Redis (produção) ---

async function checkUpstash(
  key: string,
  windowMs: number,
  max: number
): Promise<NextResponse | null> {
  const { Redis } = await import("@upstash/redis");
  const { Ratelimit } = await import("@upstash/ratelimit");

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const windowSec = Math.ceil(windowMs / 1000);
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
    prefix: "@rl",
    analytics: false,
  });

  const { success, limit, remaining, reset } = await limiter.limit(key);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      {
        success: false,
        error: "Muitas requisições. Tente novamente em alguns instantes.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, retryAfter)),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    );
  }

  return null;
}

// --- API pública ---

export async function checkRateLimit(
  key: string,
  windowMs: number,
  max: number
): Promise<NextResponse | null> {
  if (hasUpstash) {
    return checkUpstash(key, windowMs, max);
  }
  return checkMemory(key, windowMs, max);
}
