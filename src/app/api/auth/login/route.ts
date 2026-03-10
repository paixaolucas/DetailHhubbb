// =============================================================================
// POST /api/auth/login
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { loginUser } from "@/services/auth/auth.service";
import { AppError } from "@/types";
import { ZodError } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/api-helpers";
import { RATE_LIMIT } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limited = checkRateLimit(`login:${ip}`, RATE_LIMIT.AUTH.windowMs, RATE_LIMIT.AUTH.max);
  if (limited) return limited;

  try {
    const body = await req.json();

    // Per-email brute force protection (5 attempts per 15 minutes)
    const emailRaw = body?.email?.toLowerCase?.() ?? "";
    if (emailRaw) {
      const emailAllowed = checkRateLimit(`login-email:${emailRaw}`, 15 * 60 * 1000, 5);
      if (emailAllowed) {
        return NextResponse.json(
          { success: false, error: "Muitas tentativas de login. Aguarde 15 minutos." },
          { status: 429 }
        );
      }
    }

    const input = loginSchema.parse(body);

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const result = await loginUser(input, ipAddress, userAgent);

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: result.user,
          tokens: {
            accessToken: result.tokens.accessToken,
            expiresIn: result.tokens.expiresIn,
          },
        },
      },
      { status: 200 }
    );

    response.cookies.set("detailhub_access_token", result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: result.tokens.expiresIn,
      path: "/",
    });

    response.cookies.set("detailhub_refresh_token", result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 422 }
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("[Login]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
