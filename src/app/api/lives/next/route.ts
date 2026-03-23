import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyPlatformMembership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req: NextRequest, { session }) => {
  const userId = session.userId;
  const { searchParams } = new URL(req.url);
  const featuredOnly = searchParams.get("featured") === "true";

  const hasPlatform = await verifyPlatformMembership(userId);
  if (!hasPlatform) {
    return NextResponse.json({ success: true, data: null });
  }

  const now = new Date();

  // First try LIVE sessions (regardless of featured filter)
  const liveNow = await db.liveSession.findFirst({
    where: { status: "LIVE" },
    orderBy: { startedAt: "asc" },
    include: {
      host: { select: { firstName: true, lastName: true, avatarUrl: true } },
      community: { select: { name: true, slug: true } },
      rsvps: { where: { userId }, select: { id: true } },
      _count: { select: { rsvps: true } },
    },
  });

  const live = liveNow ?? await db.liveSession.findFirst({
    where: {
      status: "SCHEDULED",
      scheduledAt: { gte: now },
      ...(featuredOnly ? { isFeatured: true } : {}),
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      host: { select: { firstName: true, lastName: true, avatarUrl: true } },
      community: { select: { name: true, slug: true } },
      rsvps: { where: { userId }, select: { id: true } },
      _count: { select: { rsvps: true } },
    },
  });

  if (!live) {
    return NextResponse.json({ success: true, data: null });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: live.id,
      title: live.title,
      description: live.description,
      thumbnailUrl: live.thumbnailUrl,
      scheduledAt: live.scheduledAt.toISOString(),
      status: live.status,
      isFeatured: live.isFeatured,
      host: {
        name: `${live.host.firstName} ${live.host.lastName ?? ""}`.trim(),
        avatarUrl: live.host.avatarUrl,
      },
      community: live.community,
      rsvpCount: live._count.rsvps,
      hasRSVP: live.rsvps.length > 0,
    },
  });
});
