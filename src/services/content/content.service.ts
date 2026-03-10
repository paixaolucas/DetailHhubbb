// =============================================================================
// CONTENT SERVICE
// Module and lesson management with drip content support
// =============================================================================

import { db } from "@/lib/db";
import { NotFoundError, ForbiddenError } from "@/types";
import { UserRole, ContentType } from "@prisma/client";
import { z } from "zod";

// =============================================================================
// VALIDATION
// =============================================================================

const createModuleSchema = z.object({
  communityId: z.string().cuid(),
  title: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  sortOrder: z.number().int().default(0),
  unlockAfterDays: z.number().int().min(0).optional(),
});

const createLessonSchema = z.object({
  moduleId: z.string().cuid(),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(ContentType).default(ContentType.VIDEO),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  videoProvider: z.string().optional(),
  videoDuration: z.number().int().min(0).optional(),
  fileUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
  isFree: z.boolean().default(false),
  isDownloadable: z.boolean().default(false),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;

// =============================================================================
// CREATE MODULE
// =============================================================================

export async function createModule(
  userId: string,
  userRole: string,
  input: CreateModuleInput
) {
  await assertCommunityOwnership(userId, userRole, input.communityId);

  return db.contentModule.create({
    data: {
      communityId: input.communityId,
      title: input.title,
      description: input.description,
      sortOrder: input.sortOrder,
      unlockAfterDays: input.unlockAfterDays,
    },
  });
}

// =============================================================================
// CREATE LESSON
// =============================================================================

export async function createLesson(
  userId: string,
  userRole: string,
  input: CreateLessonInput
) {
  const module = await db.contentModule.findUnique({
    where: { id: input.moduleId },
    select: { communityId: true },
  });

  if (!module) throw new NotFoundError("Module not found");

  await assertCommunityOwnership(userId, userRole, module.communityId);

  return db.contentLesson.create({
    data: {
      moduleId: input.moduleId,
      title: input.title,
      description: input.description,
      type: input.type,
      content: input.content,
      videoUrl: input.videoUrl,
      videoProvider: input.videoProvider,
      videoDuration: input.videoDuration,
      fileUrl: input.fileUrl,
      sortOrder: input.sortOrder,
      isFree: input.isFree,
      isDownloadable: input.isDownloadable,
    },
  });
}

// =============================================================================
// GET COMMUNITY CURRICULUM
// =============================================================================

export async function getCommunityCurriculum(
  communityId: string,
  userId?: string
) {
  const modules = await db.contentModule.findMany({
    where: { communityId, isPublished: true },
    orderBy: { sortOrder: "asc" },
    include: {
      lessons: {
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          videoDuration: true,
          sortOrder: true,
          isFree: true,
          viewCount: true,
          completionCount: true,
          ...(userId && {
            progress: {
              where: { userId },
              select: { isCompleted: true, progressSecs: true },
            },
          }),
        },
      },
      _count: { select: { lessons: { where: { isPublished: true } } } },
    },
  });

  // Check membership for drip content
  if (userId) {
    const membership = await db.communityMembership.findUnique({
      where: { userId_communityId: { userId, communityId } },
      select: { joinedAt: true, status: true },
    });

    return modules.map((m) => ({
      ...m,
      isUnlocked:
        !m.unlockAfterDays ||
        !membership ||
        membership.status !== "ACTIVE"
          ? m.unlockAfterDays === null || m.unlockAfterDays === 0
          : daysSince(membership.joinedAt) >= m.unlockAfterDays,
    }));
  }

  return modules.map((m) => ({
    ...m,
    isUnlocked: m.unlockAfterDays === null || m.unlockAfterDays === 0,
  }));
}

// =============================================================================
// TRACK PROGRESS
// =============================================================================

export async function trackLessonProgress(
  userId: string,
  lessonId: string,
  progressSecs: number,
  isCompleted: boolean
): Promise<void> {
  await db.$transaction([
    db.contentProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        progressSecs,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      update: {
        progressSecs,
        isCompleted,
        completedAt: isCompleted ? new Date() : undefined,
      },
    }),

    // Increment view count on first view
    db.contentLesson.update({
      where: { id: lessonId },
      data: {
        viewCount: { increment: 1 },
        ...(isCompleted && { completionCount: { increment: 1 } }),
      },
    }),
  ]);
}

// =============================================================================
// HELPERS
// =============================================================================

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

async function assertCommunityOwnership(
  userId: string,
  userRole: string,
  communityId: string
): Promise<void> {
  if (userRole === UserRole.SUPER_ADMIN) return;

  const influencer = await db.influencer.findUnique({
    where: { userId },
    select: {
      communities: { where: { id: communityId }, select: { id: true } },
    },
  });

  if (!influencer || influencer.communities.length === 0) {
    throw new ForbiddenError("You can only manage content in your own community");
  }
}

export const contentService = {
  createModule,
  createLesson,
  getCommunityCurriculum,
  trackLessonProgress,
};
