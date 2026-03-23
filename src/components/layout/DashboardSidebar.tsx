'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, CalendarDays, MessageSquare, BookOpen, BarChart2,
  FileVideo, UserCog, Settings2, LogOut, Eye, UserCheck,
  Lock, Crown, Search, X, HelpCircle,
} from 'lucide-react';
import { Logo, LogoType } from '@/components/ui/logo';
import { RoleBadge } from '@/components/ui/badge';
import { UserRole } from '@prisma/client';
import { STORAGE_KEYS } from '@/lib/constants';

interface ViewAsUser {
  id: string;
  name: string;
  role: string;
  hasPlatform: boolean;
}

interface UserResult {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  hasPlatform?: boolean;
}

interface NavSection {
  key: string;
  label: string;
  roles: UserRole[] | 'ALL';
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  liveIndicator?: boolean;
}

function buildSections(hasLiveToday: boolean): NavSection[] {
  return [
    {
      key: 'principal',
      label: 'Principal',
      roles: 'ALL',
      items: [
        { label: 'Inicio', href: '/dashboard', icon: Home },
        { label: 'Calendario', href: '/dashboard/calendar', icon: CalendarDays, liveIndicator: hasLiveToday },
        { label: 'Mensagens', href: '/dashboard/messages', icon: MessageSquare },
      ],
    },
    {
      key: 'conteudo',
      label: 'Conteudo',
      roles: [UserRole.COMMUNITY_MEMBER, UserRole.MARKETPLACE_PARTNER],
      items: [
        { label: 'Meu aprendizado', href: '/dashboard/meu-aprendizado', icon: BookOpen },
      ],
    },
    {
      key: 'gestao',
      label: 'Gestao',
      roles: [UserRole.INFLUENCER_ADMIN],
      items: [
        { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
        { label: 'Criar conteudo', href: '/dashboard/content', icon: FileVideo },
      ],
    },
    {
      key: 'admin',
      label: 'Administracao',
      roles: [UserRole.SUPER_ADMIN],
      items: [
        { label: 'Usuarios', href: '/dashboard/usuarios', icon: UserCog },
        { label: 'Comunidades (admin)', href: '/dashboard/admin/comunidades', icon: Settings2 },
      ],
    },
  ];
}

interface DashboardSidebarProps {
  role: string;
  userName: string;
  collapsed: boolean;
  onCollapseChange: (v: boolean) => void;
  onMobileClose: () => void;
  onLogout: () => void;
  viewAs: string | null;
  viewAsUser: ViewAsUser | null;
  onViewAsChange: (viewAs: string | null, user: ViewAsUser | null) => void;
}

export function DashboardSidebar({
  role,
  userName,
  collapsed,
  onCollapseChange,
  onMobileClose,
  onLogout,
  viewAs,
  viewAsUser,
  onViewAsChange,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasLiveToday, setHasLiveToday] = useState(false);
  const [viewAsOpen, setViewAsOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [influencerSearch, setInfluencerSearch] = useState('');
  const [memberResults, setMemberResults] = useState<UserResult[]>([]);
  const [influencerResults, setInfluencerResults] = useState<UserResult[]>([]);
  const [preloadedMembers, setPreloadedMembers] = useState<UserResult[]>([]);
  const [preloadedInfluencers, setPreloadedInfluencers] = useState<UserResult[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [influencerSearching, setInfluencerSearching] = useState(false);
  const [viewAsPreloaded, setViewAsPreloaded] = useState(false);
  const memberDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const influencerDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeRole = (role as UserRole) ?? UserRole.COMMUNITY_MEMBER;
  const navRole: UserRole =
    viewAs === 'MEMBER_PAID' || viewAs === 'MEMBER_UNPAID' || viewAs === 'COMMUNITY_MEMBER'
      ? UserRole.COMMUNITY_MEMBER
      : viewAs === 'INFLUENCER' || viewAs === 'INFLUENCER_ADMIN'
      ? UserRole.INFLUENCER_ADMIN
      : safeRole;

  const userInitials = userName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  // Check if there's a live session today
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    fetch('/api/lives/next', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !d.data) return;
        const scheduledAt = new Date(d.data.scheduledAt);
        const now = new Date();
        const isToday =
          scheduledAt.getDate() === now.getDate() &&
          scheduledAt.getMonth() === now.getMonth() &&
          scheduledAt.getFullYear() === now.getFullYear();
        setHasLiveToday(isToday || d.data.status === 'LIVE');
      })
      .catch(() => {});
  }, []);

  // Pre-load users when ViewAs panel opens
  useEffect(() => {
    if (!viewAsOpen || viewAsPreloaded) return;
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all([
      fetch('/api/users?role=INFLUENCER_ADMIN&pageSize=20', { headers }).then((r) => r.json()),
      fetch('/api/users?role=COMMUNITY_MEMBER&pageSize=12', { headers }).then((r) => r.json()),
    ]).then(([infData, memData]) => {
      if (infData.success) setPreloadedInfluencers(infData.data ?? []);
      if (memData.success) setPreloadedMembers(memData.data ?? []);
      setViewAsPreloaded(true);
    }).catch(() => {});
  }, [viewAsOpen, viewAsPreloaded]);

  function searchMembers(q: string) {
    setMemberSearch(q);
    if (memberDebounce.current) clearTimeout(memberDebounce.current);
    if (!q.trim()) { setMemberResults([]); return; }
    memberDebounce.current = setTimeout(async () => {
      setMemberSearching(true);
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const res = await fetch(`/api/users?role=COMMUNITY_MEMBER&search=${encodeURIComponent(q)}&pageSize=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) setMemberResults(data.data ?? []);
      } catch { /* ignore */ } finally { setMemberSearching(false); }
    }, 300);
  }

  function searchInfluencers(q: string) {
    setInfluencerSearch(q);
    if (influencerDebounce.current) clearTimeout(influencerDebounce.current);
    if (!q.trim()) { setInfluencerResults([]); return; }
    influencerDebounce.current = setTimeout(async () => {
      setInfluencerSearching(true);
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const res = await fetch(`/api/users?role=INFLUENCER_ADMIN&search=${encodeURIComponent(q)}&pageSize=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) setInfluencerResults(data.data ?? []);
      } catch { /* ignore */ } finally { setInfluencerSearching(false); }
    }, 300);
  }

  const sections = buildSections(hasLiveToday);
  const visibleSections = sections.filter(
    (s) => s.roles === 'ALL' || (s.roles as UserRole[]).includes(navRole)
  );

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-white/10 flex-shrink-0 ${collapsed ? 'px-3 justify-center' : 'px-4'}`}>
        {collapsed ? (
          <Link href="/dashboard" onClick={onMobileClose}>
            <Logo size="md" />
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center flex-1 min-w-0" onClick={onMobileClose}>
            <LogoType height={24} variant="light" />
          </Link>
        )}
      </div>

      {/* User identity — avatar + nome + role only */}
      <div className={`border-b border-white/10 flex-shrink-0 ${collapsed ? 'flex justify-center py-3' : 'px-4 py-3'}`}>
        {collapsed ? (
          <div className="w-8 h-8 bg-gradient-to-br from-[#006079] to-[#009CD9] rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {userInitials || 'U'}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#006079] to-[#009CD9] rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {userInitials || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#EEE6E4] text-sm font-medium truncate">{userName || 'Usuario'}</p>
              <RoleBadge role={role} />
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto px-2 space-y-4">
        {visibleSections.map((section) => (
          <div key={section.key}>
            {/* Section label — visual separator only */}
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-600 px-3 pb-1">
                {section.label}
              </p>
            )}

            {/* Nav items */}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                      isActive
                        ? 'bg-[#009CD9]/15 text-[#009CD9]'
                        : 'text-gray-400 hover:text-[#EEE6E4] hover:bg-white/5'
                    }`}
                  >
                    {/* Active indicator: 2px left border */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#009CD9] rounded-r-full" />
                    )}

                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#009CD9]' : 'text-gray-500 group-hover:text-[#EEE6E4]'}`} />

                    {!collapsed && (
                      <span className="truncate text-sm">{item.label}</span>
                    )}

                    {/* Live indicator dot */}
                    {item.liveIndicator && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/10 flex-shrink-0 space-y-0.5">
        {/* Help */}
        <Link
          href="/dashboard/settings"
          onClick={onMobileClose}
          title={collapsed ? 'Central de ajuda' : undefined}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-gray-500 hover:text-[#EEE6E4] hover:bg-white/5 transition-all"
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Central de ajuda</span>}
        </Link>

        {/* ViewAs — SUPER_ADMIN only */}
        {role === 'SUPER_ADMIN' && (
          <div className="relative">
            <button
              onClick={() => setViewAsOpen((v) => !v)}
              title={collapsed ? 'Visualizar como' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm transition-all ${
                viewAs
                  ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                  : 'text-gray-500 hover:text-[#EEE6E4] hover:bg-white/5'
              }`}
            >
              <Eye className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Visualizar como</span>
                  {viewAs && <span className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" />}
                </>
              )}
            </button>

            {viewAsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setViewAsOpen(false)} />
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#252525] border border-white/10 rounded-xl overflow-y-auto shadow-2xl z-50 max-h-[82vh]">
                  {/* Members */}
                  <div className="p-2.5 border-b border-white/10">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide px-0.5 mb-2 font-semibold flex items-center gap-1.5">
                      <UserCheck className="w-3 h-3" /> Membros
                    </p>
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {(
                        [
                          { id: 'MEMBER_PAID',   label: 'Assinante',      Icon: UserCheck, desc: 'Pagou a plataforma' },
                          { id: 'MEMBER_UNPAID', label: 'Sem assinatura',  Icon: Lock,      desc: 'Ainda nao assinou' },
                        ] as Array<{ id: string; label: string; Icon: React.ComponentType<{ className?: string }>; desc: string }>
                      ).map(({ id, label, Icon, desc }) => (
                        <button key={id}
                          onClick={() => { onViewAsChange(id, null); setViewAsOpen(false); router.push('/dashboard'); }}
                          title={desc}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-center hover:bg-white/5 border ${viewAs === id && !viewAsUser ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-white/5 text-gray-400 hover:text-[#EEE6E4]'}`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] font-medium leading-tight">{label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 mb-1.5">
                      <Search className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <input type="text" placeholder="Buscar membro..." value={memberSearch}
                        onChange={(e) => searchMembers(e.target.value)}
                        className="bg-transparent text-xs text-[#EEE6E4] placeholder-gray-600 flex-1 outline-none"
                      />
                      {memberSearching && <div className="w-3 h-3 border border-[#009CD9] border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                    </div>
                    {(() => {
                      const list = memberSearch ? memberResults : preloadedMembers;
                      if (!list.length) return memberSearch && !memberSearching ? <p className="text-[11px] text-gray-600 py-1">Nenhum encontrado.</p> : null;
                      return (
                        <div className="flex flex-wrap gap-1.5 py-1">
                          {list.map((u) => {
                            const name = `${u.firstName} ${u.lastName}`.trim();
                            const ini = `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
                            const active = viewAsUser?.id === u.id;
                            return (
                              <button key={u.id} title={name}
                                onClick={() => { onViewAsChange('COMMUNITY_MEMBER', { id: u.id, name, role: 'COMMUNITY_MEMBER', hasPlatform: u.hasPlatform ?? false }); setViewAsOpen(false); setMemberSearch(''); setMemberResults([]); router.push('/dashboard'); }}
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all ring-2 ${active ? 'ring-amber-400 scale-110' : 'ring-transparent hover:ring-[#009CD9]/50 hover:scale-105'} bg-gradient-to-br from-[#006079] to-[#009CD9] overflow-hidden`}
                              >
                                {u.avatarUrl ? <Image src={u.avatarUrl} alt={name} width={36} height={36} className="w-full h-full object-cover" /> : ini}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Influencers */}
                  <div className="p-2.5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide px-0.5 mb-2 font-semibold flex items-center gap-1.5">
                      <Crown className="w-3 h-3" /> Influenciadores
                    </p>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 mb-1.5">
                      <Search className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <input type="text" placeholder="Buscar influenciador..." value={influencerSearch}
                        onChange={(e) => searchInfluencers(e.target.value)}
                        className="bg-transparent text-xs text-[#EEE6E4] placeholder-gray-600 flex-1 outline-none"
                      />
                      {influencerSearching && <div className="w-3 h-3 border border-[#009CD9] border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                    </div>
                    {(() => {
                      const list = influencerSearch ? influencerResults : preloadedInfluencers;
                      if (!list.length) return influencerSearch && !influencerSearching ? <p className="text-[11px] text-gray-600 py-1">Nenhum encontrado.</p> : !viewAsPreloaded ? <p className="text-[11px] text-gray-600 py-1">Carregando...</p> : null;
                      return (
                        <div className="flex flex-wrap gap-1.5 py-1">
                          {list.map((u) => {
                            const name = `${u.firstName} ${u.lastName}`.trim();
                            const ini = `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
                            const active = viewAsUser?.id === u.id;
                            return (
                              <button key={u.id} title={name}
                                onClick={() => { onViewAsChange('INFLUENCER_ADMIN', { id: u.id, name, role: 'INFLUENCER_ADMIN', hasPlatform: true }); setViewAsOpen(false); setInfluencerSearch(''); setInfluencerResults([]); router.push('/dashboard'); }}
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all ring-2 ${active ? 'ring-amber-400 scale-110' : 'ring-transparent hover:ring-[#009CD9]/50 hover:scale-105'} bg-gradient-to-br from-[#007A99] to-[#009CD9] overflow-hidden`}
                              >
                                {u.avatarUrl ? <Image src={u.avatarUrl} alt={name} width={36} height={36} className="w-full h-full object-cover" /> : ini}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {viewAs && (
                    <div className="p-2 border-t border-white/10">
                      <button
                        onClick={() => { onViewAsChange(null, null); setViewAsOpen(false); setMemberSearch(''); setMemberResults([]); setInfluencerSearch(''); setInfluencerResults([]); router.push('/dashboard'); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        Sair do modo visualizacao
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          title={collapsed ? 'Sair' : undefined}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
}
