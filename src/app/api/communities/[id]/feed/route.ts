// =============================================================================
// GET /api/communities/[slug]/feed
// Returns aggregated posts from ALL non-COURSE spaces in a community,
// ordered by most recent. [id] param is treated as the community SLUG.
// Supports cursor-based pagination via ?cursor=<postId>.
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { SpaceType } from "@prisma/client";

const PAGE_SIZE = 15;

export const GET = withAuth(async (req, { params }) => {
  try {
    const slug = params?.id;
    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Slug required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;

    // Resolve community by slug
    const community = await db.community.findUnique({
      where: { slug },
      select: { id: true, isPublished: true },
    });

    if (!community || !community.isPublished) {
      return NextResponse.json(
        { success: false, error: "Community not found" },
        { status: 404 }
      );
    }

    // Build cursor args
    const cursorArg = cursor ? { id: cursor } : undefined;
    const skipArg = cursor ? 1 : undefined;

    const posts = await db.post.findMany({
      where: {
        communityId: community.id,
        isHidden: false,
        space: {
          type: { notIn: [SpaceType.COURSE] },
        },
      },
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        isPinned: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      cursor: cursorArg,
      skip: skipArg,
    });

    const hasMore = posts.length > PAGE_SIZE;
    const page = hasMore ? posts.slice(0, PAGE_SIZE) : posts;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return NextResponse.json(
      {
        success: true,
        data: { posts: page, nextCursor },
      },
      {
        headers: { "Cache-Control": "private, max-age=30" },
      }
    );
  } catch (error) {
    console.error("[API] communities/feed error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
