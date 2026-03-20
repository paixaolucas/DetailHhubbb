// =============================================================================
// GET  /api/communities/[id]/spaces/[spaceId]/modules — list modules
// POST /api/communities/[id]/spaces/[spaceId]/modules — create module
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const spaceId = params?.spaceId;
    if (!communityId || !spaceId) {
      return NextResponse.json({ success: false, error: "IDs obrigatórios" }, { status: 400 });
    }

    // Verify space belongs to community
    const space = await db.space.findFirst({ where: { id: spaceId, communityId } });
    if (!space) {
      return NextResponse.json({ success: false, error: "Canal não encontrado" }, { status: 404 });
    }

    const modules = await db.contentModule.findMany({
      where: { communityId, spaceId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { lessons: true } },
      },
    });

    // Attach progress per module for the current user
    const lessonIds = await db.contentLesson.findMany({
      where: { module: { spaceId, communityId } },
      select: { id: true, moduleId: true },
    });

    const progressRows = await db.contentProgress.findMany({
      where: {
        userId: session.userId,
        lessonId: { in: lessonIds.map((l) => l.id) },
        isCompleted: true,
      },
      select: { lessonId: true },
    });

    const completedSet = new Set(progressRows.map((p) => p.lessonId));

    const moduleMap = new Map<string, { total: number; completed: number }>();
    for (const l of lessonIds) {
      const entry = moduleMap.get(l.moduleId) ?? { total: 0, completed: 0 };
      entry.total += 1;
      if (completedSet.has(l.id)) entry.completed += 1;
      moduleMap.set(l.moduleId, entry);
    }

    const data = modules.map((m) => {
      const prog = moduleMap.get(m.id);
      const total = prog?.total ?? 0;
      const completed = prog?.completed ?? 0;
      return {
        ...m,
        progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
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
    if (!communityId || !spaceId) {
      return NextResponse.json({ success: false, error: "IDs obrigatórios" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const space = await db.space.findFirst({ where: { id: spaceId, communityId } });
    if (!space) {
      return NextResponse.json({ success: false, error: "Canal não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, sortOrder, isPublished } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: "Título é obrigatório" }, { status: 400 });
    }

    const module = await db.contentModule.create({
      data: {
        communityId,
        spaceId,
        title: title.trim(),
        description: description?.trim() || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        isPublished: isPublished ?? false,
      },
      include: { _count: { select: { lessons: true } } },
    });

    return NextResponse.json({ success: true, data: module }, { status: 201 });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
