'use client';
import { UserRole } from '@prisma/client';
import { useRole, type Permission } from '@/hooks/useRole';

type ShowForProps = {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function ShowFor({ roles, children, fallback = null }: ShowForProps) {
  const { role } = useRole();
  if (!roles.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}

type CanProps = {
  do: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function Can({ do: permission, children, fallback = null }: CanProps) {
  const { can } = useRole();
  if (!can(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
