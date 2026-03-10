// =============================================================================
// PUT/DELETE /api/content/lessons/[lessonId]
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { AppError, ForbiddenError, NotFoundError } from "@/types";
import { UserRole, ContentType } from "@prisma/client";
import { z } from "zod";

const updateLessonSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(ContentType).optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  videoProvider: z.string().optional(),
  videoDuration: z.number().int().min(0).optional().nullable(),
  fileUrl: z.string().url().optional().or(z.literal("")).nullable(),
  sortOrder: z.number().int().optional(),
  isFree: z.boolean().optional(),
  isDownloadable: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

async function assertLessonOwnership(userId: string, userRole: string, lessonId: string) {
  if (userRole === UserRole.SUPER_ADMIN) return;
  const lesson = await db.contentLesson.findUnique({
    where: { id: lessonId },
    select: {
      module: {
        select: { community: { select: { influencer: { select: { userId: true } } } } },
      },
    },
  });
  if (!lesson) throw new NotFoundError("Lesson not found");
  if (lesson.module.community.influencer.userId !== userId) {
    throw new ForbiddenError("You can only manage lessons in your own community");
  }
}

export const PUT = withAuth(async (req, { session, params }) => {
  try {
    const lessonId = params?.lessonId;
    if (!lessonId) return NextResponse.json({ success: false, error: "lessonId required" }, { status: 400 });

    await assertLessonOwnership(session.userId, session.role, lessonId);

    const body = await req.json();
    const parsed = updateLessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 422 });
    }

    const updated = await db.contentLesson.update({
      where: { id: lessonId },
      data: {
        ...parsed.data,
        videoUrl: parsed.data.videoUrl === "" ? null : parsed.data.videoUrl,
        fileUrl: parsed.data.fileUrl === "" ? null : parsed.data.fileUrl,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req, { session, params }) => {
  try {
    const lessonId = params?.lessonId;
    if (!lessonId) return NextResponse.json({ success: false, error: "lessonId required" }, { status: 400 });

    await assertLessonOwnership(session.userId, session.role, lessonId);
    await db.contentLesson.delete({ where: { id: lessonId } });

    return NextResponse.json({ success: true, message: "Lesson deleted" });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
