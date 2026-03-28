// =============================================================================
// GET /api/communities/[slug]/overview
// Returns community + spaces in a SINGLE DB query.
// [id] param is treated as the community SLUG here.
// Used by the feed overview and members pages to avoid the waterfall:
//   2×parallel fetches (mine + public) → find by slug → fetch spaces
// becomes a single call.
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req, { params }) => {
  try {
    const slug = params?.id;
    if (!slug) {
      return NextResponse.json({ success: false, error: "Slug required" }, { status: 400 });
    }

    const result = await db.community.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        bannerUrl: true,
        primaryColor: true,
        isPublished: true,
        influencer: {
          select: {
            userId: true,
            displayName: true,
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
        spaces: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            type: true,
            description: true,
            isDefault: true,
            isLocked: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!result || !result.isPublished) {
      return NextResponse.json(
        { success: false, error: "Community not found" },
        { status: 404 }
      );
    }

    const { spaces, influencer, isPublished, ...community } = result;
    const influencerData = influencer
      ? {
          displayName: influencer.displayName,
          user: influencer.user,
        }
      : null;

    return NextResponse.json(
      {
        success: true,
        data: {
          community,
          spaces,
          influencerUserId: influencer?.userId ?? null,
          influencer: influencerData,
        },
      },
      {
        headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
      }
    );
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
