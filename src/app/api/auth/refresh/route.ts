// =============================================================================
// POST /api/auth/refresh
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { refreshAccessToken } from "@/services/auth/auth.service";
import { AppError } from "@/types";

export async function POST(req: NextRequest) {
  try {
    let bodyRefreshToken: string | undefined;
    try {
      const body = await req.json();
      bodyRefreshToken = body.refreshToken;
    } catch {
      // Body may be empty when token is sent via cookie — that's fine
    }
    const cookieToken = req.cookies.get("detailhub_refresh_token")?.value;
    const refreshToken = bodyRefreshToken ?? cookieToken;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "Refresh token required" },
        { status: 401 }
      );
    }

    const tokens = await refreshAccessToken(refreshToken);

    const response = NextResponse.json(
      { success: true, data: tokens },
      { status: 200 }
    );

    response.cookies.set("detailhub_access_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expiresIn,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
