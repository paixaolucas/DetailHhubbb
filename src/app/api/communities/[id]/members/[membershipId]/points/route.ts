// =============================================================================
// POST /api/communities/[id]/members/[membershipId]/points
// Manually allocate points to a member (owner or SUPER_ADMIN only)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

const allocatePointsSchema = z.object({
  amount: z.number().int().refine((n) => n !== 0, { message: "Amount must be non-zero" }),
  type: z.enum(["EARNED", "SPENT", "ADJUSTED"]).default("ADJUSTED"),
  reason: z.string().max(200).optional(),
});

export const POST = withAuth(async (req: NextRequest, { session, params }) => {
  try {
    const communityId = params?.id;
    const membershipId = params?.membershipId;

    if (!communityId || !membershipId) {
      return NextResponse.json({ success: false, error: "IDs required" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    // Resolve userId from membershipId
    const membership = await db.communityMembership.findUnique({
      where: { id: membershipId },
      select: { userId: true, communityId: true },
    });
    if (!membership || membership.communityId !== communityId) {
      return NextResponse.json({ success: false, error: "Membro não encontrado" }, { status: 404 });
    }
    const targetUserId = membership.userId;

    const body = await req.json();
    const parsed = allocatePointsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const { amount, type, reason } = parsed.data;

    let pointsDelta: number;
    let totalEarnedDelta = 0;
    if (type === "EARNED") {
      pointsDelta = Math.abs(amount);
      totalEarnedDelta = Math.abs(amount);
    } else if (type === "SPENT") {
      pointsDelta = -Math.abs(amount);
    } else {
      pointsDelta = amount;
      if (amount > 0) totalEarnedDelta = amount;
    }

    const userPoints = await db.$transaction(async (tx) => {
      const up = await tx.userPoints.upsert({
        where: { userId_communityId: { userId: targetUserId, communityId } },
        create: {
          userId: targetUserId,
          communityId,
          points: Math.max(0, pointsDelta),
          totalEarned: Math.max(0, totalEarnedDelta),
        },
        update: {
          points: { increment: pointsDelta },
          ...(totalEarnedDelta > 0 ? { totalEarned: { increment: totalEarnedDelta } } : {}),
        },
      });

      await tx.pointTransaction.create({
        data: {
          userPointsId: up.id,
          amount,
          reason: reason ?? `${type} by admin`,
          metadata: { type, allocatedBy: session.userId },
        },
      });

      return up;
    });

    return NextResponse.json({ success: true, data: userPoints }, { status: 201 });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});
