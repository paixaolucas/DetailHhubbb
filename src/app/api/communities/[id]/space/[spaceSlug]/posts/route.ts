// =============================================================================
// GET /api/communities/[slug]/space/[spaceSlug]/posts
// Combined endpoint: resolves community + spaces + posts in a single round-trip.
// [id] route param is treated as the community SLUG here.
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyMembership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

const AUTHOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

const REACTION_TYPES = ["like", "fire", "clap", "heart", "rocket"];

export const GET = withAuth(async (req, { session, params }) => {
  try {
    const communitySlug = params?.id; // the [id] segment holds the slug
    const spaceSlug = params?.spaceSlug;

    if (!communitySlug || !spaceSlug) {
      return NextResponse.json(
        { success: false, error: "Community slug and space slug required" },
        { status: 400 }
      );
    }

    // Resolve community and all its spaces in parallel
    const [community, space] = await Promise.all([
      db.community.findUnique({
        where: { slug: communitySlug },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          bannerUrl: true,
          primaryColor: true,
          influencer: { select: { userId: true } },
        },
      }),
      db.space.findFirst({
        where: { slug: spaceSlug, community: { slug: communitySlug } },
        select: { id: true },
      }),
    ]);

    if (!community) {
      return NextResponse.json(
        { success: false, error: "Community not found" },
        { status: 404 }
      );
    }

    if (!space) {
      return NextResponse.json(
        { success: false, error: "Space not found" },
        { status: 404 }
      );
    }

    // Verify membership
    const isMember = await verifyMembership(session.userId, community.id);
    if (!isMember) {
      return NextResponse.json(
        { success: false, error: "Membership required" },
        { status: 403 }
      );
    }

    // Fetch spaces + posts in parallel
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10);
    const limit = Math.min(isNaN(rawLimit) ? 20 : rawLimit, 50);

    const [allSpaces, rawPosts] = await Promise.all([
      db.space.findMany({
        where: { communityId: community.id },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          icon: true,
          isLocked: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      }),
      db.post.findMany({
        where: { spaceId: space.id, isHidden: false },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        include: {
          author: { select: AUTHOR_SELECT },
          _count: { select: { reactions: true, comments: true } },
          reactions: { select: { type: true, userId: true } },
        },
      }),
    ]);

    const userId = session.userId;
    const isOwner =
      session.role === "SUPER_ADMIN" ||
      community.influencer?.userId === userId;

    const hasMore = rawPosts.length > limit;
    const postsSlice = hasMore ? rawPosts.slice(0, limit) : rawPosts;
    const nextCursor = hasMore ? postsSlice[postsSlice.length - 1].id : null;

    const posts = postsSlice.map(({ reactions, ...post }) => {
      const reactionCounts: Record<string, number> = {};
      for (const type of REACTION_TYPES) {
        reactionCounts[type] = reactions.filter((r) => r.type === type).length;
      }
      const userReactions = reactions
        .filter((r) => r.userId === userId)
        .map((r) => r.type);
      return { ...post, reactionCounts, userReactions };
    });

    const activeSpace = allSpaces.find((s) => s.id === space.id) ?? null;

    return NextResponse.json({
      success: true,
      data: {
        community: {
          id: community.id,
          name: community.name,
          slug: community.slug,
          logoUrl: community.logoUrl,
          bannerUrl: community.bannerUrl,
          primaryColor: community.primaryColor,
        },
        spaces: allSpaces,
        activeSpace,
        isOwner,
        posts,
        nextCursor,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
