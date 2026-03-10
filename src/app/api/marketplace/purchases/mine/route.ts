// =============================================================================
// GET /api/marketplace/purchases/mine
// Lista compras dos listings do vendedor autenticado
// Query: page, pageSize, listingId
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
    const listingId = searchParams.get("listingId") ?? undefined;

    // Find seller's listings
    const sellerListings = await db.marketplaceListing.findMany({
      where: { sellerId: session.userId },
      select: { id: true },
    });
    const listingIds = sellerListings.map((l) => l.id);

    if (listingIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { items: [], pagination: { page, pageSize, total: 0, totalPages: 0 } },
      });
    }

    const where = {
      listingId: listingId ? listingId : { in: listingIds },
    };

    const [total, items] = await Promise.all([
      db.marketplacePurchase.count({ where }),
      db.marketplacePurchase.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          listing: { select: { id: true, title: true, type: true, price: true } },
          // buyer identity intentionally limited for privacy
          buyer: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    console.error("[Purchases:mine GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
