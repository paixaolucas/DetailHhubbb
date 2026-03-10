// =============================================================================
// GET  /api/communities/[id]/badges — list badges (public)
// POST /api/communities/[id]/badges — create badge (owner or SUPER_ADMIN)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;
    if (!communityId) {
      return NextResponse.json(
        { success: false, error: "Community ID required" },
        { status: 400 }
      );
    }

    const badges = await db.badge.findMany({
      where: {
        OR: [{ communityId }, { communityId: null }],
        isActive: true,
      },
      orderBy: [{ communityId: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, data: badges });
  } catch (error) {
    console.error("[Community Badges GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

const createBadgeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  icon: z.string().min(1).max(10),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  requirement: z.record(z.unknown()).optional(),
});

export const POST = withAuth(async (req: NextRequest, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json(
        { success: false, error: "Community ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createBadgeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const badge = await db.badge.create({
      data: {
        communityId,
        name: parsed.data.name,
        description: parsed.data.description,
        icon: parsed.data.icon,
        color: parsed.data.color ?? "#8B5CF6",
        requirement: (parsed.data.requirement ?? {}) as Record<string, string>,
      },
    });

    return NextResponse.json({ success: true, data: badge }, { status: 201 });
  } catch (error) {
    console.error("[Community Badges POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
