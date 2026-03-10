// =============================================================================
// GET /api/communities/[id]/leaderboard
// Public — no auth required
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;
    if (!communityId) {
      return NextResponse.json(
        { success: false, error: "Community ID required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "all";
    const limitRaw = parseInt(searchParams.get("limit") ?? "10");
    const limit = Math.min(50, Math.max(1, isNaN(limitRaw) ? 10 : limitRaw));

    // Build date filter for period
    let dateFilter: { gte?: Date } | undefined;
    if (period === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      dateFilter = { gte: d };
    } else if (period === "month") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      dateFilter = { gte: d };
    }

    // For period filters we need to aggregate from transactions;
    // for "all" we use the denormalized points field directly.
    if (period === "all" || !dateFilter) {
      const leaderboard = await db.userPoints.findMany({
        where: { communityId },
        orderBy: { points: "desc" },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      return NextResponse.json({ success: true, data: leaderboard });
    }

    // Period-scoped: sum transactions within window.
    // PointTransaction links to UserPoints (not User directly), so we first
    // fetch all UserPoints records for this community to build the join map.
    const communityUserPoints = await db.userPoints.findMany({
      where: { communityId },
      select: { id: true, userId: true, level: true, points: true },
    });

    const upByPtId = new Map(communityUserPoints.map((up) => [up.id, up]));
    const upIds = communityUserPoints.map((up) => up.id);

    // Group point transactions by userPointsId, summing `amount` (the correct field name)
    const transactions = await db.pointTransaction.groupBy({
      by: ["userPointsId"],
      where: {
        userPointsId: { in: upIds },
        createdAt: dateFilter,
        amount: { gt: 0 },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: limit,
    });

    const userIds = transactions
      .map((t) => upByPtId.get(t.userPointsId)?.userId)
      .filter((id): id is string => !!id);

    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = transactions.map((t) => {
      const up = upByPtId.get(t.userPointsId);
      return {
        userId: up?.userId ?? null,
        points: t._sum.amount ?? 0,
        level: up?.level ?? 1,
        totalPoints: up?.points ?? 0,
        user: up ? (userMap.get(up.userId) ?? null) : null,
      };
    });

    return NextResponse.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error("[Leaderboard GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
