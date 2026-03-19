// =============================================================================
// POST /api/auth/resend-verification
// Resends the email verification link
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmailVerificationEmail } from "@/lib/email/send";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/api-helpers";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limited = await checkRateLimit(`resend-verify:${ip}`, 60 * 60 * 1000, 3);
  if (limited) return limited;

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: true }); // Always return success to prevent enumeration
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, firstName: true, emailVerified: true, googleId: true },
    });

    // Always return success — prevent enumeration
    if (!user || user.emailVerified || user.googleId) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await db.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: token },
    });

    sendEmailVerificationEmail({ email: user.email, firstName: user.firstName }, token).catch(
      (err) => console.error("[ResendVerification] email failed:", err)
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
