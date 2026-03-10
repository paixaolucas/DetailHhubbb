// =============================================================================
// GET  /api/posts/[postId]/comments — list top-level comments (auth + membership)
// POST /api/posts/[postId]/comments — create comment (auth + membership)
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

export const GET = withAuth(async (req, { session, params }) => {
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
      select: { communityId: true },
    });
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    const isMember = await verifyMembership(session.userId, post.communityId);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
    }

    const comments = await db.comment.findMany({
      where: { postId, parentId: null, isHidden: false },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: AUTHOR_SELECT },
        replies: {
          where: { isHidden: false },
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: AUTHOR_SELECT },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req, { session, params }) => {
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
      select: { communityId: true, isLocked: true },
    });
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    if (post.isLocked) {
      return NextResponse.json(
        { success: false, error: "This post is locked" },
        { status: 403 }
      );
    }

    const isMember = await verifyMembership(session.userId, post.communityId);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
    }

    const body = await req.json();
    const { body: commentBody, parentId } = body;

    if (!commentBody) {
      return NextResponse.json(
        { success: false, error: "Comment body is required" },
        { status: 400 }
      );
    }

    if (parentId) {
      const parent = await db.comment.findUnique({
        where: { id: parentId },
        select: { id: true },
      });
      if (!parent) {
        return NextResponse.json(
          { success: false, error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    const [comment] = await db.$transaction([
      db.comment.create({
        data: {
          postId,
          authorId: session.userId,
          parentId: parentId ?? null,
          body: commentBody,
        },
        include: {
          author: { select: AUTHOR_SELECT },
        },
      }),
      db.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
