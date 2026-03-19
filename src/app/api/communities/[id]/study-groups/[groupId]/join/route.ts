// =============================================================================
// POST   /api/communities/[id]/study-groups/[groupId]/join — join a group
// DELETE /api/communities/[id]/study-groups/[groupId]/join — leave a group
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyMembership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const POST = withAuth(async (_req, { session, params }) => {
  const { id: communityId, groupId } = params ?? {};
  if (!communityId || !groupId) {
    return NextResponse.json({ success: false, error: "IDs required" }, { status: 400 });
  }

  const isMember = await verifyMembership(session.userId, communityId, session.hasPlatform);
  if (!isMember) {
    return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
  }

  const group = await db.studyGroup.findUnique({
    where: { id: groupId, communityId },
    select: { id: true, isOpen: true, maxMembers: true, _count: { select: { members: true } } },
  });
  if (!group) {
    return NextResponse.json({ success: false, error: "Grupo não encontrado" }, { status: 404 });
  }
  if (!group.isOpen) {
    return NextResponse.json({ success: false, error: "Este grupo está fechado." }, { status: 403 });
  }
  if (group._count.members >= group.maxMembers) {
    return NextResponse.json({ success: false, error: "Grupo cheio." }, { status: 400 });
  }

  await db.studyGroupMember.upsert({
    where: { studyGroupId_userId: { studyGroupId: groupId, userId: session.userId } },
    create: { studyGroupId: groupId, userId: session.userId },
    update: {},
  });

  return NextResponse.json({ success: true, data: { joined: true } });
});

export const DELETE = withAuth(async (_req, { session, params }) => {
  const { id: communityId, groupId } = params ?? {};
  if (!communityId || !groupId) {
    return NextResponse.json({ success: false, error: "IDs required" }, { status: 400 });
  }

  await db.studyGroupMember.deleteMany({
    where: { studyGroupId: groupId, userId: session.userId },
  });

  return NextResponse.json({ success: true, data: { joined: false } });
});
