// =============================================================================
// GET /api/dashboard/context — returns full contextual data for dashboard message
// Protected — authenticated users
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const GET = withAuth(async (_req, { session }) => {
  const userId = session.userId;
  const isInfluencer = session.role === UserRole.INFLUENCER_ADMIN;

  const [user, unreadCount, optInCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        loginStreak: true,
        createdAt: true,
        lastLoginAt: true,
        role: true,
      },
    }),
    db.notification.count({ where: { recipientId: userId, isRead: false } }),
    db.communityOptIn.count({ where: { userId } }),
  ]);

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const now = new Date();
  const daysSinceJoin = Math.floor((now.getTime() - user.createdAt.getTime()) / 86400000);
  const isNewMember = daysSinceJoin < 7;

  // Days absent since last login
  const lastLoginAt = user.lastLoginAt ?? user.createdAt;
  const absentDays = Math.floor((now.getTime() - lastLoginAt.getTime()) / 86400000);

  // New content published since last login (lessons published after last login)
  const [newContentSinceLogin, lastInfluencerWithContentData] = await Promise.all([
    db.contentLesson.count({
      where: {
        isPublished: true,
        createdAt: { gte: lastLoginAt },
        module: {
          community: {
            optIns: { some: { userId } },
          },
        },
      },
    }),
    db.contentLesson.findFirst({
      where: {
        isPublished: true,
        createdAt: { gte: lastLoginAt },
        module: {
          community: {
            optIns: { some: { userId } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        module: {
          select: {
            community: {
              select: {
                influencer: {
                  select: { displayName: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  // Last track in progress
  const lastProgressItem = await db.contentProgress.findFirst({
    where: { userId, isCompleted: false },
    orderBy: { updatedAt: "desc" },
    select: {
      lesson: {
        select: {
          id: true,
          title: true,
          module: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  const lastTrack = lastProgressItem
    ? {
        lessonId: lastProgressItem.lesson.id,
        lessonTitle: lastProgressItem.lesson.title,
        moduleId: lastProgressItem.lesson.module.id,
        moduleTitle: lastProgressItem.lesson.module.title,
      }
    : null;

  // Recently completed module/trail (within last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const recentlyCompletedItem = await db.contentProgress.findFirst({
    where: { userId, isCompleted: true, completedAt: { gte: sevenDaysAgo } },
    orderBy: { completedAt: "desc" },
    select: {
      completedAt: true,
      lesson: {
        select: {
          module: { select: { title: true } },
        },
      },
    },
  });

  // Nearest achievement — badge system uses flexible JSON requirements,
  // so we check how many badges the user hasn't earned yet and return
  // a simple "X to go" signal when they're close.
  const [earnedBadgeCount, totalBadgeCount] = await Promise.all([
    db.userBadge.count({ where: { userId } }),
    db.badge.count({ where: { isActive: true } }),
  ]);
  const unearnedCount = totalBadgeCount - earnedBadgeCount;
  // Pick first unearned badge as "nearest" if any exist
  const earnedBadgeIds = (
    await db.userBadge.findMany({ where: { userId }, select: { badgeId: true } })
  ).map((b) => b.badgeId);
  const nextBadge =
    unearnedCount > 0
      ? await db.badge.findFirst({
          where: { isActive: true, id: { notIn: earnedBadgeIds } },
          select: { name: true },
        })
      : null;
  const nearestAchievement = nextBadge
    ? { name: nextBadge.name, progressPct: Math.min(75, Math.round((earnedBadgeCount / Math.max(1, totalBadgeCount)) * 100)) }
    : null;

  // Pending lessons count
  const pendingLessons = await db.contentProgress.count({
    where: { userId, isCompleted: false },
  });

  // Base context (common to all roles)
  const baseContext = {
    streak: user.loginStreak,
    absentDays,
    newContentSinceLogin,
    lastInfluencerWithContent:
      lastInfluencerWithContentData?.module?.community?.influencer?.displayName ?? null,
    lastTrack,
    recentlyCompleted: recentlyCompletedItem
      ? { moduleTitle: recentlyCompletedItem.lesson.module.title }
      : null,
    nearestAchievement,
    isNewMember,
    daysSinceJoin,
    unreadNotifications: unreadCount,
    pendingLessons,
    optedCommunities: optInCount,
    role: user.role,
  };

  if (!isInfluencer) {
    return NextResponse.json({ success: true, data: baseContext });
  }

  // Influencer-specific context
  const influencer = await db.influencer.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!influencer) {
    return NextResponse.json({ success: true, data: baseContext });
  }

  const inflSevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  const [communityCount, contentPublishedCount, contentDraftCount, nextLive, newFollowers] =
    await Promise.all([
      db.community.count({ where: { influencerId: influencer.id } }),
      db.contentLesson.count({
        where: { isPublished: true, module: { community: { influencerId: influencer.id } } },
      }),
      db.contentLesson.count({
        where: { isPublished: false, module: { community: { influencerId: influencer.id } } },
      }),
      db.liveSession.findFirst({
        where: {
          community: { influencerId: influencer.id },
          status: "SCHEDULED",
          scheduledAt: { gte: now },
        },
        orderBy: { scheduledAt: "asc" },
        select: { scheduledAt: true },
      }),
      db.platformMembership.count({
        where: {
          referredByInfluencerId: influencer.id,
          createdAt: { gte: inflSevenDaysAgo },
        },
      }),
    ]);

  const nextLiveInDays = nextLive
    ? Math.ceil((nextLive.scheduledAt.getTime() - now.getTime()) / 86400000)
    : null;

  return NextResponse.json({
    success: true,
    data: {
      ...baseContext,
      communityCount,
      contentPublishedCount,
      contentDraftCount,
      nextLiveInDays,
      newFollowers,
    },
  });
});
