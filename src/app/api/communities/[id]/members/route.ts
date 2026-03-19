// =============================================================================
// GET /api/communities/[id]/members — paginated member list
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyMembership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";
import { CommunityMembershipStatus } from "@prisma/client";

export const GET = withAuth(async (req: NextRequest, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
    }

    const isMember = await verifyMembership(session.userId, communityId, session.hasPlatform);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10))
    );
    const statusParam = searchParams.get("status");
    const statusFilter = statusParam && Object.values(CommunityMembershipStatus).includes(statusParam as CommunityMembershipStatus)
      ? (statusParam as CommunityMembershipStatus)
      : undefined;

    const where = {
      communityId,
      ...(statusFilter ? { status: statusFilter } : {}),
    };

    const [memberships, total] = await Promise.all([
      db.communityMembership.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              profile: { select: { bio: true } },
              userBadges: {
                include: { badge: { select: { name: true, icon: true, color: true } } },
                take: 3,
              },
              userPoints: {
                where: { communityId },
                select: { points: true, level: true },
              },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.communityMembership.count({ where }),
    ]);

    // Rename userBadges → badges and userPoints → points for frontend compatibility
    const data = memberships.map((m) => ({
      ...m,
      user: {
        id: m.user.id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        avatarUrl: m.user.avatarUrl,
        profile: m.user.profile,
        badges: m.user.userBadges,
        points: m.user.userPoints,
      },
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[Community Members GET]", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});
