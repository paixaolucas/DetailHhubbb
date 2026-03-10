// =============================================================================
// GET/PUT /api/users/me/settings
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { AppError, ValidationError } from "@/types";
import { z } from "zod";

const updateSettingsSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(100).optional(),
  notificationPrefs: z.record(z.boolean()).optional(),
});

export const GET = withAuth(async (req, { session }) => {
  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        role: true,
        createdAt: true,
        twoFactorEnabled: true,
        referralCode: true,
        notificationPrefs: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const PUT = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const { currentPassword, newPassword, notificationPrefs, ...profileData } = parsed.data;

    // Password change
    let passwordHash: string | undefined;
    if (newPassword) {
      if (!currentPassword) {
        throw new ValidationError("Current password is required to change password");
      }
      const user = await db.user.findUnique({
        where: { id: session.userId },
        select: { passwordHash: true },
      });
      if (!user) throw new ValidationError("User not found");
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) throw new ValidationError("Current password is incorrect");
      passwordHash = await hashPassword(newPassword);
    }

    const updated = await db.user.update({
      where: { id: session.userId },
      data: {
        ...profileData,
        ...(passwordHash && { passwordHash }),
        ...(notificationPrefs !== undefined && { notificationPrefs }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, data: updated, message: "Settings updated" });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
