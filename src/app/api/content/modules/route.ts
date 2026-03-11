// =============================================================================
// GET /api/content/modules?communityId=xxx
// POST /api/content/modules
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { contentService } from "@/services/content/content.service";
import { db } from "@/lib/db";
import { AppError } from "@/types";
import { z } from "zod";

const createModuleSchema = z.object({
  communityId: z.string().cuid(),
  title: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  sortOrder: z.number().int().default(0),
  unlockAfterDays: z.number().int().min(0).optional(),
});

export const GET = withAuth(async (req, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");

    if (!communityId) {
      return NextResponse.json(
        { success: false, error: "communityId is required" },
        { status: 400 }
      );
    }

    const modules = await db.contentModule.findMany({
      where: { communityId },
      orderBy: { sortOrder: "asc" },
      include: {
        lessons: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            type: true,
            videoDuration: true,
            sortOrder: true,
            isPublished: true,
            isFree: true,
            viewCount: true,
            completionCount: true,
          },
        },
        _count: { select: { lessons: true } },
      },
    });

    return NextResponse.json({ success: true, data: modules });
  } catch (error) {
    console.error("[Content:modules GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = createModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const createdModule = await contentService.createModule(
      session.userId,
      session.role,
      parsed.data
    );

    return NextResponse.json({ success: true, data: createdModule }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("[Content:modules POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
