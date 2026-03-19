// =============================================================================
// GET  /api/communities/[id]/chat — fetch recent chat messages (last 100)
// POST /api/communities/[id]/chat — send a chat message
// Messages stored as AnalyticsEvent with type=CHAT_MESSAGE
// Only visible when ≥10 members online (client enforces, server stores regardless)
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyMembership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

const chatSchema = z.object({
  body: z.string().min(1).max(500).trim(),
});

export const GET = withAuth(async (req, { session, params }) => {
  const communityId = params?.id;
  if (!communityId) {
    return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
  }

  const isMember = await verifyMembership(session.userId, communityId, session.hasPlatform);
  if (!isMember) {
    return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("spaceId") ?? undefined;

  // Fetch all community chat messages, then filter by spaceId client-side
  // (Prisma JSON filter for nullable JSON path is unreliable cross-DB)
  const allEvents = await db.analyticsEvent.findMany({
    where: { communityId, type: "CHAT_MESSAGE" },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      properties: true,
      createdAt: true,
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  // Filter by spaceId server-side after fetch
  const filtered = spaceId
    ? allEvents.filter((e) => (e.properties as Record<string, unknown>).spaceId === spaceId)
    : allEvents.filter((e) => !(e.properties as Record<string, unknown>).spaceId);

  const messages = filtered.slice(-100).map((e) => ({
    id: e.id,
    body: (e.properties as Record<string, string>).body ?? "",
    createdAt: e.createdAt,
    user: e.user,
  }));

  return NextResponse.json({ success: true, data: messages });
});

export const POST = withAuth(async (req: Request, { session, params }) => {
  const communityId = params?.id;
  if (!communityId) {
    return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
  }

  const isMember = await verifyMembership(session.userId, communityId, session.hasPlatform);
  if (!isMember) {
    return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
  }

  const rawBody = await req.json();
  const parsed = chatSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 422 });
  }
  const spaceId: string | undefined = rawBody.spaceId ?? undefined;

  // Rate limit: max 1 message per 2 seconds (simple: check last msg timestamp)
  const lastMsg = await db.analyticsEvent.findFirst({
    where: { communityId, type: "CHAT_MESSAGE", userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (lastMsg && Date.now() - lastMsg.createdAt.getTime() < 2000) {
    return NextResponse.json({ success: false, error: "Você está enviando mensagens muito rápido." }, { status: 429 });
  }

  const event = await db.analyticsEvent.create({
    data: {
      userId: session.userId,
      communityId,
      type: "CHAT_MESSAGE",
      properties: { body: parsed.data.body, ...(spaceId ? { spaceId } : {}) },
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: event.id,
      body: parsed.data.body,
      createdAt: event.createdAt,
      user: event.user,
    },
  });
});
