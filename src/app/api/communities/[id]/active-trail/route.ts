// =============================================================================
// GET /api/communities/[slug]/active-trail
// Returns the user's most recently active module within a community's COURSE
// spaces. Used by the trilhas page to render the "Continue estudando" hero.
// [id] param is treated as the community SLUG (same convention as /overview,
// /feed, /lives routes).
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (_req, { session, params }) => {
  try {
    const slug = params?.id;
    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Slug obrigatório" },
        { status: 400 }
      );
    }

    // 1. Resolve community by slug
    const community = await db.community.findUnique({
      where: { slug },
      select: { id: true, isPublished: true },
    });

    if (!community) {
      return NextResponse.json(
        { success: false, error: "Comunidade não encontrada" },
        { status: 404 }
      );
    }

    // 2. Find the most recent ContentProgress for this user inside this
    //    community's modules (filter through communityId on ContentModule).
    //    Space type guard: only modules linked to a COURSE space (or modules
    //    without a space that still belong to this community).
    const progress = await db.contentProgress.findFirst({
      where: {
        userId: session.userId,
        lesson: {
          module: {
            communityId: community.id,
            space: { type: "COURSE" },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                title: true,
                sortOrder: true,
                isLocked: true,
                _count: { select: { lessons: true } },
                space: { select: { id: true, slug: true } },
              },
            },
          },
        },
      },
    });

    // 3. No progress found — the trilhas page renders a "começar" CTA instead
    if (!progress) {
      return NextResponse.json({ success: true, data: null });
    }

    const mod = progress.lesson.module;

    // 4. Count how many lessons in this module the user has already completed
    const completedLessons = await db.contentProgress.count({
      where: {
        userId: session.userId,
        completedAt: { not: null },
        lesson: { moduleId: mod.id },
      },
    });

    const totalLessons = mod._count.lessons;
    const percentComplete =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          moduleId: mod.id,
          moduleTitle: mod.title,
          moduleSortOrder: mod.sortOrder,
          isLocked: mod.isLocked,
          spaceSlug: mod.space?.slug ?? null,
          currentLessonId: progress.lesson.id,
          currentLessonTitle: progress.lesson.title,
          percentComplete,
          completedLessons,
          totalLessons,
        },
      },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  } catch (error) {
    console.error("[active-trail] error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
});
