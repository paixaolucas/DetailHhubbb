// =============================================================================
// POST /api/cron/cleanup-tokens
// Daily cron job — deletes expired and revoked refresh tokens older than 30 days.
// Prevents unbounded table growth that slows down auth queries over time.
// Protected by x-cron-secret header.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const deleted = await db.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true, createdAt: { lt: thirtyDaysAgo } },
        ],
      },
    });

    console.log(`[Cron:CleanupTokens] Deleted ${deleted.count} stale refresh tokens`);

    return NextResponse.json({
      success: true,
      data: { deletedTokens: deleted.count },
    });
  } catch (error) {
    console.error("[Cron:CleanupTokens] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
