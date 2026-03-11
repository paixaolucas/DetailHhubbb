// =============================================================================
// GET /api/admin/ad-campaigns  — list all campaigns (SUPER_ADMIN)
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const GET = withRole(UserRole.SUPER_ADMIN)(async (req) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  const where = status ? { status: status as never } : {};

  const [campaigns, total] = await Promise.all([
    db.adCampaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        format: true,
        status: true,
        budget: true,
        spent: true,
        impressions: true,
        clicks: true,
        startDate: true,
        endDate: true,
        rejectionReason: true,
        createdAt: true,
        advertiser: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
            user: { select: { email: true } },
          },
        },
      },
    }),
    db.adCampaign.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: campaigns,
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
});
