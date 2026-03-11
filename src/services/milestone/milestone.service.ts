// =============================================================================
// MILESTONE SERVICE
// Checks and awards influencer milestones based on business rules.
//
// Milestones (from doc):
//   BRONZE              — first month with ≥50 active referred members (R$500)
//   PRATA               — 200 active referred for 2 consecutive months (R$1.500)
//   OURO                — 500 active referred for 3 consecutive months (R$4.000)
//   TOP_CREATOR_MONTH   — rank #1 PP in a closed month, R$800/month (repeatable)
//   CRESCIMENTO_ACELERADO — +100 new referred in one month, R$1.000 (max 1×/quarter)
//   EMBAIXADOR          — 12 consecutive months at 100% deliveries (R$3.000)
// =============================================================================

import { db } from "@/lib/db";
import { MilestoneType } from "@prisma/client";

const BONUS: Record<MilestoneType, number> = {
  BRONZE: 500,
  PRATA: 1500,
  OURO: 4000,
  TOP_CREATOR_MONTH: 800,
  CRESCIMENTO_ACELERADO: 1000,
  EMBAIXADOR: 3000,
};

export interface MilestoneCheck {
  type: MilestoneType;
  achieved: boolean;
  bonusAmount: number;
  metadata: Record<string, unknown>;
}

// ── Check all milestones for an influencer and award any new ones ─────────────
export async function checkAndAwardMilestones(
  influencerId: string
): Promise<InfluencerMilestoneResult[]> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const awarded: InfluencerMilestoneResult[] = [];

  // Run each check; award if newly unlocked
  const checks = await Promise.all([
    checkBronze(influencerId),
    checkPrata(influencerId),
    checkOuro(influencerId),
    checkTopCreator(influencerId, year, month),
    checkCrescimentoAcelerado(influencerId, year, month),
    checkEmbaixador(influencerId),
  ]);

  for (const check of checks) {
    if (!check.achieved) continue;

    const shouldAward = await shouldAwardMilestone(
      influencerId,
      check.type,
      check.metadata
    );
    if (!shouldAward) continue;

    const milestone = await db.influencerMilestone.create({
      data: {
        influencerId,
        type: check.type,
        bonusAmount: check.bonusAmount,
        metadata: check.metadata as Record<string, string | number | boolean>,
      },
    });
    awarded.push({ ...check, milestoneId: milestone.id });
  }

  return awarded;
}

// ── Determine whether to award (prevent duplicates for unique milestones) ─────
async function shouldAwardMilestone(
  influencerId: string,
  type: MilestoneType,
  metadata: Record<string, unknown>
): Promise<boolean> {
  // Unique milestones: only award once ever
  if (["BRONZE", "PRATA", "OURO", "EMBAIXADOR"].includes(type)) {
    const existing = await db.influencerMilestone.findFirst({
      where: { influencerId, type },
    });
    return !existing;
  }

  // TOP_CREATOR_MONTH: once per month
  if (type === "TOP_CREATOR_MONTH") {
    const existing = await db.influencerMilestone.findFirst({
      where: {
        influencerId,
        type,
        metadata: { path: ["month"], equals: metadata.month as string },
      },
    });
    return !existing;
  }

  // CRESCIMENTO_ACELERADO: once per month, but max 1× per quarter
  if (type === "CRESCIMENTO_ACELERADO") {
    // Already awarded this month?
    const thisMonth = await db.influencerMilestone.findFirst({
      where: {
        influencerId,
        type,
        metadata: { path: ["month"], equals: metadata.month as string },
      },
    });
    if (thisMonth) return false;

    // Already awarded this quarter?
    const now = new Date();
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const thisQuarter = await db.influencerMilestone.findFirst({
      where: {
        influencerId,
        type,
        achievedAt: { gte: quarterStart },
      },
    });
    return !thisQuarter;
  }

  return true;
}

// ── Individual milestone checks ───────────────────────────────────────────────

async function checkBronze(influencerId: string): Promise<MilestoneCheck> {
  const activeReferred = await db.platformMembership.count({
    where: { referredByInfluencerId: influencerId, status: "ACTIVE" },
  });
  return {
    type: "BRONZE",
    achieved: activeReferred >= 50,
    bonusAmount: BONUS.BRONZE,
    metadata: { membersCount: activeReferred },
  };
}

