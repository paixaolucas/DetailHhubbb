// =============================================================================
// PATCH /api/notifications/[id]/read — Mark a single notification as read
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const PATCH = withAuth(
  async (
    _req: NextRequest,
    { session, params }: { session: { userId: string }; params?: Record<string, string> }
  ) => {
    try {
      const notificationId = params?.id;
      if (!notificationId) {
        return NextResponse.json(
          { success: false, error: "Notification ID required" },
          { status: 400 }
        );
      }

      // The where clause uses both id AND recipientId — this guarantees ownership
      // without a separate lookup. Prisma will throw if no record matches.
      const notification = await db.notification.update({
        where: {
          id: notificationId,
          recipientId: session.userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, data: notification });
    } catch (error: any) {
      // Prisma P2025 = record not found (wrong owner or missing)
      if (error?.code === "P2025") {
        return NextResponse.json(
          { success: false, error: "Notification not found" },
          { status: 404 }
        );
      }
      console.error("[Notification Read PATCH]", error);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
