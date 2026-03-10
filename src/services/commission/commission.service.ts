// =============================================================================
// COMMISSION SERVICE
// Transaction-safe commission calculation and distribution
// =============================================================================

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe/stripe";
import { NotFoundError, AppError } from "@/types";
import { CommissionType } from "@prisma/client";
import type { CommissionCalculation } from "@/types";

// =============================================================================
// CALCULATE COMMISSION
// Supports percentage, flat fee, and tiered models
// =============================================================================

export function calculateCommission(
  grossAmount: number,
  rule: {
    type: CommissionType;
    rate: number;
    flatAmount: number | null;
    tiers: Array<{ upTo: number | null; rate: number }>;
    platformFee: number;
  }
): CommissionCalculation {
  let commissionAmount = 0;

  switch (rule.type) {
    case CommissionType.PERCENTAGE:
      commissionAmount = grossAmount * rule.rate;
      break;

    case CommissionType.FLAT_FEE:
      commissionAmount = Number(rule.flatAmount ?? 0);
      break;

    case CommissionType.TIERED: {
      const tiers = rule.tiers as Array<{
        upTo: number | null;
        rate: number;
      }>;
      const sortedTiers = [...tiers].sort((a, b) =>
        a.upTo === null ? 1 : b.upTo === null ? -1 : a.upTo - b.upTo
      );

      const applicableTier = sortedTiers.find(
        (t) => t.upTo === null || grossAmount <= t.upTo
      );

      commissionAmount = grossAmount * (applicableTier?.rate ?? rule.rate);
      break;
    }
  }

  const platformFeeAmount = commissionAmount * rule.platformFee;
  const netAmount = commissionAmount - platformFeeAmount;

  return {
    grossAmount,
    commissionRate: rule.rate,
    commissionType: rule.type,
    platformFee: rule.platformFee,
    platformFeeAmount: parseFloat(platformFeeAmount.toFixed(2)),
    netAmount: parseFloat(netAmount.toFixed(2)),
  };
}

// =============================================================================
// PROCESS COMMISSION FOR A PAYMENT
// Called atomically after successful payment
// =============================================================================

async function processPaymentCommission(
  paymentId: string,
  communityId: string,
  grossAmount: number
): Promise<void> {
  // Find active commission rule for this community
  const commissionRule = await db.commissionRule.findFirst({
    where: { communityId, isActive: true },
    include: {
      community: {
        include: {
          influencer: {
            select: {
              userId: true,
              stripeAccountId: true,
              id: true,
            },
          },
        },
      },
    },
  });

  if (!commissionRule) return; // No commission rule configured

  const calculation = calculateCommission(grossAmount, {
    type: commissionRule.type,
    rate: Number(commissionRule.rate),
    flatAmount: commissionRule.flatAmount
      ? Number(commissionRule.flatAmount)
      : null,
    tiers: commissionRule.tiers as Array<{ upTo: number | null; rate: number }>,
    platformFee: Number(commissionRule.platformFee),
  });

  const influencer = commissionRule.community.influencer;

  await db.$transaction(async (tx) => {
    // Create commission transaction record
    const commissionTx = await tx.commissionTransaction.create({
      data: {
        paymentId,
        communityId,
        ruleId: commissionRule.id,
        recipientId: influencer.userId,
        grossAmount,
        platformFee: calculation.platformFeeAmount,
        netAmount: calculation.netAmount,
        status: "PENDING",
      },
    });

    // Update influencer earnings
    await tx.influencer.update({
      where: { id: influencer.id },
      data: {
        totalEarnings: { increment: calculation.netAmount },
        pendingPayout: { increment: calculation.netAmount },
      },
    });

    return commissionTx;
  });
}

// =============================================================================
// PAYOUT TO INFLUENCER VIA STRIPE CONNECT
// =============================================================================

async function payoutToInfluencer(
  influencerId: string
): Promise<{ transferred: number; transactionIds: string[] }> {
  const influencer = await db.influencer.findUnique({
    where: { id: influencerId },
    select: {
      id: true,
      userId: true,
      stripeAccountId: true,
      pendingPayout: true,
    },
  });

  if (!influencer) throw new NotFoundError("Influencer not found");

  if (!influencer.stripeAccountId) {
    throw new AppError(
      "Influencer has no connected Stripe account",
      400,
      "NO_STRIPE_ACCOUNT"
    );
  }

  const pendingAmount = Number(influencer.pendingPayout);

  if (pendingAmount < 1) {
    throw new AppError(
      "Insufficient pending payout amount",
      400,
      "INSUFFICIENT_PAYOUT"
    );
  }

  // Get all confirmed, unpaid commission transactions
  const pendingTxns = await db.commissionTransaction.findMany({
    where: {
      recipientId: influencer.userId,
      status: "CONFIRMED",
    },
    select: { id: true, netAmount: true },
  });

  if (pendingTxns.length === 0) {
    throw new AppError("No confirmed transactions to pay out", 400, "NO_TXNS");
  }

  const totalPayout = pendingTxns.reduce(
    (sum, t) => sum + Number(t.netAmount),
    0
  );

  // Create Stripe transfer to connected account
  const transfer = await stripe.transfers.create({
    amount: Math.round(totalPayout * 100),
    currency: "brl",
    destination: influencer.stripeAccountId,
    metadata: {
      influencerId: influencer.id,
      transactionCount: pendingTxns.length.toString(),
    },
  });

  const txnIds = pendingTxns.map((t) => t.id);

  await db.$transaction([
    db.commissionTransaction.updateMany({
      where: { id: { in: txnIds } },
      data: {
        status: "PAID_OUT",
        paidOutAt: new Date(),
        stripeTransferId: transfer.id,
      },
    }),
    db.influencer.update({
      where: { id: influencer.id },
      data: { pendingPayout: { decrement: totalPayout } },
    }),
  ]);

  return { transferred: totalPayout, transactionIds: txnIds };
}

// =============================================================================
// GET COMMISSION SUMMARY FOR INFLUENCER
// =============================================================================

async function getCommissionSummary(userId: string) {
  const influencer = await db.influencer.findUnique({
    where: { userId },
    select: {
      id: true,
      totalEarnings: true,
      pendingPayout: true,
      communities: {
        select: {
          id: true,
          name: true,
          commissionRules: {
            where: { isActive: true },
            select: { rate: true, type: true },
          },
        },
      },
    },
  });

  if (!influencer) throw new NotFoundError("Influencer profile not found");

  const recentTransactions = await db.commissionTransaction.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      payment: { select: { amount: true, createdAt: true } },
      community: { select: { name: true } },
    },
  });

  return {
    totalEarnings: Number(influencer.totalEarnings),
    pendingPayout: Number(influencer.pendingPayout),
    communities: influencer.communities,
    recentTransactions,
  };
}

// =============================================================================
// CONFIRM PENDING COMMISSIONS (admin task)
// =============================================================================

async function confirmPendingCommissions(
  olderThanDays: number = 3
): Promise<number> {
  const cutoffDate = new Date(
    Date.now() - olderThanDays * 24 * 60 * 60 * 1000
  );

  const result = await db.commissionTransaction.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: cutoffDate },
    },
    data: { status: "CONFIRMED" },
  });

  return result.count;
}

export const commissionService = {
  calculateCommission,
  processPaymentCommission,
  payoutToInfluencer,
  getCommissionSummary,
  confirmPendingCommissions,
};
