// =============================================================================
// POST /api/advertisers/me/campaigns/[id]/submit
// Submit a DRAFT campaign for admin review.
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole, AdCampaignStatus } from "@prisma/client";

export const POST = withRole(UserRole.MARKETPLACE_PARTNER)(async (_req, { session, params }) => {
  const campaignId = params?.id as string;

  const advertiser = await db.advertiser.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!advertiser) {
    return NextResponse.json(
      { success: false, error: "Perfil de anunciante não encontrado" },
      { status: 404 }
    );
  }

  const campaign = await db.adCampaign.findFirst({
    where: { id: campaignId, advertiserId: advertiser.id },
  });
  if (!campaign) {
    return NextResponse.json({ success: false, error: "Campanha não encontrada" }, { status: 404 });
  }

  if (campaign.status !== AdCampaignStatus.DRAFT) {
    return NextResponse.json(
      { success: false, error: "Somente campanhas em rascunho podem ser enviadas para revisão" },
      { status: 400 }
    );
  }

  // Basic completeness check
  if (!campaign.creativeUrl && campaign.format !== "EMAIL_BLAST") {
    return NextResponse.json(
      { success: false, error: "Adicione um criativo (imagem) antes de enviar para revisão" },
      { status: 400 }
    );
  }

  const updated = await db.adCampaign.update({
    where: { id: campaign.id },
    data: { status: AdCampaignStatus.PENDING_REVIEW },
  });

  return NextResponse.json({ success: true, data: updated });
});
