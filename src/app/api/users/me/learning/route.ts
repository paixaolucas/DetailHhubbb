// =============================================================================
// GET /api/users/me/learning — member's enrolled communities with progress
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req, { session }) => {
  try {
    // Verifica se o usuário tem PlatformMembership ativo
    const platformMembership = await db.platformMembership.findUnique({
      where: { userId: session.userId },
      select: { status: true, currentPeriodEnd: true },
    });

    const hasPlatform =
      platformMembership?.status === "ACTIVE" &&
      (platformMembership.currentPeriodEnd == null ||
        platformMembership.currentPeriodEnd > new Date());

    // Seleciona as comunidades com conteúdo publicado
    // — Platform member: todas as comunidades com módulos publicados
    // — Membership individual: apenas as comunidades em que está inscrito
    let communities;

    if (hasPlatform) {
      communities = await db.community.findMany({
        where: {
          isPublished: true,
          contentModules: { some: { isPublished: true } },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          primaryColor: true,
          logoUrl: true,
          contentModules: {
            where: { isPublished: true },
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  title: true,
                  type: true,
                  videoDuration: true,
                  isFree: true,
                  sortOrder: true,
                  progress: {
                    where: { userId: session.userId },
                    select: { isCompleted: true, progressSecs: true },
                  },
                },
              },
              _count: { select: { lessons: { where: { isPublished: true } } } },
            },
          },
        },
        orderBy: { name: "asc" },
      });
    } else {
      const memberships = await db.communityMembership.findMany({
        where: { userId: session.userId, status: "ACTIVE" },
        include: {
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
              primaryColor: true,
              logoUrl: true,
              contentModules: {
                where: { isPublished: true },
                orderBy: { sortOrder: "asc" },
                include: {
                  lessons: {
                    where: { isPublished: true },
                    orderBy: { sortOrder: "asc" },
                    select: {
                      id: true,
                      title: true,
                      type: true,
                      videoDuration: true,
                      isFree: true,
                      sortOrder: true,
                      progress: {
                        where: { userId: session.userId },
                        select: { isCompleted: true, progressSecs: true },
                      },
                    },
                  },
                  _count: { select: { lessons: { where: { isPublished: true } } } },
                },
              },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      });
      communities = memberships.map((m) => m.community);
    }

    // Calculate progress per community
    const data = communities.map((community) => {
      let totalLessons = 0;
      let completedLessons = 0;

      const modules = community.contentModules.map((module) => {
        const lessons = module.lessons.map((lesson) => {
          totalLessons++;
          const prog = lesson.progress[0];
          if (prog?.isCompleted) completedLessons++;
          return {
            id: lesson.id,
            title: lesson.title,
            type: lesson.type,
            duration: lesson.videoDuration
              ? formatDuration(lesson.videoDuration)
              : null,
            completed: prog?.isCompleted ?? false,
            progressSecs: prog?.progressSecs ?? 0,
            isFree: lesson.isFree,
          };
        });

        const modCompleted = lessons.filter((l) => l.completed).length;
        const modProgress = lessons.length > 0 ? Math.round((modCompleted / lessons.length) * 100) : 0;

        return {
          id: module.id,
          title: module.title,
          progress: modProgress,
          lessons,
        };
      });

      const progress =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        communityId: community.id,
        communityName: community.name,
        communitySlug: community.slug,
        communityColor: community.primaryColor,
        communityLogoUrl: community.logoUrl,
        totalLessons,
        completedLessons,
        progress,
        joinedAt: new Date(),
        modules,
      };
    });

    // Overall stats
    const totalLessons = data.reduce((s, c) => s + c.totalLessons, 0);
    const completedLessons = data.reduce((s, c) => s + c.completedLessons, 0);

    // Estimate hours watched (avg 10 min per lesson)
    const hoursWatched = Math.round((completedLessons * 10) / 60);

    return NextResponse.json({
      success: true,
      data: {
        communities: data,
        stats: {
          totalCommunities: data.length,
          completedLessons,
          totalLessons,
          hoursWatched,
        },
      },
    });
  } catch (error) {
    console.error("[Users:me:learning GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
