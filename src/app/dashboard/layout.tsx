"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  BarChart2,
  ShoppingBag,
  Wrench,
  Bot,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Menu,
  Shield,
  GraduationCap,
  Package,
  TrendingUp,
  Home,
  PlayCircle,
  X,
  DollarSign,
  Globe,
  Server,
  MessageSquare,
  Bell,
  Trophy,
  Award,
  Mail,
  Calendar,
  HelpCircle,
  Star,
} from "lucide-react";
import { RoleBadge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import SearchBar from "@/components/search/SearchBar";

// ─── Navigation config per role ──────────────────────────────────────────────

const ADMIN_NAV = [
  { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/communities", label: "Comunidades", icon: Users },
  { href: "/dashboard/usuarios", label: "Usuários", icon: Shield },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/dashboard/events", label: "Eventos", icon: Calendar },
  { href: "/dashboard/email-sequences", label: "Seq. de Email", icon: Mail },
  { href: "/dashboard/badges", label: "Badges", icon: Award },
  { href: "/dashboard/ai", label: "Auto AI", icon: Bot },
  { href: "/dashboard/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/dashboard/testimonials", label: "Depoimentos", icon: Star },
  { href: "/dashboard/admin/comunidades", label: "Comunidades (Admin)", icon: Globe },
  { href: "/dashboard/admin/ferramentas", label: "Ferramentas (Admin)", icon: Wrench },
  { href: "/dashboard/admin/plataforma", label: "Plataforma", icon: Server },
  { href: "/dashboard/admin/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

const INFLUENCER_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/communities", label: "Minhas Comunidades", icon: Users },
  { href: "/dashboard/content", label: "Conteúdo", icon: BookOpen },
  { href: "/dashboard/live", label: "Lives", icon: Video },
  { href: "/dashboard/events", label: "Eventos", icon: Calendar },
  { href: "/dashboard/email-sequences", label: "Sequências de Email", icon: Mail },
  { href: "/dashboard/badges", label: "Badges", icon: Award },
  { href: "/dashboard/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/dashboard/testimonials", label: "Depoimentos", icon: Star },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/dashboard/tools", label: "Ferramentas", icon: Wrench },
  { href: "/dashboard/ai", label: "Auto AI", icon: Bot },
  { href: "/dashboard/messages", label: "Mensagens", icon: MessageSquare },
  { href: "/dashboard/notifications", label: "Notificações", icon: Bell },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

// Reduced MEMBER_NAV — spaces are handled by SpacesNav
const MEMBER_NAV = [
  { href: "/dashboard", label: "Início", icon: Home, exact: true },
  { href: "/dashboard/meu-aprendizado", label: "Meu Aprendizado", icon: GraduationCap },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/lives", label: "Lives", icon: PlayCircle },
  { href: "/dashboard/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/dashboard/messages", label: "Mensagens", icon: MessageSquare },
  { href: "/dashboard/notifications", label: "Notificações", icon: Bell },
  { href: "/dashboard/ai", label: "Auto AI", icon: Bot },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

const PARTNER_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/meus-produtos", label: "Meus Produtos", icon: Package },
  { href: "/dashboard/vendas", label: "Vendas", icon: TrendingUp },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/messages", label: "Mensagens", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

function getNavItems(role: string) {
  switch (role) {
    case "SUPER_ADMIN": return ADMIN_NAV;
    case "INFLUENCER_ADMIN": return INFLUENCER_NAV;
    case "COMMUNITY_MEMBER": return MEMBER_NAV;
    case "MARKETPLACE_PARTNER": return PARTNER_NAV;
    default: return INFLUENCER_NAV;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface SpaceItem {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  type: string;
  communityId: string;
  communitySlug: string;
  communityName: string;
  communityLogoUrl: string | null;
}

interface CommunityGroup {
  communityId: string;
  communityName: string;
  communitySlug: string;
  communityLogoUrl: string | null;
  spaces: SpaceItem[];
}

// ─── SpacesNav ───────────────────────────────────────────────────────────────

function SpacesNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    if (!token) { setLoading(false); return; }

    fetch("/api/platform/spaces", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) { setLoading(false); return; }

        // Group by communityId
        const map = new Map<string, CommunityGroup>();
        for (const space of d.data as SpaceItem[]) {
          if (!map.has(space.communityId)) {
            map.set(space.communityId, {
              communityId: space.communityId,
              communityName: space.communityName,
              communitySlug: space.communitySlug,
              communityLogoUrl: space.communityLogoUrl,
              spaces: [],
            });
          }
          map.get(space.communityId)!.spaces.push(space);
        }
        const grouped = Array.from(map.values());
        setGroups(grouped);

        // Default: expand first community only
        if (grouped.length > 0) {
          setExpandedIds(new Set([grouped[0].communityId]));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function toggleExpand(communityId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(communityId)) next.delete(communityId);
      else next.add(communityId);
      return next;
    });
  }

  const spaceIcon = (icon: string | null, type: string) => {
    if (icon) return icon;
    switch (type) {
      case "ANNOUNCEMENT": return "📢";
      case "QA": return "❓";
      case "SHOWCASE": return "🏆";
      default: return "#";
    }
  };

  if (loading) {
    return (
      <div className="px-2 py-3 space-y-3 animate-pulse">
        {!collapsed && (
          <>
            <div className="h-3 bg-white/10 rounded w-16 mx-3" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-white/10 rounded mx-3" />
            ))}
          </>
        )}
      </div>
    );
  }

  if (groups.length === 0) {
    if (collapsed) return null;
    return (
      <div className="px-4 py-3">
        <Link
          href="/dashboard/assinar"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Assinar para ver espaços →
        </Link>
      </div>
    );
  }

  return (
    <div className="py-2">
      {!collapsed && (
        <p className="px-4 text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1">
          Espaços
        </p>
      )}
      {groups.map((group) => {
        const isExpanded = expandedIds.has(group.communityId);
        return (
          <div key={group.communityId}>
            {/* Community header */}
            <button
              onClick={() => toggleExpand(group.communityId)}
              title={collapsed ? group.communityName : undefined}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
            >
              {/* Logo */}
              {group.communityLogoUrl ? (
                <img
                  src={group.communityLogoUrl}
                  alt={group.communityName}
                  className="w-5 h-5 rounded flex-shrink-0 object-cover"
                />
              ) : (
                <div className="w-5 h-5 bg-blue-500/30 rounded flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-blue-300">
                  {group.communityName.charAt(0)}
                </div>
              )}
              {!collapsed && (
                <>
                  <span className="flex-1 text-xs font-medium text-left truncate">
                    {group.communityName}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  )}
                </>
              )}
            </button>

            {/* Spaces list */}
            {!collapsed && isExpanded && (
              <div className="ml-3 pl-3 border-l border-white/10 space-y-0.5 mb-1">
                {group.spaces.map((space) => {
                  const href = `/community/${group.communitySlug}/feed/${space.slug}`;
                  const isActive = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={space.id}
                      href={href}
                      onClick={onNavigate}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? "text-blue-400 bg-blue-600/10"
                          : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
                      }`}
                    >
                      <span className="w-4 text-center flex-shrink-0">
                        {spaceIcon(space.icon, space.type)}
                      </span>
                      <span className="truncate">{space.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState("INFLUENCER_ADMIN");
  const [userName, setUserName] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const storedRole = localStorage.getItem("detailhub_user_role") ?? "INFLUENCER_ADMIN";
    const storedName = localStorage.getItem("detailhub_user_name") ?? "";
    setRole(storedRole);
    setUserName(storedName);
    setAuthChecked(true);
  }, []);

  const navItems = getNavItems(role);
  const isMember = role === "COMMUNITY_MEMBER";

  async function handleLogout() {
    try {
      const refreshToken = localStorage.getItem("detailhub_refresh_token");
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      localStorage.removeItem("detailhub_access_token");
      localStorage.removeItem("detailhub_refresh_token");
      localStorage.removeItem("detailhub_user_role");
      localStorage.removeItem("detailhub_user_name");
      localStorage.removeItem("detailhub_user_email");
      localStorage.removeItem("detailhub_user_id");
      router.push("/login");
    }
  }

  const userInitials = userName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-white/10 flex-shrink-0 ${collapsed ? "px-3 justify-center" : "px-4"}`}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5 flex-1 min-w-0">
            <Logo size="md" />
            <div className="min-w-0">
              <span className="text-white font-bold text-sm leading-none block">DetailHub</span>
              <span className="text-blue-400 font-bold text-xs leading-none block">Pro</span>
            </div>
          </Link>
        )}
        {collapsed && <Logo size="md" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 ${collapsed ? "hidden md:flex" : "ml-auto"}`}
          title={collapsed ? "Expandir" : "Recolher"}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {userInitials || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{userName || "Usuário"}</p>
              <RoleBadge role={role} />
            </div>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center py-3 border-b border-white/10 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-xs">
            {userInitials || "U"}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
        {/* Top nav items */}
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                isActive
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-blue-400" : "text-gray-500 group-hover:text-white"}`} />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full" />
              )}
            </Link>
          );
        })}

        {/* Spaces section for members */}
        {isMember && (
          <>
            <div className="my-2 border-t border-white/10" />
            <SpacesNav
              collapsed={collapsed}
              onNavigate={() => setMobileOpen(false)}
            />
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/10 flex-shrink-0 space-y-0.5">
        <button
          onClick={handleLogout}
          title={collapsed ? "Sair" : undefined}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-chrome-900 flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chrome-900 flex">
      {/* Desktop sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-60"
        } hidden md:flex flex-col bg-chrome-950 border-r border-white/10 transition-all duration-300 fixed h-full z-30`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-60 bg-chrome-950 border-r border-white/10 z-50 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setMobileOpen(false)}
            className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className={`flex-1 ${collapsed ? "md:ml-16" : "md:ml-60"} transition-all duration-300 flex flex-col min-h-screen`}>
        {/* Top header with search + notifications */}
        <div className="hidden md:flex h-14 bg-chrome-950/80 border-b border-white/10 items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-20 backdrop-blur-sm">
          <div className="flex-1">
            <SearchBar />
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link
              href="/dashboard/settings"
              className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-xs hover:opacity-90 transition-opacity"
              title={userName}
            >
              {userInitials || "U"}
            </Link>
          </div>
        </div>

        {/* Mobile header */}
        <div className="md:hidden h-14 bg-chrome-950 border-b border-white/10 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 flex-1">
            <Logo size="sm" />
            <span className="text-white font-bold text-sm">DetailHub</span>
          </Link>
          <NotificationBell />
          <RoleBadge role={role} />
        </div>

        {/* Page content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
