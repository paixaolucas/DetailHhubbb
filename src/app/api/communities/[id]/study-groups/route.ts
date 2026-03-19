// =============================================================================
// GET  /api/communities/[id]/study-groups  — list study groups in a community
// POST /api/communities/[id]/study-groups  — create a study group
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyMembership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(3).max(80).trim(),
  description: z.string().max(500).trim().optional(),
  maxMembers: z.number().int().min(2).max(50).default(10),
  isOpen: z.boolean().default(true),
});

export const GET = withAuth(async (_req, { session, params }) => {
  const communityId = params?.id;
  if (!communityId) {
    return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
  }

  const isMember = await verifyMembership(session.userId, communityId);
  if (!isMember) {
    return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
  }

  const groups = await db.studyGroup.findMany({
    where: { communityId },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json({ success: true, data: groups });
});

export const POST = withAuth(async (req, { session, params }) => {
  const communityId = params?.id;
  if (!communityId) {
    return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
  }

  const isMember = await verifyMembership(session.userId, communityId);
  if (!isMember) {
    return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 422 });
  }

  const group = await db.studyGroup.create({
    data: {
      communityId,
      creatorId: session.userId,
      ...parsed.data,
      // Creator auto-joins
      members: { create: { userId: session.userId } },
    },
    include: {
      creator: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json({ success: true, data: group }, { status: 201 });
});
