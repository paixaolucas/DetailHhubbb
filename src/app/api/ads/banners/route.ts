// =============================================================================
// GET /api/ads/banners — returns active banner campaigns for the home carousel
// Public endpoint (no auth required)
// Also increments impressions count
// =============================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    const banners = await db.adCampaign.findMany({
      where: {
        status: "ACTIVE",
        format: "BANNER_FEED",
        creativeUrl: { not: null },
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        creativeUrl: true,
        targetUrl: true,
        ctaText: true,
        advertiser: { select: { companyName: true, logoUrl: true } },
      },
      orderBy: { budget: "desc" },
      take: 5,
    });

    // Async impression tracking (non-blocking)
    if (banners.length > 0) {
      db.adCampaign.updateMany({
        where: { id: { in: banners.map((b) => b.id) } },
        data: { impressions: { increment: 1 } },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: banners });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
