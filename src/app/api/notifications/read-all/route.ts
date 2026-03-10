// =============================================================================
// PATCH /api/notifications/read-all — Mark all notifications as read
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const PATCH = withAuth(async (_req: NextRequest, { session }) => {
  try {
    const result = await db.notification.updateMany({
      where: {
        recipientId: session.userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { updated: result.count },
    });
  } catch (error) {
    console.error("[Notifications ReadAll PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
