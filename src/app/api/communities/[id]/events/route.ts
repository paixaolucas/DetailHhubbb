// =============================================================================
// GET /api/communities/[id]/events
// Public — no auth required
// Query params: startDate, endDate (ISO strings)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;
    if (!communityId) {
      return NextResponse.json(
        { success: false, error: "Community ID required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();

    const startDate = startDateParam ? new Date(startDateParam) : now;

    // Default end date: 1 month from now (no date-fns)
    let endDate: Date;
    if (endDateParam) {
      endDate = new Date(endDateParam);
    } else {
      const d = new Date(now);
      d.setMonth(d.getMonth() + 1);
      endDate = d;
    }

    const events = await db.liveSession.findMany({
      where: {
        communityId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["SCHEDULED", "LIVE"],
        },
      },
      include: {
        host: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { rsvps: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error("[Community Events GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
