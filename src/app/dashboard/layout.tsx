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
  Menu,
  Shield,
  GraduationCap,
  Package,
  TrendingUp,
  Home,
  PlayCircle,
  Car,
  X,
  DollarSign,
  Globe,
  Server,
  MessageSquare,
  Bell,
  Trophy,
  Award,
  Mail,
  Rss,
  Search,
  Calendar,
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
  { href: "/dashboard/admin/comunidades", label: "Comunidades (Admin)", icon: Globe },
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
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/dashboard/tools", label: "Ferramentas", icon: Wrench },
  { href: "/dashboard/ai", label: "Auto AI", icon: Bot },
  { href: "/dashboard/messages", label: "Mensagens", icon: MessageSquare },
  { href: "/dashboard/notifications", label: "Notificações", icon: Bell },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

const MEMBER_NAV = [
  { href: "/dashboard", label: "Início", icon: Home, exact: true },
  { href: "/dashboard/minhas-comunidades", label: "Minhas Comunidades", icon: Car },
  { href: "/dashboard/meu-aprendizado", label: "Meu Aprendizado", icon: GraduationCap },
  { href: "/dashboard/meu-aprendizado/certificados", label: "Certificados", icon: Award },
  { href: "/dashboard/lives", label: "Lives", icon: PlayCircle },
  { href: "/dashboard/lives/calendar", label: "Calendário", icon: Calendar },
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

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState("INFLUENCER_ADMIN");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("autoclub_access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const storedRole = localStorage.getItem("autoclub_user_role") ?? "INFLUENCER_ADMIN";
    const storedName = localStorage.getItem("autoclub_user_name") ?? "";
    const storedEmail = localStorage.getItem("autoclub_user_email") ?? "";
    setRole(storedRole);
    setUserName(storedName);
    setUserEmail(storedEmail);
    setAuthChecked(true);
  }, []);

  const navItems = getNavItems(role);

  async function handleLogout() {
    try {
      const refreshToken = localStorage.getItem("autoclub_refresh_token");
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      localStorage.removeItem("autoclub_access_token");
      localStorage.removeItem("autoclub_refresh_token");
      localStorage.removeItem("autoclub_user_role");
      localStorage.removeItem("autoclub_user_name");
      localStorage.removeItem("autoclub_user_email");
      localStorage.removeItem("autoclub_user_id");
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
              <span className="text-white font-bold text-sm leading-none block">AutoClub</span>
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
            <span className="text-white font-bold text-sm">AutoClub <span className="text-blue-400">Pro</span></span>
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
