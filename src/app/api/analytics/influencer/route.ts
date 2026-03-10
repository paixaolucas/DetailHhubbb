// =============================================================================
// GET /api/analytics/influencer — Influencer's own analytics
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { analyticsService } from "@/services/analytics/analytics.service";
import { db } from "@/lib/db";

export const GET = withAuth(async (req, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get("days") ?? "30")));

    // Get the influencer record
    const influencer = await db.influencer.findUnique({
      where: { userId: session.userId },
      select: {
        id: true,
        displayName: true,
        totalEarnings: true,
        pendingPayout: true,
        communities: {
          select: { id: true, name: true },
        },
      },
    });

    if (!influencer) {
      return NextResponse.json(
        { success: false, error: "Influencer profile not found" },
        { status: 404 }
      );
    }

    const communityIds = influencer.communities.map((c) => c.id);

    if (communityIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            mrr: 0,
            mrrGrowth: 0,
            activeMembers: 0,
            newMembersThisMonth: 0,
            churnRate: 0,
            totalRevenue: 0,
            revenueGrowth: 0,
          },
          timeSeries: [],
          communities: [],
        },
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      activeMembers,
      newThisMonth,
      canceledThisMonth,
      currentMonthRevenue,
      lastMonthRevenue,
      totalRevenue,
    ] = await db.$transaction([
      db.communityMembership.count({
        where: { communityId: { in: communityIds }, status: "ACTIVE" },
      }),
      db.communityMembership.count({
        where: {
          communityId: { in: communityIds },
          joinedAt: { gte: startOfMonth },
        },
      }),
      db.communityMembership.count({
        where: {
          communityId: { in: communityIds },
          status: "CANCELED",
          canceledAt: { gte: startOfMonth },
        },
      }),
      db.payment.aggregate({
        where: {
          status: "SUCCEEDED",
          type: "SUBSCRIPTION",
          createdAt: { gte: startOfMonth },
          membership: { communityId: { in: communityIds } },
        },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: {
          status: "SUCCEEDED",
          type: "SUBSCRIPTION",
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          membership: { communityId: { in: communityIds } },
        },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: {
          status: "SUCCEEDED",
          membership: { communityId: { in: communityIds } },
        },
        _sum: { amount: true },
      }),
    ]);

    const mrr = Number(currentMonthRevenue._sum.amount ?? 0);
    const lastMrr = Number(lastMonthRevenue._sum.amount ?? 0);
    const mrrGrowth = lastMrr > 0 ? ((mrr - lastMrr) / lastMrr) * 100 : 0;
    const churnRate =
      activeMembers + canceledThisMonth > 0
        ? (canceledThisMonth / (activeMembers + canceledThisMonth)) * 100
        : 0;

    // Time series for all influencer communities
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const payments = await db.payment.findMany({
      where: {
        status: "SUCCEEDED",
        type: "SUBSCRIPTION",
        createdAt: { gte: startDate },
        membership: { communityId: { in: communityIds } },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const byDay: Record<string, { revenue: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      byDay[key] = { revenue: 0 };
    }
    for (const p of payments) {
      const key = p.createdAt.toISOString().split("T")[0];
      if (byDay[key]) byDay[key].revenue += Number(p.amount);
    }

    const newSubs = await db.communityMembership.findMany({
      where: {
        joinedAt: { gte: startDate },
        communityId: { in: communityIds },
      },
      select: { joinedAt: true },
    });

    const newSubsByDay: Record<string, number> = {};
    for (const s of newSubs) {
      const key = s.joinedAt.toISOString().split("T")[0];
      newSubsByDay[key] = (newSubsByDay[key] ?? 0) + 1;
    }

    const timeSeries = Object.entries(byDay).map(([date, data]) => ({
      date,
      revenue: parseFloat(data.revenue.toFixed(2)),
      newSubscriptions: newSubsByDay[date] ?? 0,
    }));

    // Per-community stats
    const communities = await Promise.all(
      influencer.communities.map(async (c) => {
        const [members, rev] = await db.$transaction([
          db.communityMembership.count({ where: { communityId: c.id, status: "ACTIVE" } }),
          db.payment.aggregate({
            where: {
              status: "SUCCEEDED",
              type: "SUBSCRIPTION",
              createdAt: { gte: startOfMonth },
              membership: { communityId: c.id },
            },
            _sum: { amount: true },
          }),
        ]);
        return {
          id: c.id,
          name: c.name,
          activeMembers: members,
          mrr: Number(rev._sum.amount ?? 0),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          mrr: parseFloat(mrr.toFixed(2)),
          mrrGrowth: parseFloat(mrrGrowth.toFixed(2)),
          activeMembers,
          newMembersThisMonth: newThisMonth,
          churnRate: parseFloat(churnRate.toFixed(2)),
          totalRevenue: Number(totalRevenue._sum.amount ?? 0),
          revenueGrowth: parseFloat(mrrGrowth.toFixed(2)),
          totalEarnings: Number(influencer.totalEarnings),
          pendingPayout: Number(influencer.pendingPayout),
        },
        timeSeries,
        communities,
      },
    });
  } catch (error) {
    console.error("[Analytics:influencer]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
