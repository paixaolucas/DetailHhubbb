// =============================================================================
// NEXT.JS EDGE MIDDLEWARE
// Lightweight JWT check — no Node.js APIs, runs in Edge runtime
// Full cryptographic verification is done at the API route level
// =============================================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/communities",
  "/community",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/webhooks",
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

function extractToken(req: NextRequest): string | null {
  const cookie = req.cookies.get("detailhub_access_token")?.value;
  if (cookie) return cookie;
  const auth = req.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(padded));
    if (typeof payload.exp !== "number") return false;
    return Math.floor(Date.now() / 1000) >= payload.exp;
  } catch {
    return true;
  }
}

function extractRole(token: string): string {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return "COMMUNITY_MEMBER";
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(padded));
    return payload.role ?? "COMMUNITY_MEMBER";
  } catch {
    return "COMMUNITY_MEMBER";
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  if (isProtected(pathname)) {
    const token = extractToken(request);

    if (!token || isTokenExpired(token)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete("detailhub_access_token");
      return res;
    }

    // Role-based route guards (decoded without signature verification — routing only)
    const role = extractRole(token);
    const isSeller =
      role === "INFLUENCER_ADMIN" ||
      role === "MARKETPLACE_PARTNER" ||
      role === "SUPER_ADMIN";

    const SELLER_ONLY = ["/dashboard/meus-produtos", "/dashboard/vendas", "/dashboard/live"];
    if (SELLER_ONLY.some((p) => pathname.startsWith(p)) && !isSeller) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const ADMIN_ONLY = ["/dashboard/admin", "/dashboard/usuarios", "/dashboard/communities/new"];
    if (ADMIN_ONLY.some((p) => pathname.startsWith(p)) && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
