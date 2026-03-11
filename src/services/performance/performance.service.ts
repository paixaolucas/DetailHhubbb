// =============================================================================
// PERFORMANCE SERVICE
// Calculates Pontuação de Performance (PP) for influencers.
//
// Formula (from business document):
//   PP = (views_qual × 0.30) + (engajamento × 0.25) + (novos_membros × 0.20)
//        + (retencao × 0.15) + (entregas × 0.10)
//
// Each component is normalized to 0–100 before weighting.
// Pool share = PP_influencer / Σ PP_all_active_influencers
// =============================================================================

import { db } from "@/lib/db";

// ── Contract minimums (from document) ────────────────────────────────────────
const DELIVERIES_REQUIRED = {
  videos: 2,         // exclusive videos per month
  lives: 1,          // live/Q&A per month
  forumInteractions: 4, // posts + comments by influencer in their communities
};

// ── Normalization targets ─────────────────────────────────────────────────────
// These are "100% score" reference values per component.
// Tunable as the platform grows.
const NORM = {
  qualifiedViewsTarget: 200,    // 200 qualified views = score 100
  engagementPerMemberTarget: 5, // 5 actions/member/month = score 100
  newMembersTarget: 30,         // 30 new active members = score 100
};

export interface PPComponents {
  scoreViews: number;
  scoreEngagement: number;
  scoreNewMembers: number;
  scoreRetention: number;
  scoreDeliveries: number;
  totalPP: number;
  // Raw counts for transparency
  qualifiedViews: number;
  engagementActions: number;
  activeMembers: number;
  newActiveMembers: number;
  retentionRate: number;
  deliveriesCompleted: number;
  deliveriesRequired: number;
  // Delivery breakdown
  videosPublished: number;
  livesHeld: number;
  forumInteractions: number;
}

