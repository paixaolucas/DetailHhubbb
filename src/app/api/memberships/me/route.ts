// =============================================================================
// GET /api/memberships/me — current user's active community memberships
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req, { session }) => {
  try {
    const memberships = await db.communityMembership.findMany({
      where: { userId: session.userId, status: "ACTIVE" },
      select: { communityId: true, joinedAt: true },
    });

    return NextResponse.json({
      success: true,
      data: memberships.map((m) => m.communityId),
    });
  } catch (error) {
    console.error("[Memberships Me GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
