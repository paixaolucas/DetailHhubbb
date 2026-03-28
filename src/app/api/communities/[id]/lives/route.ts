// =============================================================================
// GET /api/communities/[slug]/lives
// Returns live sessions for a community (LIVE, upcoming SCHEDULED, recent ENDED).
// [id] param is treated as the community SLUG — same convention as overview/feed.
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { LiveSessionStatus } from "@prisma/client";

export const GET = withAuth(async (req, { params }) => {
  try {
    const slug = params?.id;
    if (!slug) {
      return NextResponse.json({ success: false, error: "Slug required" }, { status: 400 });
    }

    const community = await db.community.findUnique({
      where: { slug },
      select: { id: true, isPublished: true },
    });

    if (!community || !community.isPublished) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const lives = await db.liveSession.findMany({
      where: {
        communityId: community.id,
        OR: [
          { status: LiveSessionStatus.LIVE },
          { status: LiveSessionStatus.SCHEDULED, scheduledAt: { gte: now } },
          { status: LiveSessionStatus.ENDED, endedAt: { gte: thirtyDaysAgo } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        status: true,
        scheduledAt: true,
        startedAt: true,
        endedAt: true,
        replayUrl: true,
        actualAttendees: true,
        isRecorded: true,
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { rsvps: true },
        },
      },
    });

    // Sort in JS: LIVE first, then upcoming SCHEDULED by scheduledAt ASC, then recent ENDED by endedAt DESC
    const sortedLives = lives.sort((a, b) => {
      const order = (status: LiveSessionStatus) => {
        if (status === LiveSessionStatus.LIVE) return 0;
        if (status === LiveSessionStatus.SCHEDULED) return 1;
        return 2; // ENDED
      };

      const rankA = order(a.status);
      const rankB = order(b.status);

      if (rankA !== rankB) return rankA - rankB;

      // Same group — secondary sort
      if (a.status === LiveSessionStatus.SCHEDULED && b.status === LiveSessionStatus.SCHEDULED) {
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      }
      if (a.status === LiveSessionStatus.ENDED && b.status === LiveSessionStatus.ENDED) {
        const aEnd = a.endedAt ? new Date(a.endedAt).getTime() : 0;
        const bEnd = b.endedAt ? new Date(b.endedAt).getTime() : 0;
        return bEnd - aEnd; // DESC
      }

      return 0;
    });

    const hasLive = sortedLives.some((l) => l.status === LiveSessionStatus.LIVE);

    return NextResponse.json(
      { success: true, data: { lives: sortedLives.slice(0, 20), hasLive } },
      { headers: { "Cache-Control": "private, max-age=15" } }
    );
  } catch (error) {
    console.error("[Communities:Lives:GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
