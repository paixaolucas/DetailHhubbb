// =============================================================================
// GET /api/influencers/me/milestones
// Returns achieved milestones, pending bonuses and progress toward next ones.
// Also triggers a check for any newly unlocked milestones.
// Only INFLUENCER_ADMIN.
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import {
  checkAndAwardMilestones,
  getMilestoneProgress,
} from "@/services/milestone/milestone.service";

export const GET = withRole(UserRole.INFLUENCER_ADMIN)(async (_req, { session }) => {
  const influencer = await db.influencer.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!influencer) {
    return NextResponse.json(
      { success: false, error: "Perfil de influenciador não encontrado" },
      { status: 404 }
    );
  }

  // Check and award any newly unlocked milestones (idempotent)
  const newlyAwarded = await checkAndAwardMilestones(influencer.id);

  // Full progress snapshot
  const data = await getMilestoneProgress(influencer.id);

  // Pending bonus total
  const pendingBonus = await db.influencerMilestone.aggregate({
    where: { influencerId: influencer.id, bonusPaid: false },
    _sum: { bonusAmount: true },
  });

  return NextResponse.json({
    success: true,
    data: {
      ...data,
      newlyAwarded: newlyAwarded.map((m) => ({ type: m.type, bonusAmount: m.bonusAmount })),
      pendingBonusTotal: Number(pendingBonus._sum.bonusAmount ?? 0),
    },
  });
});
