// =============================================================================
// PATCH /api/content/modules/[id]  — update module (owner community)
// Supports toggling isPremium and other module fields.
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(1000).optional().or(z.literal("")),
  isPublished: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const PATCH = withRole(UserRole.INFLUENCER_ADMIN)(async (req, { session, params }) => {
  const moduleId = params?.id as string;

  // Verify ownership through community → influencer
  const module = await db.contentModule.findUnique({
    where: { id: moduleId },
    include: { community: { select: { influencer: { select: { userId: true } } } } },
  });

  if (!module || module.community.influencer.userId !== session.userId) {
    return NextResponse.json({ success: false, error: "Módulo não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Dados inválidos", details: parsed.error.errors },
      { status: 422 }
    );
  }

  const { description, ...rest } = parsed.data;

  const updated = await db.contentModule.update({
    where: { id: moduleId },
    data: {
      ...rest,
      ...(description !== undefined ? { description: description || null } : {}),
    },
  });

  return NextResponse.json({ success: true, data: updated });
});
