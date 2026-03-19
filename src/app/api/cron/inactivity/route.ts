// =============================================================================
// POST /api/cron/inactivity
// Daily cron job — applies inactivity penalty (-3 pts/day from day 3)
// to all members and influencers who haven't interacted.
// Should be called by Vercel Cron or external scheduler once per day.
// Protected by CRON_SECRET header.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyInactivityPenalty } from "@/lib/points";

export async function POST(req: NextRequest) {
  // Simple secret check — set CRON_SECRET in env
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all UserPoints records that have points > 0
    // take: 200 prevents timeout on Vercel Hobby (10s limit) with large datasets
    const allUserPoints = await db.userPoints.findMany({
      where: { points: { gt: 0 } },
      select: { userId: true, communityId: true },
      take: 200,
    });

    let penalised = 0;
    let totalPtsDeducted = 0;

    const results = await Promise.allSettled(
      allUserPoints.map((up) =>
        applyInactivityPenalty({ userId: up.userId, communityId: up.communityId })
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value > 0) {
        penalised++;
        totalPtsDeducted += result.value;
      }
    }

    console.log(`[Cron:Inactivity] Processed ${allUserPoints.length} records. Penalised ${penalised}. Total deducted: ${totalPtsDeducted} pts.`);

    return NextResponse.json({
      success: true,
      data: { processed: allUserPoints.length, penalised, totalPtsDeducted },
    });
  } catch (error) {
    console.error("[Cron:Inactivity]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
