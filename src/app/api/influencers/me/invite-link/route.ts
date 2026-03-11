// =============================================================================
// GET /api/influencers/me/invite-link
// Returns the influencer's personalized invite link and referral stats.
// Only accessible by INFLUENCER_ADMIN.
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const GET = withRole(UserRole.INFLUENCER_ADMIN)(async (_req, { session }) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  // Get the influencer's referralCode from their User record
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      referralCode: true,
      influencerProfile: { select: { id: true } },
    },
  });

  if (!user?.influencerProfile) {
    return NextResponse.json(
      { success: false, error: "Perfil de influenciador não encontrado" },
      { status: 404 }
    );
  }

  const influencerId = user.influencerProfile.id;
  const inviteLink = user.referralCode
    ? `${appUrl}/convite/${user.referralCode}`
    : null;

  // Stats: total members referred and active members referred
  const [totalReferred, activeReferred] = await Promise.all([
    db.platformMembership.count({
      where: { referredByInfluencerId: influencerId },
    }),
    db.platformMembership.count({
      where: { referredByInfluencerId: influencerId, status: "ACTIVE" },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      inviteLink,
      referralCode: user.referralCode,
      stats: {
        totalReferred,
        activeReferred,
      },
    },
  });
});
