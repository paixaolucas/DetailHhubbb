// =============================================================================
// GET  /api/conversations/[id]/messages — fetch messages (auth required)
// POST /api/conversations/[id]/messages — send a message (auth required)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

const sendSchema = z.object({
  body: z.string().min(1).max(5000),
});

async function assertParticipant(conversationId: string, userId: string) {
  const participant = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return !!participant;
}

export const GET = withAuth(async (req: NextRequest, { session, params }) => {
  const conversationId = params?.id;
  if (!conversationId) {
    return NextResponse.json({ success: false, error: "Conversation ID required" }, { status: 400 });
  }

  const isMember = await assertParticipant(conversationId, session.userId);
  if (!isMember) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const take = 30;

    const messages = await db.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    // Mark messages as read
    await db.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: session.userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Update lastReadAt for participant
    await db.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: session.userId } },
      data: { lastReadAt: new Date() },
    });

    const nextCursor = messages.length === take ? messages[messages.length - 1].id : null;

    return NextResponse.json({
      success: true,
      data: messages.reverse(),
      nextCursor,
    });
  } catch (error) {
    console.error("[GET /api/conversations/[id]/messages]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, { session, params }) => {
  const conversationId = params?.id;
  if (!conversationId) {
    return NextResponse.json({ success: false, error: "Conversation ID required" }, { status: 400 });
  }

  const isMember = await assertParticipant(conversationId, session.userId);
  if (!isMember) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const [message] = await db.$transaction([
      db.directMessage.create({
        data: {
          conversationId,
          senderId: session.userId,
          body: parsed.data.body,
        },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      }),
      db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/conversations/[id]/messages]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
