// =============================================================================
// GET /api/auth/verify-email?token=xxx
// Verifies the email token and marks the user as verified
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email/send";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/verificar-email?error=token_invalido`);
  }

  const user = await db.user.findFirst({
    where: { emailVerifyToken: token },
    select: { id: true, email: true, firstName: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.redirect(`${APP_URL}/verificar-email?error=token_invalido`);
  }

  if (user.emailVerified) {
    return NextResponse.redirect(`${APP_URL}/login?verificado=true`);
  }

  await db.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date(), emailVerifyToken: null },
  });

  // Send welcome email after verification
  sendWelcomeEmail({ email: user.email, firstName: user.firstName }).catch(
    (err) => console.error("[VerifyEmail] welcome email failed:", err)
  );

  return NextResponse.redirect(`${APP_URL}/login?verificado=true`);
}
