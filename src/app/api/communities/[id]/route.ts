// =============================================================================
// GET/PUT/DELETE /api/communities/[id]
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import {
  getCommunityById,
  updateCommunity,
} from "@/services/community/community.service";
import { updateCommunitySchema } from "@/lib/validations/community";
import { AppError } from "@/types";
import { db } from "@/lib/db";

export const GET = withAuth(async (req, { session, params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Community ID required" },
        { status: 400 }
      );
    }

    const community = await getCommunityById(id);
    return NextResponse.json({ success: true, data: community });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (req, { session, params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Community ID required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = updateCommunitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    await updateCommunity(id, session.userId, session.role, parsed.data);
    return NextResponse.json({ success: true, message: "Community updated" });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req, { session, params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Community ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, id, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    // Soft delete — unpublish and hide from listings
    await db.community.update({
      where: { id },
      data: { isPublished: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Community DELETE]", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});
