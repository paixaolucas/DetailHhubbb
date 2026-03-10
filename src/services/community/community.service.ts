// =============================================================================
// COMMUNITY SERVICE
// Core business logic for community management
// =============================================================================

import { db } from "@/lib/db";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from "@/types";
import type {
  CreateCommunityInput,
  UpdateCommunityInput,
  CreateSubscriptionPlanInput,
} from "@/lib/validations/community";
import { UserRole } from "@prisma/client";
import { analyticsService } from "@/services/analytics/analytics.service";

// =============================================================================
// CREATE COMMUNITY
// =============================================================================

export async function createCommunity(
  userId: string,
  input: CreateCommunityInput,
  targetInfluencerUserId?: string
): Promise<{ id: string; slug: string }> {
  // If admin is creating on behalf of an influencer, use that user; otherwise use self
  const ownerUserId = targetInfluencerUserId ?? userId;

  // Find or create influencer record for ownerUserId
  let influencer = await db.influencer.findUnique({
    where: { userId: ownerUserId },
    select: { id: true },
  });

  if (!influencer) {
    // Get the user's name for displayName
    const user = await db.user.findUnique({
      where: { id: ownerUserId },
      select: { firstName: true, lastName: true },
    });
    if (!user) throw new ForbiddenError("Influencer user not found");
    influencer = await db.influencer.create({
      data: {
        userId: ownerUserId,
        displayName: `${user.firstName} ${user.lastName ?? ""}`.trim(),
      },
      select: { id: true },
    });
  }

  // Check slug uniqueness
  const existing = await db.community.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError("This URL slug is already taken");
  }

  const community = await db.community.create({
    data: {
      influencerId: influencer.id,
      name: input.name,
      slug: input.slug,
      description: input.description,
      shortDescription: input.shortDescription,
      primaryColor: input.primaryColor ?? "#6366f1",
      secondaryColor: input.secondaryColor ?? "#4f46e5",
      accentColor: input.accentColor ?? "#818ef8",
      isPrivate: input.isPrivate,
      tags: input.tags ?? [],
      welcomeMessage: input.welcomeMessage,
      rules: input.rules,
    },
    select: { id: true, slug: true },
  });

  return community;
}

// =============================================================================
// UPDATE COMMUNITY
// =============================================================================

export async function updateCommunity(
  communityId: string,
  userId: string,
  userRole: string,
  input: UpdateCommunityInput
): Promise<void> {
  const community = await db.community.findUnique({
    where: { id: communityId },
    include: { influencer: { select: { userId: true } } },
  });

  if (!community) throw new NotFoundError("Community not found");

  // Only SUPER_ADMIN or the community owner can update
  if (
    userRole !== UserRole.SUPER_ADMIN &&
    community.influencer.userId !== userId
  ) {
    throw new ForbiddenError("You can only update your own community");
  }

  // If changing slug, verify uniqueness
  if (input.slug && input.slug !== community.slug) {
    const slugConflict = await db.community.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (slugConflict) throw new ConflictError("Slug already taken");
  }

  await db.community.update({
    where: { id: communityId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.shortDescription !== undefined && {
        shortDescription: input.shortDescription,
      }),
      ...(input.primaryColor !== undefined && {
        primaryColor: input.primaryColor,
      }),
      ...(input.secondaryColor !== undefined && {
        secondaryColor: input.secondaryColor,
      }),
      ...(input.accentColor !== undefined && {
        accentColor: input.accentColor,
      }),
      ...(input.isPrivate !== undefined && { isPrivate: input.isPrivate }),
      ...(input.isPublished !== undefined && {
        isPublished: input.isPublished,
      }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.welcomeMessage !== undefined && {
        welcomeMessage: input.welcomeMessage,
      }),
      ...(input.rules !== undefined && { rules: input.rules }),
      ...(input.maxMembers !== undefined && { maxMembers: input.maxMembers }),
      ...(input.metaTitle !== undefined && { metaTitle: input.metaTitle }),
      ...(input.metaDescription !== undefined && {
        metaDescription: input.metaDescription,
      }),
      ...((input as any).logoUrl !== undefined && { logoUrl: (input as any).logoUrl }),
      ...((input as any).bannerUrl !== undefined && { bannerUrl: (input as any).bannerUrl }),
    },
  });
}

// =============================================================================
// GET COMMUNITY
// =============================================================================

export async function getCommunityBySlug(slug: string) {
  const community = await db.community.findUnique({
    where: { slug },
    include: {
      influencer: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true,
              email: true,
            },
          },
        },
      },
      subscriptionPlans: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: { memberships: { where: { status: "ACTIVE" } } },
      },
    },
  });

  if (!community) throw new NotFoundError("Community not found");
  return community;
}

