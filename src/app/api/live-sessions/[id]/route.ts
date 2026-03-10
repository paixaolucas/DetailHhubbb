// =============================================================================
// PUT/DELETE /api/live-sessions/[id]
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { AppError, ForbiddenError, NotFoundError } from "@/types";
import { UserRole, LiveSessionStatus } from "@prisma/client";
import { z } from "zod";

const updateSessionSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime().optional(),
  maxAttendees: z.number().int().positive().optional().nullable(),
  isPublic: z.boolean().optional(),
  isRecorded: z.boolean().optional(),
  status: z.nativeEnum(LiveSessionStatus).optional(),
  streamUrl: z.string().url().optional().nullable(),
  replayUrl: z.string().url().optional().nullable(),
});

async function assertSessionOwnership(userId: string, userRole: string, sessionId: string) {
  if (userRole === UserRole.SUPER_ADMIN) return;
  const session = await db.liveSession.findUnique({
    where: { id: sessionId },
    select: { hostId: true },
  });
  if (!session) throw new NotFoundError("Session not found");
  if (session.hostId !== userId) throw new ForbiddenError("You can only manage your own sessions");
}

export const PUT = withAuth(async (req: NextRequest, { session, params }) => {
  try {
    const id = params?.id;
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

    await assertSessionOwnership(session.userId, session.role, id);

    const body = await req.json();
    const parsed = updateSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 422 });
    }

    const updated = await db.liveSession.update({
      where: { id },
      data: {
        ...parsed.data,
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
        startedAt: parsed.data.status === LiveSessionStatus.LIVE ? new Date() : undefined,
        endedAt: parsed.data.status === LiveSessionStatus.ENDED ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: NextRequest, { session, params }) => {
  try {
    const id = params?.id;
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

    await assertSessionOwnership(session.userId, session.role, id);
    await db.liveSession.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Session deleted" });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
