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

    // Dashboard view: ordered by member opt-in first, includes isMember flag
    if (view === "dashboard") {
      const { db } = await import("@/lib/db");
      const session = await getSessionFromRequest(req);
      const userId = session?.userId ?? null;

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
          influencer: {
            select: {
              displayName: true,
              user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
          optIns: userId
            ? { where: { userId }, select: { id: true }, take: 1 }
            : false,
        },
        orderBy: { memberCount: "desc" },
        take: 20,
      });

      const data = communities
        .map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          shortDescription: c.shortDescription,
          logoUrl: c.logoUrl,
          bannerUrl: c.bannerUrl,
          primaryColor: c.primaryColor,
          memberCount: c.memberCount,
          influencer: c.influencer,
          isMember: userId ? (c.optIns as { id: string }[]).length > 0 : false,
        }))
        .sort((a, b) => {
          if (a.isMember === b.isMember) return b.memberCount - a.memberCount;
          return a.isMember ? -1 : 1;
        });

      return NextResponse.json({ success: true, communities: data });
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
