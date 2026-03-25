"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Eye, Menu, X } from "lucide-react";
import { RoleBadge } from "@/components/ui/badge";
import { LogoType } from "@/components/ui/logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import SearchBar from "@/components/search/SearchBar";
import { STORAGE_KEYS } from "@/lib/constants";
import { ViewAsContext } from "@/contexts/view-as-context";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

const VIEW_AS_LABELS: Record<string, string> = {
  MEMBER_PAID:   "Membro (assinante)",
  MEMBER_UNPAID: "Membro (sem assinatura)",
  INFLUENCER:    "Influenciador",
};

interface ViewAsUser {
  id: string;
  name: string;
  role: string;
  hasPlatform: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState("INFLUENCER_ADMIN");
  const [userName, setUserName] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [viewAs, setViewAs] = useState<string | null>(null);
  const [viewAsUser, setViewAsUser] = useState<ViewAsUser | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

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

      if (token) {
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(atob(padded));
            const now = Math.floor(Date.now() / 1000);
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
        } catch { /* ignore */ }
      }

      const storedRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE) ?? "INFLUENCER_ADMIN";
      const storedName = localStorage.getItem(STORAGE_KEYS.USER_NAME) ?? "";
      setRole(storedRole);
      setUserName(storedName);
      setAuthChecked(true);
    }

    checkAuth();

    fetch("/api/users/me/seen", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    }).catch(() => {});

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

  // Inject X-View-As-User header into all /api/ calls when ViewAs is active
  useEffect(() => {
    if (!viewAsUser) return;
    const originalFetch = window.fetch;
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
      if (url.startsWith("/api/")) {
        const headers = new Headers(init?.headers);
        headers.set("X-View-As-User", viewAsUser.id);
        return originalFetch(input, { ...init, headers });
      }
      return originalFetch(input, init);
    };
    return () => { window.fetch = originalFetch; };
  }, [viewAsUser]);

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

  function handleViewAsChange(newViewAs: string | null, newUser: ViewAsUser | null) {
    setViewAs(newViewAs);
    setViewAsUser(newUser);
  }

  const userInitials = userName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

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
        className={`${collapsed ? "w-16" : "w-60"} hidden md:flex flex-col bg-[#222222] border-r border-white/10 transition-all duration-300 fixed h-full z-30`}
      >
        <DashboardSidebar
          role={role}
          userName={userName}
          collapsed={collapsed}
          onCollapseChange={setCollapsed}
          onMobileClose={() => setMobileOpen(false)}
          onLogout={handleLogout}
          viewAs={viewAs}
          viewAsUser={viewAsUser}
          onViewAsChange={handleViewAsChange}
        />
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
        className={`md:hidden fixed top-0 left-0 h-full w-60 bg-[#222222] border-r border-white/10 z-50 flex flex-col transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setMobileOpen(false)}
            className="text-gray-500 hover:text-[#EEE6E4] p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <DashboardSidebar
          role={role}
          userName={userName}
          collapsed={false}
          onCollapseChange={() => {}}
          onMobileClose={() => setMobileOpen(false)}
          onLogout={handleLogout}
          viewAs={viewAs}
          viewAsUser={viewAsUser}
          onViewAsChange={handleViewAsChange}
        />
      </aside>

      {/* Main */}
      <main className={`flex-1 ${collapsed ? "md:ml-16" : "md:ml-60"} transition-all duration-300 flex flex-col min-h-screen`}>
        {/* Desktop header */}
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
        {(() => {
          const isHome = pathname === "/inicio" || pathname === "/dashboard";
          return (
            <div className="md:hidden h-14 bg-[#1A1A1A] border-b border-white/10 flex items-center px-4 gap-3 flex-shrink-0">
              {isHome ? (
                <button
                  onClick={() => setMobileOpen(true)}
                  className="text-gray-500 hover:text-[#EEE6E4] transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => router.back()}
                  className="text-gray-400 hover:text-[#EEE6E4] transition-colors p-1 -ml-1 rounded-lg hover:bg-white/5"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <Link href="/inicio" className="flex items-center flex-1">
                <LogoType height={22} variant="light" />
              </Link>
              <NotificationBell />
              <RoleBadge role={role} />
            </div>
          );
        })()}

        {/* ViewAs Banner */}
        {viewAs && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 py-2 flex items-center gap-3 flex-shrink-0">
            <Eye className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-amber-300 text-sm font-medium">
              Visualizando como: {viewAsUser ? viewAsUser.name : VIEW_AS_LABELS[viewAs] ?? viewAs}
            </span>
            {viewAsUser && (
              <span className="hidden sm:inline text-amber-500/70 text-xs truncate">
                — {viewAsUser.role === "INFLUENCER_ADMIN" ? "Influenciador" : "Membro"}
              </span>
            )}
            <button
              onClick={() => { setViewAs(null); setViewAsUser(null); router.push("/dashboard"); }}
              className="ml-auto flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1 rounded-lg transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="hidden sm:inline">Voltar ao normal</span>
              <span className="sm:hidden">Voltar</span>
            </button>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <ViewAsContext.Provider value={{
            viewAs,
            viewAsUser,
            effectiveRole:
              viewAs === "MEMBER_PAID" || viewAs === "MEMBER_UNPAID"
                ? "COMMUNITY_MEMBER"
                : viewAs === "INFLUENCER" || viewAs === "INFLUENCER_ADMIN"
                ? "INFLUENCER_ADMIN"
                : viewAsUser?.role ?? "",
            effectiveName: viewAsUser?.name ?? userName,
            effectiveHasPlatform:
              viewAs === "MEMBER_PAID" ? true
              : viewAs === "MEMBER_UNPAID" ? false
              : viewAs === "INFLUENCER" || viewAs === "INFLUENCER_ADMIN" ? true
              : viewAsUser != null ? viewAsUser.hasPlatform
              : false,
          }}>
            {children}
          </ViewAsContext.Provider>
          </div>
        </div>
      </main>
    </div>
  );
}
