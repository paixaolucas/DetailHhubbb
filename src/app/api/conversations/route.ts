// =============================================================================
// GET  /api/conversations — List user's conversations (auth required)
// POST /api/conversations — Create or get existing conversation (auth required)
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (_req, { session }) => {
  try {
    const conversations = await db.conversation.findMany({
      where: {
        participants: {
          some: { userId: session.userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json(
        { success: false, error: "participantId is required" },
        { status: 400 }
      );
    }

    if (participantId === session.userId) {
      return NextResponse.json(
        { success: false, error: "Cannot create conversation with yourself" },
        { status: 400 }
      );
    }

    // Check if a conversation already exists between the two users
    const existing = await db.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: session.userId } } },
          { participants: { some: { userId: participantId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    // Create new conversation with both participants
    const conversation = await db.conversation.create({
      data: {
        participants: {
          create: [
            { userId: session.userId },
            { userId: participantId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json({ success: true, data: conversation }, { status: 201 });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
