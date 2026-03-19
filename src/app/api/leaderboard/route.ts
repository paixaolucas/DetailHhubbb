// =============================================================================
// GET /api/leaderboard
// Public — returns top members across all communities by total points
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitRaw = parseInt(searchParams.get("limit") ?? "10");
    const limit = Math.min(50, Math.max(1, isNaN(limitRaw) ? 10 : limitRaw));
    const period = searchParams.get("period") ?? "all";

    let leaderboard: { rank: number; userId: string; totalPoints: number; level: number; user: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null }[];

    if (period === "month") {
      // Monthly: aggregate from PointTransaction for current calendar month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const txGroups = await db.pointTransaction.groupBy({
        by: ["userPointsId"],
        where: { createdAt: { gte: monthStart }, amount: { gt: 0 } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: limit,
      });

      if (txGroups.length === 0) return NextResponse.json({ success: true, data: [] });

      const upIds = txGroups.map((t) => t.userPointsId);
      const userPointsRecords = await db.userPoints.findMany({
        where: { id: { in: upIds } },
        select: { id: true, userId: true, level: true },
      });
      const upMap = new Map(userPointsRecords.map((up) => [up.id, up]));
      const userIds = userPointsRecords.map((up) => up.userId);
      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      leaderboard = txGroups.map((t, idx) => {
        const up = upMap.get(t.userPointsId);
        return {
          rank: idx + 1,
          userId: up?.userId ?? "",
          totalPoints: t._sum.amount ?? 0,
          level: up?.level ?? 1,
          user: up ? (userMap.get(up.userId) ?? null) : null,
        };
      });
    } else {
      // All-time: aggregate across all communities per user
      const grouped = await db.userPoints.groupBy({
        by: ["userId"],
        _sum: { points: true },
        _max: { level: true },
        orderBy: { _sum: { points: "desc" } },
        take: limit,
      });

      if (grouped.length === 0) return NextResponse.json({ success: true, data: [] });

      const userIds = grouped.map((g) => g.userId);
      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      leaderboard = grouped.map((g, idx) => ({
        rank: idx + 1,
        userId: g.userId,
        totalPoints: g._sum.points ?? 0,
        level: g._max.level ?? 1,
        user: userMap.get(g.userId) ?? null,
      }));
    }

    return NextResponse.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error("[Global Leaderboard GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
