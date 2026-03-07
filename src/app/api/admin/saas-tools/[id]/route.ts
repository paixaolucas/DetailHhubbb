// =============================================================================
// PUT    /api/admin/saas-tools/[id] — update tool (SUPER_ADMIN)
// DELETE /api/admin/saas-tools/[id] — delete tool (SUPER_ADMIN)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const updateToolSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(1000).optional(),
  shortDesc: z.string().max(200).nullable().optional(),
  category: z.enum(["PRODUCTIVITY", "MARKETING", "ANALYTICS", "DESIGN", "DEVELOPMENT", "FINANCE", "COMMUNICATION"]).optional(),
  logoUrl: z.string().url().nullable().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional(),
  affiliateUrl: z.string().url().nullable().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
});

export const PUT = withRole(UserRole.SUPER_ADMIN)(async (req: NextRequest, { params }) => {
  try {
    const id = params?.id;
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    const existing = await db.saasTool.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = updateToolSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 422 });
    }

    const { logoUrl, affiliateUrl, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };
    if (logoUrl !== undefined) data.logoUrl = logoUrl || null;
    if (affiliateUrl !== undefined) data.affiliateUrl = affiliateUrl || null;

    const tool = await db.saasTool.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: tool });
  } catch (error) {
    console.error("[SaasTools PUT]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withRole(UserRole.SUPER_ADMIN)(async (req: NextRequest, { params }) => {
  try {
    const id = params?.id;
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    const existing = await db.saasTool.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    await db.saasTool.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SaasTools DELETE]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
