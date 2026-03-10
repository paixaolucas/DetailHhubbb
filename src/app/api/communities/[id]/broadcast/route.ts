// =============================================================================
// POST /api/communities/[id]/broadcast
// Send a notification broadcast to all active members of a community.
// Requires community owner (influencer) or SUPER_ADMIN.
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";
import { createNotification } from "@/services/notification/notification.service";

const broadcastSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(100, "Máximo 100 caracteres").trim(),
  body: z.string().min(1, "Mensagem obrigatória").max(500, "Máximo 500 caracteres").trim(),
  link: z.string().optional(),
});

export const POST = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const raw = await req.json();
    const parsed = broadcastSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
    const { title, body, link } = parsed.data;

    // Get all active platform members (platform membership gives access to all communities)
    // Also include community-specific active members (legacy model)
    const [platformMembers, communityMembers] = await Promise.all([
      db.platformMembership.findMany({
        where: { status: "ACTIVE" },
        select: { userId: true },
      }),
      db.communityMembership.findMany({
        where: { communityId, status: "ACTIVE" },
        select: { userId: true },
      }),
    ]);

    // Merge, deduplicate, and exclude the sender
    const seen = new Map<string, true>();
    const recipientIds: string[] = [];
    for (const m of [...platformMembers, ...communityMembers]) {
      if (m.userId !== session.userId && !seen.has(m.userId)) {
        seen.set(m.userId, true);
        recipientIds.push(m.userId);
      }
    }

    if (recipientIds.length === 0) {
      return NextResponse.json({ success: true, data: { sent: 0 } });
    }

    // Create notifications in batches of 50 to avoid overwhelming the DB
    const BATCH = 50;
    let sent = 0;

    for (let i = 0; i < recipientIds.length; i += BATCH) {
      const batch = recipientIds.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.map((recipientId) =>
          createNotification({
            recipientId,
            actorId: session.userId,
            type: NotificationType.BROADCAST,
            title,
            body,
            link,
          })
        )
      );
      sent += batch.length;
    }

    return NextResponse.json({ success: true, data: { sent } });
  } catch (error) {
    console.error("[Broadcast POST]", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});