async function checkPrata(influencerId: string): Promise<MilestoneCheck> {
  // Need 200+ active referred members for 2 consecutive months.
  // Check current month live + last stored score.
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const activeNow = await db.platformMembership.count({
    where: { referredByInfluencerId: influencerId, status: "ACTIVE" },
  });

  if (activeNow < 200) {
    return { type: "PRATA", achieved: false, bonusAmount: BONUS.PRATA, metadata: {} };
  }

  // Check last closed month
  const [prevYear, prevMonth] = month === 1 ? [year - 1, 12] : [year, month - 1];
  const lastScore = await db.influencerMonthlyScore.findUnique({
    where: { influencerId_year_month: { influencerId, year: prevYear, month: prevMonth } },
    select: { newActiveMembers: true, retentionRate: true },
  });

  // Approximate: if retention was high and they had members last month too,
  // they likely had 200+. Use retentionRate as a proxy.
  const prevMonthOk = lastScore && lastScore.retentionRate >= 90;

  return {
    type: "PRATA",
    achieved: !!prevMonthOk,
    bonusAmount: BONUS.PRATA,
    metadata: { membersCount: activeNow, consecutiveMonths: prevMonthOk ? 2 : 1 },
  };
}

async function checkOuro(influencerId: string): Promise<MilestoneCheck> {
  // Need 500+ active referred for 3 consecutive months.
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const activeNow = await db.platformMembership.count({
    where: { referredByInfluencerId: influencerId, status: "ACTIVE" },
  });

  if (activeNow < 500) {
    return { type: "OURO", achieved: false, bonusAmount: BONUS.OURO, metadata: {} };
  }

  // Check last 2 closed months
  const prevMonths: { year: number; month: number }[] = [];
  for (let i = 1; i <= 2; i++) {
    let m = month - i;
    let y = year;
    if (m <= 0) { m += 12; y -= 1; }
    prevMonths.push({ year: y, month: m });
  }

  const scores = await db.influencerMonthlyScore.findMany({
    where: {
      influencerId,
      OR: prevMonths.map((p) => ({ year: p.year, month: p.month })),
    },
    select: { retentionRate: true },
  });

  const allPrevOk = scores.length === 2 && scores.every((s) => s.retentionRate >= 90);

  return {
    type: "OURO",
    achieved: allPrevOk,
    bonusAmount: BONUS.OURO,
    metadata: { membersCount: activeNow, consecutiveMonths: allPrevOk ? 3 : 1 },
  };
}

async function checkTopCreator(
  influencerId: string,
  year: number,
  month: number
): Promise<MilestoneCheck> {
  // Check if this influencer was rank #1 in the last closed month
  const [prevYear, prevMonth] = month === 1 ? [year - 1, 12] : [year, month - 1];

  const topScore = await db.influencerMonthlyScore.findFirst({
    where: { year: prevYear, month: prevMonth },
    orderBy: { totalPP: "desc" },
    select: { influencerId: true, totalPP: true },
  });

  const isTop = topScore?.influencerId === influencerId;
  const monthKey = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

  return {
    type: "TOP_CREATOR_MONTH",
    achieved: isTop,
    bonusAmount: BONUS.TOP_CREATOR_MONTH,
    metadata: { month: monthKey, pp: topScore?.totalPP ?? 0 },
  };
}

