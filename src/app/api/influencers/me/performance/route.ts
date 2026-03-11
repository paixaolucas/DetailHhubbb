// =============================================================================
// GET /api/influencers/me/performance
// Returns the current month's PP components (live) + last 6 months history.
// Only accessible by INFLUENCER_ADMIN.
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import {
  calculateInfluencerPP,
  calculatePoolShare,
} from "@/services/performance/performance.service";

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

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1–12

  // ── Current month PP (live calculation) ────────────────────────────────────
  const current = await calculateInfluencerPP(influencer.id, year, month);
  const { poolShare, rank, totalInfluencers } = await calculatePoolShare(
    influencer.id,
    current.totalPP,
    year,
    month
  );

  // ── Last 6 months history (from stored scores) ──────────────────────────────
  const history = await db.influencerMonthlyScore.findMany({
    where: {
      influencerId: influencer.id,
      OR: [
        { year: year - 1, month: { gte: month + 1 } }, // same months last year
        { year, month: { lt: month } },                 // earlier this year
      ],
    },
    orderBy: [{ year: "asc" }, { month: "asc" }],
    select: {
      year: true,
      month: true,
      totalPP: true,
      scoreViews: true,
      scoreEngagement: true,
      scoreNewMembers: true,
      scoreRetention: true,
      scoreDeliveries: true,
      poolShare: true,
    },
    take: 6,
  });

  const historyFormatted = history.map((h) => ({
    label: new Date(h.year, h.month - 1, 1).toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    }),
    totalPP: h.totalPP,
    scoreViews: h.scoreViews,
    scoreEngagement: h.scoreEngagement,
    scoreNewMembers: h.scoreNewMembers,
    scoreRetention: h.scoreRetention,
    scoreDeliveries: h.scoreDeliveries,
    poolShare: h.poolShare,
  }));

  return NextResponse.json({
    success: true,
    data: {
      current: {
        ...current,
        poolShare,
        poolSharePct: parseFloat((poolShare * 100).toFixed(2)),
        rank,
        totalInfluencers,
        period: { year, month },
      },
      history: historyFormatted,
    },
  });
});
