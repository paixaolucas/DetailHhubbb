// =============================================================================
// GET /api/live-sessions?communityId=xxx
// POST /api/live-sessions
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { AppError, ForbiddenError } from "@/types";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { awardInfluencerPoints } from "@/lib/points";

const createSessionSchema = z.object({
  communityId: z.string().cuid(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime(),
  maxAttendees: z.number().int().positive().optional(),
  isPublic: z.boolean().default(false),
  isRecorded: z.boolean().default(true),
});

export const GET = withAuth(async (req, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");
    const status = searchParams.get("status");

    // Members see sessions from their communities
    // Influencers see their own community sessions
    let communityIds: string[] = [];

    if (communityId) {
      communityIds = [communityId];
    } else if (session.role === UserRole.INFLUENCER_ADMIN || session.role === UserRole.SUPER_ADMIN) {
      const influencer = await db.influencer.findUnique({
        where: { userId: session.userId },
        select: { communities: { select: { id: true } } },
      });
      communityIds = influencer?.communities.map((c) => c.id) ?? [];
    } else {
      // Member: get their active memberships
      const memberships = await db.communityMembership.findMany({
        where: { userId: session.userId, status: "ACTIVE" },
        select: { communityId: true },
      });
      communityIds = memberships.map((m) => m.communityId);
    }

    const sessions = await db.liveSession.findMany({
      where: {
        communityId: { in: communityIds },
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { scheduledAt: "asc" },
      include: {
        host: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        community: { select: { id: true, name: true, primaryColor: true } },
        _count: { select: { attendees: true } },
      },
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("[LiveSessions GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withAuth(async (req, { session }) => {
  try {
    if (session.role !== UserRole.INFLUENCER_ADMIN && session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ success: false, error: "Only influencers can create live sessions" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    // Verify ownership of the community
    if (session.role !== UserRole.SUPER_ADMIN) {
      const influencer = await db.influencer.findUnique({
        where: { userId: session.userId },
        select: { communities: { where: { id: parsed.data.communityId }, select: { id: true } } },
      });
      if (!influencer || influencer.communities.length === 0) {
        throw new ForbiddenError("You can only create sessions for your own communities");
      }
    }

    const liveSession = await db.liveSession.create({
      data: {
        communityId: parsed.data.communityId,
        hostId: session.userId,
        title: parsed.data.title,
        description: parsed.data.description,
        scheduledAt: new Date(parsed.data.scheduledAt),
        maxAttendees: parsed.data.maxAttendees,
        isPublic: parsed.data.isPublic,
        isRecorded: parsed.data.isRecorded,
      },
    });

    // Award influencer points for creating a live session (idempotent per session)
    awardInfluencerPoints({
      userId: session.userId,
      communityId: parsed.data.communityId,
      amount: 25,
      reason: "criou uma live session",
      eventType: "INFLUENCER_LIVE_CREATE",
      metadata: { idempotencyKey: `live_${liveSession.id}` },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: liveSession }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error("[LiveSessions POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
