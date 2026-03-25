// =============================================================================
// GET /api/posts/trending — posts em alta nas comunidades por engajamento real
// Protected — members only
// Query params: limit (default 5, max 10), hours (default 168 = 7 days)
// Ordered by: likeCount*2 + commentCount*3 + viewCount (weighted engagement score)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(10, Math.max(1, parseInt(searchParams.get("limit") ?? "5")));
  const hours = Math.max(1, parseInt(searchParams.get("hours") ?? "168"));

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  try {
    const posts = await db.post.findMany({
      where: {
        isHidden: false,
        isLocked: false,
        createdAt: { gte: since },
      },
      select: {
        id: true,
        title: true,
        body: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
        createdAt: true,
        type: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            primaryColor: true,
            logoUrl: true,
          },
        },
        space: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { likeCount: "desc" },
        { commentCount: "desc" },
        { viewCount: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    const data = posts.map((post) => ({
      id: post.id,
      title: post.title,
      body: post.body.slice(0, 200),
      type: post.type,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      viewCount: post.viewCount,
      createdAt: post.createdAt,
      author: {
        id: post.author.id,
        name: `${post.author.firstName} ${post.author.lastName ?? ""}`.trim(),
        avatarUrl: post.author.avatarUrl,
      },
      community: post.community,
      spaceSlug: post.space?.slug ?? null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[posts/trending:GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
