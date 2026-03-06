// =============================================================================
// POST /api/communities/[id]/badges/award
// Concede uma badge a um membro (community owner ou SUPER_ADMIN)
// Body: { badgeId: string, userId: string }
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

const awardSchema = z.object({
  badgeId: z.string().cuid(),
  userId: z.string().cuid(),
});

export const POST = withAuth(async (req, { session, params }) => {
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
    const parsed = awardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const { badgeId, userId } = parsed.data;

    // Verify badge belongs to this community or is platform-wide
    const badge = await db.badge.findFirst({
      where: { id: badgeId, OR: [{ communityId }, { communityId: null }], isActive: true },
    });
    if (!badge) {
      return NextResponse.json({ success: false, error: "Badge not found" }, { status: 404 });
    }

    // Verify target user has active membership in this community
    const membership = await db.communityMembership.findUnique({
      where: { userId_communityId: { userId, communityId } },
      select: { status: true },
    });
    if (membership?.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "User is not an active member of this community" },
        { status: 400 }
      );
    }

    // Upsert to handle re-awards gracefully
    const userBadge = await db.userBadge.upsert({
      where: { userId_badgeId_communityId: { userId, badgeId, communityId } },
      update: { awardedAt: new Date() },
      create: { userId, badgeId, communityId, awardedAt: new Date() },
      include: {
        badge: { select: { name: true, icon: true, color: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ success: true, data: userBadge }, { status: 201 });
  } catch (error) {
    console.error("[Badge Award POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
