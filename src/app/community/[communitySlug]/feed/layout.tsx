"use client";

// =============================================================================
// Community Feed Layout — wraps all /community/[slug]/feed/* routes
// Has its own header + space sidebar, separate from the dashboard layout
// =============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Hash, Menu, X, Users, Trophy } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface Space {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  type?: string | null;
}

interface Community {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor: string;
  memberCount?: number;
  shortDescription?: string | null;
}

export default function CommunityFeedLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const communitySlug = params.communitySlug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [userName, setUserName] = useState("");
  const [userInitials, setUserInitials] = useState("U");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    const name = localStorage.getItem("detailhub_user_name") ?? "";
    setUserName(name);
    setUserInitials(
      name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase() || "U"
    );

    if (!token) {
      router.push(`/login?redirect=/community/${communitySlug}/feed`);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    fetch("/api/communities?published=true", { headers })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const found = (d.communities as Community[]).find((c) => c.slug === communitySlug);
          if (found) {
            setCommunity(found);
            return fetch(`/api/communities/${found.id}/spaces`, { headers })
              .then((r) => r.json())
              .then((sd) => { if (sd.success) setSpaces(sd.data ?? []); });
          }
        }
      })
      .catch(console.error);
  }, [communitySlug, router]);

  // Active space slug from pathname: /community/[slug]/feed/[spaceSlug]
  const activeSpaceSlug = pathname.split(`/community/${communitySlug}/feed/`)[1]?.split("/")[0] ?? "";

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#F0EEFF] border-r border-gray-200">
      {/* Community header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-gray-200 flex-shrink-0">
        {community?.logoUrl ? (
          <img
            src={community.logoUrl}
            alt={community.name}
            className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-gray-900 flex-shrink-0"
            style={{ backgroundColor: community?.primaryColor ?? "#8B5CF6" }}
          >
            {community?.name.charAt(0) ?? "C"}
          </div>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-gray-900 text-sm truncate leading-tight">
            {community?.name ?? "Comunidade"}
          </span>
          {community?.memberCount != null && (
            <span className="text-[10px] text-gray-500">
              {community.memberCount.toLocaleString("pt-BR")} membros
            </span>
          )}
        </div>
      </div>

      {/* Spaces nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 px-2 mb-2">
          Canais
        </p>
        {spaces.length === 0 && (
          <p className="text-xs text-gray-600 px-2 py-2">Nenhum canal</p>
        )}
        {spaces.map((space) => {
          const href = `/community/${communitySlug}/feed/${space.slug}`;
          const isActive = space.slug === activeSpaceSlug;
          return (
            <Link
              key={space.id}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={[
                "flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-all group",
                isActive
                  ? "bg-violet-500/20 text-violet-300 font-medium"
                  : "text-gray-400 hover:bg-violet-50 hover:text-gray-700",
              ].join(" ")}
            >
              {space.icon ? (
                <span className="text-base leading-none w-4 text-center flex-shrink-0">
                  {space.icon}
                </span>
              ) : (
                <Hash
                  className={[
                    "w-4 h-4 flex-shrink-0",
                    isActive ? "text-violet-400" : "text-gray-600 group-hover:text-gray-400",
                  ].join(" ")}
                />
              )}
              <span className="truncate">{space.name}</span>
            </Link>
          );
        })}

        {/* Extra links */}
        <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col gap-0.5">
          <Link
            href={`/community/${communitySlug}/members`}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-400 hover:bg-violet-50 hover:text-gray-700 transition-all"
          >
            <Users className="w-4 h-4 text-gray-600" />
            <span>Membros</span>
          </Link>
          <Link
            href={`/community/${communitySlug}/leaderboard`}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-400 hover:bg-violet-50 hover:text-gray-700 transition-all"
          >
            <Trophy className="w-4 h-4 text-gray-600" />
            <span>Leaderboard</span>
          </Link>
        </div>
      </nav>

      {/* Back to dashboard */}
      <div className="p-3 border-t border-gray-200 flex-shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-600 hover:bg-violet-50 transition-all"
        >
          <span className="text-gray-600">←</span>
          Dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col fixed h-full z-30">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-56 z-50 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-500 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="h-14 bg-[#F0EEFF]/80 border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0 sticky top-0 z-20 backdrop-blur-sm">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-400 hover:text-gray-900 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo → dashboard */}
          <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <Logo size="sm" />
            <span className="hidden sm:block text-gray-900 font-bold text-sm">DetailHub</span>
          </Link>

          <span className="text-gray-600 text-sm hidden sm:block">/</span>
          <span className="text-gray-400 text-sm truncate hidden sm:block max-w-[200px]">
            {community?.name ?? communitySlug}
          </span>

          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <Link
              href="/dashboard/settings"
              className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xs hover:opacity-90 transition-opacity"
              title={userName}
            >
              {userInitials}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
