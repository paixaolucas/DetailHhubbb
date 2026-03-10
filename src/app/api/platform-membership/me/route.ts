import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req, { session }) => {
  const membership = await db.platformMembership.findUnique({
    where: { userId: session.userId },
    include: { plan: true },
  });

  return NextResponse.json({
    success: true,
    data: {
      hasMembership: membership?.status === "ACTIVE",
      membership,
    },
  });
});
