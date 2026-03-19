// =============================================================================
// GET  /api/communities/[id]/testimonials — List active testimonials (public)
// POST /api/communities/[id]/testimonials — Create testimonial (community owner)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership, getSessionFromRequest } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
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

    // If authenticated owner or admin requests ?all=true, return inactive ones too
    const all = req.nextUrl.searchParams.get("all") === "true";
    let showAll = false;
    if (all) {
      const session = await getSessionFromRequest(req);
      if (session) {
        showAll = await verifyCommunityOwnership(session.userId, communityId, session.role);
      }
    }

    const testimonials = await db.communityTestimonial.findMany({
      where: { communityId, ...(showAll ? {} : { isActive: true }) },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: testimonials });
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
    const { authorName, authorTitle, avatarUrl, body: testimonialBody, rating, sortOrder } = body;

    if (!authorName || !testimonialBody) {
      return NextResponse.json(
        { success: false, error: "authorName and body are required" },
        { status: 400 }
      );
    }

    const testimonial = await db.communityTestimonial.create({
      data: {
        communityId,
        authorName,
        authorTitle: authorTitle ?? null,
        avatarUrl: avatarUrl ?? null,
        body: testimonialBody,
        rating: rating ?? null,
        sortOrder: sortOrder ?? 0,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: testimonial }, { status: 201 });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
