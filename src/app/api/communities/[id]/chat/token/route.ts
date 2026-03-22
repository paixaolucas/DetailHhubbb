// =============================================================================
// POST /api/communities/[id]/chat/token
// Issues a short-lived SSE ticket (30s) in exchange for a valid Bearer token.
// The client uses this ticket as ?ticket= in the SSE stream URL to avoid
// exposing the main JWT access token in server logs / Referer headers.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { verifyMembership } from "@/middleware/auth.middleware";
import { createSseTicket } from "@/lib/auth/jwt";

export const POST = withAuth(
  async (req: NextRequest, { session, params }) => {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json(
        { success: false, error: "Community ID required" },
        { status: 400 }
      );
    }

    const isMember = await verifyMembership(
      session.userId,
      communityId,
      session.hasPlatform
    );
    if (!isMember) {
      return NextResponse.json(
        { success: false, error: "Not a member of this community" },
        { status: 403 }
      );
    }

    const ticket = await createSseTicket({
      userId: session.userId,
      communityId,
    });

    return NextResponse.json({ success: true, data: { ticket } });
  }
);
