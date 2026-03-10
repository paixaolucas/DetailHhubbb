// =============================================================================
// GET /api/communities/[id]/spaces  — list spaces (public, no auth)
// POST /api/communities/[id]/spaces — create space (owner only)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req, { params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json(
        { success: false, error: "Community ID required" },
        { status: 400 }
      );
    }

    const spaces = await db.space.findMany({
      where: { communityId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: spaces });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json(
        { success: false, error: "Community ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, description, icon, type, isPublic, isDefault } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "name and slug are required" },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug) || slug.length < 2 || slug.length > 60) {
      return NextResponse.json(
        { success: false, error: "Slug inválido. Use apenas letras minúsculas, números e hífens (2-60 caracteres)." },
        { status: 400 }
      );
    }

    const existing = await db.space.findUnique({
      where: { communityId_slug: { communityId, slug } },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A space with this slug already exists" },
        { status: 409 }
      );
    }

    const space = await db.space.create({
      data: {
        communityId,
        name,
        slug,
        description,
        icon,
        type: type || "DISCUSSION",
        sortOrder: 0,
        isPublic: isPublic ?? true,
        isDefault: isDefault ?? false,
      },
    });

    return NextResponse.json({ success: true, data: space }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
