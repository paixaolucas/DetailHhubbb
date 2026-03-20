// =============================================================================
// GET  /api/spaces/[spaceId]/posts — list posts (member only, cursor pagination)
// POST /api/spaces/[spaceId]/posts — create post (member only)
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyMembership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { createPostSchema } from "@/lib/validations/post";
import { trackEvent } from "@/services/analytics/analytics.service";
import { awardPoints, awardInfluencerPoints } from "@/lib/points";

const AUTHOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

const REACTION_TYPES = ["like", "fire", "clap", "heart", "rocket"];

/** Attach reactionCounts and userReactions to posts using a single groupBy query */
async function enrichWithReactions<T extends { id: string }>(
  posts: T[],
  postIds: string[],
  userId: string
): Promise<(T & { reactionCounts: Record<string, number>; userReactions: string[] })[]> {
  if (postIds.length === 0) return posts.map((p) => ({ ...p, reactionCounts: {}, userReactions: [] }));

  const [grouped, userRows] = await Promise.all([
    db.postReaction.groupBy({
      by: ["postId", "type"],
      where: { postId: { in: postIds } },
      _count: true,
    }),
    db.postReaction.findMany({
      where: { postId: { in: postIds }, userId },
      select: { postId: true, type: true },
    }),
  ]);

  // Build lookup maps
  const countMap = new Map<string, Record<string, number>>();
  for (const row of grouped) {
    if (!countMap.has(row.postId)) countMap.set(row.postId, {});
    countMap.get(row.postId)![row.type] = row._count;
  }

  const userMap = new Map<string, string[]>();
  for (const row of userRows) {
    if (!userMap.has(row.postId)) userMap.set(row.postId, []);
    userMap.get(row.postId)!.push(row.type);
  }

  return posts.map((post) => {
    const counts = countMap.get(post.id) ?? {};
    const reactionCounts: Record<string, number> = {};
    for (const type of REACTION_TYPES) reactionCounts[type] = counts[type] ?? 0;
    return {
      ...post,
      reactionCounts,
      userReactions: userMap.get(post.id) ?? [],
    };
  });
}

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

    const isMember = await verifyMembership(session.userId, space.communityId, session.hasPlatform);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10);
    const limit = Math.min(isNaN(rawLimit) ? 20 : rawLimit, 50);
    const newerThan = searchParams.get("newerThan") ?? undefined;

    const postSelect = {
      author: { select: AUTHOR_SELECT },
      _count: { select: { reactions: true, comments: true } },
    } as const;

    const userId = session.userId;

    // ── newerThan: return only posts created after the given ISO timestamp ──
    if (newerThan) {
      const rawPosts = await db.post.findMany({
        where: { spaceId, isHidden: false, createdAt: { gt: new Date(newerThan) } },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: postSelect,
      });
      const postIds = rawPosts.map((p) => p.id);
      const posts = await enrichWithReactions(rawPosts, postIds, userId);
      return NextResponse.json({
        success: true,
        data: { posts, nextCursor: null },
      });
    }

    // ── Default: cursor-based pagination ──
    const rawPosts = await db.post.findMany({
      where: { spaceId, isHidden: false },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      include: postSelect,
    });

    const hasMore = rawPosts.length > limit;
    const raw = hasMore ? rawPosts.slice(0, limit) : rawPosts;
    const nextCursor = hasMore ? raw[raw.length - 1].id : null;
    const postIds = raw.map((p) => p.id);
    const posts = await enrichWithReactions(raw, postIds, userId);

    return NextResponse.json({
      success: true,
      data: { posts, nextCursor },
    });
  } catch (error) {
    console.error("[API] Error:", error);
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
      select: {
        communityId: true,
        isLocked: true,
        community: { select: { influencer: { select: { userId: true } } } },
      },
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

    const isMember = await verifyMembership(session.userId, space.communityId, session.hasPlatform);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
    }

    // Score gate: user needs ≥70 pts to create posts
    const userPoints = await db.userPoints.findUnique({
      where: { userId_communityId: { userId: session.userId, communityId: space.communityId } },
      select: { points: true },
    });
    if ((userPoints?.points ?? 0) < 70) {
      return NextResponse.json(
        { success: false, error: "Score insuficiente para criar posts. Engaje com a comunidade para desbloquear." },
        { status: 403 }
      );
    }

    const rawBody = await req.json();
    const parsed = createPostSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    // Require either body content or a videoUrl
    if (!parsed.data.videoUrl && (!parsed.data.body || !parsed.data.body.trim())) {
      return NextResponse.json(
        { success: false, error: "O conteúdo do post é obrigatório" },
        { status: 400 }
      );
    }

    const { title, body: postBody, type, videoUrl } = parsed.data;

    // Determine final type and content for VIDEO posts
    const finalType = videoUrl ? "VIDEO" : type;
    const finalBody = videoUrl ? (videoUrl) : (postBody || " ");

    const post = await db.post.create({
      data: {
        spaceId,
        authorId: session.userId,
        communityId: space.communityId,
        title,
        body: finalBody,
        type: finalType,
      },
      include: {
        author: { select: AUTHOR_SELECT },
      },
    });

    trackEvent({ userId: session.userId, communityId: space.communityId, type: "POST_CREATE", properties: { postId: post.id } });

    // Award member points asynchronously (non-blocking)
    awardPoints({
      userId: session.userId,
      communityId: space.communityId,
      amount: 15,
      reason: "criou um post",
      eventType: "POST_CREATE",
      dailyLimit: 2,
    }).catch(() => {});

    // Award influencer points for activity in their community
    const influencerUserId = space.community?.influencer?.userId;
    if (influencerUserId && influencerUserId !== session.userId) {
      awardInfluencerPoints({
        userId: influencerUserId,
        communityId: space.communityId,
        amount: 10,
        reason: "membro criou post na comunidade",
        eventType: "INFLUENCER_MEMBER_POST",
        dailyLimit: 20,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
