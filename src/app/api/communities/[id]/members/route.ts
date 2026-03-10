// =============================================================================
// GET /api/communities/[id]/members — paginated member list
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";

export const GET = withAuth(async (req: NextRequest, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10))
    );

    const [memberships, total] = await Promise.all([
      db.communityMembership.findMany({
        where: { communityId },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
        },
        orderBy: { joinedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.communityMembership.count({ where: { communityId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: memberships,
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
