// =============================================================================
// POST /api/reports — create a report (auth required)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

const createReportSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "USER"]),
  targetId: z.string().min(1),
  reason: z.string().min(10).max(1000),
});

export const POST = withAuth(async (req: NextRequest, { session }) => {
  try {
    const body = await req.json();
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const { targetType, targetId, reason } = parsed.data;

    const report = await db.report.create({
      data: {
        reportedById: session.userId,
        targetType,
        targetId,
        reason,
      },
    });

    return NextResponse.json({ success: true, data: { id: report.id } }, { status: 201 });
  } catch (error) {
    console.error("[Report POST]", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});
