// =============================================================================
// POST /api/live-sessions/[id]/rsvp  — RSVP to a live session
// GET  /api/live-sessions/[id]/rsvp  — Get current user's RSVP
// Requires auth
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

const rsvpSchema = z.object({
  status: z.enum(["GOING", "MAYBE", "NOT_GOING"]),
});

export const POST = withAuth(async (req: NextRequest, { session, params }) => {
  try {
    const sessionId = params?.id;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID required" },
        { status: 400 }
      );
    }

    // Verify the live session exists
    const liveSession = await db.liveSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true },
    });
    if (!liveSession) {
      return NextResponse.json(
        { success: false, error: "Sessão não encontrada" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = rsvpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const rsvp = await db.liveSessionRSVP.upsert({
      where: {
        sessionId_userId: { sessionId, userId: session.userId },
      },
      update: { status: parsed.data.status },
      create: {
        sessionId,
        userId: session.userId,
        status: parsed.data.status,
      },
    });

    return NextResponse.json({ success: true, data: rsvp });
  } catch (error) {
    console.error("[RSVP POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (req: NextRequest, { session, params }) => {
  try {
    const sessionId = params?.id;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID required" },
        { status: 400 }
      );
    }

    const rsvp = await db.liveSessionRSVP.findUnique({
      where: {
        sessionId_userId: { sessionId, userId: session.userId },
      },
    });

    return NextResponse.json({ success: true, data: rsvp ?? null });
  } catch (error) {
    console.error("[RSVP GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
