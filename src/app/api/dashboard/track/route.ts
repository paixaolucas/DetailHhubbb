import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (_req, { session }) => {
  const userId = session.userId;

  // Get lessons the user has started but not completed
  const inProgressProgress = await db.contentProgress.findMany({
    where: { userId, isCompleted: false },
    include: {
      lesson: {
        include: {
          module: {
            include: {
              community: { select: { name: true, slug: true, primaryColor: true } },
              lessons: { select: { id: true } },
            },
          },
        },
      },
    },
    take: 6,
    orderBy: { updatedAt: "desc" },
  });

  // Dedupe by module
  const uniqueModuleIds: string[] = [];
  const progressByModule = new Map<string, typeof inProgressProgress[number]>();
  for (const p of inProgressProgress) {
    const modId = p.lesson.module.id;
    if (!progressByModule.has(modId)) {
      progressByModule.set(modId, p);
      uniqueModuleIds.push(modId);
    }
  }

  if (uniqueModuleIds.length === 0) {
    return NextResponse.json({ success: true, data: { modules: [] } });
  }

  // Single query to count completed lessons per module — no N+1
  const completedGroups = await db.contentProgress.groupBy({
    by: ["lessonId"],
    where: {
      userId,
      isCompleted: true,
      lesson: { moduleId: { in: uniqueModuleIds } },
    },
    _count: { _all: true },
  });

  // Map lessonId → moduleId to aggregate counts
  const lessonToModule = new Map<string, string>();
  for (const p of inProgressProgress) {
    lessonToModule.set(p.lesson.id, p.lesson.module.id);
  }

  // Also need lessonIds for completed lessons from the modules
  const completedLessons = await db.contentLesson.findMany({
    where: { moduleId: { in: uniqueModuleIds } },
    select: { id: true, moduleId: true },
  });

  const completedCountPerModule = new Map<string, number>();
  const completedLessonIds = new Set(completedGroups.map((g) => g.lessonId));
  for (const lesson of completedLessons) {
    if (completedLessonIds.has(lesson.id)) {
      completedCountPerModule.set(
        lesson.moduleId,
        (completedCountPerModule.get(lesson.moduleId) ?? 0) + 1
      );
    }
  }

  const modules = uniqueModuleIds.map((modId) => {
    const p = progressByModule.get(modId)!;
    const mod = p.lesson.module;
    const completedLessons = completedCountPerModule.get(modId) ?? 0;
    const totalLessons = mod.lessons.length;
    return {
      id: mod.id,
      title: mod.title,
      coverImageUrl: mod.coverImageUrl,
      community: mod.community,
      totalLessons,
      completedLessons,
      percentComplete: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      nextLesson: {
        id: p.lesson.id,
        title: p.lesson.title,
        type: p.lesson.type as string,
      },
    };
  });

  return NextResponse.json({ success: true, data: { modules } });
});
