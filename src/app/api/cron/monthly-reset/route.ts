// =============================================================================
// POST /api/cron/monthly-reset — runs on the 1st of each month
// Awards "monthly champion" badges to top leaderboard users, then nothing to clear
// (All-time points stay; monthly view already filtered by transaction date)
// Protected by x-cron-secret header
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/services/notification/notification.service";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get previous month's range
    const now = new Date();
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);

    // Find all communities
    const communities = await db.community.findMany({
      where: { isPublished: true },
      select: { id: true, name: true },
    });

    let championsNotified = 0;

    for (const community of communities) {
      // Get all UserPoints for this community
      const communityUserPoints = await db.userPoints.findMany({
        where: { communityId: community.id },
        select: { id: true, userId: true },
      });
      if (communityUserPoints.length === 0) continue;

      const upIds = communityUserPoints.map((up) => up.id);
      const upByPtId = new Map(communityUserPoints.map((up) => [up.id, up.userId]));

      // Top earner for previous month
      const topTx = await db.pointTransaction.groupBy({
        by: ["userPointsId"],
        where: {
          userPointsId: { in: upIds },
          createdAt: { gte: prevMonthStart, lt: prevMonthEnd },
          amount: { gt: 0 },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 3,
      });

      for (let i = 0; i < topTx.length; i++) {
        const userId = upByPtId.get(topTx[i].userPointsId);
        if (!userId) continue;
        const pts = topTx[i]._sum.amount ?? 0;
        const rank = i + 1;
        const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
        createNotification({
          recipientId: userId,
          type: "ACHIEVEMENT_UNLOCKED",
          title: `${medal} Top ${rank} do mês em ${community.name}!`,
          body: `Você ficou em ${rank}º lugar no ranking mensal com ${pts} pts. Parabéns!`,
          link: `/community/${community.id}/feed`,
        }).catch(() => {});
        championsNotified++;
      }
    }

    return NextResponse.json({
      success: true,
      data: { communitiesProcessed: communities.length, championsNotified },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
