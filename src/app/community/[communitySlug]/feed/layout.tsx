"use client";

// =============================================================================
// Community Feed Layout — redesigned with banner sidebar + color header
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Hash, Menu, X, Users, Trophy, UserPlus, UserCheck,
  Loader2, ChevronRight, LayoutDashboard, BookOpen,
} from "lucide-react";
import { LogoType } from "@/components/ui/logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { STORAGE_KEYS } from "@/lib/constants";
import { ChatWidget } from "@/components/community/ChatWidget";

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
  bannerUrl?: string | null;
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
  const [optedIn, setOptedIn] = useState<boolean | null>(null);
  const [optInLoading, setOptInLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const name = localStorage.getItem(STORAGE_KEYS.USER_NAME) ?? "";
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
            Promise.all([
              fetch(`/api/communities/${found.id}/spaces`, { headers }).then((r) => r.json()),
              fetch(`/api/communities/${found.id}/join`, { headers }).then((r) => r.json()),
            ]).then(([sd, jd]) => {
              if (sd.success) setSpaces(sd.data ?? []);
              if (jd.success) setOptedIn(jd.data?.joined ?? false);
            });
          }
        }
      })
      .catch(console.error);
  }, [communitySlug, router]);

  const handleOptIn = useCallback(async () => {
    if (!community) return;
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    setOptInLoading(true);
    try {
      const method = optedIn ? "DELETE" : "POST";
      const res = await fetch(`/api/communities/${community.id}/join`, {
        method,
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      const d = await res.json();
      if (d.success) setOptedIn(d.data.joined);
    } catch {
      // ignore
    } finally {
      setOptInLoading(false);
    }
  }, [community, optedIn]);

  const activeSpaceSlug =
    pathname.split(`/community/${communitySlug}/feed/`)[1]?.split("/")[0] ?? "";

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#181818] border-r border-white/8">

      {/* ── Community banner header ── */}
      <div className="relative flex-shrink-0 overflow-hidden" style={{ minHeight: "80px" }}>
        {community?.bannerUrl ? (
          <>
            <Image
              src={community.bannerUrl}
              alt={community.name ?? ""}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-[#181818]" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: community
                ? `linear-gradient(135deg, ${community.primaryColor}50 0%, ${community.primaryColor}10 100%)`
                : "linear-gradient(135deg, #006079 0%, #003344 100%)",
            }}
          />
        )}

        {/* Logo + name over banner */}
        <div className="relative p-3 pt-4 flex items-end gap-2.5 h-20">
          {community?.logoUrl ? (
            <Image
              src={community.logoUrl}
              alt={community.name ?? ""}
              width={32}
              height={32}
              className="w-8 h-8 rounded-xl object-cover border-2 border-[#181818] shadow-lg flex-shrink-0"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-[#EEE6E4] flex-shrink-0 border-2 border-[#181818] shadow-lg"
              style={{ backgroundColor: community?.primaryColor ?? "#007A99" }}
            >
              {community?.name?.charAt(0) ?? "C"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[#EEE6E4] text-sm truncate leading-tight drop-shadow">
              {community?.name ?? "Comunidade"}
            </p>
            {community?.memberCount != null && (
              <p className="text-[10px] text-gray-300/80 drop-shadow">
                {community.memberCount.toLocaleString("pt-BR")} membros
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Spaces nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-600 px-2 mb-2">
          Canais
        </p>

        {spaces.filter((s) => s.type !== "COURSE").length === 0 && (
          <p className="text-xs text-gray-600 px-2 py-2">Nenhum canal disponível</p>
        )}

        {spaces.filter((s) => s.type !== "COURSE").slice(0, 3).map((space) => {
          const href = `/community/${communitySlug}/feed/${space.slug}`;
          const isActive = space.slug === activeSpaceSlug;
          return (
            <Link
              key={space.id}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={[
                "flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm transition-all group relative",
                isActive
                  ? "text-[#EEE6E4] font-medium"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5",
              ].join(" ")}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{ backgroundColor: community?.primaryColor ?? "#009CD9" }}
                />
              )}
              {/* Active bg */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-xl opacity-10"
                  style={{ backgroundColor: community?.primaryColor ?? "#009CD9" }}
                />
              )}

              <span className="relative flex items-center gap-2 w-full">
                {space.icon ? (
                  <span className="text-base leading-none w-4 text-center flex-shrink-0">
                    {space.icon}
                  </span>
                ) : (
                  <Hash
                    className={[
                      "w-4 h-4 flex-shrink-0 transition-colors",
                      isActive
                        ? "text-[#EEE6E4]"
                        : "text-gray-600 group-hover:text-gray-400",
                    ].join(" ")}
                  />
                )}
                <span className="truncate">{space.name}</span>
              </span>
            </Link>
          );
        })}

        {/* ── Opt-in button ── */}
        {optedIn !== null && (
          <div className="mt-4 px-1 space-y-1.5">
            <button
              onClick={handleOptIn}
              disabled={optInLoading}
              className={[
                "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                optedIn
                  ? "bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 border border-white/10 hover:border-red-500/30"
                  : "text-white border border-transparent hover:opacity-90",
              ].join(" ")}
              style={!optedIn ? { backgroundColor: community?.primaryColor ?? "#006079" } : {}}
            >
              {optInLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : optedIn ? (
                <UserCheck className="w-3.5 h-3.5" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              {optedIn ? "Seguindo esta comunidade" : "Seguir esta comunidade"}
            </button>
            {!optedIn && (
              <p className="text-[10px] text-gray-600 text-center px-1 leading-relaxed">
                Apareça no ranking e mostre sua participação ativa
              </p>
            )}
          </div>
        )}

        {/* ── Extra nav links ── */}
        <div className="mt-4 pt-3 border-t border-white/8 flex flex-col gap-0.5">
          <Link
            href={`/community/${communitySlug}/trilhas`}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-all"
          >
            <BookOpen className="w-4 h-4 text-gray-600" />
            <span>Trilhas</span>
          </Link>
          <Link
            href={`/community/${communitySlug}/members`}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-all"
          >
            <Users className="w-4 h-4 text-gray-600" />
            <span>Membros</span>
          </Link>
          <Link
            href={`/community/${communitySlug}/leaderboard`}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-all"
          >
            <Trophy className="w-4 h-4 text-gray-600" />
            <span>Leaderboard</span>
          </Link>
        </div>
      </nav>

      {/* ── Back to dashboard ── */}
      <div className="p-3 border-t border-white/8 flex-shrink-0">
        <Link
          href="/inicio"
          className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-all"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Início
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col fixed h-full z-30">
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
        className={`md:hidden fixed top-0 left-0 h-full w-60 z-50 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-[#EEE6E4] p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <Sidebar />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">

        {/* Top header */}
        <header className="h-14 bg-[#1A1A1A]/90 border-b border-white/8 flex items-center px-4 gap-3 flex-shrink-0 sticky top-0 z-20 backdrop-blur-sm">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-400 hover:text-[#EEE6E4] transition-colors p-1"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <Link href="/inicio" className="flex items-center flex-shrink-0">
            <LogoType height={18} variant="light" />
          </Link>

          <ChevronRight className="w-3.5 h-3.5 text-gray-600 hidden sm:block" />
          <Link
            href={`/community/${communitySlug}/feed`}
            className="text-gray-400 hover:text-[#EEE6E4] text-sm truncate hidden sm:block max-w-[160px] transition-colors font-medium"
          >
            {community?.name ?? communitySlug}
          </Link>

          {activeSpaceSlug && spaces.length > 0 && (() => {
            const activeSpace = spaces.find((s) => s.slug === activeSpaceSlug);
            return activeSpace ? (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600 hidden sm:block flex-shrink-0" />
                <span className="text-[#EEE6E4] text-sm truncate hidden sm:block max-w-[140px] font-medium">
                  {activeSpace.icon ? `${activeSpace.icon} ` : "#"}{activeSpace.name}
                </span>
              </>
            ) : null;
          })()}

          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <Link
              href="/dashboard/settings"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-lg"
              style={{ background: `linear-gradient(135deg, #006079, #009CD9)` }}
              title={userName}
            >
              {userInitials}
            </Link>
          </div>
        </header>

        {/* ── Community accent strip (below header, above content) ── */}
        {community && (
          <div
            className="h-0.5 flex-shrink-0"
            style={{ background: `linear-gradient(90deg, ${community.primaryColor}, ${community.primaryColor}00)` }}
          />
        )}

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Chat widget */}
      {community && (() => {
        const activeSpace = activeSpaceSlug ? spaces.find((s) => s.slug === activeSpaceSlug) : null;
        return activeSpace ? (
          <ChatWidget
            communityId={community.id}
            spaceId={activeSpace.id}
            label={`Chat: ${activeSpace.name}`}
          />
        ) : (
          <ChatWidget communityId={community.id} />
        );
      })()}
    </div>
  );
}
