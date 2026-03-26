// =============================================================================
// PAYMENT SERVICE
// Stripe subscription management, checkout, and billing portal
// =============================================================================

import { stripe } from "@/lib/stripe/stripe";
import { db } from "@/lib/db";
import { AppError, NotFoundError } from "@/types";
import { commissionService } from "@/services/commission/commission.service";
import { syncMemberCount } from "@/services/community/community.service";
import { sendPlatformMembershipEmail } from "@/lib/email/send";
import Stripe from "stripe";

// =============================================================================
// CREATE STRIPE CUSTOMER
// =============================================================================

export async function getOrCreateStripeCustomer(
  userId: string
): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, firstName: true, lastName: true },
  });

  if (!user) throw new NotFoundError("User not found");

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    metadata: { userId },
  });

  await db.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// =============================================================================
// CREATE STRIPE PRODUCT & PRICE FOR A PLAN
// =============================================================================

export async function syncPlanToStripe(planId: string): Promise<void> {
  const plan = await db.subscriptionPlan.findUnique({
    where: { id: planId },
    include: { community: { select: { name: true, slug: true } } },
  });

  if (!plan) throw new NotFoundError("Plan not found");

  // Create or update Stripe product
  let productId = plan.stripeProductId;

  if (!productId) {
    const product = await stripe.products.create({
      name: `${plan.community.name} — ${plan.name}`,
      metadata: {
        communityId: plan.communityId,
        planId: plan.id,
      },
    });
    productId = product.id;
  }

  // Create Stripe price
  const price = await stripe.prices.create({
    product: productId,
    currency: plan.currency,
    unit_amount: Math.round(Number(plan.price) * 100),
    recurring: {
      interval: plan.interval as Stripe.Price.Recurring.Interval,
      interval_count: plan.intervalCount,
    },
    metadata: { planId: plan.id, communityId: plan.communityId },
  });

  await db.subscriptionPlan.update({
    where: { id: planId },
    data: {
      stripePriceId: price.id,
      stripeProductId: productId,
    },
  });
}

// =============================================================================
// CREATE PLATFORM CHECKOUT SESSION
// =============================================================================

export async function createPlatformCheckoutSession(params: {
  userId: string;
  platformPlanId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  const plan = await db.platformPlan.findUnique({
    where: { id: params.platformPlanId, isActive: true },
  });

  if (!plan) throw new NotFoundError("Platform plan not found");
  if (!plan.stripePriceId) {
    throw new AppError("Payment not configured for this plan", 500, "STRIPE_NOT_CONFIGURED");
  }

  const existing = await db.platformMembership.findUnique({
    where: { userId: params.userId },
    select: { status: true },
  });
  if (existing?.status === "ACTIVE") {
    throw new AppError("Already has an active platform membership", 409, "ALREADY_MEMBER");
  }

  // Resolve influencer that referred this user
  let referredByInfluencerId: string | undefined;
  const userRecord = await db.user.findUnique({
    where: { id: params.userId },
    select: { referredById: true },
  });
  if (userRecord?.referredById) {
    const influencer = await db.influencer.findUnique({
      where: { userId: userRecord.referredById },
      select: { id: true },
    });
    if (influencer) referredByInfluencerId = influencer.id;
  }

  const customerId = await getOrCreateStripeCustomer(params.userId);

  const checkoutMetadata: Record<string, string> = {
    userId: params.userId,
    platformPlanId: plan.id,
    ...(referredByInfluencerId ? { referredByInfluencerId } : {}),
  };

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    mode: "subscription",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    subscription_data: {
      trial_period_days: plan.trialDays > 0 ? plan.trialDays : undefined,
      metadata: checkoutMetadata,
    },
    metadata: checkoutMetadata,
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new AppError("Stripe did not return a checkout URL", 500, "STRIPE_NO_URL");
  }
  return { sessionId: session.id, url: session.url };
}

// =============================================================================
// CREATE CHECKOUT SESSION
// =============================================================================

