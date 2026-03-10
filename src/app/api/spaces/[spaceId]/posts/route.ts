// =============================================================================
// GET  /api/spaces/[spaceId]/posts — list posts (member only, cursor pagination)
// POST /api/spaces/[spaceId]/posts — create post (member only)
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyMembership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { createPostSchema } from "@/lib/validations/post";
import { trackEvent } from "@/services/analytics/analytics.service";

const AUTHOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

export const GET = withAuth(async (req, { session, params }) => {
  try {
    const spaceId = params?.spaceId;
    if (!spaceId) {
      return NextResponse.json(
        { success: false, error: "Space ID required" },
        { status: 400 }
      );
    }

    const space = await db.space.findUnique({
      where: { id: spaceId },
      select: { communityId: true },
    });
    if (!space) {
      return NextResponse.json({ success: false, error: "Space not found" }, { status: 404 });
    }

    const isMember = await verifyMembership(session.userId, space.communityId);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10);
    const limit = Math.min(isNaN(rawLimit) ? 20 : rawLimit, 50);

    const rawPosts = await db.post.findMany({
      where: { spaceId, isHidden: false },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      include: {
        author: { select: AUTHOR_SELECT },
        _count: { select: { reactions: true, comments: true } },
        reactions: { select: { type: true, userId: true } },
      },
    });

    const hasMore = rawPosts.length > limit;
    const raw = hasMore ? rawPosts.slice(0, limit) : rawPosts;
    const nextCursor = hasMore ? raw[raw.length - 1].id : null;

    const REACTION_TYPES = ["like", "fire", "clap", "heart", "rocket"];
    const page = raw.map(({ reactions, ...post }) => {
      const reactionCounts: Record<string, number> = {};
      for (const type of REACTION_TYPES) {
        reactionCounts[type] = reactions.filter((r) => r.type === type).length;
      }
      const userReactions = reactions
        .filter((r) => r.userId === session.userId)
        .map((r) => r.type);
      return { ...post, reactionCounts, userReactions };
    });

    return NextResponse.json({
      success: true,
      data: { posts: page, nextCursor },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req, { session, params }) => {
  try {
    const spaceId = params?.spaceId;
    if (!spaceId) {
      return NextResponse.json(
        { success: false, error: "Space ID required" },
        { status: 400 }
      );
    }

    const space = await db.space.findUnique({
      where: { id: spaceId },
      select: { communityId: true, isLocked: true },
    });
    if (!space) {
      return NextResponse.json({ success: false, error: "Space not found" }, { status: 404 });
    }

    if (space.isLocked) {
      return NextResponse.json(
        { success: false, error: "This space is locked" },
        { status: 403 }
      );
    }

    const isMember = await verifyMembership(session.userId, space.communityId);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
    }

    const rawBody = await req.json();
    const parsed = createPostSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const { title, body: postBody, type } = parsed.data;

    const post = await db.post.create({
      data: {
        spaceId,
        authorId: session.userId,
        communityId: space.communityId,
        title,
        body: postBody,
        type,
      },
      include: {
        author: { select: AUTHOR_SELECT },
      },
    });

    trackEvent({ userId: session.userId, communityId: space.communityId, type: "POST_CREATE", properties: { postId: post.id } });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
