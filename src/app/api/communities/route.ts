// =============================================================================
// GET /api/communities — list public communities
// POST /api/communities — create community (SUPER_ADMIN only)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, withPermission, withRole, getSessionFromRequest } from "@/middleware/auth.middleware";
import {
  listPublicCommunities,
  listAllCommunities,
  createCommunity,
} from "@/services/community/community.service";
import { createCommunitySchema } from "@/lib/validations/community";
import { Permissions } from "@/lib/auth/rbac";
import { AppError } from "@/types";
import { ZodError } from "zod";
import { UserRole } from "@prisma/client";
import { trackEvent } from "@/services/analytics/analytics.service";

// Shuffle determinístico com seed (Fisher-Yates + LCG)
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = Math.imul(s, 1664525) + 1013904223;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "12"))
    );
    const search = searchParams.get("search") ?? undefined;
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const isAdmin = searchParams.get("admin") === "true";
    const view = searchParams.get("view");

    if (isAdmin) {
      const session = await getSessionFromRequest(req);
      if (session?.role === UserRole.SUPER_ADMIN) {
        const result = await listAllCommunities({ page, pageSize, search });
        return NextResponse.json({ success: true, ...result }, { status: 200 });
      }
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Sidebar view: retorna apenas comunidades do membro, campos mínimos
    if (view === "sidebar") {
      const { db } = await import("@/lib/db");
      const session = await getSessionFromRequest(req);
      const userId = session?.userId ?? null;

      if (!userId) {
        return NextResponse.json(
          { success: true, communities: [] },
          { headers: { "Cache-Control": "private, max-age=60" } }
        );
      }

      const optIns = await db.communityOptIn.findMany({
        where: { userId },
        include: {
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              primaryColor: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      });

      const communities = optIns.map((o) => o.community);

      return NextResponse.json(
        { success: true, communities },
        { headers: { "Cache-Control": "private, max-age=60" } }
      );
    }

    // Explore view: enriched community cards for the discovery page
    if (view === "explore") {
      const { db } = await import("@/lib/db");
      const session = await getSessionFromRequest(req);
      const userId = session?.userId ?? null;

      const sort = searchParams.get("sort") ?? "popular";
      const now = new Date();

      const orderBy =
        sort === "new"
          ? { createdAt: "desc" as const }
          : { memberCount: "desc" as const }; // popular + active both sort by memberCount for now

      const communities = await db.community.findMany({
        where: {
          isPublished: true,
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { shortDescription: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          logoUrl: true,
          bannerUrl: true,
          primaryColor: true,
          memberCount: true,
          createdAt: true,
          influencer: {
            select: {
              displayName: true,
              user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
          spaces: {
            where: { type: "COURSE" },
            select: { id: true },
          },
          ...(userId
            ? { optIns: { where: { userId }, select: { id: true }, take: 1 } }
            : {}),
          liveSessions: {
            where: {
              status: { in: ["LIVE", "SCHEDULED"] },
              scheduledAt: { gte: now },
            },
            select: { id: true },
          },
        },
        orderBy,
        take: 50,
      });

      const mapped = communities.map((c) => {
        const optIns = (c as any).optIns as { id: string }[] | undefined;
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          shortDescription: c.shortDescription,
          logoUrl: c.logoUrl,
          bannerUrl: c.bannerUrl,
          primaryColor: c.primaryColor,
          memberCount: c.memberCount,
          createdAt: c.createdAt,
          influencer: c.influencer,
          moduleSpaceCount: c.spaces.length,
          livesCount: c.liveSessions.length,
          isMember: userId ? (optIns?.length ?? 0) > 0 : false,
        };
      });

      return NextResponse.json({ success: true, communities: mapped });
    }

    // Dashboard view: ordered by member opt-in first, includes isMember flag
    if (view === "dashboard") {
      const { db } = await import("@/lib/db");
      const session = await getSessionFromRequest(req);
      const userId = session?.userId ?? null;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // 1. Busca comunidades publicadas
      const communities = await db.community.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          logoUrl: true,
          bannerUrl: true,
          primaryColor: true,
          memberCount: true,
          createdAt: true,
          influencer: {
            select: {
              displayName: true,
              user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
          ...(userId ? { optIns: { where: { userId }, select: { id: true }, take: 1 } } : {}),
        },
        orderBy: { memberCount: "desc" },
        take: 50,
      });

      const communityIds = communities.map((c) => c.id);

      // 2. Engajamento — isolado: se falhar, segue sem personalização
      const engagementMap = new Map<string, number>();
      if (userId) {
        try {
          const engagementRaw = await db.analyticsEvent.groupBy({
            by: ["communityId"],
            where: {
              userId,
              communityId: { not: null },
              createdAt: { gte: ninetyDaysAgo },
              type: { in: ["PAGE_VIEW", "CONTENT_VIEW", "CONTENT_COMPLETE", "LIVE_SESSION_JOIN", "POST_CREATE", "CHAT_MESSAGE"] },
            },
            _count: { id: true },
          });
          for (const e of engagementRaw) {
            if (e.communityId) engagementMap.set(e.communityId, e._count.id);
          }
        } catch {
          // Falha silenciosa — comunidades aparecem sem personalização
        }
      }

      // 3. Novos conteúdos (últimos 7 dias) — ContentLesson não tem communityId direto,
      //    por isso agrupamos por ContentModule.communityId (conta módulos, não lições)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newLessonsMap = new Map<string, number>();
      try {
        const newLessonsRaw = await db.contentModule.groupBy({
          by: ["communityId"],
          where: {
            communityId: { in: communityIds },
            isPublished: true,
            createdAt: { gte: sevenDaysAgo },
          },
          _count: { id: true },
        });
        for (const l of newLessonsRaw) {
          newLessonsMap.set(l.communityId, l._count.id);
        }
      } catch {
        // Falha silenciosa — newContentCount padrão 0
      }

      // 4. Lives hoje (status LIVE ou SCHEDULED com scheduledAt no dia corrente)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const liveTodaySet = new Set<string>();
      try {
        const livesToday = await db.liveSession.findMany({
          where: {
            communityId: { in: communityIds },
            OR: [
              { status: "LIVE" },
              { status: "SCHEDULED", scheduledAt: { gte: startOfDay, lte: endOfDay } },
            ],
          },
          select: { communityId: true },
        });
        for (const l of livesToday) {
          liveTodaySet.add(l.communityId);
        }
      } catch {
        // Falha silenciosa — hasLiveToday padrão false
      }

      const dailySeed = Math.floor(Date.now() / 86_400_000);

      const mapped = communities.map((c) => {
        const optIns = (c as any).optIns as { id: string }[] | undefined;
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          shortDescription: c.shortDescription,
          logoUrl: c.logoUrl,
          bannerUrl: c.bannerUrl,
          primaryColor: c.primaryColor,
          memberCount: c.memberCount,
          influencer: c.influencer,
          isMember: userId ? (optIns?.length ?? 0) > 0 : false,
          isNew: c.createdAt >= thirtyDaysAgo,
          engagementCount: engagementMap.get(c.id) ?? 0,
          newContentCount: newLessonsMap.get(c.id) ?? 0,
          hasLiveToday: liveTodaySet.has(c.id),
        };
      });

      const withEngagement = mapped
        .filter((c) => engagementMap.has(c.id))
        .sort((a, b) => b.engagementCount - a.engagementCount);

      const noEngagement = seededShuffle(
        mapped.filter((c) => !engagementMap.has(c.id)),
        dailySeed
      );

      return NextResponse.json({
        success: true,
        communities: [...withEngagement, ...noEngagement].slice(0, 20),
      });
    }

    const result = await listPublicCommunities({ page, pageSize, search, tags });

    return NextResponse.json(
      { success: true, ...result },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
      }
    );
  } catch (error) {
    console.error("[Communities:GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withRole(UserRole.SUPER_ADMIN)(
  async (req, { session }) => {
    try {
      const body = await req.json();
      const { influencerUserId, ...rest } = body;
      const input = createCommunitySchema.parse(rest);
      const community = await createCommunity(session.userId, input, influencerUserId);

      trackEvent({ userId: session.userId, type: "COMMUNITY_CREATE", properties: { communityId: community.id } });

      return NextResponse.json(
        { success: true, data: community },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: error.errors },
          { status: 422 }
        );
      }
      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.statusCode }
        );
      }
      console.error("[Communities:POST]", error);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
