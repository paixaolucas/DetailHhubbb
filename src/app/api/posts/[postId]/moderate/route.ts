// =============================================================================
// POST /api/posts/[postId]/moderate — Superfã trusted moderation
// Superfã (≥85 pts in this community) can flag a post
// After FLAGS_TO_HIDE unique Superfã flags, post is auto-hidden
// Admin can hide immediately
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

const SUPERFAN_THRESHOLD = 85;
const FLAGS_TO_HIDE = 3;

export const POST = withAuth(async (_req, { session, params }) => {
  const postId = params?.postId;
  if (!postId) {
    return NextResponse.json({ success: false, error: "Post ID required" }, { status: 400 });
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, communityId: true, isHidden: true },
  });
  if (!post) {
    return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
  }
  if (post.isHidden) {
    return NextResponse.json({ success: false, error: "Post já está oculto." }, { status: 400 });
  }

  const isAdmin =
    session.role === UserRole.SUPER_ADMIN ||
    session.role === UserRole.INFLUENCER_ADMIN;

  if (!isAdmin) {
    const userPoints = await db.userPoints.findUnique({
      where: { userId_communityId: { userId: session.userId, communityId: post.communityId } },
      select: { points: true },
    });
    if ((userPoints?.points ?? 0) < SUPERFAN_THRESHOLD) {
      return NextResponse.json(
        { success: false, error: "Apenas membros Superfã podem moderar conteúdo." },
        { status: 403 }
      );
    }
  }

  // Use Report model to track Superfã flags
  const existingReport = await db.report.findFirst({
    where: {
      reportedById: session.userId,
      targetId: postId,
      targetType: "POST",
      reason: "SUPERFAN_MODERATION",
    },
    select: { id: true },
  });

  if (existingReport) {
    return NextResponse.json({ success: false, error: "Você já sinalizou este post." }, { status: 400 });
  }

  await db.report.create({
    data: {
      reportedById: session.userId,
      targetId: postId,
      targetType: "POST",
      reason: "SUPERFAN_MODERATION",
    },
  });

  // Count total Superfã flags on this post
  const flagCount = await db.report.count({
    where: { targetId: postId, targetType: "POST", reason: "SUPERFAN_MODERATION" },
  });

  const shouldHide = isAdmin || flagCount >= FLAGS_TO_HIDE;
  if (shouldHide) {
    await db.post.update({ where: { id: postId }, data: { isHidden: true } });
  }

  return NextResponse.json({
    success: true,
    data: {
      flagged: true,
      hidden: shouldHide,
      flagCount,
      message: shouldHide
        ? "Post ocultado com sucesso."
        : `Post sinalizado (${flagCount}/${FLAGS_TO_HIDE} sinalizações para ocultar).`,
    },
  });
});
