// =============================================================================
// POST /api/stripe/premium-upgrade
// Creates a Stripe Checkout session to upgrade from STANDARD to PREMIUM tier.
// The webhook (handleCheckoutCompleted) detects `isPremiumUpgrade: "true"` in
// metadata and sets tier = PREMIUM on the existing PlatformMembership.
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe/stripe";
import { PlatformMembershipStatus } from "@prisma/client";

const PREMIUM_PRICE_ANNUAL_BRL = 60000; // R$600 additional / year (in centavos)
const PREMIUM_PRODUCT_NAME = "DetailHub Premium";
const PREMIUM_PRODUCT_DESCRIPTION =
  "Acesso a conteúdo exclusivo premium, suporte prioritário e benefícios especiais";

export const POST = withAuth(async (_req, { session }) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (!appUrl) {
    return NextResponse.json({ success: false, error: "App URL not configured" }, { status: 500 });
  }

  // Must have an active standard membership
  const membership = await db.platformMembership.findUnique({
    where: { userId: session.userId },
    select: { id: true, status: true, tier: true },
  });

  if (!membership || membership.status !== PlatformMembershipStatus.ACTIVE) {
    return NextResponse.json(
      { success: false, error: "Você precisa ter uma assinatura ativa para fazer upgrade" },
      { status: 400 }
    );
  }

  if (membership.tier === "PREMIUM") {
    return NextResponse.json(
      { success: false, error: "Você já tem o plano Premium" },
      { status: 400 }
    );
  }

  // Get or create Stripe customer
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { email: true, firstName: true, lastName: true, stripeCustomerId: true },
  });
  if (!user) return NextResponse.json({ success: false, error: "Usuário não encontrado" }, { status: 404 });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { userId: session.userId },
    });
    customerId = customer.id;
    await db.user.update({ where: { id: session.userId }, data: { stripeCustomerId: customerId } });
  }

  const successUrl = `${appUrl}/dashboard/assinar-premium?payment=success`;
  const cancelUrl = `${appUrl}/dashboard/assinar-premium?payment=canceled`;

  const session_ = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "brl",
          unit_amount: PREMIUM_PRICE_ANNUAL_BRL,
          product_data: {
            name: PREMIUM_PRODUCT_NAME,
            description: PREMIUM_PRODUCT_DESCRIPTION,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: session.userId,
      membershipId: membership.id,
      isPremiumUpgrade: "true",
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return NextResponse.json({ success: true, data: { url: session_.url } });
});
