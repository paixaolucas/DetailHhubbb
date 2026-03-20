// =============================================================================
// PATCH  /api/communities/[id]/spaces/[spaceId]/modules/[moduleId] — edit module
// DELETE /api/communities/[id]/spaces/[spaceId]/modules/[moduleId] — delete module
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const PATCH = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const spaceId = params?.spaceId;
    const moduleId = params?.moduleId;
    if (!communityId || !spaceId || !moduleId) {
      return NextResponse.json({ success: false, error: "IDs obrigatórios" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.contentModule.findFirst({
      where: { id: moduleId, communityId, spaceId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Módulo não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, isPublished, sortOrder } = body;

    const updated = await db.contentModule.update({
      where: { id: moduleId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isPublished !== undefined && { isPublished }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      include: { _count: { select: { lessons: true } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const spaceId = params?.spaceId;
    const moduleId = params?.moduleId;
    if (!communityId || !spaceId || !moduleId) {
      return NextResponse.json({ success: false, error: "IDs obrigatórios" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.contentModule.findFirst({
      where: { id: moduleId, communityId, spaceId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Módulo não encontrado" }, { status: 404 });
    }

    await db.contentModule.delete({ where: { id: moduleId } });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
