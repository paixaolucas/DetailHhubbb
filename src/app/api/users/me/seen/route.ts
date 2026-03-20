import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

// PATCH /api/users/me/seen — updates lastLoginAt (used as "last seen" timestamp)
export const PATCH = withAuth(async (_req, { session }) => {
  await db.user.update({
    where: { id: session.userId },
    data: { lastLoginAt: new Date() },
  });
  return NextResponse.json({ success: true });
});
