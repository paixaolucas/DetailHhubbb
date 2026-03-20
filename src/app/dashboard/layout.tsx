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
  Menu,
  Shield,
  Flag,
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
  Compass,
  CheckSquare,
  Megaphone,
  Car,
  Search,
  Kanban,
  Eye,
  ArrowLeft,
  UserCheck,
  Crown,
  Lock,
  Link2,
  Layers,
} from "lucide-react";
import { RoleBadge } from "@/components/ui/badge";
import { Logo, LogoType } from "@/components/ui/logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import SearchBar from "@/components/search/SearchBar";
import { STORAGE_KEYS } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}
interface NavGroup {
  type: "group";
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}
interface NavLink extends NavItem {
  type?: "link";
}
type NavEntry = NavLink | NavGroup;

// ─── Navigation config per role ──────────────────────────────────────────────

const ADMIN_NAV: NavEntry[] = [
  { type: "link", href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard, exact: true },
  {
    type: "group",
    label: "Gestão",
    icon: Shield,
    items: [
      { href: "/dashboard/admin/comunidades", label: "Comunidades", icon: Globe },
      { href: "/dashboard/usuarios", label: "Usuários", icon: Shield },
      { href: "/dashboard/admin/denuncias", label: "Denúncias", icon: Flag },
      { href: "/dashboard/admin/anuncios", label: "Anúncios", icon: Megaphone },
      { href: "/dashboard/admin/plataforma", label: "Plataforma", icon: Server },
      { href: "/dashboard/admin/financeiro", label: "Financeiro", icon: DollarSign },
      { href: "/dashboard/admin/ferramentas", label: "Ferramentas", icon: Wrench },
      { href: "/dashboard/projeto", label: "Projeto", icon: Kanban },
    ],
  },
  {
    type: "group",
    label: "Conteúdo",
    icon: BookOpen,
    items: [
      { href: "/dashboard/events", label: "Eventos", icon: Calendar },
      { href: "/dashboard/email-sequences", label: "Seq. de Email", icon: Mail },
      { href: "/dashboard/badges", label: "Badges", icon: Award },
      { href: "/dashboard/faqs", label: "FAQs", icon: HelpCircle },
      { href: "/dashboard/testimonials", label: "Depoimentos", icon: Star },
      { href: "/dashboard/marketplace", label: "Marketplace", icon: ShoppingBag },
      { href: "/dashboard/ai", label: "Auto AI", icon: Bot },
    ],
  },
  {
    type: "group",
    label: "Conta",
    icon: Settings,
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
      { href: "/dashboard/settings", label: "Configurações", icon: Settings },
    ],
  },
];

const INFLUENCER_NAV: NavEntry[] = [
  { type: "link", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    type: "group",
    label: "Comunidades",
    icon: Users,
    items: [
      { href: "/dashboard/communities", label: "Minhas Comunidades", icon: Users },
      { href: "/dashboard/content", label: "Conteúdo", icon: BookOpen },
      { href: "/dashboard/live", label: "Lives", icon: Video },
      { href: "/dashboard/events", label: "Eventos", icon: Calendar },
      { href: "/dashboard/email-sequences", label: "Seq. de Email", icon: Mail },
      { href: "/dashboard/badges", label: "Badges", icon: Award },
      { href: "/dashboard/faqs", label: "FAQs", icon: HelpCircle },
      { href: "/dashboard/testimonials", label: "Depoimentos", icon: Star },
    ],
  },
  {
    type: "group",
    label: "Crescimento",
    icon: TrendingUp,
    items: [
      { href: "/dashboard/financeiro", label: "Financeiro", icon: DollarSign },
      { href: "/dashboard/performance", label: "Performance (PP)", icon: Trophy },
      { href: "/dashboard/milestones", label: "Marcos & Bônus", icon: Award },
      { href: "/dashboard/entregas", label: "Entregas do Mês", icon: CheckSquare },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
      { href: "/dashboard/marketplace", label: "Marketplace", icon: ShoppingBag },
      { href: "/dashboard/anuncios", label: "Anúncios", icon: Megaphone },
      { href: "/dashboard/tools", label: "Ferramentas", icon: Wrench },
      { href: "/dashboard/ai", label: "Auto AI", icon: Bot },
    ],
  },
  {
    type: "group",
    label: "Conta",
    icon: Settings,
    items: [
      { href: "/dashboard/messages", label: "Mensagens", icon: MessageSquare },
      { href: "/dashboard/notifications", label: "Notificações", icon: Bell },
      { href: "/dashboard/settings", label: "Configurações", icon: Settings },
    ],
  },
];

