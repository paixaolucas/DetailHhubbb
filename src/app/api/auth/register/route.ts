// =============================================================================
// POST /api/auth/register
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/auth";
import { registerUser } from "@/services/auth/auth.service";
import { AppError } from "@/types";
import { ZodError } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/api-helpers";
import { RATE_LIMIT } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limited = await checkRateLimit(`register:${ip}`, RATE_LIMIT.AUTH.windowMs, RATE_LIMIT.AUTH.max);
  if (limited) return limited;

  try {
    const body = await req.json();
    const input = registerSchema.parse(body);

    const result = await registerUser(input);

    // No tokens issued at registration — user must verify email first
    return NextResponse.json(
      {
        success: true,
        data: { user: result.user },
      },
      { status: 201 }
    );
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

    console.error("[Register]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
