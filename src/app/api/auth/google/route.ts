// =============================================================================
// GOOGLE OAUTH — REDIRECT TO GOOGLE CONSENT SCREEN
// =============================================================================

import { NextResponse } from "next/server";
import crypto from "crypto";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: Request) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { success: false, error: "Google OAuth not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get("redirect") || "/dashboard";
  const ref = searchParams.get("ref") || "";

  // Generate CSRF state token
  const state = crypto.randomBytes(32).toString("hex");

  // Encode redirect + ref + CSRF in state
  const statePayload = Buffer.from(
    JSON.stringify({ csrf: state, redirect, ref })
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${APP_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state: statePayload,
    prompt: "select_account",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  // Set state cookie for CSRF validation
  const response = NextResponse.redirect(googleAuthUrl);
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
