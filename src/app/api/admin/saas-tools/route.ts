// =============================================================================
// GET  /api/admin/saas-tools — list all tools (SUPER_ADMIN)
// POST /api/admin/saas-tools — create tool (SUPER_ADMIN)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

export const GET = withRole(UserRole.SUPER_ADMIN)(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
    const category = searchParams.get("category") ?? undefined;

    const where = category ? { category: category as any } : {};

    const [total, items] = await Promise.all([
      db.saasTool.count({ where }),
      db.saasTool.findMany({
        where,
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } },
    });
  } catch (error) {
    console.error("[SaasTools GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

const createToolSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  shortDesc: z.string().max(200).optional(),
  category: z.enum(["PRODUCTIVITY", "MARKETING", "ANALYTICS", "DESIGN", "DEVELOPMENT", "FINANCE", "COMMUNICATION"]),
  logoUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url(),
  affiliateUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  rating: z.number().min(0).max(5).optional(),
});

export const POST = withRole(UserRole.SUPER_ADMIN)(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = createToolSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 422 });
    }

    const { logoUrl, affiliateUrl, ...rest } = parsed.data;
    const tool = await db.saasTool.create({
      data: {
        ...rest,
        logoUrl: logoUrl || null,
        affiliateUrl: affiliateUrl || null,
      },
    });

    return NextResponse.json({ success: true, data: tool }, { status: 201 });
  } catch (error) {
    console.error("[SaasTools POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
