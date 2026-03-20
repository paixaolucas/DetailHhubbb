// =============================================================================
// POST /...lessons/[lessonId]/progress — mark lesson as completed
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const POST = withAuth(async (req, { session, params }) => {
  try {
    const lessonId = params?.lessonId;
    const moduleId = params?.moduleId;
    if (!lessonId || !moduleId) {
      return NextResponse.json({ success: false, error: "IDs obrigatórios" }, { status: 400 });
    }

    // Verify lesson exists
    const lesson = await db.contentLesson.findFirst({ where: { id: lessonId, moduleId } });
    if (!lesson) {
      return NextResponse.json({ success: false, error: "Aula não encontrada" }, { status: 404 });
    }

    const progress = await db.contentProgress.upsert({
      where: { userId_lessonId: { userId: session.userId, lessonId } },
      update: {
        isCompleted: true,
        completedAt: new Date(),
        viewedAt: new Date(),
      },
      create: {
        userId: session.userId,
        lessonId,
        isCompleted: true,
        completedAt: new Date(),
        viewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: progress });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
