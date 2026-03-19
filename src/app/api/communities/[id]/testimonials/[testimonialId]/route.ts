// =============================================================================
// PATCH  /api/communities/[id]/testimonials/[testimonialId] — Update (owner)
// DELETE /api/communities/[id]/testimonials/[testimonialId] — Delete (owner)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const PATCH = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const testimonialId = params?.testimonialId;

    if (!communityId || !testimonialId) {
      return NextResponse.json(
        { success: false, error: "Community ID and Testimonial ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.communityTestimonial.findFirst({
      where: { id: testimonialId, communityId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Testimonial not found" }, { status: 404 });
    }

    const body = await req.json();
    const { authorName, authorTitle, avatarUrl, body: testimonialBody, rating, sortOrder, isActive } = body;

    const updated = await db.communityTestimonial.update({
      where: { id: testimonialId },
      data: {
        ...(authorName !== undefined && { authorName }),
        ...(authorTitle !== undefined && { authorTitle }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(testimonialBody !== undefined && { body: testimonialBody }),
        ...(rating !== undefined && { rating }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (_req: NextRequest, { session, params }) => {
  try {
    const communityId = params?.id;
    const testimonialId = params?.testimonialId;

    if (!communityId || !testimonialId) {
      return NextResponse.json(
        { success: false, error: "Community ID and Testimonial ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.communityTestimonial.findFirst({
      where: { id: testimonialId, communityId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Testimonial not found" }, { status: 404 });
    }

    await db.communityTestimonial.delete({ where: { id: testimonialId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
