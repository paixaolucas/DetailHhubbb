// =============================================================================
// POST /api/posts/[postId]/reactions — toggle reaction (auth + membership)
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyMembership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { awardPoints } from "@/lib/points";

const VALID_REACTION_TYPES = ["like", "fire", "clap", "heart", "rocket"] as const;
type ReactionType = (typeof VALID_REACTION_TYPES)[number];

export const POST = withAuth(async (req, { session, params }) => {
  try {
    const postId = params?.postId;
    if (!postId) {
      return NextResponse.json(
        { success: false, error: "Post ID required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { type } = body as { type: ReactionType };

    if (!type || !VALID_REACTION_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `type must be one of: ${VALID_REACTION_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { communityId: true, likeCount: true },
    });
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    const isMember = await verifyMembership(session.userId, post.communityId, session.hasPlatform);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
    }

    const existing = await db.postReaction.findUnique({
      where: { postId_userId_type: { postId, userId: session.userId, type } },
    });

    let reacted: boolean;
    let likeCount: number;

    if (existing) {
      const [, updatedPost] = await db.$transaction([
        db.postReaction.delete({ where: { id: existing.id } }),
        db.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        }),
      ]);
      reacted = false;
      likeCount = updatedPost.likeCount;
    } else {
      const [, updatedPost] = await db.$transaction([
        db.postReaction.create({
          data: { postId, userId: session.userId, type },
        }),
        db.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
          select: { likeCount: true },
        }),
      ]);
      reacted = true;
      likeCount = updatedPost.likeCount;

      // Award points asynchronously (non-blocking)
      awardPoints({
        userId: session.userId,
        communityId: post.communityId,
        amount: 3,
        reason: "reagiu a um post",
        eventType: "POST_REACTION",
        dailyLimit: 10,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: { reacted, likeCount } });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req, { session, params }) => {
  try {
    const postId = params?.postId;
    if (!postId) {
      return NextResponse.json({ success: false, error: "Post ID required" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as ReactionType | null;

    if (!type || !VALID_REACTION_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `type must be one of: ${VALID_REACTION_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const existing = await db.postReaction.findUnique({
      where: { postId_userId_type: { postId, userId: session.userId, type } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Reação não encontrada" }, { status: 404 });
    }

    const [, updatedPost] = await db.$transaction([
      db.postReaction.delete({ where: { id: existing.id } }),
      db.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      }),
    ]);

    return NextResponse.json({ success: true, data: { likeCount: updatedPost.likeCount } });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});
