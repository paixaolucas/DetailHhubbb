// =============================================================================
// GET /api/admin/members — list all platform members (SUPER_ADMIN only)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole, PlatformMembershipStatus } from "@prisma/client";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

const VALID_STATUSES = new Set<string>(Object.values(PlatformMembershipStatus));

export const GET = withRole(UserRole.SUPER_ADMIN)(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);

      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
      const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10))
      );
      const statusParam = searchParams.get("status") ?? undefined;
      const influencerId = searchParams.get("influencerId") ?? undefined;
      const search = searchParams.get("search")?.trim() ?? undefined;

      // Validate status param against enum values to avoid Prisma type errors
      const status =
        statusParam && VALID_STATUSES.has(statusParam)
          ? (statusParam as PlatformMembershipStatus)
          : undefined;

      const where = {
        ...(status ? { status } : {}),
        ...(influencerId ? { referredByInfluencerId: influencerId } : {}),
        ...(search
          ? {
              user: {
                OR: [
                  { firstName: { contains: search, mode: "insensitive" as const } },
                  { lastName: { contains: search, mode: "insensitive" as const } },
                  { email: { contains: search, mode: "insensitive" as const } },
                ],
              },
            }
          : {}),
      };

      const [memberships, total] = await Promise.all([
        db.platformMembership.findMany({
          where,
          select: {
            id: true,
            userId: true,
            status: true,
            joinedAt: true,
            currentPeriodEnd: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            plan: {
              select: {
                interval: true,
              },
            },
            referredByInfluencer: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
          orderBy: { joinedAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.platformMembership.count({ where }),
      ]);

      const members = memberships.map((m) => ({
        id: m.id,
        userId: m.userId,
        userName: `${m.user.firstName} ${m.user.lastName}`.trim(),
        userEmail: m.user.email,
        status: m.status,
        planInterval: m.plan.interval,
        joinedAt: m.joinedAt,
        currentPeriodEnd: m.currentPeriodEnd,
        referredByInfluencer: m.referredByInfluencer
          ? { id: m.referredByInfluencer.id, displayName: m.referredByInfluencer.displayName }
          : null,
      }));

      return NextResponse.json({
        success: true,
        data: {
          members,
          total,
          page,
          pageSize,
        },
      });
    } catch (error) {
      console.error("[Admin Members GET]", error);
      return NextResponse.json(
        { success: false, error: "Erro interno ao listar membros" },
        { status: 500 }
      );
    }
  }
);
