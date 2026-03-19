// =============================================================================
// PATCH  /api/comments/[commentId] — edit comment (author only)
// DELETE /api/comments/[commentId] — delete comment (author or admin/influencer)
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const PATCH = withAuth(async (req, { session, params }) => {
  try {
    const commentId = params?.commentId;
    if (!commentId) {
      return NextResponse.json(
        { success: false, error: "Comment ID required" },
        { status: 400 }
      );
    }

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });
    if (!comment) {
      return NextResponse.json({ success: false, error: "Comentário não encontrado" }, { status: 404 });
    }

    if (comment.authorId !== session.userId) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const { body: commentBody } = body;

    if (!commentBody) {
      return NextResponse.json(
        { success: false, error: "O conteúdo do comentário é obrigatório" },
        { status: 400 }
      );
    }

    const updated = await db.comment.update({
      where: { id: commentId },
      data: { body: commentBody },
    });

    return NextResponse.json({ success: true, data: updated });
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
    const commentId = params?.commentId;
    if (!commentId) {
      return NextResponse.json(
        { success: false, error: "Comment ID required" },
        { status: 400 }
      );
    }

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: {
        authorId: true,
        postId: true,
        post: {
          select: {
            space: {
              select: { communityId: true },
            },
          },
        },
      },
    });
    if (!comment) {
      return NextResponse.json({ success: false, error: "Comentário não encontrado" }, { status: 404 });
    }

    const isAuthor = comment.authorId === session.userId;
    const isSuperAdmin = session.role === UserRole.SUPER_ADMIN;

    // INFLUENCER_ADMIN can only delete comments in communities they own
    let isOwningInfluencer = false;
    if (session.role === UserRole.INFLUENCER_ADMIN) {
      const communityId = comment.post?.space?.communityId;
      if (communityId) {
        isOwningInfluencer = await verifyCommunityOwnership(
          session.userId,
          communityId,
          session.role
        );
      }
    }

    if (!isAuthor && !isSuperAdmin && !isOwningInfluencer) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    await db.$transaction([
      db.comment.delete({ where: { id: commentId } }),
      db.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
});
