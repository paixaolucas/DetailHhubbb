// =============================================================================
// MEMBER HEALTH — Global engagement score across ALL communities
// Used to gate post creation: members must engage (react/comment) before posting
// =============================================================================

import { db } from "@/lib/db";

export interface MemberHealth {
  score: number;     // 0–100
  canPost: boolean;  // true when score >= HEALTH_POST_THRESHOLD
  reactions: number; // reactions given in last 30 days
  comments: number;  // comments made in last 30 days
}

export const HEALTH_POST_THRESHOLD = 30; // score needed to unlock posting
export const HEALTH_WINDOW_DAYS = 30;    // look-back window in days

/**
 * Computes a member's global health score based on cross-community engagement.
 * Reactions: +5 pts each | Comments: +10 pts each | Max: 100
 *
 * This is intentionally cheap: two indexed COUNT queries, no joins.
 */
export async function getMemberHealthScore(userId: string): Promise<MemberHealth> {
  const since = new Date(Date.now() - HEALTH_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [reactions, comments] = await Promise.all([
    db.postReaction.count({ where: { userId, createdAt: { gte: since } } }),
    db.comment.count({ where: { authorId: userId, createdAt: { gte: since } } }),
  ]);

  const score = Math.min(100, reactions * 5 + comments * 10);
  return { score, canPost: score >= HEALTH_POST_THRESHOLD, reactions, comments };
}
