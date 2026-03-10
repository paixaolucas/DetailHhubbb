// =============================================================================
// PUT/DELETE /api/marketplace/listings/[listingId]
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { AppError, ForbiddenError, NotFoundError } from "@/types";
import { UserRole, MarketplaceListingStatus, MarketplaceListingType } from "@prisma/client";
import { z } from "zod";

const updateListingSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  shortDesc: z.string().max(300).optional(),
  type: z.nativeEnum(MarketplaceListingType).optional(),
  price: z.number().positive().max(99999).optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  categories: z.array(z.string().max(50)).max(5).optional(),
  features: z.array(z.string().max(200)).max(20).optional(),
  status: z.nativeEnum(MarketplaceListingStatus).optional(),
});

async function assertListingOwnership(userId: string, userRole: string, listingId: string) {
  if (userRole === UserRole.SUPER_ADMIN) return;
  const listing = await db.marketplaceListing.findUnique({ where: { id: listingId }, select: { sellerId: true } });
  if (!listing) throw new NotFoundError("Listing not found");
  if (listing.sellerId !== userId) throw new ForbiddenError("You can only manage your own listings");
}

export const PUT = withAuth(async (req, { session, params }) => {
  try {
    const listingId = params?.listingId;
    if (!listingId) return NextResponse.json({ success: false, error: "listingId required" }, { status: 400 });

    await assertListingOwnership(session.userId, session.role, listingId);

    const body = await req.json();
    const parsed = updateListingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 422 });
    }

    const updated = await db.marketplaceListing.update({
      where: { id: listingId },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req, { session, params }) => {
  try {
    const listingId = params?.listingId;
    if (!listingId) return NextResponse.json({ success: false, error: "listingId required" }, { status: 400 });

    await assertListingOwnership(session.userId, session.role, listingId);
    // Soft-delete by archiving
    await db.marketplaceListing.update({
      where: { id: listingId },
      data: { status: MarketplaceListingStatus.ARCHIVED },
    });

    return NextResponse.json({ success: true, message: "Listing archived" });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
