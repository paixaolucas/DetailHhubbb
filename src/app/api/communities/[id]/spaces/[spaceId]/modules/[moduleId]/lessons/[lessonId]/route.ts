// =============================================================================
// GET    /...lessons/[lessonId] — get lesson with progress
// PATCH  /...lessons/[lessonId] — edit lesson
// DELETE /...lessons/[lessonId] — delete lesson
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const moduleId = params?.moduleId;
    const lessonId = params?.lessonId;
    if (!communityId || !moduleId || !lessonId) {
      return NextResponse.json({ success: false, error: "IDs obrigatórios" }, { status: 400 });
    }

    const lesson = await db.contentLesson.findFirst({
      where: { id: lessonId, moduleId },
    });
    if (!lesson) {
      return NextResponse.json({ success: false, error: "Aula não encontrada" }, { status: 404 });
    }

    const progress = await db.contentProgress.findUnique({
      where: { userId_lessonId: { userId: session.userId, lessonId } },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...lesson,
        isCompleted: progress?.isCompleted ?? false,
        progressSecs: progress?.progressSecs ?? 0,
        completedAt: progress?.completedAt ?? null,
      },
    });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const moduleId = params?.moduleId;
    const lessonId = params?.lessonId;
    if (!communityId || !moduleId || !lessonId) {
      return NextResponse.json({ success: false, error: "IDs obrigatórios" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.contentLesson.findFirst({ where: { id: lessonId, moduleId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Aula não encontrada" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, videoUrl, videoProvider, videoDuration, type, content, sortOrder, isPublished, isFree } = body;

    const updated = await db.contentLesson.update({
      where: { id: lessonId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(videoUrl !== undefined && { videoUrl: videoUrl?.trim() || null }),
        ...(videoProvider !== undefined && { videoProvider: videoProvider?.trim() || null }),
        ...(videoDuration !== undefined && { videoDuration }),
        ...(type !== undefined && { type }),
        ...(content !== undefined && { content: content?.trim() || null }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isPublished !== undefined && { isPublished }),
        ...(isFree !== undefined && { isFree }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const moduleId = params?.moduleId;
    const lessonId = params?.lessonId;
    if (!communityId || !moduleId || !lessonId) {
      return NextResponse.json({ success: false, error: "IDs obrigatórios" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.contentLesson.findFirst({ where: { id: lessonId, moduleId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Aula não encontrada" }, { status: 404 });
    }

    await db.contentLesson.delete({ where: { id: lessonId } });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
