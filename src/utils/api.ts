// =============================================================================
// API UTILITY HELPERS
// =============================================================================

import type { ApiResponse } from "@/types";

/**
 * Standardized API response builder
 */
export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data } satisfies ApiResponse<T>, {
    status,
  });
}

export function created<T>(data: T): Response {
  return ok(data, 201);
}

export function error(
  message: string,
  status = 500,
  code?: string
): Response {
  return Response.json(
    { success: false, error: message } satisfies ApiResponse,
    { status }
  );
}

export function validationError(
  details: Array<{ path: string[]; message: string }>
): Response {
  return Response.json(
    {
      success: false,
      error: "Validation failed",
      details,
    },
    { status: 422 }
  );
}

/**
 * Safe JSON parser — returns null on failure
 */
export async function safeParseJson<T = unknown>(
  req: Request
): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Extract pagination params from URL
 */
export function getPaginationParams(url: string): {
  page: number;
  pageSize: number;
} {
  const { searchParams } = new URL(url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20"))
  );
  return { page, pageSize };
}

/**
 * Client-side fetch with auth header injection
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("detailhub_access_token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    // Attempt token refresh using httpOnly cookie
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      if (refreshData.data?.accessToken) {
        localStorage.setItem(
          "detailhub_access_token",
          refreshData.data.accessToken
        );
        headers["Authorization"] = `Bearer ${refreshData.data.accessToken}`;
        return apiFetch(url, { ...options, headers });
      }
    }

    // Redirect to login if refresh fails
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return res.json() as Promise<ApiResponse<T>>;
}
