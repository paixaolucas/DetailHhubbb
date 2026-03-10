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
    const input = loginSchema.parse(body);

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const result = await loginUser(input, ipAddress, userAgent);

    const response = NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );

    response.cookies.set("detailhub_access_token", result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: result.tokens.expiresIn,
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
