// =============================================================================
// GET /api/admin/reports — list reports (SUPER_ADMIN only)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";

export const GET = withRole(UserRole.SUPER_ADMIN)(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
      const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10))
      );
      const status = searchParams.get("status") ?? undefined;

      const where = status ? { status: status as "PENDING" | "RESOLVED" | "IGNORED" } : {};

      const [reports, total] = await Promise.all([
        db.report.findMany({
          where,
          include: {
            reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.report.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: reports,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (error) {
      console.error("[Admin Reports GET]", error);
      return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
    }
  }
);
