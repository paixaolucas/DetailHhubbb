// =============================================================================
// GET /api/health — liveness probe for uptime monitoring (UptimeRobot, etc.)
// Returns 200 with basic status. No auth required.
// =============================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Lightweight DB check — just read the singleton config row
    await db.platformConfig.findUnique({ where: { id: "singleton" }, select: { id: true } });

    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
