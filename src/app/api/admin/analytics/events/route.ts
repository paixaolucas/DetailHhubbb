// =============================================================================
// GET /api/admin/analytics/events — query analytics events (SUPER_ADMIN)
// Query: type, userId, communityId, startDate, endDate, page, pageSize
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const GET = withRole(UserRole.SUPER_ADMIN)(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10)));
    const type = searchParams.get("type") ?? undefined;
    const userId = searchParams.get("userId") ?? undefined;
    const communityId = searchParams.get("communityId") ?? undefined;
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;

    const where: Record<string, unknown> = {};
    if (type) where.type = type as any;
    if (userId) where.userId = userId;
    if (communityId) where.communityId = communityId;
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const [total, items] = await Promise.all([
      db.analyticsEvent.count({ where }),
      db.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          type: true,
          createdAt: true,
          sessionId: true,
          properties: true,
          userId: true,
          communityId: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          community: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Also return aggregated counts per event type for the queried range
    const typeCounts = await db.analyticsEvent.groupBy({
      by: ["type"],
      where: where.createdAt ? { createdAt: where.createdAt as any } : undefined,
      _count: { type: true },
      orderBy: { _count: { type: "desc" } },
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        typeCounts: typeCounts.map((t) => ({ type: t.type, count: t._count.type })),
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    console.error("[Analytics Events GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
