// =============================================================================
// GET /api/feed/recommended — trending posts algorithm
// Scores: engagement (reactions + comments×2) × recency decay
// Returns top N posts from communities the member belongs to
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

const RECENCY_DECAY = [
  { days: 1,  factor: 1.0 },
  { days: 3,  factor: 0.8 },
  { days: 7,  factor: 0.6 },
  { days: 14, factor: 0.4 },
  { days: 30, factor: 0.2 },
];

function recencyFactor(createdAt: Date): number {
  const ageMs = Date.now() - createdAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  for (const tier of RECENCY_DECAY) {
    if (ageDays <= tier.days) return tier.factor;
  }
  return 0.1;
}

export const GET = withAuth(async (req, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "8", 10));

    // Get communities where the user has opted in (or fall back to all published)
    const optIns = await db.communityOptIn.findMany({
      where: { userId: session.userId },
      select: { communityId: true },
    });
    const communityIds = optIns.map((o) => o.communityId);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days

    const posts = await db.post.findMany({
      where: {
        isHidden: false,
        createdAt: { gte: since },
        ...(communityIds.length > 0
          ? { communityId: { in: communityIds } }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100, // fetch more for scoring
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        createdAt: true,
        attachments: true,
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        space: { select: { slug: true, name: true, community: { select: { name: true, slug: true, primaryColor: true } } } },
        _count: { select: { reactions: true, comments: true } },
      },
    });

    // Score and sort
    const scored = posts
      .map((p) => {
        const engagement = p._count.reactions + p._count.comments * 2;
        const score = engagement * recencyFactor(p.createdAt);
        return { ...p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json({ success: true, data: scored });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