const MEMBER_NAV: NavEntry[] = [
  { type: "link", href: "/dashboard", label: "Início", icon: Home, exact: true },
  {
    type: "group",
    label: "Comunidades",
    icon: Users,
    items: [
      { href: "/dashboard/minhas-comunidades", label: "Minhas Comunidades", icon: Users },
      { href: "/dashboard/meu-aprendizado", label: "Meu Aprendizado", icon: GraduationCap },
      { href: "/dashboard/lives", label: "Lives", icon: PlayCircle },
      { href: "/dashboard/lives/calendar", label: "Calendário", icon: Calendar },
      { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    type: "group",
    label: "Explorar",
    icon: Compass,
    items: [
      { href: "/dashboard/garage", label: "Minha Garagem", icon: Car },
      { href: "/dashboard/marketplace", label: "Marketplace", icon: ShoppingBag },
      { href: "/dashboard/ai", label: "Auto AI", icon: Bot },
      { href: "/dashboard/search", label: "Buscar", icon: Search },
    ],
  },
  {
    type: "group",
    label: "Conta",
    icon: Settings,
    items: [
      { href: "/dashboard/messages", label: "Mensagens", icon: MessageSquare },
      { href: "/dashboard/notifications", label: "Notificações", icon: Bell },
      { href: "/dashboard/settings", label: "Configurações", icon: Settings },
    ],
  },
];

const PARTNER_NAV: NavEntry[] = [
  { type: "link", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    type: "group",
    label: "Produtos",
    icon: Package,
    items: [
      { href: "/dashboard/meus-produtos", label: "Meus Produtos", icon: Package },
      { href: "/dashboard/vendas", label: "Vendas", icon: TrendingUp },
      { href: "/dashboard/anuncios", label: "Meus Anúncios", icon: Megaphone },
    ],
  },
  {
    type: "group",
    label: "Crescimento",
    icon: TrendingUp,
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
      { href: "/dashboard/marketplace", label: "Marketplace", icon: ShoppingBag },
    ],
  },
  {
    type: "group",
    label: "Conta",
    icon: Settings,
    items: [
      { href: "/dashboard/messages", label: "Mensagens", icon: MessageSquare },
      { href: "/dashboard/settings", label: "Configurações", icon: Settings },
    ],
  },
];

function getNavItems(role: string): NavEntry[] {
  switch (role) {
    case "SUPER_ADMIN": return ADMIN_NAV;
    case "INFLUENCER_ADMIN": return INFLUENCER_NAV;
    case "COMMUNITY_MEMBER": return MEMBER_NAV;
    case "MARKETPLACE_PARTNER": return PARTNER_NAV;
    default: return INFLUENCER_NAV;
  }
}

// ─── View As ─────────────────────────────────────────────────────────────────

interface ViewAsOption {
  id: string;
  label: string;
  icon: React.ElementType;
  desc: string;
  navigateTo?: string;
}

const VIEW_AS_OPTIONS: ViewAsOption[] = [
  { id: "MEMBER",       label: "Membros",          icon: UserCheck, desc: "Como um assinante vê a plataforma" },
  { id: "INFLUENCER",   label: "Influenciadores",  icon: Crown,     desc: "Como um criador de comunidade vê" },
  { id: "PAYWALL",      label: "Paywalls",          icon: Lock,      desc: "O que não-assinantes enxergam",        navigateTo: "/dashboard/assinar" },
  { id: "INVITE_LINK",  label: "Links de Convite", icon: Link2,     desc: "Espaços e grupos via link de convite", navigateTo: "/dashboard/admin/comunidades" },
  { id: "ACCESS_GROUP", label: "Grupos de Acesso", icon: Layers,    desc: "Espaços e grupos disponíveis",         navigateTo: "/dashboard/communities" },
];

const VIEW_AS_LABELS: Record<string, string> = {
  MEMBER:       "Membro",
  INFLUENCER:   "Influenciador",
  PAYWALL:      "Paywall (sem assinatura)",
  INVITE_LINK:  "Link de Convite",
  ACCESS_GROUP: "Grupo de Acesso",
};

const VIEW_AS_DESCS: Record<string, string> = {
  MEMBER:       "Você está vendo a plataforma como um membro comum.",
  INFLUENCER:   "Você está vendo como um influenciador.",
  PAYWALL:      "Você está vendo o que usuários sem assinatura enxergam.",
  INVITE_LINK:  "Você está vendo o que novos membros veem via link de convite.",
  ACCESS_GROUP: "Você está vendo os grupos e espaços disponíveis.",
};

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState("INFLUENCER_ADMIN");
  const [userName, setUserName] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [viewAs, setViewAs] = useState<string | null>(null);
  const [viewAsOpen, setViewAsOpen] = useState(false);
  const [viewAsSearch, setViewAsSearch] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      // If no access token, try to refresh using the httpOnly cookie
      if (!token) {
        try {
          const res = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          const data = await res.json();
          if (res.ok && data.data?.accessToken) {
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.data.accessToken);
          } else {
            // Refresh failed — clear everything and redirect
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
            localStorage.removeItem(STORAGE_KEYS.USER_NAME);
            localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
            localStorage.removeItem(STORAGE_KEYS.USER_ID);
            router.push("/login");
            return;
          }
        } catch {
          router.push("/login");
          return;
        }
      }

      // Check if token is about to expire or already expired
      if (token) {
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(atob(padded));
            const now = Math.floor(Date.now() / 1000);
            // If token expires within 5 minutes, proactively refresh via cookie
            if (payload.exp && payload.exp - now < 300) {
              const res = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
              });
              const data = await res.json();
              if (res.ok && data.data?.accessToken) {
                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.data.accessToken);
              }
            }
          }
        } catch {
          // Token decode failed — continue with existing token
        }
      }

      const storedRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE) ?? "INFLUENCER_ADMIN";
      const storedName = localStorage.getItem(STORAGE_KEYS.USER_NAME) ?? "";
      setRole(storedRole);
      setUserName(storedName);
      setAuthChecked(true);
    }

    checkAuth();

    // Proactively refresh token every 5 minutes to prevent idle logout
    const refreshInterval = setInterval(async () => {
      const t = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!t) return;
      try {
        const parts = t.split(".");
        if (parts.length === 3) {
          const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const payload = JSON.parse(atob(padded));
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp - now < 600) {
            const res = await fetch("/api/auth/refresh", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            });
            const data = await res.json();
            if (res.ok && data.data?.accessToken) {
              localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.data.accessToken);
            }
          }
        }
      } catch { /* ignore */ }
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [router]);

  // Auto-expand groups that contain the active route
  useEffect(() => {
    const nav = getNavItems(role);
    const toOpen = new Set<string>();
    nav.forEach((entry) => {
      if (entry.type === "group") {
        const hasActive = entry.items.some(
          (item) => pathname === item.href || pathname.startsWith(item.href + "/")
        );
        if (hasActive) toOpen.add(entry.label);
      }
    });
    setOpenGroups(toOpen);
  }, [pathname, role]);

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } finally {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
      localStorage.removeItem(STORAGE_KEYS.USER_NAME);
      localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
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
          <Link href="/" className="flex items-center flex-1 min-w-0">
            <LogoType height={24} variant="light" />
          </Link>
        )}
        {collapsed && <Logo size="md" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`text-gray-500 hover:text-[#EEE6E4] transition-colors p-1 rounded-lg hover:bg-white/5 ${collapsed ? "hidden md:flex" : "ml-auto"}`}
          title={collapsed ? "Expandir" : "Recolher"}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#006079] to-[#009CD9] rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {userInitials || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#EEE6E4] text-sm font-medium truncate">{userName || "Usuário"}</p>
              <RoleBadge role={role} />
            </div>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center py-3 border-b border-white/10 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-[#006079] to-[#009CD9] rounded-xl flex items-center justify-center text-white font-bold text-xs">
            {userInitials || "U"}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
        {((viewAs === "MEMBER" ? MEMBER_NAV : viewAs === "INFLUENCER" ? INFLUENCER_NAV : getNavItems(role)) as NavEntry[]).map((entry) => {
          if (!entry.type || entry.type === "link") {
            const item = entry as NavLink;
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                  isActive
                    ? "bg-[#006079]/20 text-[#009CD9] border border-[#006079]/30"
                    : "text-gray-400 hover:text-[#EEE6E4] hover:bg-white/5"
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#009CD9]" : "text-gray-500 group-hover:text-[#EEE6E4]"}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && isActive && <div className="ml-auto w-1.5 h-1.5 bg-[#009CD9] rounded-full" />}
              </Link>
            );
          }

          // Group
          const group = entry as NavGroup;
          const isGroupActive = group.items.some(
            (item) => pathname === item.href || pathname.startsWith(item.href + "/")
          );
          const isOpen = openGroups.has(group.label);

          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                title={collapsed ? group.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                  isGroupActive
                    ? "bg-[#006079]/20 text-[#009CD9] border border-[#006079]/30"
                    : "text-gray-400 hover:text-[#EEE6E4] hover:bg-white/5"
                }`}
              >
                <group.icon className={`w-5 h-5 flex-shrink-0 ${isGroupActive ? "text-[#009CD9]" : "text-gray-500 group-hover:text-[#EEE6E4]"}`} />
                {!collapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{group.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${isGroupActive ? "text-[#009CD9]" : "text-gray-400"}`}
                    />
                  </>
                )}
              </button>
              {!collapsed && isOpen && (
                <div className="ml-3 pl-3 border-l border-white/10 mt-0.5 space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all group ${
                          isActive
                            ? "bg-[#006079]/20 text-[#009CD9] font-medium"
                            : "text-gray-500 hover:text-[#EEE6E4] hover:bg-white/5"
                        }`}
                      >
                        <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#009CD9]" : "text-gray-400 group-hover:text-gray-300"}`} />
                        <span className="truncate">{item.label}</span>
                        {isActive && <div className="ml-auto w-1 h-1 bg-[#009CD9] rounded-full" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/10 flex-shrink-0 space-y-0.5">
        {/* Visualizar Como — só para SUPER_ADMIN */}
        {role === "SUPER_ADMIN" && (
          <div className="relative">
            <button
              onClick={() => setViewAsOpen((v) => !v)}
              title={collapsed ? "Visualizar como" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm transition-all ${
                viewAs
                  ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                  : "text-gray-500 hover:text-[#EEE6E4] hover:bg-white/5"
              }`}
            >
              <Eye className="w-5 h-5 flex-shrink-0" />
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
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#252525] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                  {/* Header */}
                  <div className="p-2 border-b border-white/10">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide px-1 mb-1.5 font-medium">Visualizar como</p>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
                      <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Pesquisar membro..."
                        value={viewAsSearch}
                        onChange={(e) => setViewAsSearch(e.target.value)}
                        className="bg-transparent text-xs text-[#EEE6E4] placeholder-gray-500 flex-1 outline-none"
                      />
                    </div>
                  </div>
                  {/* Options */}
                  <div className="p-1">
                    {VIEW_AS_OPTIONS.filter((o) =>
                      !viewAsSearch || o.label.toLowerCase().includes(viewAsSearch.toLowerCase())
                    ).map(({ id, label, icon: Icon, desc, navigateTo }) => (
                      <button
                        key={id}
                        onClick={() => {
                          setViewAs(id);
                          setViewAsOpen(false);
                          setViewAsSearch("");
                          if (navigateTo) router.push(navigateTo);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left hover:bg-white/5 ${
                          viewAs === id ? "text-amber-400" : "text-gray-400 hover:text-[#EEE6E4]"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium leading-tight">{label}</p>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">{desc}</p>
                        </div>
                        {viewAs === id && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                  {/* Clear */}
                  {viewAs && (
                    <div className="p-2 border-t border-white/10">
                      <button
                        onClick={() => { setViewAs(null); setViewAsOpen(false); router.push("/dashboard"); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        Sair do modo visualização
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
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
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[#009CD9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex">
      {/* Desktop sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-60"
        } hidden md:flex flex-col bg-[#222222] border-r border-white/10 transition-all duration-300 fixed h-full z-30`}
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
        className={`md:hidden fixed top-0 left-0 h-full w-60 bg-[#222222] border-r border-white/10 z-50 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setMobileOpen(false)}
            className="text-gray-500 hover:text-[#EEE6E4] p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className={`flex-1 ${collapsed ? "md:ml-16" : "md:ml-60"} transition-all duration-300 flex flex-col min-h-screen`}>
        {/* Top header with search + notifications */}
        <div className="hidden md:flex h-14 bg-[#1A1A1A]/90 border-b border-white/10 items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-20 backdrop-blur-sm">
          <div className="flex-1">
            <SearchBar />
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link
              href="/dashboard/settings"
              className="w-8 h-8 bg-gradient-to-br from-[#006079] to-[#009CD9] rounded-xl flex items-center justify-center text-white font-bold text-xs hover:opacity-90 transition-opacity"
              title={userName}
            >
              {userInitials || "U"}
            </Link>
          </div>
        </div>

        {/* Mobile header */}
        <div className="md:hidden h-14 bg-[#1A1A1A] border-b border-white/10 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-gray-500 hover:text-[#EEE6E4] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center flex-1">
            <LogoType height={22} variant="light" />
          </Link>
          <NotificationBell />
          <RoleBadge role={role} />
        </div>

        {/* ViewAs Banner */}
        {viewAs && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 py-2 flex items-center gap-3 flex-shrink-0">
            <Eye className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-amber-300 text-sm font-medium">
              Visualizando como: {VIEW_AS_LABELS[viewAs]}
            </span>
            <span className="hidden sm:inline text-amber-500/70 text-xs truncate">
              — {VIEW_AS_DESCS[viewAs]}
            </span>
            <button
              onClick={() => { setViewAs(null); router.push("/dashboard"); }}
              className="ml-auto flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1 rounded-lg transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="hidden sm:inline">Voltar ao normal</span>
              <span className="sm:hidden">Voltar</span>
            </button>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
