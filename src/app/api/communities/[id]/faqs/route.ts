// =============================================================================
// GET  /api/communities/[id]/faqs — List FAQs (public, no auth)
// POST /api/communities/[id]/faqs — Create FAQ (community owner only)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const communityId = context.params.id;
    if (!communityId) {
      return NextResponse.json(
        { success: false, error: "Community ID required" },
        { status: 400 }
      );
    }

    const faqs = await db.communityFAQ.findMany({
      where: { communityId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: faqs });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json(
        { success: false, error: "Community ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { question, answer, sortOrder } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: "question and answer are required" },
        { status: 400 }
      );
    }

    const faq = await db.communityFAQ.create({
      data: {
        communityId,
        question,
        answer,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json({ success: true, data: faq }, { status: 201 });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
