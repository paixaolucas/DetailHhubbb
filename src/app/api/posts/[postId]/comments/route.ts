// =============================================================================
// GET  /api/posts/[postId]/comments — list top-level comments (auth + membership)
// POST /api/posts/[postId]/comments — create comment (auth + membership)
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, verifyMembership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { notifyNewComment, notifyNewReply } from "@/services/notification/notification.service";
import { awardPoints, awardInfluencerPoints } from "@/lib/points";

const commentSchema = z.object({
  body: z
    .string()
    .min(1, "Comentário não pode estar vazio")
    .max(5000, "Máximo 5000 caracteres")
    .trim(),
  parentId: z.string().optional(),
  attachments: z.array(
    z.union([
      z.string().url(),
      z.object({ url: z.string().url(), name: z.string(), size: z.number().optional() }),
    ])
  ).max(10).optional().default([]),
});

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

    const isMember = await verifyMembership(session.userId, post.communityId, session.hasPlatform);
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
    const postId = params?.postId;
    if (!postId) {
      return NextResponse.json(
        { success: false, error: "Post ID required" },
        { status: 400 }
      );
    }

    const post = await db.post.findUnique({
      where: { id: postId },
      select: {
        communityId: true,
        isLocked: true,
        authorId: true,
        title: true,
        community: {
          select: {
            slug: true,
            influencer: { select: { userId: true } },
          },
        },
      },
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

    const isMember = await verifyMembership(session.userId, post.communityId, session.hasPlatform);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
    }

    const rawBody = await req.json();
    const parsed = commentSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
    const { body: commentBody, parentId, attachments } = parsed.data;

    let parentAuthorId: string | null = null;
    if (parentId) {
      const parent = await db.comment.findUnique({
        where: { id: parentId },
        select: { id: true, authorId: true },
      });
      if (!parent) {
        return NextResponse.json(
          { success: false, error: "Parent comment not found" },
          { status: 404 }
        );
      }
      parentAuthorId = parent.authorId;
    }

    const [comment] = await db.$transaction([
      db.comment.create({
        data: {
          postId,
          authorId: session.userId,
          parentId: parentId ?? null,
          body: commentBody,
          attachments: attachments as object[],
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

    // Award member points asynchronously (non-blocking)
    const pointsEventType = parentId ? "REPLY_CREATE" : "COMMENT_CREATE";
    awardPoints({
      userId: session.userId,
      communityId: post.communityId,
      amount: parentId ? 6 : 8,
      reason: parentId ? "respondeu um comentário" : "comentou em um post",
      eventType: pointsEventType,
      dailyLimit: parentId ? 8 : 5,
    }).catch(() => {});

    // Award influencer points for engagement in their community
    const influencerUserId = post.community?.influencer?.userId;
    if (influencerUserId && influencerUserId !== session.userId) {
      awardInfluencerPoints({
        userId: influencerUserId,
        communityId: post.communityId,
        amount: 8,
        reason: "membro comentou na comunidade",
        eventType: "INFLUENCER_MEMBER_COMMENT",
        dailyLimit: 40,
      }).catch(() => {});
    }

    // Fire notifications asynchronously (non-blocking)
    const actorName = `${comment.author.firstName} ${comment.author.lastName}`;
    const communitySlug = post.community?.slug ?? "";

    if (parentId && parentAuthorId) {
      notifyNewReply({
        commentAuthorId: parentAuthorId,
        actorId: session.userId,
        actorName,
        postId,
        communitySlug,
        commentBody,
      }).catch(() => {});
    } else {
      notifyNewComment({
        postAuthorId: post.authorId,
        actorId: session.userId,
        actorName,
        postTitle: post.title ?? "",
        postId,
        communitySlug,
        commentBody,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
