// =============================================================================
// ANALYTICS SERVICE
// MRR, churn, growth, and revenue tracking
// =============================================================================

import { db } from "@/lib/db";
import { AnalyticsEventType } from "@prisma/client";
import type { AnalyticsSummary, RevenueDataPoint, InfluencerRevenueStats } from "@/types";

// =============================================================================
// TRACK EVENT
// =============================================================================

export async function trackEvent(params: {
  userId?: string;
  communityId?: string;
  type: AnalyticsEventType;
  properties?: Record<string, unknown>;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}): Promise<void> {
  // Fire-and-forget — never block the request
  db.analyticsEvent
    .create({
      data: {
        userId: params.userId,
        communityId: params.communityId,
        type: params.type,
        properties: (params.properties ?? {}) as any,
        sessionId: params.sessionId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        referrer: params.referrer,
      },
    })
    .catch((err) => {
      console.error("[Analytics] Failed to track event:", err);
    });
}

// =============================================================================
// PLATFORM-WIDE SUMMARY (SUPER ADMIN)
// =============================================================================

export async function getPlatformSummary(): Promise<AnalyticsSummary> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    activeMemberships,
    newThisMonth,
    newLastMonth,
    canceledThisMonth,
    currentMonthRevenue,
    lastMonthRevenue,
    totalRevenue,
  ] = await db.$transaction([
    // Active memberships
    db.communityMembership.count({ where: { status: "ACTIVE" } }),

    // New this month
    db.communityMembership.count({
      where: { joinedAt: { gte: startOfMonth } },
    }),

    // New last month
    db.communityMembership.count({
      where: {
        joinedAt: { gte: startOfLastMonth, lt: startOfMonth },
      },
    }),

    // Canceled this month
    db.communityMembership.count({
      where: {
        status: "CANCELED",
        canceledAt: { gte: startOfMonth },
      },
    }),

    // Revenue this month
    db.payment.aggregate({
      where: {
        status: "SUCCEEDED",
        type: "SUBSCRIPTION",
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),

    // Revenue last month
    db.payment.aggregate({
      where: {
        status: "SUCCEEDED",
        type: "SUBSCRIPTION",
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true },
    }),

    // Total revenue all time
    db.payment.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amount: true },
    }),
  ]);

  const mrr = Number(currentMonthRevenue._sum.amount ?? 0);
  const lastMrr = Number(lastMonthRevenue._sum.amount ?? 0);
  const mrrGrowth =
    lastMrr > 0 ? ((mrr - lastMrr) / lastMrr) * 100 : 0;

  // Churn rate = canceled / (active + canceled) * 100
  const churnRate =
    activeMemberships + canceledThisMonth > 0
      ? (canceledThisMonth / (activeMemberships + canceledThisMonth)) * 100
      : 0;

  const revenueGrowth =
    lastMrr > 0 ? ((mrr - lastMrr) / lastMrr) * 100 : 0;

  return {
    mrr,
    mrrGrowth: parseFloat(mrrGrowth.toFixed(2)),
    activeMembers: activeMemberships,
    newMembersThisMonth: newThisMonth,
    churnRate: parseFloat(churnRate.toFixed(2)),
    totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
  };
}

// =============================================================================
// COMMUNITY-SPECIFIC ANALYTICS
// =============================================================================

export async function getCommunityAnalytics(communityId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last12Months = new Date(
    now.getFullYear() - 1,
    now.getMonth(),
    now.getDate()
  );

  const [
    activeMembers,
    newMembersMonth,
    canceledMonth,
    monthRevenue,
    totalRevenue,
    topContent,
  ] = await db.$transaction([
    db.communityMembership.count({
      where: { communityId, status: "ACTIVE" },
    }),

    db.communityMembership.count({
      where: { communityId, joinedAt: { gte: startOfMonth } },
    }),

    db.communityMembership.count({
      where: {
        communityId,
        status: "CANCELED",
        canceledAt: { gte: startOfMonth },
      },
    }),

    db.payment.aggregate({
      where: {
        status: "SUCCEEDED",
        type: "SUBSCRIPTION",
        createdAt: { gte: startOfMonth },
        membership: { communityId },
      },
      _sum: { amount: true },
    }),

    db.payment.aggregate({
      where: {
        status: "SUCCEEDED",
        membership: { communityId },
      },
      _sum: { amount: true },
    }),

    db.contentLesson.findMany({
      where: { module: { communityId } },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        viewCount: true,
        completionCount: true,
        type: true,
      },
    }),
  ]);

  const churnRate =
    activeMembers + canceledMonth > 0
      ? (canceledMonth / (activeMembers + canceledMonth)) * 100
      : 0;

  return {
    activeMembers,
    newMembersMonth,
    canceledMonth,
    mrr: Number(monthRevenue._sum.amount ?? 0),
    totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    churnRate: parseFloat(churnRate.toFixed(2)),
    topContent,
  };
}

