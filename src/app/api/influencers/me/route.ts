// =============================================================================
// GET/PUT /api/influencers/me
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const updateInfluencerSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(1000).optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  socialLinks: z.record(z.string()).optional(),
});

export const GET = withAuth(async (_req: NextRequest, { session }) => {
  try {
    const influencer = await db.influencer.findUnique({
      where: { userId: session.userId },
      select: {
        id: true,
        displayName: true,
        bio: true,
        websiteUrl: true,
        socialLinks: true,
        stripeAccountStatus: true,
        isVerified: true,
        totalEarnings: true,
        pendingPayout: true,
      },
    });

    return NextResponse.json({ success: true, data: influencer ?? null });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});

export const PUT = withAuth(async (req: NextRequest, { session }) => {
  try {
    if (session.role !== UserRole.INFLUENCER_ADMIN && session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateInfluencerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const existing = await db.influencer.findUnique({ where: { userId: session.userId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Perfil de influencer não encontrado" }, { status: 404 });
    }

    const updated = await db.influencer.update({
      where: { userId: session.userId },
      data: {
        ...(parsed.data.displayName !== undefined && { displayName: parsed.data.displayName }),
        ...(parsed.data.bio !== undefined && { bio: parsed.data.bio }),
        ...(parsed.data.websiteUrl !== undefined && { websiteUrl: parsed.data.websiteUrl }),
        ...(parsed.data.socialLinks !== undefined && { socialLinks: parsed.data.socialLinks }),
      },
      select: {
        id: true,
        displayName: true,
        bio: true,
        websiteUrl: true,
        socialLinks: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});
