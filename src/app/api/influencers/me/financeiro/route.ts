// =============================================================================
// GET /api/influencers/me/financeiro
// Financial dashboard data for INFLUENCER_ADMIN.
// Returns member stats, projected commission, ranking and monthly history.
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

  // ── Member counts ───────────────────────────────────────────────────────────
  const [totalReferred, activeReferred, newThisMonth, canceledThisMonth] =
    await Promise.all([
      db.platformMembership.count({
        where: { referredByInfluencerId: influencerId },
      }),
      db.platformMembership.count({
        where: { referredByInfluencerId: influencerId, status: "ACTIVE" },
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

  // ── Projected commission ────────────────────────────────────────────────────
  // Use the most recent active platform plan price as the reference ticket
  const activePlan = await db.platformPlan.findFirst({
    where: { isActive: true },
    orderBy: { price: "asc" },
    select: { price: true, interval: true, intervalCount: true },
  });

  let monthlyTicket = 79; // fallback from document (R$79/month reference)
  if (activePlan) {
    const price = Number(activePlan.price);
    if (activePlan.interval === "year") {
      monthlyTicket = price / 12;
    } else if (activePlan.interval === "month") {
      monthlyTicket = price / activePlan.intervalCount;
    }
  }

  const projectedMonthlyCommission = activeReferred * monthlyTicket * COMMISSION_RATE;

  // ── Retention rate ──────────────────────────────────────────────────────────
  const retentionRate =
    totalReferred > 0 ? (activeReferred / totalReferred) * 100 : 0;

  // ── Churn rate (this month) ─────────────────────────────────────────────────
  const baseForChurn = activeReferred + canceledThisMonth;
  const churnRate = baseForChurn > 0 ? (canceledThisMonth / baseForChurn) * 100 : 0;

  // ── Rank among all influencers (by active referred members) ─────────────────
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
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyHistory: { month: string; newMembers: number; commission: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const label = start.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

    const newInMonth = await db.platformMembership.count({
      where: {
        referredByInfluencerId: influencerId,
        joinedAt: { gte: start, lte: end },
      },
    });

    monthlyHistory.push({
      month: label,
      newMembers: newInMonth,
      commission: parseFloat((newInMonth * monthlyTicket * COMMISSION_RATE).toFixed(2)),
    });
  }

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
        projectedMonthlyCommission: parseFloat(projectedMonthlyCommission.toFixed(2)),
        totalEarnings: Number(influencer.totalEarnings),
        pendingPayout: Number(influencer.pendingPayout),
        retentionRate: parseFloat(retentionRate.toFixed(1)),
        churnRate: parseFloat(churnRate.toFixed(1)),
        rank,
        totalInfluencers,
        monthlyTicket: parseFloat(monthlyTicket.toFixed(2)),
      },
      monthlyHistory,
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
