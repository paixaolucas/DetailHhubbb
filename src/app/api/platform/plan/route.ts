import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (_req: NextRequest) => {
  const plan = await db.platformPlan.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!plan) {
    return NextResponse.json({ success: false, error: "No active plan found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: plan });
});
