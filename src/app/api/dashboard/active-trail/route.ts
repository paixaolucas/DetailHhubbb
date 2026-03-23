// =============================================================================
// GET /api/dashboard/active-trail — returns the single most-active in-progress trail
// Only returns a result when 0 < percentComplete < 100
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (_req, { session }) => {
  const userId = session.userId;

  // Find the most recently updated in-progress lesson
  const latest = await db.contentProgress.findFirst({
    where: { userId, isCompleted: false },
    orderBy: { updatedAt: "desc" },
    select: {
      lesson: {
        select: {
          id: true,
          title: true,
          module: {
            select: {
              id: true,
              title: true,
              coverImageUrl: true,
              lessons: { select: { id: true } },
              community: {
                select: { name: true, slug: true, primaryColor: true },
              },
            },
          },
        },
      },
    },
  });

  if (!latest) {
    return NextResponse.json({ success: true, data: null });
  }

  const mod = latest.lesson.module;
  const totalLessons = mod.lessons.length;

  if (totalLessons === 0) {
    return NextResponse.json({ success: true, data: null });
  }

  // Count completed lessons for this module
  const completedCount = await db.contentProgress.count({
    where: {
      userId,
      isCompleted: true,
      lesson: { moduleId: mod.id },
    },
  });

  const percentComplete = Math.round((completedCount / totalLessons) * 100);

  // Only return if actually in progress (not 0% and not 100%)
  if (percentComplete === 0 || percentComplete >= 100) {
    return NextResponse.json({ success: true, data: null });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: mod.id,
      title: mod.title,
      coverImageUrl: mod.coverImageUrl,
      community: mod.community,
      totalLessons,
      completedLessons: completedCount,
      percentComplete,
      currentLesson: {
        id: latest.lesson.id,
        title: latest.lesson.title,
      },
    },
  });
});
