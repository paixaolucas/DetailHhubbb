// =============================================================================
// API HELPERS
// Shared utilities for Next.js API route handlers
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

/**
 * Safely parse JSON from a request body.
 * Returns { data, error } instead of throwing.
 */
export async function parseBody<T = unknown>(
  req: NextRequest
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const data = (await req.json()) as T;
    return { data, error: null };
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { success: false, error: "Corpo da requisição inválido ou malformado." },
        { status: 400 }
      ),
    };
  }
}

/**
 * Extract client IP address from request headers.
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
