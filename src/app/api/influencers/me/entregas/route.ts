// =============================================================================
// GET /api/influencers/me/entregas?year=X&month=X
// Returns full delivery checklist for a given month:
//   - Auto-tracked: videos, lives, forum interactions
//   - Manual: external mentions, bio link confirmed
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { calculateInfluencerPP } from "@/services/performance/performance.service";

const REQUIRED = { videos: 2, lives: 1, forumInteractions: 4, mentions: 2 };

export const GET = withRole(UserRole.INFLUENCER_ADMIN)(async (req, { session }) => {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));

  if (month < 1 || month > 12 || year < 2024 || year > now.getFullYear() + 1) {
    return NextResponse.json({ success: false, error: "Período inválido" }, { status: 400 });
  }

  const influencer = await db.influencer.findUnique({
    where: { userId: session.userId },
    select: { id: true, bioLinkConfirmed: true },
  });

  if (!influencer) {
    return NextResponse.json(
      { success: false, error: "Perfil de influenciador não encontrado" },
      { status: 404 }
    );
  }

  // Auto-tracked: reuse PP component calculation for the specific month
  const pp = await calculateInfluencerPP(influencer.id, year, month);

  // Manual: external mentions this month
  const mentions = await db.influencerExternalMention.findMany({
    where: { influencerId: influencer.id, year, month },
    orderBy: { createdAt: "desc" },
    select: { id: true, platform: true, url: true, description: true, createdAt: true },
  });

  // Monthly history: last 6 closed months from stored scores
  const history = await db.influencerMonthlyScore.findMany({
    where: { influencerId: influencer.id },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 6,
    select: {
      year: true,
      month: true,
      deliveriesCompleted: true,
      deliveriesRequired: true,
      scoreDeliveries: true,
    },
  });

  const checklist = {
    videos: { done: pp.videosPublished, required: REQUIRED.videos },
    lives: { done: pp.livesHeld, required: REQUIRED.lives },
    forumInteractions: { done: pp.forumInteractions, required: REQUIRED.forumInteractions },
    mentions: { done: mentions.length, required: REQUIRED.mentions },
    bioLink: { done: influencer.bioLinkConfirmed, required: true },
  };

  const totalItems = 5;
  const completedItems =
    (checklist.videos.done >= checklist.videos.required ? 1 : 0) +
    (checklist.lives.done >= checklist.lives.required ? 1 : 0) +
    (checklist.forumInteractions.done >= checklist.forumInteractions.required ? 1 : 0) +
    (checklist.mentions.done >= checklist.mentions.required ? 1 : 0) +
    (checklist.bioLink.done ? 1 : 0);

  return NextResponse.json({
    success: true,
    data: {
      period: { year, month },
      checklist,
      completedItems,
      totalItems,
      completionPct: Math.round((completedItems / totalItems) * 100),
      mentions,
      bioLinkConfirmed: influencer.bioLinkConfirmed,
      history: history.map((h) => ({
        year: h.year,
        month: h.month,
        label: new Date(h.year, h.month - 1, 1).toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        }),
        completionPct: Math.round(h.scoreDeliveries),
        completed: h.deliveriesCompleted,
        required: h.deliveriesRequired,
      })),
    },
  });
});
