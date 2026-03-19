// =============================================================================
// POST /api/cron/pp-distribution
// Runs on the 15th of each month at 08:00 BRT (11:00 UTC).
// Closes the previous month's PP for all active influencers, calculates
// their share of the performance pool, and updates pendingPayout.
// Sends a notification to each influencer with their estimated payout.
// Protected by x-cron-secret header.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { saveMonthlyScore } from "@/services/performance/performance.service";
import { createNotification } from "@/services/notification/notification.service";
import { Decimal } from "@prisma/client/runtime/library";

// 15% of subscriptions go to the performance pool (per business document)
const POOL_PCT = 0.15;
// 20% holdback for 30 days (chargeback protection)
const HOLDBACK_PCT = 0.20;

function prevMonth(now: Date): { year: number; month: number } {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const { year, month } = prevMonth(now);

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    console.log(`[Cron:PPDistribution] Processing PP for ${year}-${String(month).padStart(2, "0")}`);

    // ── 1. Total platform subscription revenue for the previous month ─────────
    const revenueResult = await db.payment.aggregate({
      where: {
        status: "SUCCEEDED",
        type: "SUBSCRIPTION",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    });

    const totalRevenue = Number(revenueResult._sum?.amount ?? 0);
    const totalPool = totalRevenue * POOL_PCT;

    console.log(`[Cron:PPDistribution] Revenue: R$${totalRevenue.toFixed(2)}, Pool (15%): R$${totalPool.toFixed(2)}`);

    // ── 2. Get all active influencers ─────────────────────────────────────────
    const influencers = await db.influencer.findMany({
      where: { isActive: true },
      select: { id: true, userId: true },
    });

    if (influencers.length === 0) {
      return NextResponse.json({ success: true, data: { processed: 0, totalPool } });
    }

    // ── 3. Save monthly score for each influencer ─────────────────────────────
    let processed = 0;
    let totalPPSum = 0;

    for (const inf of influencers) {
      try {
        await saveMonthlyScore(inf.id, year, month);
        processed++;
      } catch (err) {
        console.error(`[Cron:PPDistribution] Failed to save score for influencer ${inf.id}:`, err);
      }
    }

    // ── 4. Load all saved scores and calculate pool shares ────────────────────
    const scores = await db.influencerMonthlyScore.findMany({
      where: { year, month },
      select: { influencerId: true, totalPP: true, poolShare: true },
    });

    totalPPSum = scores.reduce((sum, s) => sum + s.totalPP, 0);

    // ── 5. Update pendingPayout for each influencer + notify ──────────────────
    let notified = 0;

    for (const score of scores) {
      const influencer = influencers.find((i) => i.id === score.influencerId);
      if (!influencer) continue;

      // Recalculate poolShare with final totalPPSum for accuracy
      const finalShare = totalPPSum > 0 ? score.totalPP / totalPPSum : 0;
      const grossPayout = totalPool * finalShare;
      const netPayout = grossPayout * (1 - HOLDBACK_PCT); // 80% now, 20% after 30 days

      if (netPayout > 0) {
        await db.influencer.update({
          where: { id: score.influencerId },
          data: {
            pendingPayout: { increment: new Decimal(netPayout.toFixed(2)) },
            totalEarnings: { increment: new Decimal(netPayout.toFixed(2)) },
          },
        });
      }

      // Notify influencer
      const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      const pct = (finalShare * 100).toFixed(1);

      if (score.totalPP >= 10) {
        createNotification({
          recipientId: influencer.userId,
          type: "ACHIEVEMENT_UNLOCKED",
          title: `Caixa de Performance — ${monthLabel} 💰`,
          body:
            netPayout >= 0.01
              ? `Sua fatia da Caixa de Performance de ${monthLabel} é ${pct}% (PP: ${score.totalPP.toFixed(0)}/100). Valor estimado: R$ ${netPayout.toFixed(2)} (80% liberado — 20% retido por 30 dias).`
              : `Sua PP de ${monthLabel} foi ${score.totalPP.toFixed(0)}/100 (${pct}% do pool). O pool deste mês foi R$ ${totalPool.toFixed(2)}.`,
          link: "/dashboard/performance",
        }).catch(() => {});
        notified++;
      }
    }

    // Update final poolShare in InfluencerMonthlyScore with recalculated value
    for (const score of scores) {
      const finalShare = totalPPSum > 0 ? score.totalPP / totalPPSum : 0;
      await db.influencerMonthlyScore.update({
        where: {
          influencerId_year_month: {
            influencerId: score.influencerId,
            year,
            month,
          },
        },
        data: { poolShare: parseFloat(finalShare.toFixed(4)) },
      });
    }

    console.log(
      `[Cron:PPDistribution] Done. Processed: ${processed}, Notified: ${notified}, Pool: R$${totalPool.toFixed(2)}`
    );

    return NextResponse.json({
      success: true,
      data: {
        period: { year, month },
        processed,
        notified,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalPool: parseFloat(totalPool.toFixed(2)),
        totalInfluencers: scores.length,
      },
    });
  } catch (error) {
    console.error("[Cron:PPDistribution]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
