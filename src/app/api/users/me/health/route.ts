// =============================================================================
// GET /api/users/me/health — member global health score
// Returns engagement score, canPost flag, and progress breakdown
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getMemberHealthScore, HEALTH_POST_THRESHOLD } from "@/lib/member-health";
import { UserRole } from "@prisma/client";

export const GET = withAuth(async (_req, { session }) => {
  try {
    // Admins and influencers bypass the health gate entirely
    if (
      session.role === UserRole.SUPER_ADMIN ||
      session.role === UserRole.INFLUENCER_ADMIN
    ) {
      return NextResponse.json({
        success: true,
        data: { score: 100, canPost: true, reactions: 0, comments: 0, threshold: HEALTH_POST_THRESHOLD },
      });
    }

    const health = await getMemberHealthScore(session.userId);
    return NextResponse.json({
      success: true,
      data: { ...health, threshold: HEALTH_POST_THRESHOLD },
    });
  } catch (error) {
    console.error("[users/me/health:GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
