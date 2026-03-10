// =============================================================================
// API CLIENT — fetch wrapper with timeout and auth header injection
// =============================================================================

import { STORAGE_KEYS } from "@/lib/constants";
import type { ApiResponse } from "@/types";

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Fetch with a configurable timeout (default 30s).
 * Throws if the request times out or fails.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...fetchOptions, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Authenticated API fetch — injects Bearer token, handles 401 refresh, timeout.
 */
export async function apiClient<T = unknown>(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<ApiResponse<T>> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetchWithTimeout(url, { ...options, headers });

  if (res.status === 401) {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
        : null;

    if (refreshToken) {
      const refreshRes = await fetchWithTimeout("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newToken = refreshData.data?.accessToken;
        if (newToken) {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newToken);
          headers["Authorization"] = `Bearer ${newToken}`;
          const retryRes = await fetchWithTimeout(url, { ...options, headers });
          return retryRes.json() as Promise<ApiResponse<T>>;
        }
      }
    }

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return res.json() as Promise<ApiResponse<T>>;
}
