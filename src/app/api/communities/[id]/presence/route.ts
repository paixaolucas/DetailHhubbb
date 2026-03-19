// =============================================================================
// POST /api/communities/[id]/presence — heartbeat ping (call every 60s)
// GET  /api/communities/[id]/presence — returns online user count (last 2min)
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

const PRESENCE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const CHAT_MIN_ONLINE = 10; // min online to show chat

export const POST = withAuth(async (_req, { session, params }) => {
  const communityId = params?.id;
  if (!communityId) {
    return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
  }

  await db.analyticsEvent.create({
    data: {
      userId: session.userId,
      communityId,
      type: "ONLINE_PING",
      properties: {},
    },
  });

  // Return current count too
  const since = new Date(Date.now() - PRESENCE_WINDOW_MS);
  const onlineCount = await db.analyticsEvent.groupBy({
    by: ["userId"],
    where: { communityId, type: "ONLINE_PING", createdAt: { gte: since }, userId: { not: null } },
  });

  return NextResponse.json({ success: true, data: { onlineCount: onlineCount.length } });
});

export const GET = withAuth(async (_req, { session: _s, params }) => {
  const communityId = params?.id;
  if (!communityId) {
    return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
  }

  const since = new Date(Date.now() - PRESENCE_WINDOW_MS);
  const onlineGroups = await db.analyticsEvent.groupBy({
    by: ["userId"],
    where: { communityId, type: "ONLINE_PING", createdAt: { gte: since }, userId: { not: null } },
  });

  return NextResponse.json({
    success: true,
    data: { onlineCount: onlineGroups.length, chatVisible: onlineGroups.length >= CHAT_MIN_ONLINE },
  });
});
