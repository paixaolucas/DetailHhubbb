import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { createPlatformCheckoutSession } from "@/services/payment/payment.service";
import { AppError } from "@/types";

export const POST = withAuth(async (req, { session }) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (!appUrl) {
    return NextResponse.json(
      { success: false, error: "App URL not configured" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { platformPlanId } = body;

  if (!platformPlanId || typeof platformPlanId !== "string") {
    return NextResponse.json(
      { success: false, error: "platformPlanId required" },
      { status: 400 }
    );
  }

  const successUrl = `${appUrl}/dashboard?payment=success`;
  const cancelUrl = `${appUrl}/dashboard/assinar?payment=canceled`;

  // Validate URLs to prevent open redirect
  if (!successUrl.startsWith(appUrl) || !cancelUrl.startsWith(appUrl)) {
    return NextResponse.json({ success: false, error: "Invalid URL" }, { status: 400 });
  }

  try {
    const result = await createPlatformCheckoutSession({
      userId: session.userId,
      platformPlanId,
      successUrl,
      cancelUrl,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
