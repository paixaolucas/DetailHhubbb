// =============================================================================
// GET /api/marketplace/listings
// POST /api/marketplace/listings
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, withPermission } from "@/middleware/auth.middleware";
import { Permissions } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { AppError } from "@/types";
import { MarketplaceListingType, MarketplaceListingStatus, UserRole } from "@prisma/client";
import { z } from "zod";

const createListingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  shortDesc: z.string().max(300).optional(),
  type: z.nativeEnum(MarketplaceListingType).default(MarketplaceListingType.COURSE),
  price: z.number().positive().max(99999),
  currency: z.string().length(3).default("brl"),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string().max(30)).max(10).default([]),
  categories: z.array(z.string().max(50)).max(5).default([]),
  features: z.array(z.string().max(200)).max(20).default([]),
  communityId: z.string().optional(),
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 80);
}

export const GET = withAuth(async (req, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine") === "true";
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));

    const where: any = {
      ...(mine ? { sellerId: session.userId } : { status: MarketplaceListingStatus.ACTIVE }),
      ...(status && mine ? { status: status as MarketplaceListingStatus } : {}),
      ...(type ? { type: type as MarketplaceListingType } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { shortDesc: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    };

    // Community members only see listings from their communities + global listings
    if (!mine && session.role === UserRole.COMMUNITY_MEMBER) {
      const memberships = await db.communityMembership.findMany({
        where: { userId: session.userId, status: "ACTIVE" },
        select: { communityId: true },
      });
      const communityIds = memberships.map((m) => m.communityId);
      where.OR = [
        { communityId: null },
        { communityId: { in: communityIds } },
      ];
    }

    const [listings, totalCount] = await db.$transaction([
      db.marketplaceListing.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: mine ? { createdAt: "desc" } : { isFeatured: "desc" },
        include: {
          seller: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          _count: { select: { purchases: true } },
        },
      }),
      db.marketplaceListing.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: listings,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: page * pageSize < totalCount,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("[Marketplace:listings GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withPermission(Permissions.MARKETPLACE_SELL)(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = createListingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(parsed.data.title);
    const existingSlug = await db.marketplaceListing.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const listing = await db.marketplaceListing.create({
      data: {
        sellerId: session.userId,
        communityId: parsed.data.communityId ?? null,
        title: parsed.data.title,
        slug,
        description: parsed.data.description,
        shortDesc: parsed.data.shortDesc,
        type: parsed.data.type,
        price: parsed.data.price,
        currency: parsed.data.currency,
        coverImageUrl: parsed.data.coverImageUrl || null,
        tags: parsed.data.tags,
        categories: parsed.data.categories,
        features: parsed.data.features,
        status: MarketplaceListingStatus.DRAFT,
      },
    });

    return NextResponse.json({ success: true, data: listing }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error("[Marketplace:listings POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
