// =============================================================================
// GET  /api/communities/[id]/email-sequences — list sequences
// POST /api/communities/[id]/email-sequences — create sequence
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

const createSequenceSchema = z.object({
  name: z.string().min(1).max(200),
  trigger: z.enum(["ON_JOIN", "ON_SUBSCRIPTION", "ON_LESSON_COMPLETE", "MANUAL"]),
  isActive: z.boolean().optional(),
});

export const GET = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json(
        { success: false, error: "Community ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const sequences = await db.emailSequence.findMany({
      where: { communityId },
      include: {
        steps: { orderBy: { stepNumber: "asc" } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: sequences });
  } catch (error) {
    console.error("[Email Sequences GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json(
        { success: false, error: "Community ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createSequenceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const { name, trigger, isActive } = parsed.data;

    const sequence = await db.emailSequence.create({
      data: {
        communityId,
        name,
        trigger,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, data: sequence }, { status: 201 });
  } catch (error) {
    console.error("[Email Sequences POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
