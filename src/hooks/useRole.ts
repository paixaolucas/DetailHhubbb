'use client';
import { UserRole } from '@prisma/client';
import { STORAGE_KEYS } from '@/lib/constants';

export type Permission =
  | 'view:analytics'
  | 'view:admin'
  | 'view:all_communities'
  | 'view:own_communities'
  | 'manage:users'
  | 'manage:own_community'
  | 'create:live'
  | 'create:content'
  | 'view:member_content';

const PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'view:analytics', 'view:admin', 'view:all_communities',
    'manage:users', 'manage:own_community', 'create:live',
    'create:content', 'view:member_content',
  ],
  INFLUENCER_ADMIN: [
    'view:analytics', 'view:own_communities',
    'manage:own_community', 'create:live', 'create:content',
    'view:member_content',
  ],
  COMMUNITY_MEMBER: ['view:member_content'],
  MARKETPLACE_PARTNER: ['view:member_content'],
};

export function useRole() {
  const role = (
    typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEYS.USER_ROLE)
      : null
  ) as UserRole | null;

  const safeRole = role ?? UserRole.COMMUNITY_MEMBER;

  return {
    role: safeRole,
    isAdmin: safeRole === UserRole.SUPER_ADMIN,
    isInfluencer: safeRole === UserRole.INFLUENCER_ADMIN,
    isMember: safeRole === UserRole.COMMUNITY_MEMBER,
    isPartner: safeRole === UserRole.MARKETPLACE_PARTNER,
    can: (permission: Permission) =>
      PERMISSIONS[safeRole]?.includes(permission) ?? false,
  };
}
