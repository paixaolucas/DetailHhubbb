// =============================================================================
// GET /api/users/[id]/points/[communityId]
// Public — no auth required
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; communityId: string } }
) {
  try {
    const { id: userId, communityId } = params;

    if (!userId || !communityId) {
      return NextResponse.json(
        { success: false, error: "User ID and Community ID required" },
        { status: 400 }
      );
    }

    const userPoints = await db.userPoints.findUnique({
      where: {
        userId_communityId: { userId, communityId },
      },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    // Return null data if not found — user has no points in this community yet
    return NextResponse.json({ success: true, data: userPoints ?? null });
  } catch (error) {
    console.error("[User Points GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
