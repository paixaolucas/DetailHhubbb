// =============================================================================
// PUT/DELETE /api/content/modules/[moduleId]
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { AppError, ForbiddenError, NotFoundError } from "@/types";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const updateModuleSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  sortOrder: z.number().int().optional(),
  unlockAfterDays: z.number().int().min(0).nullable().optional(),
  isPublished: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  isPremium: z.boolean().optional(),
});

async function assertOwnership(userId: string, userRole: string, moduleId: string) {
  if (userRole === UserRole.SUPER_ADMIN) return;
  const contentModule = await db.contentModule.findUnique({
    where: { id: moduleId },
    select: { community: { select: { influencer: { select: { userId: true } } } } },
  });
  if (!contentModule) throw new NotFoundError("Module not found");
  if (contentModule.community.influencer.userId !== userId) {
    throw new ForbiddenError("You can only manage content in your own community");
  }
}

export const PATCH = withAuth(async (req, { session, params }) => {
  try {
    const moduleId = params?.moduleId;
    if (!moduleId) return NextResponse.json({ success: false, error: "moduleId required" }, { status: 400 });

    await assertOwnership(session.userId, session.role, moduleId);

    const body = await req.json();
    const parsed = updateModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 422 });
    }

    const updated = await db.contentModule.update({
      where: { id: moduleId },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const PUT = withAuth(async (req, { session, params }) => {
  try {
    const moduleId = params?.moduleId;
    if (!moduleId) return NextResponse.json({ success: false, error: "moduleId required" }, { status: 400 });

    await assertOwnership(session.userId, session.role, moduleId);

    const body = await req.json();
    const parsed = updateModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 422 });
    }

    const updated = await db.contentModule.update({
      where: { id: moduleId },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req, { session, params }) => {
  try {
    const moduleId = params?.moduleId;
    if (!moduleId) return NextResponse.json({ success: false, error: "moduleId required" }, { status: 400 });

    await assertOwnership(session.userId, session.role, moduleId);
    await db.contentModule.delete({ where: { id: moduleId } });

    return NextResponse.json({ success: true, message: "Module deleted" });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
