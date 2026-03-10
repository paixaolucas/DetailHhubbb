// =============================================================================
// PATCH /api/communities/[id]/spaces/[spaceId] — update space (owner only)
// DELETE /api/communities/[id]/spaces/[spaceId] — delete space (owner only)
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const PATCH = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const spaceId = params?.spaceId;
    if (!communityId || !spaceId) {
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, icon, type, sortOrder, isLocked, isPublic } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (type !== undefined) updateData.type = type;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isLocked !== undefined) updateData.isLocked = isLocked;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const space = await db.space.update({
      where: { id: spaceId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: space });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const spaceId = params?.spaceId;
    if (!communityId || !spaceId) {
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const space = await db.space.findUnique({
      where: { id: spaceId },
      select: { isDefault: true },
    });

    if (!space) {
      return NextResponse.json({ success: false, error: "Space not found" }, { status: 404 });
    }

    if (space.isDefault) {
      return NextResponse.json(
        { success: false, error: "Cannot delete the default space" },
        { status: 400 }
      );
    }

    await db.space.delete({ where: { id: spaceId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
