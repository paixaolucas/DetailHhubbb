// =============================================================================
// GET /api/users/[id]/certificates
// Requires auth — user can only view their own certificates
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req: NextRequest, { session, params }) => {
  try {
    const userId = params?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 }
      );
    }

    // Users may only retrieve their own certificates; SUPER_ADMIN may view any
    if (session.userId !== userId && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const certificates = await db.certificate.findMany({
      where: { userId },
      include: {
        community: {
          select: { name: true, slug: true, logoUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: certificates });
  } catch (error) {
    console.error("[User Certificates GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
