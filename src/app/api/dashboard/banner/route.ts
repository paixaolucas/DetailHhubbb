// =============================================================================
// GET /api/dashboard/banner — admin-configured hero banner for dashboard
// Returns the active banner stored in PlatformConfig.config.dashboardBanner
// Returns null if no banner or isActive !== true
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export interface DashboardBanner {
  imageUrl: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  statLabel?: string;
  statValue?: string;
  isActive: boolean;
}

export const GET = withAuth(async () => {
  try {
    const config = await db.platformConfig.findUnique({
      where: { id: "singleton" },
      select: { config: true },
    });

    const raw = config?.config as Record<string, unknown> | null;
    const banner = raw?.dashboardBanner as DashboardBanner | null | undefined;

    if (!banner?.isActive || !banner.imageUrl) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: banner });
  } catch (error) {
    console.error("[dashboard/banner:GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