export async function getCommunityById(id: string) {
  const community = await db.community.findUnique({
    where: { id },
    include: {
      influencer: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      subscriptionPlans: { where: { isActive: true } },
    },
  });

  if (!community) throw new NotFoundError("Community not found");
  return community;
}

// =============================================================================
// LIST COMMUNITIES (paginated)
// =============================================================================

export async function listPublicCommunities(params: {
  page: number;
  pageSize: number;
  search?: string;
  tags?: string[];
}) {
  const { page, pageSize, search, tags } = params;
  const skip = (page - 1) * pageSize;

  const where = {
    isPublished: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        {
          description: { contains: search, mode: "insensitive" as const },
        },
      ],
    }),
    ...(tags?.length && { tags: { hasSome: tags } as any }),
  };

  const [communities, totalCount] = await db.$transaction([
    db.community.findMany({
      where: where as any,
      skip,
      take: pageSize,
      orderBy: { memberCount: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        logoUrl: true,
        bannerUrl: true,
        primaryColor: true,
        memberCount: true,
        tags: true,
        influencer: {
          select: {
            displayName: true,
            user: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        subscriptionPlans: {
          where: { isActive: true, isDefault: true },
          select: { price: true, currency: true, interval: true },
          take: 1,
        },
      },
    }),
    db.community.count({ where: where as any }),
  ]);

  return {
    communities,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: skip + pageSize < totalCount,
      hasPreviousPage: page > 1,
    },
  };
}

// =============================================================================
// LIST ALL COMMUNITIES (admin — no isPublished filter)
// =============================================================================

export async function listAllCommunities(params: {
  page: number;
  pageSize: number;
  search?: string;
}) {
  const { page, pageSize, search } = params;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { slug: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [communities, totalCount] = await db.$transaction([
    db.community.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        isPublished: true,
        isPrivate: true,
        memberCount: true,
        influencer: {
          select: {
            displayName: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
    db.community.count({ where }),
  ]);

  return {
    data: communities,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: skip + pageSize < totalCount,
      hasPreviousPage: page > 1,
    },
  };
}

// =============================================================================
// INFLUENCER COMMUNITIES
// =============================================================================

export async function getInfluencerCommunities(userId: string) {
  const influencer = await db.influencer.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!influencer) return [];

  return db.community.findMany({
    where: { influencerId: influencer.id },
    include: {
      _count: {
        select: { memberships: { where: { status: "ACTIVE" } } },
      },
      subscriptionPlans: { where: { isActive: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// =============================================================================
// MEMBERSHIP MANAGEMENT
// =============================================================================

export async function getMembersByCommunnity(
  communityId: string,
  params: { page: number; pageSize: number; status?: string }
) {
  const skip = (params.page - 1) * params.pageSize;

  const [members, totalCount] = await db.$transaction([
    db.communityMembership.findMany({
      where: {
        communityId,
        ...(params.status && {
          status: params.status as "ACTIVE" | "CANCELED",
        }),
      },
      skip,
      take: params.pageSize,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            lastLoginAt: true,
          },
        },
        plan: { select: { name: true, price: true } },
      },
      orderBy: { joinedAt: "desc" },
    }),
    db.communityMembership.count({ where: { communityId } }),
  ]);

  return { members, totalCount };
}

// =============================================================================
// SUBSCRIPTION PLANS
// =============================================================================

export async function createSubscriptionPlan(
  userId: string,
  userRole: string,
  input: CreateSubscriptionPlanInput
) {
  const community = await db.community.findUnique({
    where: { id: input.communityId },
    include: { influencer: { select: { userId: true } } },
  });

  if (!community) throw new NotFoundError("Community not found");

  if (
    userRole !== UserRole.SUPER_ADMIN &&
    community.influencer.userId !== userId
  ) {
    throw new ForbiddenError("You can only manage your own community plans");
  }

  // Ensure only one default plan per community
  if (input.isDefault) {
    await db.subscriptionPlan.updateMany({
      where: { communityId: input.communityId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return db.subscriptionPlan.create({
    data: {
      communityId: input.communityId,
      name: input.name,
      description: input.description,
      price: input.price,
      currency: input.currency,
      intervalCount: input.intervalCount,
      interval: input.interval,
      trialDays: input.trialDays,
      features: input.features,
      isDefault: input.isDefault,
      sortOrder: input.sortOrder,
      maxMembers: input.maxMembers,
      hasContentAccess: input.hasContentAccess,
      hasLiveAccess: input.hasLiveAccess,
      hasCommunityAccess: input.hasCommunityAccess,
    },
  });
}

// =============================================================================
// MEMBER COUNT SYNC (called after membership changes)
// =============================================================================

export async function syncMemberCount(communityId: string): Promise<void> {
  const count = await db.communityMembership.count({
    where: { communityId, status: "ACTIVE" },
  });

  await db.community.update({
    where: { id: communityId },
    data: { memberCount: count },
  });
}
