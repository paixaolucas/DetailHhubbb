import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const GET = async () => {
  const plan = await db.platformPlan.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!plan) {
    return NextResponse.json({ success: false, error: "No active plan found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: plan });
};
