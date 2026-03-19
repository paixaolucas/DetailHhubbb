// =============================================================================
// PUT /api/users/[id]/status — SUPER_ADMIN only
// Ban, unban, activate, deactivate users
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const updateStatusSchema = z.object({
  isBanned: z.boolean().optional(),
  isActive: z.boolean().optional(),
  bannedReason: z.string().max(500).optional(),
});

export const PUT = withRole(UserRole.SUPER_ADMIN)(async (req, { session, params }) => {
  try {
    const userId = params?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    // Prevent self-modification
    if (userId === session.userId) {
      return NextResponse.json({ success: false, error: "Cannot modify own account status" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 422 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.isBanned !== undefined) {
      updateData.isBanned = parsed.data.isBanned;
      if (parsed.data.isBanned) {
        updateData.bannedAt = new Date();
        updateData.bannedReason = parsed.data.bannedReason ?? "Banned by admin";
      } else {
        updateData.bannedAt = null;
        updateData.bannedReason = null;
      }
    }
    if (parsed.data.isActive !== undefined) {
      updateData.isActive = parsed.data.isActive;
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        isBanned: true,
      },
    });

    // Revoke all active refresh tokens so ban/deactivation takes effect immediately
    if (parsed.data.isBanned === true || parsed.data.isActive === false) {
      await db.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("[User Status PUT]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
