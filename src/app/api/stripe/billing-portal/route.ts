export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { createBillingPortalSession } from "@/services/payment/payment.service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export const POST = withAuth(async (req, { session }) => {
  const body = await req.json().catch(() => ({}));
  const returnUrl: string = body.returnUrl ?? `${APP_URL}/dashboard/settings`;

  if (!returnUrl.startsWith(APP_URL)) {
    return NextResponse.json(
      { success: false, error: "Invalid returnUrl" },
      { status: 400 }
    );
  }

  const url = await createBillingPortalSession(session.userId, returnUrl);

  return NextResponse.json({ success: true, data: { url } });
});
