// =============================================================================
// PATCH /api/communities/[id]/influencer
// SUPER_ADMIN only — change the influencer of a community and promote user
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const PATCH = withRole(UserRole.SUPER_ADMIN)(
  async (req: NextRequest, { params }: { session: any; params?: Record<string, string> }) => {
    try {
      const { influencerUserId } = await req.json();
      if (!influencerUserId) {
        return NextResponse.json({ success: false, error: "influencerUserId required" }, { status: 400 });
      }

      const communityId = params?.id as string;

      // Find or create Influencer record
      let influencer = await db.influencer.findUnique({
        where: { userId: influencerUserId },
        select: { id: true },
      });
      if (!influencer) {
        const user = await db.user.findUnique({ where: { id: influencerUserId }, select: { firstName: true, lastName: true } });
        if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        influencer = await db.influencer.create({
          data: { userId: influencerUserId, displayName: `${user.firstName} ${user.lastName ?? ""}`.trim() },
          select: { id: true },
        });
      }

      // Promote user role
      await db.user.update({ where: { id: influencerUserId }, data: { role: UserRole.INFLUENCER_ADMIN } });

      // Update community
      await db.community.update({ where: { id: communityId }, data: { influencerId: influencer.id } });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[Community Influencer PATCH]", error);
      return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
  }
);
