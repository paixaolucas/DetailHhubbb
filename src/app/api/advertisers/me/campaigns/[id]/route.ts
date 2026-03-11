// =============================================================================
// GET    /api/advertisers/me/campaigns/[id]  — fetch single campaign
// PATCH  /api/advertisers/me/campaigns/[id]  — update draft campaign
// DELETE /api/advertisers/me/campaigns/[id]  — delete draft campaign
// POST   /api/advertisers/me/campaigns/[id]/submit — submit for review
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole, AdCampaignStatus, AdFormat } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().max(1000).optional().or(z.literal("")),
  format: z.nativeEnum(AdFormat).optional(),
  budget: z.number().positive().max(100000).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  targetUrl: z.string().url().optional().or(z.literal("")),
  creativeUrl: z.string().url().optional().or(z.literal("")),
  ctaText: z.string().max(60).optional().or(z.literal("")),
});

async function getCampaignForOwner(campaignId: string, userId: string) {
  const advertiser = await db.advertiser.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!advertiser) return null;

  return db.adCampaign.findFirst({
    where: { id: campaignId, advertiserId: advertiser.id },
  });
}

export const GET = withRole(UserRole.MARKETPLACE_PARTNER)(async (_req, { session, params }) => {
  const campaign = await getCampaignForOwner(params!.id as string, session.userId);
  if (!campaign) {
    return NextResponse.json({ success: false, error: "Campanha não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: campaign });
});

export const PATCH = withRole(UserRole.MARKETPLACE_PARTNER)(async (req, { session, params }) => {
  const campaign = await getCampaignForOwner(params!.id as string, session.userId);
  if (!campaign) {
    return NextResponse.json({ success: false, error: "Campanha não encontrada" }, { status: 404 });
  }

  // Only allow editing DRAFT or REJECTED campaigns
  if (
    campaign.status !== AdCampaignStatus.DRAFT &&
    campaign.status !== AdCampaignStatus.REJECTED
  ) {
    return NextResponse.json(
      { success: false, error: "Apenas campanhas em rascunho ou rejeitadas podem ser editadas" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Dados inválidos", details: parsed.error.errors },
      { status: 422 }
    );
  }

  const { startDate, endDate, targetUrl, creativeUrl, ctaText, description, ...rest } = parsed.data;

  const updated = await db.adCampaign.update({
    where: { id: campaign.id },
    data: {
      ...rest,
      ...(description !== undefined ? { description: description || null } : {}),
      ...(targetUrl !== undefined ? { targetUrl: targetUrl || null } : {}),
      ...(creativeUrl !== undefined ? { creativeUrl: creativeUrl || null } : {}),
      ...(ctaText !== undefined ? { ctaText: ctaText || null } : {}),
      ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
      ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
      // Reset to DRAFT if was REJECTED and now being re-edited
      ...(campaign.status === AdCampaignStatus.REJECTED
        ? { status: AdCampaignStatus.DRAFT, rejectionReason: null }
        : {}),
    },
  });

  return NextResponse.json({ success: true, data: updated });
});

export const DELETE = withRole(UserRole.MARKETPLACE_PARTNER)(async (_req, { session, params }) => {
  const campaign = await getCampaignForOwner(params!.id as string, session.userId);
  if (!campaign) {
    return NextResponse.json({ success: false, error: "Campanha não encontrada" }, { status: 404 });
  }

  if (campaign.status === AdCampaignStatus.ACTIVE) {
    return NextResponse.json(
      { success: false, error: "Não é possível excluir uma campanha ativa" },
      { status: 400 }
    );
  }

  await db.adCampaign.delete({ where: { id: campaign.id } });
  return NextResponse.json({ success: true });
});
