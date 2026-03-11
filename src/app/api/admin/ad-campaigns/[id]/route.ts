// =============================================================================
// PATCH /api/admin/ad-campaigns/[id]
// Approve, reject, pause, or reactivate a campaign. (SUPER_ADMIN)
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole, AdCampaignStatus } from "@prisma/client";
import { z } from "zod";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), reason: z.string().min(5).max(500) }),
  z.object({ action: z.literal("pause") }),
  z.object({ action: z.literal("activate") }),
  z.object({ action: z.literal("complete") }),
]);

export const PATCH = withRole(UserRole.SUPER_ADMIN)(async (req, { session, params }) => {
  const campaignId = params?.id as string;

  const campaign = await db.adCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    return NextResponse.json({ success: false, error: "Campanha não encontrada" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Ação inválida", details: parsed.error.errors },
      { status: 422 }
    );
  }

  const { action } = parsed.data;

  // Validate transitions
  const transitions: Record<string, AdCampaignStatus[]> = {
    approve: [AdCampaignStatus.PENDING_REVIEW],
    reject: [AdCampaignStatus.PENDING_REVIEW],
    pause: [AdCampaignStatus.ACTIVE],
    activate: [AdCampaignStatus.PAUSED, AdCampaignStatus.PENDING_REVIEW],
    complete: [AdCampaignStatus.ACTIVE, AdCampaignStatus.PAUSED],
  };

  if (!transitions[action].includes(campaign.status)) {
    return NextResponse.json(
      { success: false, error: `Ação "${action}" não é permitida para o status atual` },
      { status: 400 }
    );
  }

  const statusMap: Record<string, AdCampaignStatus> = {
    approve: AdCampaignStatus.ACTIVE,
    reject: AdCampaignStatus.REJECTED,
    pause: AdCampaignStatus.PAUSED,
    activate: AdCampaignStatus.ACTIVE,
    complete: AdCampaignStatus.COMPLETED,
  };

  const updated = await db.adCampaign.update({
    where: { id: campaign.id },
    data: {
      status: statusMap[action],
      reviewedById: session.userId,
      reviewedAt: new Date(),
      ...(action === "reject"
        ? { rejectionReason: (parsed.data as { action: "reject"; reason: string }).reason }
        : {}),
      ...(action === "approve" || action === "activate" ? { rejectionReason: null } : {}),
    },
  });

  return NextResponse.json({ success: true, data: updated });
});

export const GET = withRole(UserRole.SUPER_ADMIN)(async (_req, { params }) => {
  const campaign = await db.adCampaign.findUnique({
    where: { id: params?.id as string },
    include: {
      advertiser: {
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ success: false, error: "Campanha não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: campaign });
});
