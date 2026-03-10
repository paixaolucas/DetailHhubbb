// =============================================================================
// GET /api/analytics/platform — SuperAdmin only
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { analyticsService } from "@/services/analytics/analytics.service";
import { UserRole } from "@prisma/client";

export const GET = withRole(UserRole.SUPER_ADMIN)(async (req, { session }) => {
  try {
    const [summary, influencerStats] = await Promise.all([
      analyticsService.getPlatformSummary(),
      analyticsService.getInfluencerRevenueStats(),
    ]);

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") ?? "30");
    const timeSeries = await analyticsService.getRevenueTimeSeries(
      undefined,
      Math.min(90, Math.max(7, days))
    );

    return NextResponse.json(
      {
        success: true,
        data: { summary, influencerStats, timeSeries },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Analytics:platform]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
