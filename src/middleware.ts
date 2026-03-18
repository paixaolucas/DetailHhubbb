// =============================================================================
// NEXT.JS EDGE MIDDLEWARE
// Lightweight existence check only — token expiry is handled at API layer
// This prevents redirect loops caused by expired tokens
// =============================================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/communities",
  "/community",
  "/certificates",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/google",
  "/api/webhooks",
  "/api/stripe/webhook",
  "/api/leaderboard",
  "/api/communities",
  "/api/platform/plan",
];

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/ai-assistant"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

function hasToken(req: NextRequest): boolean {
  // Check cookie OR Authorization header — just existence, NOT expiry
  // Expiry validation happens at the API layer to avoid redirect loops
  const cookie = req.cookies.get("detailhub_access_token")?.value;
  if (cookie && cookie.length > 20) return true;
  // Also allow through if refresh token is present — client-side refresh will handle expired access tokens
  const refreshCookie = req.cookies.get("detailhub_refresh_token")?.value;
  if (refreshCookie && refreshCookie.length > 20) return true;
  const auth = req.headers.get("Authorization");
  if (auth?.startsWith("Bearer ") && auth.length > 27) return true;
  return false;
}

/**
 * Extracts user role from JWT for routing decisions ONLY.
 * Uses manual base64 decode (no signature verification) — intentional for performance at the Edge.
 * Authentication and authorization are enforced in API route middleware (withAuth / withRole).
 */
function extractRole(req: NextRequest): string {
  try {
    const cookie = req.cookies.get("detailhub_access_token")?.value;
    const token = cookie ?? req.headers.get("Authorization")?.slice(7);
    if (!token) return "";
    const parts = token.split(".");
    if (parts.length !== 3) return "";
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(padded));
    return payload.role ?? "";
  } catch {
    return "";
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (isPublic(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (isProtected(pathname)) {
    if (!hasToken(request)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete("detailhub_access_token");
      return res;
    }

    // Role-based route guards (decoded without signature verification — routing only)
    // Full cryptographic verification happens at the API layer
    const role = extractRole(request);

    const SELLER_ONLY = ["/dashboard/meus-produtos", "/dashboard/vendas", "/dashboard/live"];
    if (SELLER_ONLY.some((p) => pathname.startsWith(p)) && role === "COMMUNITY_MEMBER") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const INFLUENCER_ONLY = ["/dashboard/analytics"];
    if (
      INFLUENCER_ONLY.some((p) => pathname.startsWith(p)) &&
      role !== "SUPER_ADMIN" && role !== "INFLUENCER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const ADMIN_ONLY = [
      "/dashboard/admin",
      "/dashboard/usuarios",
      "/dashboard/communities/new",
    ];
    if (ADMIN_ONLY.some((p) => pathname.startsWith(p)) && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains"
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
