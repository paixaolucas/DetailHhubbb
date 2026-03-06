// =============================================================================
// GET /api/users/[id]/points/[communityId]/transactions
// Auth required — user can only view own transactions; SUPER_ADMIN sees all
// Cursor-based pagination: ?cursor=<id>&limit=20&type=EARNED|SPENT|EXPIRED|ADJUSTED
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const GET = withAuth(async (req, { session, params }) => {
  try {
    const userId = params?.id;
    const communityId = params?.communityId;

    if (!userId || !communityId) {
      return NextResponse.json({ success: false, error: "User ID and community ID required" }, { status: 400 });
    }

    // Only owner or SUPER_ADMIN
    if (session.userId !== userId && session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    // Find UserPoints record
    const userPoints = await db.userPoints.findUnique({
      where: { userId_communityId: { userId, communityId } },
      select: { id: true, points: true },
    });

    if (!userPoints) {
      return NextResponse.json({
        success: true,
        data: { items: [], points: 0, nextCursor: null },
      });
    }

    const transactions = await db.pointTransaction.findMany({
      where: { userPointsId: userPoints.id },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = transactions.length > limit;
    const items = hasMore ? transactions.slice(0, limit) : transactions;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      success: true,
      data: { items, points: userPoints.points, nextCursor },
    });
  } catch (error) {
    console.error("[PointTransactions GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