export async function calculateInfluencerPP(
  influencerId: string,
  year: number,
  month: number // 1-12
): Promise<PPComponents> {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get influencer's communities and user ID
  const influencer = await db.influencer.findUnique({
    where: { id: influencerId },
    select: {
      userId: true,
      communities: { select: { id: true } },
    },
  });

  if (!influencer) throw new Error("Influencer not found");

  const communityIds = influencer.communities.map((c) => c.id);

  // ── 1. Views Qualificados (30%) ───────────────────────────────────────────
  // Count ContentProgress records where member watched ≥60% of a lesson
  // in the influencer's communities, within this month.
  let qualifiedViews = 0;
  if (communityIds.length > 0) {
    const progressRecords = await db.contentProgress.findMany({
      where: {
        updatedAt: { gte: startOfMonth, lte: endOfMonth },
        lesson: {
          module: { communityId: { in: communityIds } },
          videoDuration: { gt: 0 },
        },
        progressSecs: { gt: 0 },
      },
      select: {
        progressSecs: true,
        lesson: { select: { videoDuration: true } },
      },
    });

    qualifiedViews = progressRecords.filter(
      (p) =>
        p.lesson.videoDuration &&
        p.progressSecs / p.lesson.videoDuration >= 0.6
    ).length;
  }

  const scoreViews = Math.min(100, (qualifiedViews / NORM.qualifiedViewsTarget) * 100);

  // ── 2. Engajamento na Comunidade (25%) ────────────────────────────────────
  // Sum of: comments + post reactions + comment reactions on influencer's
  // communities this month, weighted by active member count.
  let engagementActions = 0;
  let activeMembers = 0;

  if (communityIds.length > 0) {
    const [comments, postReactions, commentReactions, memberCount] =
      await Promise.all([
        db.comment.count({
          where: {
            post: { communityId: { in: communityIds } },
            createdAt: { gte: startOfMonth, lte: endOfMonth },
            isHidden: false,
          },
        }),
        db.postReaction.count({
          where: {
            post: { communityId: { in: communityIds } },
            createdAt: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        db.commentReaction.count({
          where: {
            comment: { post: { communityId: { in: communityIds } } },
            createdAt: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        db.communityMembership.count({
          where: { communityId: { in: communityIds }, status: "ACTIVE" },
        }),
      ]);

    engagementActions = comments + postReactions + commentReactions;
    activeMembers = memberCount;
  }

  const engagementPerMember =
    activeMembers > 0 ? engagementActions / activeMembers : 0;
  const scoreEngagement = Math.min(
    100,
    (engagementPerMember / NORM.engagementPerMemberTarget) * 100
  );

  // ── 3. Novos Membros Ativos (20%) ─────────────────────────────────────────
  // Referred members who joined in this month AND are still active
  // AND have been active for ≥30 days (churn-proof window).
  const newActiveMembers = await db.platformMembership.count({
    where: {
      referredByInfluencerId: influencerId,
      joinedAt: { gte: startOfMonth, lte: endOfMonth, lt: thirtyDaysAgo },
      status: "ACTIVE",
    },
  });

  const scoreNewMembers = Math.min(
    100,
    (newActiveMembers / NORM.newMembersTarget) * 100
  );

  // ── 4. Retenção de Membros (15%) ──────────────────────────────────────────
  // Among all referred members: what % are still active?
  const [totalReferred, activeReferred] = await Promise.all([
    db.platformMembership.count({
      where: {
        referredByInfluencerId: influencerId,
        joinedAt: { lt: startOfMonth }, // exclude brand new ones
      },
    }),
    db.platformMembership.count({
      where: {
        referredByInfluencerId: influencerId,
        joinedAt: { lt: startOfMonth },
        status: "ACTIVE",
      },
    }),
  ]);

  const retentionRate =
    totalReferred > 0 ? (activeReferred / totalReferred) * 100 : 100;
  const scoreRetention = retentionRate; // already 0–100

  // ── 5. Completude de Entregas Contratuais (10%) ───────────────────────────
  // Tracked in-platform deliveries:
  //   - Videos published (ContentLesson created by influencer this month)
  //   - Lives held (LiveSession with status ENDED by influencer this month)
  //   - Forum interactions (Post + Comment by influencer this month)
  let videosPublished = 0;
  let livesHeld = 0;
  let forumInteractions = 0;

  if (communityIds.length > 0) {
    const [videos, lives, posts, comments] = await Promise.all([
      db.contentLesson.count({
        where: {
          module: { communityId: { in: communityIds } },
          isPublished: true,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      db.liveSession.count({
        where: {
          communityId: { in: communityIds },
          hostId: influencer.userId,
          status: "ENDED",
          endedAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      db.post.count({
        where: {
          communityId: { in: communityIds },
          authorId: influencer.userId,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          isHidden: false,
        },
      }),
      db.comment.count({
        where: {
          post: { communityId: { in: communityIds } },
          authorId: influencer.userId,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          isHidden: false,
        },
      }),
    ]);

    videosPublished = videos;
    livesHeld = lives;
    forumInteractions = posts + comments;
  }

  // Each delivery type scored independently, then averaged
  const videoScore = Math.min(1, videosPublished / DELIVERIES_REQUIRED.videos);
  const liveScore = Math.min(1, livesHeld / DELIVERIES_REQUIRED.lives);
  const forumScore = Math.min(
    1,
    forumInteractions / DELIVERIES_REQUIRED.forumInteractions
  );

  const deliveriesCompleted =
    (videosPublished >= DELIVERIES_REQUIRED.videos ? 1 : 0) +
    (livesHeld >= DELIVERIES_REQUIRED.lives ? 1 : 0) +
    (forumInteractions >= DELIVERIES_REQUIRED.forumInteractions ? 1 : 0);
  const deliveriesRequired = 3;

  const scoreDeliveries =
    ((videoScore + liveScore + forumScore) / 3) * 100;

  // ── Final PP ─────────────────────────────────────────────────────────────
  const totalPP =
    scoreViews * 0.30 +
    scoreEngagement * 0.25 +
    scoreNewMembers * 0.20 +
    scoreRetention * 0.15 +
    scoreDeliveries * 0.10;

  return {
    scoreViews: parseFloat(scoreViews.toFixed(1)),
    scoreEngagement: parseFloat(scoreEngagement.toFixed(1)),
    scoreNewMembers: parseFloat(scoreNewMembers.toFixed(1)),
    scoreRetention: parseFloat(scoreRetention.toFixed(1)),
    scoreDeliveries: parseFloat(scoreDeliveries.toFixed(1)),
    totalPP: parseFloat(totalPP.toFixed(1)),
    qualifiedViews,
    engagementActions,
    activeMembers,
    newActiveMembers,
    retentionRate: parseFloat(retentionRate.toFixed(1)),
    deliveriesCompleted,
    deliveriesRequired,
    videosPublished,
    livesHeld,
    forumInteractions,
  };
}

// ── Pool share: PP_influencer / Σ PP_all ─────────────────────────────────────
export async function calculatePoolShare(
  influencerId: string,
  myPP: number,
  year: number,
  month: number
): Promise<{ poolShare: number; rank: number; totalInfluencers: number }> {
  // Get all active influencers
  const allInfluencers = await db.influencer.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  // Use stored scores for the current month if available (faster),
  // otherwise only include influencers with stored scores
  const storedScores = await db.influencerMonthlyScore.findMany({
    where: { year, month },
    select: { influencerId: true, totalPP: true },
  });

  const scoreMap = new Map(storedScores.map((s) => [s.influencerId, s.totalPP]));
  // Inject the current influencer's live score
  scoreMap.set(influencerId, myPP);

  const allPPs = Array.from(scoreMap.values());
  const totalPPSum = allPPs.reduce((sum, pp) => sum + pp, 0);
  const poolShare = totalPPSum > 0 ? myPP / totalPPSum : 0;

  // Rank: how many influencers have a higher PP
  const sorted = allPPs.slice().sort((a, b) => b - a);
  const rank = sorted.findIndex((pp) => pp <= myPP) + 1;

  return {
    poolShare: parseFloat(poolShare.toFixed(4)),
    rank,
    totalInfluencers: allInfluencers.length,
  };
}

// ── Persist monthly score (called by a cron job at month end) ─────────────────
export async function saveMonthlyScore(
  influencerId: string,
  year: number,
  month: number
): Promise<void> {
  const components = await calculateInfluencerPP(influencerId, year, month);
  const { poolShare } = await calculatePoolShare(
    influencerId,
    components.totalPP,
    year,
    month
  );

  await db.influencerMonthlyScore.upsert({
    where: { influencerId_year_month: { influencerId, year, month } },
    create: {
      influencerId,
      year,
      month,
      ...components,
      poolShare,
    },
    update: {
      ...components,
      poolShare,
    },
  });
}
