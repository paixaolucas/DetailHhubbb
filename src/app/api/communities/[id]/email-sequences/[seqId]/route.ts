// =============================================================================
// PUT    /api/communities/[id]/email-sequences/[seqId] — update sequence
// DELETE /api/communities/[id]/email-sequences/[seqId] — delete sequence
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

const stepSchema = z.object({
  stepNumber: z.number().int().positive(),
  delayDays: z.number().int().min(0),
  subject: z.string().min(1).max(500),
  bodyHtml: z.string().min(1),
  bodyText: z.string().optional(),
});

const updateSequenceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  trigger: z.enum(["ON_JOIN", "ON_SUBSCRIPTION", "ON_LESSON_COMPLETE", "MANUAL"]).optional(),
  isActive: z.boolean().optional(),
  steps: z.array(stepSchema).optional(),
});

export const PUT = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const seqId = params?.seqId;
    if (!communityId || !seqId) {
      return NextResponse.json(
        { success: false, error: "Community ID and Sequence ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Confirm the sequence belongs to this community
    const existing = await db.emailSequence.findFirst({
      where: { id: seqId, communityId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Sequence not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateSequenceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const { steps, ...sequenceData } = parsed.data;

    // Update sequence fields
    const sequence = await db.emailSequence.update({
      where: { id: seqId },
      data: {
        ...(sequenceData.name !== undefined && { name: sequenceData.name }),
        ...(sequenceData.trigger !== undefined && { trigger: sequenceData.trigger }),
        ...(sequenceData.isActive !== undefined && { isActive: sequenceData.isActive }),
      },
    });

    // If steps provided, replace all existing steps
    if (steps !== undefined) {
      await db.emailSequenceStep.deleteMany({ where: { sequenceId: seqId } });
      if (steps.length > 0) {
        await db.emailSequenceStep.createMany({
          data: steps.map((s) => ({ sequenceId: seqId, ...s })),
        });
      }
    }

    const updated = await db.emailSequence.findUnique({
      where: { id: seqId },
      include: { steps: { orderBy: { stepNumber: "asc" } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[Email Sequences PUT]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const seqId = params?.seqId;
    if (!communityId || !seqId) {
      return NextResponse.json(
        { success: false, error: "Community ID and Sequence ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.emailSequence.findFirst({
      where: { id: seqId, communityId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Sequence not found" }, { status: 404 });
    }

    await db.emailSequence.delete({ where: { id: seqId } });

    return NextResponse.json({ success: true, message: "Sequence deleted" });
  } catch (error) {
    console.error("[Email Sequences DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
