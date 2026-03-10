// =============================================================================
// POST /api/webhooks/stripe
// Stripe webhook endpoint — MUST be excluded from auth middleware
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { handleWebhookEvent } from "@/services/payment/payment.service";

export const runtime = "nodejs"; // Required for raw body access

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    const payload = await req.arrayBuffer();
    const payloadBuffer = Buffer.from(payload);
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    await handleWebhookEvent(payloadBuffer, signature);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Stripe Webhook]", message);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
