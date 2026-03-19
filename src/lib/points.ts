// =============================================================================
// POINTS UTILITY
// Central module for all point logic: awarding, levels, inactivity, influencer health.
// =============================================================================

import { db } from "@/lib/db";
import { createNotification } from "@/services/notification/notification.service";

// ─── Constants ────────────────────────────────────────────────────────────────

export const POST_THRESHOLD = 70; // minimum score to create posts
export const INACTIVITY_PENALTY = 3; // pts lost per day from day 3 of inactivity
export const INACTIVITY_GRACE_DAYS = 2; // days before penalty starts

// ─── Member Levels ────────────────────────────────────────────────────────────

export type MemberLevel = "Novo" | "Ativo" | "Participante" | "Superfã";

export function getMemberLevel(points: number): MemberLevel {
  if (points >= 85) return "Superfã";
  if (points >= 70) return "Participante";
  if (points >= 40) return "Ativo";
  return "Novo";
}

export function getMemberLevelColor(level: MemberLevel): string {
  switch (level) {
    case "Superfã":    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "Participante": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "Ativo":      return "bg-[#007A99]/20 text-[#009CD9] border-[#007A99]/30";
    case "Novo":       return "bg-white/10 text-gray-400 border-white/10";
  }
}

// ─── Influencer Health ────────────────────────────────────────────────────────

export type InfluencerHealth = "Saudável" | "Atenção" | "Crítico";

export function getInfluencerHealth(points: number): InfluencerHealth {
  if (points >= 70) return "Saudável";
  if (points >= 40) return "Atenção";
  return "Crítico";
}

export function getInfluencerHealthEmoji(health: InfluencerHealth): string {
  switch (health) {
    case "Saudável": return "🟢";
    case "Atenção":  return "🟡";
    case "Crítico":  return "🔴";
  }
}

// ─── Award Points (Member) ────────────────────────────────────────────────────

/**
 * Award points to a MEMBER for an engagement event.
 * - Checks daily limit per event type before awarding.
 * - Only awards points if user has an active PlatformMembership.
 * - Fires notification when crossing POST_THRESHOLD.
 * Returns true if points were awarded.
 */
