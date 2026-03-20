// =============================================================================
// GET  /api/communities/[id]/spaces/[spaceId]/modules/[moduleId]/lessons — list
// POST /api/communities/[id]/spaces/[spaceId]/modules/[moduleId]/lessons — create
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const spaceId = params?.spaceId;
    const moduleId = params?.moduleId;
    if (!communityId || !spaceId || !moduleId) {
      return NextResponse.json({ success: false, error: "IDs obrigatórios" }, { status: 400 });
    }

    const contentMod = await db.contentModule.findFirst({
      where: { id: moduleId, communityId, spaceId },
    });
    if (!contentMod) {
      return NextResponse.json({ success: false, error: "Módulo não encontrado" }, { status: 404 });
    }

    const lessons = await db.contentLesson.findMany({
      where: { moduleId },
      orderBy: { sortOrder: "asc" },
    });

    const lessonIds = lessons.map((l) => l.id);
    const progressRows = await db.contentProgress.findMany({
      where: { userId: session.userId, lessonId: { in: lessonIds } },
      select: { lessonId: true, isCompleted: true, progressSecs: true },
    });

    const progressMap = new Map(progressRows.map((p) => [p.lessonId, p]));

    const data = lessons.map((l) => {
      const prog = progressMap.get(l.id);
      return {
        ...l,
        isCompleted: prog?.isCompleted ?? false,
        progressSecs: prog?.progressSecs ?? 0,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const spaceId = params?.spaceId;
    const moduleId = params?.moduleId;
    if (!communityId || !spaceId || !moduleId) {
      return NextResponse.json({ success: false, error: "IDs obrigatórios" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const contentMod = await db.contentModule.findFirst({
      where: { id: moduleId, communityId, spaceId },
    });
    if (!contentMod) {
      return NextResponse.json({ success: false, error: "Módulo não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      description,
      videoUrl,
      videoProvider,
      videoDuration,
      type,
      content,
      sortOrder,
      isPublished,
      isFree,
      attachments,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: "Título é obrigatório" }, { status: 400 });
    }

    const lesson = await db.contentLesson.create({
      data: {
        moduleId,
        title: title.trim(),
        description: description?.trim() || null,
        videoUrl: videoUrl?.trim() || null,
        videoProvider: videoProvider?.trim() || null,
        videoDuration: typeof videoDuration === "number" ? videoDuration : null,
        type: type || "VIDEO",
        content: content?.trim() || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        isPublished: isPublished ?? false,
        isFree: isFree ?? false,
        attachments: Array.isArray(attachments) ? attachments : [],
      },
    });

    return NextResponse.json({ success: true, data: lesson }, { status: 201 });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
