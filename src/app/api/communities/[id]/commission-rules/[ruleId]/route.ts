// =============================================================================
// PUT /api/communities/[id]/commission-rules/[ruleId]  — update rule
// DELETE /api/communities/[id]/commission-rules/[ruleId]  — delete rule
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { CommissionType } from "@prisma/client";
import { z } from "zod";

const updateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  type: z.nativeEnum(CommissionType).optional(),
  rate: z.number().min(0).max(100).optional(),
  flatAmount: z.number().min(0).optional().nullable(),
  minAmount: z.number().min(0).optional().nullable(),
  maxAmount: z.number().min(0).optional().nullable(),
  platformFee: z.number().min(0).max(1).optional(),
  isActive: z.boolean().optional(),
});

async function resolveRule(session: any, params: any) {
  const communityId = params?.id;
  const ruleId = params?.ruleId;
  if (!communityId || !ruleId) return { error: "IDs required", status: 400 };

  const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
  if (!isOwner) return { error: "Acesso negado", status: 403 };

  const rule = await db.commissionRule.findUnique({ where: { id: ruleId } });
  if (!rule) return { error: "Regra não encontrada", status: 404 };
  if (rule.communityId !== communityId) return { error: "Acesso negado", status: 403 };

  return { communityId, ruleId };
}

export const PUT = withAuth(async (req: NextRequest, { session, params }) => {
  try {
    const resolved = await resolveRule(session, params);
    if ("error" in resolved) {
      return NextResponse.json({ success: false, error: resolved.error }, { status: resolved.status });
    }

    const body = await req.json();
    const parsed = updateRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const updated = await db.commissionRule.update({
      where: { id: resolved.ruleId },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (_req: NextRequest, { session, params }) => {
  try {
    const resolved = await resolveRule(session, params);
    if ("error" in resolved) {
      return NextResponse.json({ success: false, error: resolved.error }, { status: resolved.status });
    }

    await db.commissionRule.delete({ where: { id: resolved.ruleId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});
