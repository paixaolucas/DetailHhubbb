// =============================================================================
// DELETE /api/notifications/[id] — Delete own notification
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const DELETE = withAuth(
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

      // recipientId check guarantees ownership — Prisma throws P2025 if no match
      await db.notification.delete({
        where: {
          id: notificationId,
          recipientId: session.userId,
        },
      });

      return NextResponse.json({ success: true, data: null });
    } catch (error: any) {
      if (error?.code === "P2025") {
        return NextResponse.json(
          { success: false, error: "Notification not found" },
          { status: 404 }
        );
      }
      console.error("[Notification DELETE]", error);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
