// =============================================================================
// GET /api/notifications/unread-count — Count of unread notifications
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (_req: NextRequest, { session }) => {
  try {
    const count = await db.notification.count({
      where: {
        recipientId: session.userId,
        isRead: false,
      },
    });

    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    console.error("[Notifications UnreadCount GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
