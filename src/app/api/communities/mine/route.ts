// =============================================================================
// GET /api/communities/mine — influencer's own communities
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getInfluencerCommunities } from "@/services/community/community.service";

export const GET = withAuth(async (req, { session }) => {
  try {
    const communities = await getInfluencerCommunities(session.userId);
    return NextResponse.json(
      { success: true, data: communities },
      {
        status: 200,
        headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
      }
    );
  } catch (error) {
    console.error("[Communities:mine]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
