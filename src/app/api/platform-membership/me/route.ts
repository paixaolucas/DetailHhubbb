import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req, { session }) => {
  const membership = await db.platformMembership.findUnique({
    where: { userId: session.userId },
    include: { plan: true },
  });

  const now = new Date();
  const hasMembership =
    membership?.status === "ACTIVE" &&
    (membership.currentPeriodEnd == null || membership.currentPeriodEnd > now);

  return NextResponse.json(
    {
      success: true,
      data: {
        hasMembership,
        membership,
      },
    },
    { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
  );
});
