// =============================================================================
// API CLIENT — fetch wrapper with timeout, auth, and auto-refresh
// =============================================================================

import { STORAGE_KEYS } from "@/lib/constants";
import type { ApiResponse } from "@/types";

const DEFAULT_TIMEOUT_MS = 30_000;

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

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      : null;
  if (!refreshToken) return null;

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newToken = data.data?.accessToken;
    if (newToken) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newToken);
      // Also update refresh token if rotated
      if (data.data?.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.data.refreshToken);
      }
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
}

function redirectToLogin() {
  if (typeof window !== "undefined") {
    // Clear stale tokens
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    window.location.href = "/login";
  }
}

export async function apiClient<T = unknown>(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<ApiResponse<T>> {
  let token =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      : null;

  // Proactively refresh if token is expired or about to expire (within 60s)
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(padded));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp - now < 60) {
          const newToken = await tryRefreshToken();
          if (newToken) token = newToken;
        }
      }
    } catch {
      // Ignore decode errors — will get 401 from server which triggers refresh
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetchWithTimeout(url, { ...options, headers });

  if (res.status === 401) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      const retryRes = await fetchWithTimeout(url, { ...options, headers });
      if (retryRes.status === 401) {
        redirectToLogin();
        return { success: false, error: "Session expired" } as ApiResponse<T>;
      }
      return retryRes.json() as Promise<ApiResponse<T>>;
    }
    redirectToLogin();
    return { success: false, error: "Session expired" } as ApiResponse<T>;
  }

  return res.json() as Promise<ApiResponse<T>>;
}
