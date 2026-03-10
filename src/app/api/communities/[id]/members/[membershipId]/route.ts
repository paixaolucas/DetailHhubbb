// =============================================================================
// DELETE /api/communities/[id]/members/[membershipId]
// Soft-deletes a membership (sets status to CANCELLED) to preserve analytics
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const DELETE = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const membershipId = params?.membershipId;
    if (!communityId || !membershipId) {
      return NextResponse.json({ success: false, error: "Parâmetros ausentes" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    // Verify membership exists before updating
    const membership = await db.communityMembership.findUnique({
      where: { id: membershipId },
      select: { id: true, communityId: true },
    });

    if (!membership) {
      return NextResponse.json({ success: false, error: "Membro não encontrado" }, { status: 404 });
    }

    if (membership.communityId !== communityId) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    // Soft delete — preserves membership history for analytics
    await db.communityMembership.update({
      where: { id: membershipId },
      data: { status: "CANCELED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Community Members DELETE]", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});
