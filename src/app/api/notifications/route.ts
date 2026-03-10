// =============================================================================
// GET /api/notifications — cursor-paginated notifications for current user
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

const PAGE_SIZE = 20;

export const GET = withAuth(async (req: NextRequest, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;

    const notifications = await db.notification.findMany({
      where: { recipientId: session.userId },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      take: PAGE_SIZE + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      include: {
        actor: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    const hasMore = notifications.length > PAGE_SIZE;
    const page = hasMore ? notifications.slice(0, PAGE_SIZE) : notifications;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return NextResponse.json({ success: true, data: page, nextCursor });
  } catch (error) {
    console.error("[Notifications GET]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
});
