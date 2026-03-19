// =============================================================================
// PATCH /api/content/lessons/[lessonId]/progress — mark lesson progress
// Requires active membership in the lesson's community
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";
import { awardPoints } from "@/lib/points";
import { createNotification } from "@/services/notification/notification.service";

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
        module: {
          select: {
            id: true,
            sortOrder: true,
            communityId: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 });
    }

    // Sequential module lock: if module.sortOrder > 0, the previous module must be complete
    if (lesson.module.sortOrder > 0) {
      const prevModule = await db.contentModule.findFirst({
        where: { communityId: lesson.module.communityId, sortOrder: lesson.module.sortOrder - 1 },
        select: {
          lessons: { where: { isPublished: true }, select: { id: true } },
        },
      });
      if (prevModule && prevModule.lessons.length > 0) {
        const prevLessonIds = prevModule.lessons.map((l) => l.id);
        const completedCount = await db.contentProgress.count({
          where: { userId: session.userId, lessonId: { in: prevLessonIds }, isCompleted: true },
        });
        if (completedCount < prevLessonIds.length) {
          return NextResponse.json(
            { success: false, error: "Complete o módulo anterior para desbloquear este conteúdo." },
            { status: 403 }
          );
        }
      }
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

    const wasAlreadyCompleted = await db.contentProgress.findUnique({
      where: { userId_lessonId: { userId: session.userId, lessonId } },
      select: { isCompleted: true },
    });

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

    // Check if module was just fully completed → +25 pts (idempotent per module)
    if (parsed.data.isCompleted && !wasAlreadyCompleted?.isCompleted) {
      const communityId = lesson.module.communityId;
      // Find the module's ID and all its lessons
      const fullLesson = await db.contentLesson.findUnique({
        where: { id: lessonId },
        select: { moduleId: true, module: { select: { id: true } } },
      });
      if (fullLesson) {
        const moduleId = fullLesson.moduleId;
        const [allLessons, completedLessons] = await Promise.all([
          db.contentLesson.count({ where: { moduleId, isPublished: true } }),
          db.contentProgress.count({
            where: {
              userId: session.userId,
              isCompleted: true,
              lesson: { moduleId },
            },
          }),
        ]);

        if (allLessons > 0 && completedLessons >= allLessons) {
          // All lessons done — award module completion points (idempotent)
          awardPoints({
            userId: session.userId,
            communityId,
            amount: 25,
            reason: `completou o módulo`,
            eventType: "MODULE_COMPLETE",
            dailyLimit: 999,
            metadata: { idempotencyKey: `module_${moduleId}` },
          }).catch(() => {});

          // Check if ALL community modules are now complete → issue certificate
          const allCommunityModules = await db.contentModule.findMany({
            where: { communityId, isPublished: true },
            select: { lessons: { where: { isPublished: true }, select: { id: true } } },
          });
          const allCommunityLessonIds = allCommunityModules.flatMap((m) => m.lessons.map((l) => l.id));
          if (allCommunityLessonIds.length > 0) {
            const totalCompleted = await db.contentProgress.count({
              where: { userId: session.userId, lessonId: { in: allCommunityLessonIds }, isCompleted: true },
            });
            if (totalCompleted >= allCommunityLessonIds.length) {
              // Issue certificate if not already done
              const existingCert = await db.certificate.findFirst({
                where: { userId: session.userId, communityId },
                select: { id: true },
              });
              if (!existingCert) {
                const community = await db.community.findUnique({
                  where: { id: communityId },
                  select: { name: true, influencer: { select: { displayName: true } } },
                });
                const cert = await db.certificate.create({
                  data: {
                    userId: session.userId,
                    communityId,
                    title: `Certificado de Conclusão — ${community?.name ?? "Trilha"}`,
                    issuerName: community?.influencer?.displayName ?? "Detailer'HUB",
                    completedAt: new Date(),
                  },
                });
                createNotification({
                  recipientId: session.userId,
                  type: "ACHIEVEMENT_UNLOCKED",
                  title: "🎓 Certificado emitido!",
                  body: `Parabéns! Você concluiu todos os módulos de ${community?.name} e recebeu seu certificado.`,
                  link: `/certificates/${cert.code}`,
                }).catch(() => {});
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, data: progress });
  } catch (error) {
    console.error("[ContentProgress PATCH]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
