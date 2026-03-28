import { UserRole } from '@prisma/client';

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[] | 'ALL';
  group: 'principal' | 'gestao' | 'conteudo' | 'admin';
  badge?: string;
};

export const NAV_ITEMS: NavItem[] = [
  // ── PRINCIPAL (todos os roles autenticados) ──
  { label: 'Inicio',       href: '/inicio',                icon: 'Home',          roles: [UserRole.COMMUNITY_MEMBER, UserRole.MARKETPLACE_PARTNER], group: 'principal' },
  { label: 'Inicio',       href: '/dashboard',             icon: 'Home',          roles: [UserRole.SUPER_ADMIN, UserRole.INFLUENCER_ADMIN], group: 'principal' },
  { label: 'Explorar',     href: '/explorar',              icon: 'Compass',       roles: [UserRole.COMMUNITY_MEMBER, UserRole.MARKETPLACE_PARTNER], group: 'principal' },
  { label: 'Calendario',   href: '/dashboard/calendar',    icon: 'CalendarDays',  roles: 'ALL', group: 'principal' },
  { label: 'Mensagens',    href: '/dashboard/messages',    icon: 'MessageSquare', roles: 'ALL', group: 'principal' },

  // ── CONTEUDO (membro) ──
  { label: 'Meu aprendizado', href: '/dashboard/meu-aprendizado', icon: 'BookOpen',  roles: [UserRole.COMMUNITY_MEMBER, UserRole.MARKETPLACE_PARTNER], group: 'conteudo' },
  { label: 'Ferramentas',     href: '/dashboard/ferramentas',     icon: 'Wrench',    roles: [UserRole.COMMUNITY_MEMBER, UserRole.MARKETPLACE_PARTNER], group: 'conteudo' },

  // ── GESTAO (influenciador) ──
  { label: 'Analytics',         href: '/dashboard/analytics',                 icon: 'BarChart2',  roles: [UserRole.INFLUENCER_ADMIN], group: 'gestao' },
  { label: 'Criar conteudo',    href: '/dashboard/content',                   icon: 'FileVideo',  roles: [UserRole.INFLUENCER_ADMIN], group: 'gestao' },
  { label: 'Guia de inicio',    href: '/dashboard/onboarding-influenciador',  icon: 'Rocket',     roles: [UserRole.INFLUENCER_ADMIN], group: 'gestao' },

  // ── ADMIN (super admin) ──
  { label: 'Usuarios',            href: '/dashboard/usuarios',          icon: 'UserCog',   roles: [UserRole.SUPER_ADMIN], group: 'admin' },
  { label: 'Membros',             href: '/dashboard/admin/membros',     icon: 'Users',     roles: [UserRole.SUPER_ADMIN], group: 'admin' },
  { label: 'Comunidades (admin)', href: '/dashboard/admin/comunidades', icon: 'Settings2', roles: [UserRole.SUPER_ADMIN], group: 'admin' },
];

export function getNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter(
    (item) => item.roles === 'ALL' || (item.roles as UserRole[]).includes(role)
  );
}

export function getNavGroups(role: UserRole): Record<string, NavItem[]> {
  const items = getNavItems(role);
  const groups: Record<string, NavItem[]> = {};
  for (const item of items) {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  }
  return groups;
}

export const GROUP_LABELS: Record<string, string> = {
  principal: 'Principal',
  conteudo: 'Conteudo',
  gestao: 'Gestao',
  admin: 'Administracao',
};
