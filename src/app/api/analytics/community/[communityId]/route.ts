// =============================================================================
// GET /api/analytics/community/[communityId]
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { analyticsService } from "@/services/analytics/analytics.service";
import { AppError } from "@/types";

export const GET = withAuth(
  async (req, { session, params }) => {
    try {
      const communityId = params?.communityId;
      if (!communityId) {
        return NextResponse.json(
          { success: false, error: "Community ID required" },
          { status: 400 }
        );
      }

      const isOwner = await verifyCommunityOwnership(
        session.userId,
        communityId,
        session.role
      );

      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }

      const [analytics, timeSeries] = await Promise.all([
        analyticsService.getCommunityAnalytics(communityId),
        analyticsService.getRevenueTimeSeries(communityId, 30),
      ]);

      return NextResponse.json(
        { success: true, data: { analytics, timeSeries } },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.statusCode }
        );
      }
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
