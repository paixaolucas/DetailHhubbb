// =============================================================================
// GET    /api/posts/[postId] — get post + comments (auth + membership)
// PATCH  /api/posts/[postId] — edit post (author or owner)
// DELETE /api/posts/[postId] — delete post (author or owner)
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  withAuth,
  verifyMembership,
  verifyCommunityOwnership,
} from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

const AUTHOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

export const GET = withAuth(async (req, { session, params }) => {
  try {
    const postId = params?.postId;
    if (!postId) {
      return NextResponse.json(
        { success: false, error: "Post ID required" },
        { status: 400 }
      );
    }

    // Fetch only communityId first to verify membership before loading full post
    const postMeta = await db.post.findUnique({
      where: { id: postId },
      select: { communityId: true },
    });

    if (!postMeta) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    const isMember = await verifyMembership(session.userId, postMeta.communityId, session.hasPlatform);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
    }

    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: AUTHOR_SELECT },
        space: { select: { id: true, name: true, slug: true } },
        comments: {
          where: { parentId: null, isHidden: false },
          orderBy: { createdAt: "asc" },
          take: 50,
          include: {
            author: { select: AUTHOR_SELECT },
            replies: {
              where: { isHidden: false },
              orderBy: { createdAt: "asc" },
              include: {
                author: { select: AUTHOR_SELECT },
              },
            },
            _count: { select: { reactions: true } },
          },
        },
        _count: { select: { reactions: true, comments: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    // Increment view count in the background — do not await to avoid delaying response
    db.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    }).catch(() => undefined);

    return NextResponse.json({ success: true, data: post });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (req, { session, params }) => {
  try {
    const postId = params?.postId;
    if (!postId) {
      return NextResponse.json(
        { success: false, error: "Post ID required" },
        { status: 400 }
      );
    }

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { authorId: true, communityId: true },
    });
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    const isAuthor = post.authorId === session.userId;
    const isOwner = await verifyCommunityOwnership(session.userId, post.communityId, session.role);

    if (!isAuthor && !isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const updatePostSchema = z
      .object({
        title: z.string().max(255).optional(),
        body: z.string().max(50_000).optional(),
      })
      .refine((d) => d.title !== undefined || d.body !== undefined, {
        message: "At least one field required",
      });

    const parsed = updatePostSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }
    const { title, body: postBody } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (postBody !== undefined) updateData.body = postBody;

    const updated = await db.post.update({
      where: { id: postId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req, { session, params }) => {
  try {
    const postId = params?.postId;
    if (!postId) {
      return NextResponse.json(
        { success: false, error: "Post ID required" },
        { status: 400 }
      );
    }

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { authorId: true, communityId: true },
    });
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    const isAuthor = post.authorId === session.userId;
    const isOwner = await verifyCommunityOwnership(session.userId, post.communityId, session.role);

    if (!isAuthor && !isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await db.post.delete({ where: { id: postId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
