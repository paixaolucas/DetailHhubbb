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

    // Aggregate points across all communities per user
    const grouped = await db.userPoints.groupBy({
      by: ["userId"],
      _sum: { points: true },
      _max: { level: true },
      orderBy: { _sum: { points: "desc" } },
      take: limit,
    });

    if (grouped.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const userIds = grouped.map((g) => g.userId);
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = grouped.map((g, idx) => ({
      rank: idx + 1,
      userId: g.userId,
      totalPoints: g._sum.points ?? 0,
      level: g._max.level ?? 1,
      user: userMap.get(g.userId) ?? null,
    }));

    return NextResponse.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error("[Global Leaderboard GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
