// =============================================================================
// GET /api/platform/banner — returns admin-configured hero banner for dashboard
// Protected — members only
// Banner data is stored in PlatformConfig.config.heroBanner JSON field
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export interface HeroBannerData {
  imageUrl: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  statLabel?: string;
  statValue?: string;
}

export const GET = withAuth(async () => {
  try {
    const config = await db.platformConfig.findUnique({
      where: { id: "singleton" },
      select: { config: true },
    });

    const raw = config?.config as Record<string, unknown> | null;
    const heroBanner = raw?.heroBanner as HeroBannerData | null | undefined;

    if (!heroBanner?.imageUrl) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: heroBanner });
  } catch (error) {
    console.error("[platform/banner:GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
