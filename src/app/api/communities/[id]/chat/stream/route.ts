// =============================================================================
// GET /api/communities/[id]/chat/stream
// Server-Sent Events endpoint for real-time community chat.
// Replaces polling in ChatWidget when running on a persistent server (Hostinger).
// On Vercel Hobby (10s timeout) the client falls back to polling automatically.
//
// Auth: JWT token passed as ?token=<accessToken> query param
// (EventSource API does not support custom headers)
// =============================================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { verifyMembership } from "@/middleware/auth.middleware";

const POLL_MS = 3000; // how often to check for new messages server-side
const KEEPALIVE_MS = 25000; // send keepalive comment to prevent proxy timeouts

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const communityId = params?.id;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const spaceId = searchParams.get("spaceId") ?? undefined;

  // ── Auth ────────────────────────────────────────────────────────────────────
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  let session: Awaited<ReturnType<typeof verifyAccessToken>>;
  try {
    session = await verifyAccessToken(token);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const isMember = await verifyMembership(session.sub, communityId, session.hasPlatform);
  if (!isMember) {
    return new Response("Forbidden", { status: 403 });
  }

  // ── SSE Stream ──────────────────────────────────────────────────────────────
  const encoder = new TextEncoder();

  // Track latest message id to only send deltas
  let latestCreatedAt: Date = new Date();

  // Load initial batch (last 100)
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

  const filtered = spaceId
    ? allEvents.filter((e) => (e.properties as Record<string, unknown>).spaceId === spaceId)
    : allEvents.filter((e) => !(e.properties as Record<string, unknown>).spaceId);

  const initial = filtered.slice(-100).reverse().map((e) => ({
    id: e.id,
    body: (e.properties as Record<string, string>).body ?? "",
    createdAt: e.createdAt,
    user: e.user,
  }));

  if (initial.length > 0) {
    latestCreatedAt = initial[initial.length - 1].createdAt;
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller already closed
        }
      };

      const keepalive = () => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          // controller already closed
        }
      };

      // Send initial messages
      send({ type: "init", messages: initial });

      // Poll for new messages
      const pollTimer = setInterval(async () => {
        try {
          const newEvents = await db.analyticsEvent.findMany({
            where: {
              communityId,
              type: "CHAT_MESSAGE",
              createdAt: { gt: latestCreatedAt },
            },
            orderBy: { createdAt: "asc" },
            take: 50,
            select: {
              id: true,
              properties: true,
              createdAt: true,
              user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
          });

          const newFiltered = spaceId
            ? newEvents.filter((e) => (e.properties as Record<string, unknown>).spaceId === spaceId)
            : newEvents.filter((e) => !(e.properties as Record<string, unknown>).spaceId);

          if (newFiltered.length > 0) {
            latestCreatedAt = newFiltered[newFiltered.length - 1].createdAt;
            const messages = newFiltered.map((e) => ({
              id: e.id,
              body: (e.properties as Record<string, string>).body ?? "",
              createdAt: e.createdAt,
              user: e.user,
            }));
            send({ type: "messages", messages });
          }
        } catch {
          clearInterval(pollTimer);
          clearInterval(keepaliveTimer);
          controller.close();
        }
      }, POLL_MS);

      // Keepalive pings to prevent proxy/browser timeouts
      const keepaliveTimer = setInterval(keepalive, KEEPALIVE_MS);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(pollTimer);
        clearInterval(keepaliveTimer);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}
