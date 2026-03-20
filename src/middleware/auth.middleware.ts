// =============================================================================
// AUTH MIDDLEWARE
// Protects API routes with JWT verification and RBAC
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { hasPermission, requirePermission } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import type { Permission } from "@/lib/auth/rbac";
import type { AuthSession } from "@/types";
import { UserRole } from "@prisma/client";

// db is still needed for verifyPlatformMembership / verifyMembership / verifyCommunityOwnership

export type AuthenticatedHandler = (
  req: NextRequest,
  context: {
    session: AuthSession;
    params?: Record<string, string>;
  }
) => Promise<NextResponse>;

// =============================================================================
// EXTRACT AND VALIDATE SESSION
// =============================================================================

export async function getSessionFromRequest(
  req: NextRequest
): Promise<AuthSession | null> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);

    // Use JWT claims directly — avoids a DB round-trip on every request.
    // isActive/isBanned checks happen at login; the 2h token expiry limits exposure.
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      firstName: payload.firstName ?? "",
      lastName: payload.lastName ?? "",
      avatarUrl: null,
      hasPlatform: payload.hasPlatform,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// ROUTE PROTECTORS
// =============================================================================

export function withAuth(handler: AuthenticatedHandler) {
  return async (
    req: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse> => {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // ViewAs: SUPER_ADMIN can impersonate any user via X-View-As-User header.
    // Swaps userId, role e hasPlatform para simular fielmente a experiência do usuário alvo.
    // withRole(SUPER_ADMIN) bloqueará chamadas admin-only durante ViewAs — comportamento correto.
    if (session.role === UserRole.SUPER_ADMIN) {
      const viewAsUserId = req.headers.get("X-View-As-User");
      if (viewAsUserId) {
        const targetUser = await db.user.findUnique({
          where: { id: viewAsUserId },
          select: { role: true },
        });
        if (targetUser) {
          session.userId = viewAsUserId;
          session.role = targetUser.role;
          session.hasPlatform = false; // força verificação real no banco para o usuário alvo
        }
      }
    }

    return handler(req, { session, params: context?.params });
  };
}

export function withPermission(permission: Permission) {
  return (handler: AuthenticatedHandler) =>
    withAuth(async (req, context) => {
      if (
        !hasPermission(context.session.role as UserRole, permission)
      ) {
        return NextResponse.json(
          { success: false, error: "Insufficient permissions" },
          { status: 403 }
        );
      }
      return handler(req, context);
    });
}

export function withRole(role: UserRole) {
  return (handler: AuthenticatedHandler) =>
    withAuth(async (req, context) => {
      const roleHierarchy: Record<UserRole, number> = {
        [UserRole.SUPER_ADMIN]: 100,
        [UserRole.INFLUENCER_ADMIN]: 50,
        [UserRole.MARKETPLACE_PARTNER]: 30,
        [UserRole.COMMUNITY_MEMBER]: 10,
      };

      const userLevel = roleHierarchy[context.session.role as UserRole] ?? 0;
      const requiredLevel = roleHierarchy[role];

      if (userLevel < requiredLevel) {
        return NextResponse.json(
          { success: false, error: "Insufficient role" },
          { status: 403 }
        );
      }

      return handler(req, context);
    });
}

// =============================================================================
// COMMUNITY OWNERSHIP GUARD
// Ensures influencer can only manage their own community
// =============================================================================

export async function verifyCommunityOwnership(
  userId: string,
  communityId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === UserRole.SUPER_ADMIN) return true;

  const influencer = await db.influencer.findUnique({
    where: { userId },
    select: {
      communities: {
        where: { id: communityId },
        select: { id: true },
      },
    },
  });

  return (influencer?.communities.length ?? 0) > 0;
}

export async function verifyPlatformMembership(
  userId: string,
  /** Fast-path: if true (from JWT claim), skip DB query */
  hasPlatformClaim?: boolean
): Promise<boolean> {
  if (hasPlatformClaim === true) return true;
  const membership = await db.platformMembership.findUnique({
    where: { userId },
    select: { status: true, currentPeriodEnd: true },
  });
  if (membership?.status !== "ACTIVE") return false;
  // If currentPeriodEnd is set, enforce it; if null (manual/seed), trust ACTIVE status
  if (membership.currentPeriodEnd != null && membership.currentPeriodEnd <= new Date()) return false;
  return true;
}

export async function verifyMembership(
  userId: string,
  communityId: string,
  /** Fast-path: pass session.hasPlatform from JWT to skip DB query when possible */
  hasPlatformClaim?: boolean
): Promise<boolean> {
  // Fast path: JWT claims active platform membership
  if (hasPlatformClaim === true) return true;

  // Check community-level membership first
  const membership = await db.communityMembership.findUnique({
    where: { userId_communityId: { userId, communityId } },
    select: { status: true, currentPeriodEnd: true },
  });
  if (
    membership?.status === "ACTIVE" &&
    membership.currentPeriodEnd != null &&
    membership.currentPeriodEnd > new Date()
  ) return true;

  // Platform membership grants access to all communities
  return verifyPlatformMembership(userId);
}
