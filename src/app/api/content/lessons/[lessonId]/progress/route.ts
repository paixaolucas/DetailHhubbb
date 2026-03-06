// =============================================================================
// PATCH /api/content/lessons/[lessonId]/progress — mark lesson progress
// Requires active membership in the lesson's community
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  isCompleted: z.boolean().optional(),
  progressSecs: z.number().int().min(0).optional(),
});

export const PATCH = withAuth(async (req, { session, params }) => {
  try {
    const lessonId = params?.lessonId;
    if (!lessonId) {
      return NextResponse.json({ success: false, error: "Lesson ID required" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 422 });
    }

    // Find lesson and its community via module
    const lesson = await db.contentLesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        isFree: true,
        module: { select: { communityId: true } },
      },
    });

    if (!lesson) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 });
    }

    // Verify active membership (free lessons are accessible to anyone authenticated)
    if (!lesson.isFree) {
      const membership = await db.communityMembership.findUnique({
        where: {
          userId_communityId: {
            userId: session.userId,
            communityId: lesson.module.communityId,
          },
        },
        select: { status: true },
      });

      if (membership?.status !== "ACTIVE") {
        return NextResponse.json(
          { success: false, error: "Active membership required" },
          { status: 403 }
        );
      }
    }

    const updateData: {
      isCompleted?: boolean;
      completedAt?: Date | null;
      progressSecs?: number;
      viewedAt: Date;
    } = { viewedAt: new Date() };

    if (parsed.data.isCompleted !== undefined) {
      updateData.isCompleted = parsed.data.isCompleted;
      updateData.completedAt = parsed.data.isCompleted ? new Date() : null;
    }
    if (parsed.data.progressSecs !== undefined) {
      updateData.progressSecs = parsed.data.progressSecs;
    }

    const progress = await db.contentProgress.upsert({
      where: { userId_lessonId: { userId: session.userId, lessonId } },
      update: updateData,
      create: {
        userId: session.userId,
        lessonId,
        isCompleted: parsed.data.isCompleted ?? false,
        completedAt: parsed.data.isCompleted ? new Date() : null,
        progressSecs: parsed.data.progressSecs ?? 0,
        viewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: progress });
  } catch (error) {
    console.error("[ContentProgress PATCH]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
