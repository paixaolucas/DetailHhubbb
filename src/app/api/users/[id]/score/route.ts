// =============================================================================
// GET /api/users/[id]/score
// Returns aggregated points and max level across all communities for a user.
// Used by the member dashboard score card.
// Protected: requires auth + user can only fetch their own score.
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (_req, { session, params }) => {
  try {
    const userId = params?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    // Users can only read their own score
    if (userId !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const agg = await db.userPoints.aggregate({
      where: { userId },
      _sum: { points: true },
      _max: { level: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        points: agg._sum.points ?? 0,
        level: agg._max.level ?? 1,
      },
    });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