export async function awardPoints(params: {
  userId: string;
  communityId: string;
  amount: number;
  reason: string;
  eventType: string;
  dailyLimit: number;
  metadata?: Record<string, string>;
}): Promise<boolean> {
  const { userId, communityId, amount, reason, eventType, dailyLimit, metadata } = params;

  // Only award to active platform members
  const membership = await db.platformMembership.findFirst({
    where: { userId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!membership) return false;

  // Check daily limit using indexed eventType field
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const countToday = await db.pointTransaction.count({
    where: {
      userPoints: { userId },
      eventType: { equals: eventType },
      createdAt: { gte: today },
    },
  });
  if (countToday >= dailyLimit) return false;

  // Idempotency check via metadata key (e.g. for module completion)
  if (metadata?.idempotencyKey) {
    const exists = await db.pointTransaction.findFirst({
      where: {
        userPoints: { userId },
        reason: { contains: metadata.idempotencyKey },
      },
      select: { id: true },
    });
    if (exists) return false;
  }

  // Upsert UserPoints and create transaction
  const existing = await db.userPoints.findUnique({
    where: { userId_communityId: { userId, communityId } },
    select: { id: true, points: true },
  });

  const pointsBefore = existing?.points ?? 0;
  const reasonStr = metadata?.idempotencyKey
    ? `${eventType}:${reason}:${metadata.idempotencyKey}`
    : `${eventType}:${reason}`;

  const updated = await db.userPoints.upsert({
    where: { userId_communityId: { userId, communityId } },
    create: {
      userId,
      communityId,
      points: amount,
      totalEarned: amount,
      level: 1,
      transactions: { create: { amount, reason: reasonStr, eventType } },
    },
    update: {
      points: { increment: amount },
      totalEarned: { increment: amount },
      transactions: { create: { amount, reason: reasonStr, eventType } },
    },
    select: { points: true },
  });

  // Notify when crossing post-creation threshold
  if (pointsBefore < POST_THRESHOLD && updated.points >= POST_THRESHOLD) {
    createNotification({
      recipientId: userId,
      type: "ACHIEVEMENT_UNLOCKED",
      title: "Você desbloqueou a criação de posts! 🎉",
      body: "Você já faz parte desta comunidade — agora pode criar posts e compartilhar com todos.",
      link: "/dashboard",
    }).catch(() => {});
  }

  return true;
}

// ─── Award Points (Influencer) ────────────────────────────────────────────────

/**
 * Award points to an INFLUENCER for platform activity.
 * Does NOT check PlatformMembership (influencers are not members).
 * Supports monthly cap via monthlyLimit parameter.
 */
export async function awardInfluencerPoints(params: {
  userId: string;
  communityId: string;
  amount: number;
  reason: string;
  eventType: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  metadata?: Record<string, string>;
}): Promise<boolean> {
  const { userId, communityId, amount, reason, eventType, dailyLimit, monthlyLimit, metadata } = params;

  // Idempotency check
  if (metadata?.idempotencyKey) {
    const exists = await db.pointTransaction.findFirst({
      where: {
        userPoints: { userId },
        reason: { contains: metadata.idempotencyKey },
      },
      select: { id: true },
    });
    if (exists) return false;
  }

  // Daily limit check using indexed eventType field
  if (dailyLimit !== undefined) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await db.pointTransaction.count({
      where: {
        userPoints: { userId },
        eventType: { equals: eventType },
        createdAt: { gte: today },
      },
    });
    if (count >= dailyLimit) return false;
  }

  // Monthly cap check using indexed eventType field
  if (monthlyLimit !== undefined) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthTotal = await db.pointTransaction.aggregate({
      where: {
        userPoints: { userId },
        eventType: { equals: eventType },
        createdAt: { gte: monthStart },
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    });
    if ((monthTotal._sum.amount ?? 0) >= monthlyLimit) return false;
  }

  const reasonStr = metadata?.idempotencyKey
    ? `${eventType}:${reason}:${metadata.idempotencyKey}`
    : `${eventType}:${reason}`;

  await db.userPoints.upsert({
    where: { userId_communityId: { userId, communityId } },
    create: {
      userId,
      communityId,
      points: amount,
      totalEarned: amount,
      level: 1,
      transactions: { create: { amount, reason: reasonStr, eventType } },
    },
    update: {
      points: { increment: amount },
      totalEarned: { increment: amount },
      transactions: { create: { amount, reason: reasonStr, eventType } },
    },
  });

  return true;
}

// ─── Inactivity Penalty ───────────────────────────────────────────────────────

/**
 * Apply inactivity penalty (-3 pts/day) if user has been inactive for > INACTIVITY_GRACE_DAYS.
 * Called by the daily cron job. Points never go below 0.
 * Returns the number of penalty points applied (0 if no penalty).
 */
export async function applyInactivityPenalty(params: {
  userId: string;
  communityId: string;
}): Promise<number> {
  const { userId, communityId } = params;

  const up = await db.userPoints.findUnique({
    where: { userId_communityId: { userId, communityId } },
    select: { id: true, points: true, updatedAt: true },
  });

  if (!up || up.points <= 0) return 0;

  // Find last positive transaction
  const lastAction = await db.pointTransaction.findFirst({
    where: {
      userPointsId: up.id,
      amount: { gt: 0 },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (!lastAction) return 0;

  const daysSinceAction = Math.floor(
    (Date.now() - lastAction.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceAction <= INACTIVITY_GRACE_DAYS) return 0;

  // Days in penalty = days since action minus grace days
  const penaltyDays = daysSinceAction - INACTIVITY_GRACE_DAYS;

  // Check if we already applied penalty today to avoid double-penalising
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alreadyPenalised = await db.pointTransaction.findFirst({
    where: {
      userPointsId: up.id,
      eventType: { equals: "INACTIVITY" },
      createdAt: { gte: today },
    },
    select: { id: true },
  });
  if (alreadyPenalised) return 0;

  // Apply one day of penalty (cron runs once/day)
  const penalty = Math.min(INACTIVITY_PENALTY * penaltyDays, up.points); // never below 0
  const actualPenalty = Math.min(penalty, up.points);
  if (actualPenalty <= 0) return 0;

  await db.userPoints.update({
    where: { id: up.id },
    data: {
      points: { decrement: actualPenalty },
      transactions: {
        create: { amount: -actualPenalty, reason: `INACTIVITY:${penaltyDays} dias sem ação`, eventType: "INACTIVITY" },
      },
    },
  });

  return actualPenalty;
}
