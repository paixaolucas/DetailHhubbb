// =============================================================================
// POST /api/cron/influencer-performance — weekly motivational notifications for influencers
// Runs every Monday. Notifies top-performing influencers with encouraging messages.
// Also sends supportive (never threatening) nudges to inactive influencers.
// Protected by x-cron-secret header
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/services/notification/notification.service";
import { UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all influencer accounts with their community
    const influencers = await db.user.findMany({
      where: { role: UserRole.INFLUENCER_ADMIN },
      select: {
        id: true,
        firstName: true,
        influencerProfile: {
          select: {
            communities: {
              where: { isPublished: true },
              select: { id: true, name: true, slug: true },
              take: 1,
            },
          },
        },
      },
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    type InfluencerWeekScore = {
      userId: string;
      firstName: string;
      communityName: string;
      communitySlug: string;
      weekPts: number;
      totalPts: number;
    };
    const scores: InfluencerWeekScore[] = [];

    for (const inf of influencers) {
      const community = inf.influencerProfile?.communities?.[0];
      if (!community) continue;

      const userPoints = await db.userPoints.findUnique({
        where: { userId_communityId: { userId: inf.id, communityId: community.id } },
        select: { id: true, points: true },
      });
      if (!userPoints) continue;

      const weekTx = await db.pointTransaction.aggregate({
        where: {
          userPointsId: userPoints.id,
          createdAt: { gte: weekAgo },
          amount: { gt: 0 },
        },
        _sum: { amount: true },
      });

      scores.push({
        userId: inf.id,
        firstName: inf.firstName,
        communityName: community.name,
        communitySlug: community.slug,
        weekPts: weekTx._sum.amount ?? 0,
        totalPts: userPoints.points,
      });
    }

    // Sort by weekly points descending
    scores.sort((a, b) => b.weekPts - a.weekPts);

    let notified = 0;

    // Top 3: medalhas e encorajamento
    const medals = ["🥇", "🥈", "🥉"];
    const topMessages = [
      "Você está no topo do engajamento esta semana! Sua comunidade está vibrando. Continue assim!",
      "Incrível! Você está entre os influenciadores mais ativos da plataforma esta semana. Seu trabalho faz diferença!",
      "Você está no top 3 de engajamento esta semana. Continue com esse ritmo — seus membros percebem!",
    ];

    for (let i = 0; i < Math.min(3, scores.length); i++) {
      const s = scores[i];
      if (s.weekPts === 0) continue;
      createNotification({
        recipientId: s.userId,
        type: "ACHIEVEMENT_UNLOCKED",
        title: `${medals[i]} Top ${i + 1} da semana — ${s.communityName}`,
        body: topMessages[i],
        link: `/community/${s.communitySlug}/feed`,
      }).catch(() => {});
      notified++;
    }

    // Influencers in ascent (≥20 pts this week, not top 3): motivational boost
    const improvers = scores.slice(3).filter((s) => s.weekPts >= 20);
    for (const s of improvers.slice(0, 5)) {
      createNotification({
        recipientId: s.userId,
        type: "ACHIEVEMENT_UNLOCKED",
        title: `Você está em alta esta semana! 🚀`,
        body: `Você acumulou ${s.weekPts} pts em ${s.communityName} esta semana. Seu engajamento está crescendo — continue com esse ritmo!`,
        link: `/community/${s.communitySlug}/feed`,
      }).catch(() => {});
      notified++;
    }

    // Inactive influencers (0 pts this week with existing score): supportive nudge
    const inactive = scores.filter((s) => s.weekPts === 0 && s.totalPts > 0);
    for (const s of inactive.slice(0, 10)) {
      createNotification({
        recipientId: s.userId,
        type: "BROADCAST",
        title: `Sua comunidade ${s.communityName} sente sua falta 💙`,
        body: `Esta semana ainda não detectamos atividade sua. Um post, uma resposta ou uma live pode fazer grande diferença para seus membros. Você consegue!`,
        link: `/community/${s.communitySlug}/feed`,
      }).catch(() => {});
      notified++;
    }

    return NextResponse.json({
      success: true,
      data: {
        influencersChecked: scores.length,
        notified,
        top3: scores.slice(0, 3).map((s) => ({ name: s.firstName, weekPts: s.weekPts })),
      },
    });
  } catch (error) {
    console.error("[Cron:InfluencerPerformance] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
