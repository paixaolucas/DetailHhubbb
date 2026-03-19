// =============================================================================
// POST /api/auth/forgot-password
// Generates a stateless JWT reset token (1h expiry) and sends via email
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/api-helpers";
import { RATE_LIMIT } from "@/lib/constants";
import { sendPasswordResetEmail } from "@/lib/email/send";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET env var is required");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limited = await checkRateLimit(`forgot-password:${ip}`, RATE_LIMIT.AUTH.windowMs, RATE_LIMIT.AUTH.max);
  if (limited) return limited;

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Per-email rate limit: 2 per hour to prevent targeted abuse / email DoS
    const emailLimited = await checkRateLimit(`forgot-pwd-email:${email.toLowerCase()}`, 60 * 60 * 1000, 2);
    if (emailLimited) {
      // Return same success message to avoid enumeration
      return NextResponse.json({
        success: true,
        message: "Se o email existir, você receberá um link de recuperação.",
      });
    }

    // Per-IP rate limit: 5 per hour to prevent mass enumeration
    const ipLimited = await checkRateLimit(`forgot-pwd-ip:${ip}`, 60 * 60 * 1000, 5);
    if (ipLimited) {
      return NextResponse.json({
        success: true,
        message: "Se o email existir, você receberá um link de recuperação.",
      });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, firstName: true },
    });

    // Always return 200 to avoid user enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Se o email existir, você receberá um link de recuperação.",
      });
    }

    const resetToken = await new SignJWT({ type: "pw-reset" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(JWT_SECRET);

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password/${resetToken}`;

    // Dev: log to console only — never expose token in response
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Password reset link for ${user.email}: ${resetLink}`);
    }

    // Send reset email via Resend (no-op in dev if RESEND_API_KEY not set)
    await sendPasswordResetEmail(
      { email: user.email, firstName: user.firstName },
      resetToken
    ).catch((err) => console.error("[ForgotPassword] email send failed:", err));

    return NextResponse.json({
      success: true,
      message: "Se o email existir, você receberá um link de recuperação.",
    });
  } catch (error) {
    console.error("[ForgotPassword]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
