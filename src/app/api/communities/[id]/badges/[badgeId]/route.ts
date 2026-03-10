// =============================================================================
// PATCH  /api/communities/[id]/badges/[badgeId] — update badge
// DELETE /api/communities/[id]/badges/[badgeId] — deactivate badge
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

const updateBadgeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  icon: z.string().min(1).max(10).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const PATCH = withAuth(async (req: NextRequest, { session, params }) => {
  try {
    const communityId = params?.id;
    const badgeId = params?.badgeId;
    if (!communityId || !badgeId) {
      return NextResponse.json(
        { success: false, error: "Community ID and Badge ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.badge.findFirst({
      where: { id: badgeId, communityId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Badge not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateBadgeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const badge = await db.badge.update({
      where: { id: badgeId },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: badge });
  } catch (error) {
    console.error("[Community Badges PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req: NextRequest, { session, params }) => {
  try {
    const communityId = params?.id;
    const badgeId = params?.badgeId;
    if (!communityId || !badgeId) {
      return NextResponse.json(
        { success: false, error: "Community ID and Badge ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.badge.findFirst({
      where: { id: badgeId, communityId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Badge not found" }, { status: 404 });
    }

    await db.badge.update({ where: { id: badgeId }, data: { isActive: false } });

    return NextResponse.json({ success: true, message: "Badge deactivated" });
  } catch (error) {
    console.error("[Community Badges DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
