export const dynamic = "force-dynamic";

// =============================================================================
// POST /api/stripe/checkout
// Creates a Stripe checkout session for community subscription
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { createCheckoutSession } from "@/services/payment/payment.service";
import { AppError } from "@/types";
import { z } from "zod";
import { trackEvent } from "@/services/analytics/analytics.service";
import { checkRateLimit } from "@/lib/rate-limit";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const checkoutSchema = z.object({
  planId: z.string().cuid(),
  successUrl: z
    .string()
    .url()
    .refine((url) => url.startsWith(appUrl), {
      message: "successUrl must be on the same domain",
    })
    .optional(),
  cancelUrl: z
    .string()
    .url()
    .refine((url) => url.startsWith(appUrl), {
      message: "cancelUrl must be on the same domain",
    })
    .optional(),
});

export const POST = withAuth(async (req, { session }) => {
  const rl = await checkRateLimit(`checkout:${session.userId}`, 60_000, 5);
  if (rl) return rl;
  try {
    const body = await req.json();
    const { planId, successUrl, cancelUrl } = checkoutSchema.parse(body);

    const result = await createCheckoutSession({
      userId: session.userId,
      planId,
      successUrl: successUrl ?? `${appUrl}/dashboard?payment=success`,
      cancelUrl: cancelUrl ?? `${appUrl}/dashboard?payment=canceled`,
    });

    trackEvent({ userId: session.userId, type: "CHECKOUT_INITIATED", properties: { planId } });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("[Checkout]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
