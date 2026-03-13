// =============================================================================
// GET /api/influencers/me/financeiro
// Financial dashboard data for INFLUENCER_ADMIN.
// Returns member stats, projected commission, ranking and monthly history.
// Separates annual (à vista) and monthly members for accurate projections.
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

const COMMISSION_RATE = 0.35; // 35% per document

export const GET = withRole(UserRole.INFLUENCER_ADMIN)(async (_req, { session }) => {
  const influencer = await db.influencer.findUnique({
    where: { userId: session.userId },
    select: { id: true, totalEarnings: true, pendingPayout: true },
  });

  if (!influencer) {
    return NextResponse.json(
      { success: false, error: "Perfil de influenciador não encontrado" },
      { status: 404 }
    );
  }

  const influencerId = influencer.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // ── Fetch active plan for price reference ────────────────────────────────────
  const activePlan = await db.platformPlan.findFirst({
    where: { isActive: true },
    orderBy: { price: "asc" },
    select: { price: true, interval: true, intervalCount: true },
  });

  // R$837/ano ÷ 12 = R$69.75/mês — fallback se não houver plano no banco
  const annualPrice = activePlan?.interval === "year"
    ? Number(activePlan.price)
    : activePlan
      ? Number(activePlan.price) * (12 / (activePlan.intervalCount ?? 1))
      : 837;

  const monthlyEquivalent = activePlan?.interval === "month"
    ? Number(activePlan.price) / (activePlan.intervalCount ?? 1)
    : annualPrice / 12;

  // ── Member counts ───────────────────────────────────────────────────────────
  const [totalReferred, newThisMonth, canceledThisMonth] = await Promise.all([
    db.platformMembership.count({
      where: { referredByInfluencerId: influencerId },
    }),
    db.platformMembership.count({
      where: {
        referredByInfluencerId: influencerId,
        joinedAt: { gte: startOfMonth },
      },
    }),
    db.platformMembership.count({
      where: {
        referredByInfluencerId: influencerId,
        status: "CANCELED",
        canceledAt: { gte: startOfMonth },
      },
    }),
  ]);

  // ── Active members with plan — to split annual vs monthly ──────────────────
  const activeMembershipsWithPlan = await db.platformMembership.findMany({
    where: { referredByInfluencerId: influencerId, status: "ACTIVE" },
    select: {
      plan: { select: { interval: true, intervalCount: true, price: true } },
    },
  });

  const activeReferred = activeMembershipsWithPlan.length;

  const annualMembersCount = activeMembershipsWithPlan.filter(
    (m) => m.plan.interval === "year"
  ).length;

  const monthlyMembersCount = activeMembershipsWithPlan.filter(
    (m) => m.plan.interval === "month"
  ).length;

  // ── Projected commission ────────────────────────────────────────────────────
  // Monthly: recorrente todo mês (apenas membros mensais)
  // Annual:  chega de uma vez na renovação (1× por ano)
  const projectedMonthlyCommission = monthlyMembersCount * monthlyEquivalent * COMMISSION_RATE;
  const annualRenewalCommission = annualMembersCount * annualPrice * COMMISSION_RATE;

  // ── Retention & churn ───────────────────────────────────────────────────────
  const retentionRate =
    totalReferred > 0 ? (activeReferred / totalReferred) * 100 : 0;
  const baseForChurn = activeReferred + canceledThisMonth;
  const churnRate = baseForChurn > 0 ? (canceledThisMonth / baseForChurn) * 100 : 0;

  // ── Rank ────────────────────────────────────────────────────────────────────
  const allInfluencerCounts = await db.platformMembership.groupBy({
    by: ["referredByInfluencerId"],
    where: { status: "ACTIVE", referredByInfluencerId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const totalInfluencers = allInfluencerCounts.length;
  const rankIndex = allInfluencerCounts.findIndex(
    (r) => r.referredByInfluencerId === influencerId
  );
  const rank = rankIndex >= 0 ? rankIndex + 1 : totalInfluencers + 1;

  // ── Monthly history (last 6 months) ────────────────────────────────────────
  // Commission is calculated per actual payment type:
  //   annual member → R$ annualPrice × 35% (one-time on join)
  //   monthly member → R$ monthlyEquivalent × 35% (each month)
  const monthlyHistory: { month: string; newMembers: number; commission: number; annualNew: number; monthlyNew: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const label = start.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

    const newWithPlans = await db.platformMembership.findMany({
      where: {
        referredByInfluencerId: influencerId,
        joinedAt: { gte: start, lte: end },
      },
      select: {
        plan: { select: { interval: true, intervalCount: true, price: true } },
      },
    });

    let commission = 0;
    let annualNew = 0;
    let monthlyNew = 0;

    for (const m of newWithPlans) {
      const price = Number(m.plan.price);
      if (m.plan.interval === "year") {
        // Paid in full: commission on the full annual amount
        commission += price * COMMISSION_RATE;
        annualNew++;
      } else {
        // Monthly: commission on the monthly charge
        commission += (price / (m.plan.intervalCount ?? 1)) * COMMISSION_RATE;
        monthlyNew++;
      }
    }

    monthlyHistory.push({
      month: label,
      newMembers: newWithPlans.length,
      commission: parseFloat(commission.toFixed(2)),
      annualNew,
      monthlyNew,
    });
  }

  // ── Recent payments split by type (for Pagamentos tab) ─────────────────────
  const recentPaymentsRaw = await db.payment.findMany({
    where: {
      status: "SUCCEEDED",
      platformMembership: { referredByInfluencerId: influencerId },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      amount: true,
      createdAt: true,
      platformMembership: {
        select: {
          plan: { select: { interval: true, intervalCount: true, price: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  const recentPayments = recentPaymentsRaw.map((p) => {
    const interval = p.platformMembership?.plan.interval ?? "year";
    const planPrice = Number(p.platformMembership?.plan.price ?? annualPrice);
    const intervalCount = p.platformMembership?.plan.intervalCount ?? 1;
    const isAnnual = interval === "year";
    // Commission on the actual amount paid
    const commission = Number(p.amount) * COMMISSION_RATE;
    return {
      id: p.id,
      memberName: p.platformMembership?.user
        ? `${p.platformMembership.user.firstName} ${p.platformMembership.user.lastName}`
        : "Membro",
      type: isAnnual ? "annual" : "monthly",
      typeLabel: isAnnual ? "Anual (à vista)" : "Mensal (recorrente)",
      amount: Number(p.amount),
      commission: parseFloat(commission.toFixed(2)),
      createdAt: p.createdAt.toISOString(),
    };
  });

  // ── Badge progress ──────────────────────────────────────────────────────────
  const BADGES = [
    { name: "Bronze", threshold: 50, color: "#cd7f32" },
    { name: "Prata", threshold: 200, color: "#a8a9ad" },
    { name: "Ouro", threshold: 500, color: "#ffd700" },
  ];

  let currentBadge: (typeof BADGES)[0] | null = null;
  let nextBadge: (typeof BADGES)[0] | null = null;

  for (const badge of BADGES) {
    if (activeReferred >= badge.threshold) {
      currentBadge = badge;
    } else if (!nextBadge) {
      nextBadge = badge;
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        activeReferred,
        totalReferred,
        newThisMonth,
        annualMembersCount,
        monthlyMembersCount,
        projectedMonthlyCommission: parseFloat(projectedMonthlyCommission.toFixed(2)),
        annualRenewalCommission: parseFloat(annualRenewalCommission.toFixed(2)),
        totalEarnings: Number(influencer.totalEarnings),
        pendingPayout: Number(influencer.pendingPayout),
        retentionRate: parseFloat(retentionRate.toFixed(1)),
        churnRate: parseFloat(churnRate.toFixed(1)),
        rank,
        totalInfluencers,
        monthlyTicket: parseFloat(monthlyEquivalent.toFixed(2)),
        annualTicket: parseFloat(annualPrice.toFixed(2)),
      },
      monthlyHistory,
      recentPayments,
      badge: {
        current: currentBadge,
        next: nextBadge
          ? {
              ...nextBadge,
              membersNeeded: nextBadge.threshold - activeReferred,
              progress: Math.round((activeReferred / nextBadge.threshold) * 100),
            }
          : null,
      },
    },
  });
});
