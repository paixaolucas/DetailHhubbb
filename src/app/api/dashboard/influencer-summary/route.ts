// =============================================================================
// GET /api/dashboard/influencer-summary
// Returns all data needed for the influencer dashboard in ONE request:
// analytics summary + communities + recent members + influencer score
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (_req, { session }) => {
  try {
    // Get influencer profile + communities in one query
    const influencer = await db.influencer.findUnique({
      where: { userId: session.userId },
      select: {
        id: true,
        totalEarnings: true,
        pendingPayout: true,
        communities: {
          where: { isPublished: true },
          select: { id: true, name: true, slug: true, logoUrl: true, memberCount: true, primaryColor: true },
          take: 5,
        },
      },
    });

    if (!influencer || influencer.communities.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: { mrr: 0, mrrGrowth: 0, activeMembers: 0, newMembersThisMonth: 0, churnRate: 0, totalRevenue: 0, revenueGrowth: 0 },
          timeSeries: [],
          communities: [],
          members: [],
          influencerScore: 0,
        },
      });
    }

    const communityIds = influencer.communities.map((c) => c.id);
    const primaryCommunityId = communityIds[0];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // All DB queries in parallel
    const [
      statsResult,
      membersResult,
      scoreResult,
      paymentsLast30,
    ] = await Promise.all([
      // Stats transaction
      db.$transaction([
        db.communityMembership.count({ where: { communityId: { in: communityIds }, status: "ACTIVE" } }),
        db.communityMembership.count({ where: { communityId: { in: communityIds }, joinedAt: { gte: startOfMonth } } }),
        db.communityMembership.count({ where: { communityId: { in: communityIds }, status: "CANCELED", canceledAt: { gte: startOfMonth } } }),
        db.payment.aggregate({ where: { status: "SUCCEEDED", type: "SUBSCRIPTION", createdAt: { gte: startOfMonth }, membership: { communityId: { in: communityIds } } }, _sum: { amount: true } }),
        db.payment.aggregate({ where: { status: "SUCCEEDED", type: "SUBSCRIPTION", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, membership: { communityId: { in: communityIds } } }, _sum: { amount: true } }),
        db.payment.aggregate({ where: { status: "SUCCEEDED", membership: { communityId: { in: communityIds } } }, _sum: { amount: true } }),
      ]),
      // Recent members (first community only)
      db.communityMembership.findMany({
        where: { communityId: primaryCommunityId, status: "ACTIVE" },
        orderBy: { joinedAt: "desc" },
        take: 5,
        select: {
          id: true,
          joinedAt: true,
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      // Influencer score
      db.userPoints.findUnique({
        where: { userId_communityId: { userId: session.userId, communityId: primaryCommunityId } },
        select: { points: true, level: true },
      }),
      // Last 30 days payments for time series
      db.payment.findMany({
        where: {
          status: "SUCCEEDED",
          createdAt: { gte: thirtyDaysAgo },
          membership: { communityId: { in: communityIds } },
        },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const [activeMembers, newThisMonth, canceledThisMonth, currentMonthRev, lastMonthRev, totalRev] = statsResult;
    const mrr = Number(currentMonthRev._sum.amount ?? 0);
    const lastMrr = Number(lastMonthRev._sum.amount ?? 0);
    const mrrGrowth = lastMrr > 0 ? ((mrr - lastMrr) / lastMrr) * 100 : 0;
    const churnRate = activeMembers + canceledThisMonth > 0
      ? (canceledThisMonth / (activeMembers + canceledThisMonth)) * 100
      : 0;

    // Build daily time series
    const dayMap = new Map<string, number>();
    for (const p of paymentsLast30) {
      const day = p.createdAt.toISOString().slice(0, 10);
      dayMap.set(day, (dayMap.get(day) ?? 0) + Number(p.amount));
    }
    const timeSeries = Array.from(dayMap.entries()).map(([date, revenue]) => ({ date, revenue }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          mrr,
          mrrGrowth: Math.round(mrrGrowth * 10) / 10,
          activeMembers,
          newMembersThisMonth: newThisMonth,
          churnRate: Math.round(churnRate * 10) / 10,
          totalRevenue: Number(totalRev._sum.amount ?? 0),
          revenueGrowth: mrrGrowth,
        },
        timeSeries,
        communities: influencer.communities,
        members: membersResult,
        influencerScore: scoreResult?.points ?? 0,
      },
    });
  } catch (err) {
    console.error("[InfluencerSummary]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