// =============================================================================
// REVENUE TIME SERIES (30 days)
// =============================================================================

export async function getRevenueTimeSeries(
  communityId?: string,
  days: number = 30
): Promise<RevenueDataPoint[]> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const payments = await db.payment.findMany({
    where: {
      status: "SUCCEEDED",
      type: "SUBSCRIPTION",
      createdAt: { gte: startDate },
      ...(communityId && { membership: { communityId } }),
    },
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const byDay: Record<string, { revenue: number }> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    byDay[key] = { revenue: 0 };
  }

  for (const p of payments) {
    const key = p.createdAt.toISOString().split("T")[0];
    if (byDay[key]) {
      byDay[key].revenue += Number(p.amount);
    }
  }

  const newSubs = await db.communityMembership.findMany({
    where: {
      joinedAt: { gte: startDate },
      ...(communityId && { communityId }),
    },
    select: { joinedAt: true },
  });

  const cancelations = await db.communityMembership.findMany({
    where: {
      canceledAt: { gte: startDate },
      ...(communityId && { communityId }),
    },
    select: { canceledAt: true },
  });

  const newSubsByDay: Record<string, number> = {};
  const cancelByDay: Record<string, number> = {};

  for (const s of newSubs) {
    const key = s.joinedAt.toISOString().split("T")[0];
    newSubsByDay[key] = (newSubsByDay[key] ?? 0) + 1;
  }

  for (const c of cancelations) {
    if (!c.canceledAt) continue;
    const key = c.canceledAt.toISOString().split("T")[0];
    cancelByDay[key] = (cancelByDay[key] ?? 0) + 1;
  }

  return Object.entries(byDay).map(([date, data]) => ({
    date,
    revenue: parseFloat(data.revenue.toFixed(2)),
    newSubscriptions: newSubsByDay[date] ?? 0,
    cancellations: cancelByDay[date] ?? 0,
  }));
}

// =============================================================================
// INFLUENCER REVENUE STATS (SUPER ADMIN)
// =============================================================================

export async function getInfluencerRevenueStats(): Promise<
  InfluencerRevenueStats[]
> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const influencers = await db.influencer.findMany({
    include: {
      user: { select: { firstName: true, lastName: true } },
      communities: {
        include: {
          _count: { select: { memberships: { where: { status: "ACTIVE" } } } },
          commissionRules: {
            where: { isActive: true },
            select: { rate: true },
            take: 1,
          },
        },
      },
    },
  });

  const result: InfluencerRevenueStats[] = [];

  for (const inf of influencers) {
    for (const community of inf.communities) {
      const mrrResult = await db.payment.aggregate({
        where: {
          status: "SUCCEEDED",
          type: "SUBSCRIPTION",
          createdAt: { gte: startOfMonth },
          membership: { communityId: community.id },
        },
        _sum: { amount: true },
      });

      result.push({
        influencerId: inf.id,
        displayName: inf.displayName,
        communityName: community.name,
        mrr: Number(mrrResult._sum.amount ?? 0),
        totalMembers: community._count.memberships,
        totalEarnings: Number(inf.totalEarnings),
        commissionRate: Number(community.commissionRules[0]?.rate ?? 0),
      });
    }
  }

  return result.sort((a, b) => b.mrr - a.mrr);
}

export const analyticsService = {
  trackEvent,
  getPlatformSummary,
  getCommunityAnalytics,
  getRevenueTimeSeries,
  getInfluencerRevenueStats,
};
