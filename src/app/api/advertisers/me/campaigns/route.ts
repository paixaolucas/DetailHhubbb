// =============================================================================
// GET  /api/advertisers/me/campaigns  — list my campaigns
// POST /api/advertisers/me/campaigns  — create new campaign (draft)
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole, AdFormat } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  format: z.nativeEnum(AdFormat),
  budget: z.number().positive().max(100000),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  targetUrl: z.string().url().optional().or(z.literal("")),
  creativeUrl: z.string().url().optional().or(z.literal("")),
  ctaText: z.string().max(60).optional().or(z.literal("")),
});

async function getAdvertiser(userId: string) {
  return db.advertiser.findUnique({ where: { userId }, select: { id: true } });
}

export const GET = withRole(UserRole.MARKETPLACE_PARTNER)(async (req, { session }) => {
  const advertiser = await getAdvertiser(session.userId);
  if (!advertiser) {
    return NextResponse.json({ success: true, data: [] });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  const campaigns = await db.adCampaign.findMany({
    where: {
      advertiserId: advertiser.id,
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      format: true,
      status: true,
      budget: true,
      spent: true,
      impressions: true,
      clicks: true,
      startDate: true,
      endDate: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, data: campaigns });
});

export const POST = withRole(UserRole.MARKETPLACE_PARTNER)(async (req, { session }) => {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Dados inválidos", details: parsed.error.errors },
      { status: 422 }
    );
  }

  // Ensure advertiser profile exists
  let advertiser = await getAdvertiser(session.userId);
  if (!advertiser) {
    return NextResponse.json(
      { success: false, error: "Complete seu perfil de anunciante antes de criar campanhas" },
      { status: 400 }
    );
  }

  const { title, description, format, budget, startDate, endDate, targetUrl, creativeUrl, ctaText } =
    parsed.data;

  const campaign = await db.adCampaign.create({
    data: {
      advertiserId: advertiser.id,
      title,
      description: description || null,
      format,
      budget,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      targetUrl: targetUrl || null,
      creativeUrl: creativeUrl || null,
      ctaText: ctaText || null,
    },
  });

  return NextResponse.json({ success: true, data: campaign }, { status: 201 });
});
