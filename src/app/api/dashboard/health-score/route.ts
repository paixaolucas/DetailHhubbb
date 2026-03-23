import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

function computeLevel(points: number): string {
  if (points >= 85) return "Superfã";
  if (points >= 70) return "Participante";
  if (points >= 40) return "Ativo";
  return "Novo";
}

function computeXpNext(level: string): number {
  switch (level) {
    case "Novo": return 40;
    case "Ativo": return 70;
    case "Participante": return 85;
    default: return Infinity;
  }
}

export const GET = withAuth(async (_req, { session }) => {
  const [user, pointsAgg] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: { loginStreak: true },
    }),
    db.userPoints.aggregate({
      where: { userId: session.userId },
      _sum: { points: true },
    }),
  ]);

  const streak = user?.loginStreak ?? 0;
  const totalPoints = pointsAgg._sum.points ?? 0;

  // Score: streak contributes up to 40 pts (10+ days = max), points up to 60 pts
  const streakScore = Math.min(40, streak * 4);
  const pointsScore = Math.min(60, Math.round(totalPoints * 0.6));
  const score = Math.min(100, streakScore + pointsScore);

  const level = computeLevel(totalPoints);
  const xp_next = computeXpNext(level);

  return NextResponse.json({
    success: true,
    data: {
      score,
      level,
      xp_current: totalPoints,
      xp_next: xp_next === Infinity ? totalPoints : xp_next,
      streak,
    },
  });
});