export async function createCheckoutSession(params: {
  userId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  const plan = await db.subscriptionPlan.findUnique({
    where: { id: params.planId, isActive: true },
    include: {
      community: {
        select: { id: true, name: true, slug: true, isPublished: true },
      },
    },
  });

  if (!plan) throw new NotFoundError("Subscription plan not found");
  if (!plan.community.isPublished) {
    throw new AppError("This community is not available", 400, "NOT_PUBLISHED");
  }
  if (!plan.stripePriceId) {
    throw new AppError(
      "Payment not configured for this plan",
      500,
      "STRIPE_NOT_CONFIGURED"
    );
  }

  // Check for existing active membership
  const existingMembership = await db.communityMembership.findUnique({
    where: {
      userId_communityId: {
        userId: params.userId,
        communityId: plan.communityId,
      },
    },
    select: { status: true },
  });

  if (existingMembership?.status === "ACTIVE") {
    throw new AppError("Already a member of this community", 409, "ALREADY_MEMBER");
  }

  const customerId = await getOrCreateStripeCustomer(params.userId);

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    mode: "subscription",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    subscription_data: {
      trial_period_days: plan.trialDays > 0 ? plan.trialDays : undefined,
      metadata: {
        userId: params.userId,
        communityId: plan.communityId,
        planId: plan.id,
      },
    },
    metadata: {
      userId: params.userId,
      communityId: plan.communityId,
      planId: plan.id,
    },
    allow_promotion_codes: true,
  };

  const session = await stripe.checkout.sessions.create(sessionParams);

  return { sessionId: session.id, url: session.url! };
}

// =============================================================================
// CREATE BILLING PORTAL SESSION
// =============================================================================

export async function createBillingPortalSession(
  userId: string,
  returnUrl: string
): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

// =============================================================================
// HANDLE STRIPE WEBHOOK EVENTS
// =============================================================================

export async function handleWebhookEvent(
  payload: Buffer,
  signature: string
): Promise<void> {
  const { STRIPE_WEBHOOK_SECRET } = await import("@/lib/stripe/stripe");

  if (!STRIPE_WEBHOOK_SECRET) {
    throw new AppError("Webhook secret not configured", 500, "WEBHOOK_NOT_CONFIGURED");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new AppError(
      `Webhook signature verification failed: ${err}`,
      400,
      "WEBHOOK_SIGNATURE_INVALID"
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "invoice.payment_succeeded":
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    default:
      // Unknown event types are silently ignored
      break;
  }
}

// =============================================================================
// CHECKOUT COMPLETED → CREATE MEMBERSHIP
// =============================================================================

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const { userId, communityId, planId, platformPlanId, referredByInfluencerId, isPremiumUpgrade, membershipId } = session.metadata ?? {};

  if (!userId) return;

  // Premium tier upgrade (one-time payment)
  if (isPremiumUpgrade === "true" && membershipId) {
    await db.platformMembership.update({
      where: { id: membershipId },
      data: { tier: "PREMIUM" },
    });
    return;
  }

  // Platform membership checkout
  if (platformPlanId) {
    // Validate that the Stripe customer matches the userId in metadata
    const userRecord = await db.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, firstName: true },
    });
    if (
      userRecord?.stripeCustomerId &&
      session.customer !== userRecord.stripeCustomerId
    ) {
      console.error(`[Webhook] Customer mismatch for userId ${userId}: expected ${userRecord.stripeCustomerId}, got ${session.customer}`);
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    const existingMembership = await db.platformMembership.findUnique({
      where: { userId },
      select: { id: true },
    });

    await db.platformMembership.upsert({
      where: { userId },
      create: {
        userId,
        planId: platformPlanId,
        status: "ACTIVE",
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        ...(referredByInfluencerId ? { referredByInfluencerId } : {}),
      },
      update: {
        status: "ACTIVE",
        planId: platformPlanId,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        // referredByInfluencerId is immutable — never overwrite on reactivations
      },
    });

    // Send welcome email only on first activation (not reactivations)
    if (!existingMembership && userRecord?.email && userRecord?.firstName) {
      const plan = await db.platformPlan.findUnique({
        where: { id: platformPlanId },
        select: { name: true, price: true },
      });
      const amount = plan
        ? `R$${(Number(plan.price) / 100).toFixed(2).replace(".", ",")}`
        : "R$708,00";
      await sendPlatformMembershipEmail(
        { email: userRecord.email, firstName: userRecord.firstName },
        { planName: plan?.name ?? "Assinatura Anual", amount }
      ).catch((err) =>
        console.error("[Email] Failed to send platform welcome email:", err)
      );
    }

    return;
  }

  if (!communityId || !planId) return;

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  await db.$transaction(async (tx) => {
    // Upsert membership (handles re-subscriptions)
    await tx.communityMembership.upsert({
      where: { userId_communityId: { userId, communityId } },
      create: {
        userId,
        communityId,
        planId,
        status: "ACTIVE",
        subscriptionStatus: "ACTIVE",
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialStart: subscription.trial_start
          ? new Date(subscription.trial_start * 1000)
          : null,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
      },
      update: {
        status: "ACTIVE",
        subscriptionStatus: "ACTIVE",
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });
  });

  await syncMemberCount(communityId);
}

