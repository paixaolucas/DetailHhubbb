// =============================================================================
// GET /api/content/modules?communityId=xxx
// POST /api/content/modules
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { contentService } from "@/services/content/content.service";
import { db } from "@/lib/db";
import { AppError } from "@/types";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const createModuleSchema = z.object({
  communityId: z.string().cuid(),
  title: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  sortOrder: z.number().int().default(0),
  unlockAfterDays: z.number().int().min(0).optional(),
});

export const GET = withAuth(async (req, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");

    if (!communityId) {
      return NextResponse.json(
        { success: false, error: "communityId is required" },
        { status: 400 }
      );
    }

    const modules = await db.contentModule.findMany({
      where: { communityId },
      orderBy: { sortOrder: "asc" },
      include: {
        lessons: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            type: true,
            videoDuration: true,
            sortOrder: true,
            isPublished: true,
            isFree: true,
            viewCount: true,
            completionCount: true,
          },
        },
        _count: { select: { lessons: true } },
      },
    });

    // Admins/influencers see all modules unlocked
    if (session.role === UserRole.SUPER_ADMIN || session.role === UserRole.INFLUENCER_ADMIN) {
      return NextResponse.json({ success: true, data: modules.map((m) => ({ ...m, isLocked: false })) });
    }

    // For members: compute sequential unlock (previous module must be fully complete)
    const lessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
    const completedSet = new Set<string>();
    if (lessonIds.length > 0) {
      const completed = await db.contentProgress.findMany({
        where: { userId: session.userId, lessonId: { in: lessonIds }, isCompleted: true },
        select: { lessonId: true },
      });
      for (const c of completed) completedSet.add(c.lessonId);
    }

    const result = modules.map((mod, idx) => {
      if (idx === 0) return { ...mod, isLocked: false };
      // Locked if previous module has at least one unfinished published lesson
      const prevLessons = modules[idx - 1].lessons.filter((l) => l.isPublished);
      const prevComplete = prevLessons.length > 0 && prevLessons.every((l) => completedSet.has(l.id));
      return { ...mod, isLocked: !prevComplete };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[Content:modules GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = createModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const createdModule = await contentService.createModule(
      session.userId,
      session.role,
      parsed.data
    );

    return NextResponse.json({ success: true, data: createdModule }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("[Content:modules POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
