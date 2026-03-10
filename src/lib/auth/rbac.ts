// =============================================================================
// ROLE-BASED ACCESS CONTROL
// Strict permission isolation per role
// =============================================================================

import { UserRole } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "@/types";

// =============================================================================
// PERMISSION DEFINITIONS
// =============================================================================

export const Permissions = {
  // Platform-level
  PLATFORM_MANAGE: "platform:manage",
  PLATFORM_ANALYTICS: "platform:analytics",

  // Community management
  COMMUNITY_CREATE: "community:create",
  COMMUNITY_READ: "community:read",
  COMMUNITY_UPDATE_OWN: "community:update:own",
  COMMUNITY_DELETE_OWN: "community:delete:own",
  COMMUNITY_MANAGE_ALL: "community:manage:all",

  // Members
  MEMBER_VIEW_OWN_COMMUNITY: "member:view:own_community",
  MEMBER_MANAGE_OWN_COMMUNITY: "member:manage:own_community",
  MEMBER_MANAGE_ALL: "member:manage:all",

  // Content
  CONTENT_VIEW: "content:view",
  CONTENT_CREATE_OWN: "content:create:own",
  CONTENT_MANAGE_OWN: "content:manage:own",
  CONTENT_MANAGE_ALL: "content:manage:all",

  // Live sessions
  LIVE_SESSION_VIEW: "live_session:view",
  LIVE_SESSION_HOST_OWN: "live_session:host:own",
  LIVE_SESSION_MANAGE_ALL: "live_session:manage:all",

  // Subscriptions
  SUBSCRIPTION_MANAGE_OWN: "subscription:manage:own",
  SUBSCRIPTION_MANAGE_ALL: "subscription:manage:all",

  // Analytics
  ANALYTICS_VIEW_OWN: "analytics:view:own",
  ANALYTICS_VIEW_ALL: "analytics:view:all",

  // Commission
  COMMISSION_VIEW_OWN: "commission:view:own",
  COMMISSION_MANAGE_ALL: "commission:manage:all",

  // Marketplace
  MARKETPLACE_VIEW: "marketplace:view",
  MARKETPLACE_SELL: "marketplace:sell",
  MARKETPLACE_MANAGE_ALL: "marketplace:manage:all",

  // AI
  AI_USE: "ai:use",
  AI_MANAGE: "ai:manage",

  // SaaS Tools
  TOOLS_VIEW: "tools:view",
  TOOLS_MANAGE: "tools:manage",

  // Feed / Social (Phase 1)
  POSTS_CREATE: "posts:create",
  POSTS_MODERATE: "posts:moderate",
  SPACES_MANAGE: "spaces:manage",

  // Notifications (Phase 2)
  NOTIFICATIONS_READ: "notifications:read",

  // Messages (Phase 7)
  MESSAGES_SEND: "messages:send",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

// =============================================================================
// ROLE → PERMISSION MAPPING
// =============================================================================

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permissions) as Permission[],

  [UserRole.INFLUENCER_ADMIN]: [
    Permissions.COMMUNITY_CREATE,
    Permissions.COMMUNITY_READ,
    Permissions.COMMUNITY_UPDATE_OWN,
    Permissions.COMMUNITY_DELETE_OWN,
    Permissions.MEMBER_VIEW_OWN_COMMUNITY,
    Permissions.MEMBER_MANAGE_OWN_COMMUNITY,
    Permissions.CONTENT_VIEW,
    Permissions.CONTENT_CREATE_OWN,
    Permissions.CONTENT_MANAGE_OWN,
    Permissions.LIVE_SESSION_VIEW,
    Permissions.LIVE_SESSION_HOST_OWN,
    Permissions.SUBSCRIPTION_MANAGE_OWN,
    Permissions.ANALYTICS_VIEW_OWN,
    Permissions.COMMISSION_VIEW_OWN,
    Permissions.MARKETPLACE_VIEW,
    Permissions.MARKETPLACE_SELL,
    Permissions.AI_USE,
    Permissions.TOOLS_VIEW,
    Permissions.POSTS_CREATE,
    Permissions.POSTS_MODERATE,
    Permissions.SPACES_MANAGE,
    Permissions.NOTIFICATIONS_READ,
    Permissions.MESSAGES_SEND,
  ],

  [UserRole.COMMUNITY_MEMBER]: [
    Permissions.COMMUNITY_READ,
    Permissions.CONTENT_VIEW,
    Permissions.LIVE_SESSION_VIEW,
    Permissions.MARKETPLACE_VIEW,
    Permissions.AI_USE,
    Permissions.TOOLS_VIEW,
    Permissions.POSTS_CREATE,
    Permissions.NOTIFICATIONS_READ,
    Permissions.MESSAGES_SEND,
  ],

  [UserRole.MARKETPLACE_PARTNER]: [
    Permissions.COMMUNITY_READ,
    Permissions.CONTENT_VIEW,
    Permissions.MARKETPLACE_VIEW,
    Permissions.MARKETPLACE_SELL,
    Permissions.AI_USE,
    Permissions.TOOLS_VIEW,
    Permissions.MESSAGES_SEND,
    Permissions.NOTIFICATIONS_READ,
  ],
};

// =============================================================================
// PERMISSION CHECKS
// =============================================================================

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function requirePermission(
  role: UserRole | undefined,
  permission: Permission
): void {
  if (!role) {
    throw new UnauthorizedError("Authentication required");
  }
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(
      `Permission denied: ${permission} requires a higher role`
    );
  }
}

export function requireRole(
  userRole: UserRole | undefined,
  requiredRole: UserRole
): void {
  if (!userRole) {
    throw new UnauthorizedError("Authentication required");
  }

  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.SUPER_ADMIN]: 100,
    [UserRole.INFLUENCER_ADMIN]: 50,
    [UserRole.MARKETPLACE_PARTNER]: 30,
    [UserRole.COMMUNITY_MEMBER]: 10,
  };

  if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
    throw new ForbiddenError("Insufficient role");
  }
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}

export function isInfluencerAdmin(role: UserRole): boolean {
  return role === UserRole.INFLUENCER_ADMIN || role === UserRole.SUPER_ADMIN;
}
