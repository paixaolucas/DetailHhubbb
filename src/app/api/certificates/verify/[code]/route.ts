// =============================================================================
// GET /api/certificates/verify/[code]
// Public — no auth required
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code;
    if (!code) {
      return NextResponse.json(
        { success: false, error: "Certificate code required" },
        { status: 400 }
      );
    }

    const certificate = await db.certificate.findUnique({
      where: { code },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
        community: {
          select: { name: true, logoUrl: true, slug: true },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: "Certificado não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: certificate });
  } catch (error) {
    console.error("[Certificate Verify GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