async function checkCrescimentoAcelerado(
  influencerId: string,
  year: number,
  month: number
): Promise<MilestoneCheck> {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const newThisMonth = await db.platformMembership.count({
    where: {
      referredByInfluencerId: influencerId,
      joinedAt: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  return {
    type: "CRESCIMENTO_ACELERADO",
    achieved: newThisMonth >= 100,
    bonusAmount: BONUS.CRESCIMENTO_ACELERADO,
    metadata: { month: monthKey, newMembers: newThisMonth },
  };
}

async function checkEmbaixador(influencerId: string): Promise<MilestoneCheck> {
  // 12 consecutive months where deliveriesCompleted >= deliveriesRequired
  const now = new Date();

  const last12: { year: number; month: number }[] = [];
  for (let i = 1; i <= 12; i++) {
    let m = now.getMonth() + 1 - i;
    let y = now.getFullYear();
    while (m <= 0) { m += 12; y -= 1; }
    last12.push({ year: y, month: m });
  }

  const scores = await db.influencerMonthlyScore.findMany({
    where: {
      influencerId,
      OR: last12.map((p) => ({ year: p.year, month: p.month })),
    },
    select: { deliveriesCompleted: true, deliveriesRequired: true },
  });

  const allFull =
    scores.length === 12 &&
    scores.every((s) => s.deliveriesCompleted >= s.deliveriesRequired);

  return {
    type: "EMBAIXADOR",
    achieved: allFull,
    bonusAmount: BONUS.EMBAIXADOR,
    metadata: { consecutiveMonthsFull: scores.filter((s) => s.deliveriesCompleted >= s.deliveriesRequired).length },
  };
}

// ── Progress toward each unachieved milestone ─────────────────────────────────
export async function getMilestoneProgress(influencerId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [activeReferred, newThisMonth, achieved] = await Promise.all([
    db.platformMembership.count({
      where: { referredByInfluencerId: influencerId, status: "ACTIVE" },
    }),
    db.platformMembership.count({
      where: {
        referredByInfluencerId: influencerId,
        joinedAt: { gte: new Date(year, month - 1, 1) },
      },
    }),
    db.influencerMilestone.findMany({
      where: { influencerId },
      select: { type: true, achievedAt: true, bonusAmount: true, bonusPaid: true, metadata: true },
      orderBy: { achievedAt: "asc" },
    }),
  ]);

  const achievedTypes = new Set(achieved.map((a) => a.type));

  // Consecutive months for Prata/Ouro/Embaixador
  const last12Scores = await db.influencerMonthlyScore.findMany({
    where: { influencerId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 12,
    select: { year: true, month: true, retentionRate: true, deliveriesCompleted: true, deliveriesRequired: true },
  });

  // Consecutive months with 200+ active (proxy: high retention)
  let consecutivePrata = 0;
  for (const s of last12Scores) {
    if (s.retentionRate >= 90 && activeReferred >= 200) consecutivePrata++;
    else break;
  }
  if (activeReferred >= 200) consecutivePrata = Math.max(1, consecutivePrata); // at least current month

  // Consecutive months with 500+ active
  let consecutiveOuro = 0;
  for (const s of last12Scores) {
    if (s.retentionRate >= 90 && activeReferred >= 500) consecutiveOuro++;
    else break;
  }
  if (activeReferred >= 500) consecutiveOuro = Math.max(1, consecutiveOuro);

  // Consecutive months at 100% deliveries
  let consecutiveEmbaixador = 0;
  for (const s of last12Scores) {
    if (s.deliveriesCompleted >= s.deliveriesRequired && s.deliveriesRequired > 0) {
      consecutiveEmbaixador++;
    } else break;
  }

  return {
    achieved: achieved.map((a) => ({
      type: a.type,
      achievedAt: a.achievedAt,
      bonusAmount: Number(a.bonusAmount),
      bonusPaid: a.bonusPaid,
      metadata: a.metadata,
    })),
    progress: {
      BRONZE: {
        achieved: achievedTypes.has("BRONZE"),
        current: activeReferred,
        required: 50,
        pct: Math.min(100, Math.round((activeReferred / 50) * 100)),
      },
      PRATA: {
        achieved: achievedTypes.has("PRATA"),
        current: consecutivePrata,
        required: 2,
        membersRequired: 200,
        membersNow: activeReferred,
        pct: Math.min(100, Math.round((Math.min(activeReferred, 200) / 200) * 50 + (consecutivePrata / 2) * 50)),
      },
      OURO: {
        achieved: achievedTypes.has("OURO"),
        current: consecutiveOuro,
        required: 3,
        membersRequired: 500,
        membersNow: activeReferred,
        pct: Math.min(100, Math.round((Math.min(activeReferred, 500) / 500) * 50 + (consecutiveOuro / 3) * 50)),
      },
      TOP_CREATOR_MONTH: {
        achieved: achievedTypes.has("TOP_CREATOR_MONTH"),
        repeatable: true,
        count: achieved.filter((a) => a.type === "TOP_CREATOR_MONTH").length,
      },
      CRESCIMENTO_ACELERADO: {
        achieved: achievedTypes.has("CRESCIMENTO_ACELERADO"),
        repeatable: true,
        count: achieved.filter((a) => a.type === "CRESCIMENTO_ACELERADO").length,
        current: newThisMonth,
        required: 100,
        pct: Math.min(100, Math.round((newThisMonth / 100) * 100)),
      },
      EMBAIXADOR: {
        achieved: achievedTypes.has("EMBAIXADOR"),
        current: consecutiveEmbaixador,
        required: 12,
        pct: Math.min(100, Math.round((consecutiveEmbaixador / 12) * 100)),
      },
    },
  };
}

interface InfluencerMilestoneResult extends MilestoneCheck {
  milestoneId: string;
}
