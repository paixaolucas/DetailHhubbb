// =============================================================================
// GET  /api/advertisers/me  — fetch or create advertiser profile
// POST /api/advertisers/me  — upsert advertiser profile
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const profileSchema = z.object({
  companyName: z.string().min(2).max(100),
  website: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
});

export const GET = withRole(UserRole.MARKETPLACE_PARTNER)(async (_req, { session }) => {
  const advertiser = await db.advertiser.findUnique({
    where: { userId: session.userId },
    include: {
      _count: { select: { campaigns: true } },
    },
  });

  return NextResponse.json({ success: true, data: advertiser });
});

export const POST = withRole(UserRole.MARKETPLACE_PARTNER)(async (req, { session }) => {
  const body = await req.json().catch(() => ({}));
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Dados inválidos", details: parsed.error.errors },
      { status: 422 }
    );
  }

  const { companyName, website, logoUrl, bio, phone } = parsed.data;

  const advertiser = await db.advertiser.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      companyName,
      website: website || null,
      logoUrl: logoUrl || null,
      bio: bio || null,
      phone: phone || null,
    },
    update: {
      companyName,
      website: website || null,
      logoUrl: logoUrl || null,
      bio: bio || null,
      phone: phone || null,
    },
  });

  return NextResponse.json({ success: true, data: advertiser });
});
