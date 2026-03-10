// =============================================================================
// DELETE /api/communities/[id]/plans/[planId]
// PUT    /api/communities/[id]/plans/[planId]
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

const updatePlanSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  features: z.array(z.string().max(200)).max(20).optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const PUT = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const planId = params?.planId;
    if (!communityId || !planId) {
      return NextResponse.json({ success: false, error: "Parâmetros ausentes" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    // Verify plan belongs to this community
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: planId },
      select: { id: true, communityId: true },
    });
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plano não encontrado" }, { status: 404 });
    }
    if (plan.communityId !== communityId) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updatePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const updated = await db.subscriptionPlan.update({
      where: { id: planId },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[Plan PUT]", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const planId = params?.planId;
    if (!communityId || !planId) {
      return NextResponse.json({ success: false, error: "Parâmetros ausentes" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    // Verify plan belongs to this community before deactivating
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: planId },
      select: { id: true, communityId: true },
    });
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plano não encontrado" }, { status: 404 });
    }
    if (plan.communityId !== communityId) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    await db.subscriptionPlan.update({
      where: { id: planId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Plan DELETE]", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});
