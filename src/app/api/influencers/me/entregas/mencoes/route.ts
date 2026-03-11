// =============================================================================
// POST /api/influencers/me/entregas/mencoes
// Register a new external platform mention for the current month.
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const VALID_PLATFORMS = ["instagram", "youtube", "whatsapp", "tiktok", "other"] as const;

const mentionSchema = z.object({
  platform: z.enum(VALID_PLATFORMS),
  description: z.string().min(5).max(200),
  url: z.string().url().optional().or(z.literal("")),
  year: z.number().int().min(2024).optional(),
  month: z.number().int().min(1).max(12).optional(),
});

export const POST = withRole(UserRole.INFLUENCER_ADMIN)(async (req, { session }) => {
  const body = await req.json().catch(() => ({}));
  const parsed = mentionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Dados inválidos", details: parsed.error.errors },
      { status: 422 }
    );
  }

  const influencer = await db.influencer.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!influencer) {
    return NextResponse.json(
      { success: false, error: "Perfil de influenciador não encontrado" },
      { status: 404 }
    );
  }

  const now = new Date();
  const year = parsed.data.year ?? now.getFullYear();
  const month = parsed.data.month ?? (now.getMonth() + 1);

  // Cap at 10 mentions per month (reasonable upper limit)
  const existing = await db.influencerExternalMention.count({
    where: { influencerId: influencer.id, year, month },
  });
  if (existing >= 10) {
    return NextResponse.json(
      { success: false, error: "Limite de 10 menções por mês atingido" },
      { status: 400 }
    );
  }

  const mention = await db.influencerExternalMention.create({
    data: {
      influencerId: influencer.id,
      year,
      month,
      platform: parsed.data.platform,
      description: parsed.data.description,
      url: parsed.data.url || null,
    },
    select: { id: true, platform: true, url: true, description: true, createdAt: true },
  });

  return NextResponse.json({ success: true, data: mention }, { status: 201 });
});
