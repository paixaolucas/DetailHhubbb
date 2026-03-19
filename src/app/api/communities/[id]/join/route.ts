// =============================================================================
// POST /api/communities/[id]/join   — opt-in to a community
// DELETE /api/communities/[id]/join — opt-out from a community
// Requires active PlatformMembership (access) to declare belonging.
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { createNotification } from "@/services/notification/notification.service";
import { awardInfluencerPoints } from "@/lib/points";

export const POST = withAuth(async (_req, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
    }

    // Must have active platform membership to opt-in
    const platformMembership = await db.platformMembership.findFirst({
      where: { userId: session.userId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!platformMembership) {
      return NextResponse.json(
        { success: false, error: "Assinatura ativa necessária para entrar nesta comunidade" },
        { status: 403 }
      );
    }

    const community = await db.community.findUnique({
      where: { id: communityId, isPublished: true },
      select: {
        id: true,
        name: true,
        influencer: { select: { userId: true } },
      },
    });
    if (!community) {
      return NextResponse.json({ success: false, error: "Comunidade não encontrada" }, { status: 404 });
    }

    // Upsert opt-in (idempotent)
    const optIn = await db.communityOptIn.upsert({
      where: { userId_communityId: { userId: session.userId, communityId } },
      create: { userId: session.userId, communityId },
      update: {}, // already joined — no-op
    });

    // Notify influencer of new member opt-in (non-blocking)
    if (community.influencer?.userId && community.influencer.userId !== session.userId) {
      const user = await db.user.findUnique({
        where: { id: session.userId },
        select: { firstName: true, lastName: true },
      });
      const name = user ? `${user.firstName} ${user.lastName}` : "Um membro";
      createNotification({
        recipientId: community.influencer.userId,
        actorId: session.userId,
        type: "NEW_MEMBER",
        title: `${name} entrou na sua comunidade`,
        body: `${name} declarou pertencimento à comunidade ${community.name}.`,
        link: `/dashboard/communities`,
      }).catch(() => {});
    }

    // Award influencer +5 pts for each new member opt-in (idempotent per user+community)
    if (community.influencer?.userId && community.influencer.userId !== session.userId) {
      awardInfluencerPoints({
        userId: community.influencer.userId,
        communityId,
        amount: 5,
        reason: "novo membro entrou na comunidade",
        eventType: "INFLUENCER_NEW_MEMBER",
        dailyLimit: 20,
        metadata: { idempotencyKey: `join_${session.userId}_${communityId}` },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: { joined: true, optInId: optIn.id } });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (_req, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
    }

    await db.communityOptIn.deleteMany({
      where: { userId: session.userId, communityId },
    });

    return NextResponse.json({ success: true, data: { joined: false } });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const GET = withAuth(async (_req, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
    }

    const optIn = await db.communityOptIn.findUnique({
      where: { userId_communityId: { userId: session.userId, communityId } },
      select: { id: true, joinedAt: true },
    });

    const count = await db.communityOptIn.count({ where: { communityId } });

    return NextResponse.json({ success: true, data: { joined: !!optIn, joinedAt: optIn?.joinedAt ?? null, memberCount: count } });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