// =============================================================================
// INVOICE PAID → RECORD PAYMENT + COMMISSION
// =============================================================================

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );

  const { userId, communityId, platformPlanId } = subscription.metadata ?? {};
  if (!userId) return;

  // Platform membership invoice
  if (platformPlanId) {
    // Idempotency check — Stripe may redeliver the same event
    const existingPayment = await db.payment.findFirst({
      where: { stripeInvoiceId: invoice.id },
      select: { id: true },
    });
    if (existingPayment) return;

    const platformMembership = await db.platformMembership.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!platformMembership) return;

    const amountPaid = invoice.amount_paid / 100;
    const payment = await db.payment.create({
      data: {
        userId,
        platformMembershipId: platformMembership.id,
        amount: amountPaid,
        currency: invoice.currency,
        status: "SUCCEEDED",
        type: "SUBSCRIPTION",
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId:
          typeof invoice.payment_intent === "string" ? invoice.payment_intent : null,
      },
    });
    await db.platformMembership.update({
      where: { id: platformMembership.id },
      data: {
        status: "ACTIVE",
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
    // Comissão de indicação
    const membershipWithReferral = await db.platformMembership.findUnique({
      where: { userId },
      select: { referredByInfluencerId: true },
    });
    if (membershipWithReferral?.referredByInfluencerId) {
      await commissionService.processPlatformReferralCommission(
        payment.id,
        membershipWithReferral.referredByInfluencerId,
        amountPaid
      );
    }
    return;
  }

  if (!communityId) return;

  // Idempotency check — Stripe may redeliver the same event
  const existingPayment = await db.payment.findFirst({
    where: { stripeInvoiceId: invoice.id },
    select: { id: true },
  });
  if (existingPayment) return;

  const membership = await db.communityMembership.findUnique({
    where: { userId_communityId: { userId, communityId } },
    select: { id: true },
  });

  if (!membership) return;

  const amountPaid = invoice.amount_paid / 100;

  const payment = await db.payment.create({
    data: {
      userId,
      membershipId: membership.id,
      amount: amountPaid,
      currency: invoice.currency,
      status: "SUCCEEDED",
      type: "SUBSCRIPTION",
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId:
        typeof invoice.payment_intent === "string"
          ? invoice.payment_intent
          : null,
    },
  });

  // Process commission distribution
  await commissionService.processPaymentCommission(
    payment.id,
    communityId,
    amountPaid
  );

  // Update membership period
  await db.communityMembership.update({
    where: { id: membership.id },
    data: {
      subscriptionStatus: "ACTIVE",
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

// =============================================================================
// INVOICE FAILED
// =============================================================================

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );

  const { userId, communityId } = subscription.metadata ?? {};
  if (!userId || !communityId) return;

  await db.communityMembership.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: { subscriptionStatus: "PAST_DUE", status: "PENDING_PAYMENT" },
  });
}

// =============================================================================
// SUBSCRIPTION UPDATED
// =============================================================================

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const { platformPlanId } = subscription.metadata ?? {};

  if (platformPlanId) {
    const statusMap: Record<string, string> = {
      active: "ACTIVE",
      canceled: "CANCELED",
      past_due: "PAST_DUE",
      trialing: "TRIALING",
    };
    await db.platformMembership.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: (statusMap[subscription.status] ?? "PAST_DUE") as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
    return;
  }

  const membership = await db.communityMembership.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { id: true },
  });

  if (!membership) return;

  await db.communityMembership.update({
    where: { id: membership.id },
    data: {
      subscriptionStatus: subscription.status.toUpperCase() as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

// =============================================================================
// SUBSCRIPTION DELETED → CANCEL MEMBERSHIP
// =============================================================================

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const { platformPlanId } = subscription.metadata ?? {};

  if (platformPlanId) {
    await db.platformMembership.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: "CANCELED", canceledAt: new Date(), cancelAtPeriodEnd: false },
    });
    return;
  }

  const membership = await db.communityMembership.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { id: true, communityId: true },
  });

  if (!membership) return;

  await db.communityMembership.update({
    where: { id: membership.id },
    data: {
      status: "CANCELED",
      subscriptionStatus: "CANCELED",
      canceledAt: new Date(),
      cancelAtPeriodEnd: false,
    },
  });

  await syncMemberCount(membership.communityId);
}
