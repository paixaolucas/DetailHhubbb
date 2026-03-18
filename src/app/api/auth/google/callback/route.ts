// =============================================================================
// GOOGLE OAUTH CALLBACK — Exchange code for tokens, login or register user
// =============================================================================

import { NextResponse } from "next/server";
import { loginOrRegisterWithGoogle } from "@/services/auth/auth.service";
import { getAccessTokenExpiry } from "@/lib/auth/jwt";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface GoogleUserInfo {
  sub: string; // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name?: string;
  picture?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // Handle Google errors (user denied, etc.)
  if (errorParam) {
    return NextResponse.redirect(
      `${APP_URL}/login?error=${encodeURIComponent("Login com Google cancelado")}`
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `${APP_URL}/login?error=${encodeURIComponent("Parâmetros inválidos")}`
    );
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      `${APP_URL}/login?error=${encodeURIComponent("Google OAuth não configurado")}`
    );
  }

  // Validate CSRF state
  let redirectPath = "/dashboard";
  let refCode: string | undefined;

  try {
    const statePayload = JSON.parse(
      Buffer.from(stateParam, "base64url").toString("utf-8")
    );

    const cookieHeader = request.headers.get("cookie") || "";
    const stateCookie = cookieHeader
      .split("; ")
      .find((c) => c.startsWith("google_oauth_state="))
      ?.split("=")[1];

    if (!stateCookie || stateCookie !== statePayload.csrf) {
      return NextResponse.redirect(
        `${APP_URL}/login?error=${encodeURIComponent("Sessão expirada. Tente novamente.")}`
      );
    }

    redirectPath = statePayload.redirect || "/dashboard";
    refCode = statePayload.ref || undefined;
  } catch {
    return NextResponse.redirect(
      `${APP_URL}/login?error=${encodeURIComponent("Estado inválido")}`
    );
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("[Google OAuth] Token exchange failed:", err);
      return NextResponse.redirect(
        `${APP_URL}/login?error=${encodeURIComponent("Falha ao autenticar com Google")}`
      );
    }

    const tokenData: GoogleTokenResponse = await tokenRes.json();

    // Fetch user info
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );

    if (!userInfoRes.ok) {
      return NextResponse.redirect(
        `${APP_URL}/login?error=${encodeURIComponent("Falha ao obter dados do Google")}`
      );
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(
        `${APP_URL}/login?error=${encodeURIComponent("Conta Google sem email")}`
      );
    }

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded?.split(",")[0]?.trim() || "unknown";

    // Login or register user
    const result = await loginOrRegisterWithGoogle(
      {
        googleId: googleUser.sub,
        email: googleUser.email,
        firstName: googleUser.given_name || googleUser.name?.split(" ")[0] || "User",
        lastName: googleUser.family_name || googleUser.name?.split(" ").slice(1).join(" ") || "",
        avatarUrl: googleUser.picture,
        emailVerified: googleUser.email_verified,
      },
      ipAddress,
      refCode
    );

    // Build redirect URL with tokens in hash (not query params for security)
    const callbackUrl = new URL("/api/auth/google/complete", APP_URL);
    callbackUrl.searchParams.set("redirect", redirectPath);

    const response = NextResponse.redirect(callbackUrl.toString());

    // Set httpOnly cookies
    const isProduction = process.env.NODE_ENV === "production";
    const expiresIn = getAccessTokenExpiry();

    response.cookies.set("detailhub_access_token", result.tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: expiresIn,
      path: "/",
    });

    response.cookies.set("detailhub_refresh_token", result.tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    // Set non-httpOnly cookie with user data for client-side hydration
    const userData = JSON.stringify({
      userId: result.user.userId,
      email: result.user.email,
      role: result.user.role,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      avatarUrl: result.user.avatarUrl,
      accessToken: result.tokens.accessToken,
    });

    response.cookies.set("detailhub_google_auth", userData, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 60, // 1 minute — just for client to read
      path: "/",
    });

    // Clear the CSRF cookie
    response.cookies.delete("google_oauth_state");

    return response;
  } catch (error) {
    console.error("[Google OAuth] Error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao autenticar com Google";
    return NextResponse.redirect(
      `${APP_URL}/login?error=${encodeURIComponent(message)}`
    );
  }
}
