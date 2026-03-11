// =============================================================================
// DELETE /api/influencers/me/entregas/mencoes/[id]
// Remove an external mention. Only the owner can delete.
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const DELETE = withRole(UserRole.INFLUENCER_ADMIN)(async (_req, { session, params }) => {
  const mentionId = params?.id as string;
  if (!mentionId) {
    return NextResponse.json({ success: false, error: "ID obrigatório" }, { status: 400 });
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

  const mention = await db.influencerExternalMention.findUnique({
    where: { id: mentionId },
    select: { influencerId: true },
  });

  if (!mention || mention.influencerId !== influencer.id) {
    return NextResponse.json({ success: false, error: "Menção não encontrada" }, { status: 404 });
  }

  await db.influencerExternalMention.delete({ where: { id: mentionId } });

  return NextResponse.json({ success: true });
});
