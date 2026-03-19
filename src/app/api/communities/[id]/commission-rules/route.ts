// =============================================================================
// GET /api/communities/[id]/commission-rules  — list rules
// POST /api/communities/[id]/commission-rules  — create rule
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { CommissionType } from "@prisma/client";
import { z } from "zod";

const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(CommissionType).default(CommissionType.PERCENTAGE),
  rate: z.number().min(0).max(100),
  flatAmount: z.number().min(0).optional().nullable(),
  minAmount: z.number().min(0).optional().nullable(),
  maxAmount: z.number().min(0).optional().nullable(),
  platformFee: z.number().min(0).max(1).optional(),
  isActive: z.boolean().default(true),
});

export const GET = withAuth(async (_req: NextRequest, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    const rules = await db.commissionRule.findMany({
      where: { communityId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const rule = await db.commissionRule.create({
      data: {
        communityId,
        name: parsed.data.name,
        description: parsed.data.description,
        type: parsed.data.type,
        rate: parsed.data.rate,
        flatAmount: parsed.data.flatAmount,
        minAmount: parsed.data.minAmount,
        maxAmount: parsed.data.maxAmount,
        platformFee: parsed.data.platformFee ?? 0.10,
        isActive: parsed.data.isActive,
      },
    });

    return NextResponse.json({ success: true, data: rule }, { status: 201 });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});
