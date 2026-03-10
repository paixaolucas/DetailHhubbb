// =============================================================================
// POST /api/comments/[commentId]/reactions — toggle comment reaction (auth)
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

const VALID_REACTION_TYPES = ["like", "fire", "clap", "heart", "rocket"] as const;
type ReactionType = (typeof VALID_REACTION_TYPES)[number];

export const POST = withAuth(async (req, { session, params }) => {
  try {
    const commentId = params?.commentId;
    if (!commentId) {
      return NextResponse.json(
        { success: false, error: "Comment ID required" },
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

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { likeCount: true },
    });
    if (!comment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    }

    const existing = await db.commentReaction.findUnique({
      where: { commentId_userId_type: { commentId, userId: session.userId, type } },
    });

    let reacted: boolean;
    let likeCount: number;

    if (existing) {
      await db.commentReaction.delete({ where: { id: existing.id } });
      const updated = await db.comment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
      reacted = false;
      likeCount = updated.likeCount;
    } else {
      await db.commentReaction.create({
        data: { commentId, userId: session.userId, type },
      });
      const updated = await db.comment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });
      reacted = true;
      likeCount = updated.likeCount;
    }

    return NextResponse.json({ success: true, data: { reacted, likeCount } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
