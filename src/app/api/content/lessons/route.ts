// =============================================================================
// POST /api/content/lessons
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { contentService } from "@/services/content/content.service";
import { AppError } from "@/types";
import { z } from "zod";
import { ContentType } from "@prisma/client";

const createLessonSchema = z.object({
  moduleId: z.string().cuid(),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(ContentType).default(ContentType.VIDEO),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  videoProvider: z.string().optional(),
  videoDuration: z.number().int().min(0).optional(),
  fileUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.number().int().default(0),
  isFree: z.boolean().default(false),
  isDownloadable: z.boolean().default(false),
});

export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = createLessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const lesson = await contentService.createLesson(
      session.userId,
      session.role,
      {
        ...parsed.data,
        videoUrl: parsed.data.videoUrl || undefined,
        fileUrl: parsed.data.fileUrl || undefined,
      }
    );

    return NextResponse.json({ success: true, data: lesson }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("[Content:lessons POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
