// =============================================================================
// PATCH  /api/communities/[id]/faqs/[faqId] — Update FAQ (community owner only)
// DELETE /api/communities/[id]/faqs/[faqId] — Delete FAQ (community owner only)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const PATCH = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const faqId = params?.faqId;

    if (!communityId || !faqId) {
      return NextResponse.json(
        { success: false, error: "Community ID and FAQ ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { question, answer, sortOrder } = body;

    const existing = await db.communityFAQ.findFirst({
      where: { id: faqId, communityId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "FAQ not found" }, { status: 404 });
    }

    const updated = await db.communityFAQ.update({
      where: { id: faqId },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (_req, { session, params }) => {
  try {
    const communityId = params?.id;
    const faqId = params?.faqId;

    if (!communityId || !faqId) {
      return NextResponse.json(
        { success: false, error: "Community ID and FAQ ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.communityFAQ.findFirst({
      where: { id: faqId, communityId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "FAQ not found" }, { status: 404 });
    }

    await db.communityFAQ.delete({ where: { id: faqId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
