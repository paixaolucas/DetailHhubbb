// =============================================================================
// PATCH /api/influencers/me/entregas/bio-link
// Toggle the bio link confirmation for the influencer.
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const PATCH = withRole(UserRole.INFLUENCER_ADMIN)(async (req, { session }) => {
  const body = await req.json().catch(() => ({}));
  const confirmed = Boolean(body.confirmed);

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

  await db.influencer.update({
    where: { id: influencer.id },
    data: { bioLinkConfirmed: confirmed },
  });

  return NextResponse.json({ success: true, data: { bioLinkConfirmed: confirmed } });
});
