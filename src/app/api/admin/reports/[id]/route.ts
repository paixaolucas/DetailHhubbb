// =============================================================================
// PATCH /api/admin/reports/[id] — resolve or ignore a report (SUPER_ADMIN only)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const resolveReportSchema = z.object({
  status: z.enum(["RESOLVED", "IGNORED"]),
});

export const PATCH = withRole(UserRole.SUPER_ADMIN)(
  async (req: NextRequest, { session, params }) => {
    try {
      const id = params?.id;
      if (!id) {
        return NextResponse.json({ success: false, error: "Report ID required" }, { status: 400 });
      }

      const body = await req.json();
      const parsed = resolveReportSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
          { status: 400 }
        );
      }

      const report = await db.report.findUnique({ where: { id }, select: { id: true } });
      if (!report) {
        return NextResponse.json({ success: false, error: "Report não encontrado" }, { status: 404 });
      }

      const updated = await db.report.update({
        where: { id },
        data: {
          status: parsed.data.status,
          resolvedAt: new Date(),
          resolvedBy: session.userId,
        },
      });

      return NextResponse.json({ success: true, data: updated });
    } catch (error) {
      console.error("[Admin Reports PATCH]", error);
      return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
    }
  }
);
