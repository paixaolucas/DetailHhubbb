"use client";

// =============================================================================
// Community Feed Layout — redesigned with CommunityHeader + CommunityTabs
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Hash, Menu, X, ChevronRight, LayoutDashboard, Loader2, ArrowLeft,
} from "lucide-react";
import { LogoType } from "@/components/ui/logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { STORAGE_KEYS } from "@/lib/constants";
import { ChatWidget } from "@/components/community/ChatWidget";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunityTabs } from "@/components/community/CommunityTabs";

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

interface Influencer {
  displayName?: string | null;
  user?: { firstName: string; lastName: string; avatarUrl?: string | null } | null;
}

export default function CommunityFeedLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const communitySlug = params.communitySlug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
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
      name
        .split(" ")
        .slice(0, 2)
        .map((n: string) => n[0])
        .join("")
        .toUpperCase() || "U"
    );

    if (!token) {
      router.push(`/login?redirect=/community/${communitySlug}/feed`);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    fetch(`/api/communities/${communitySlug}/overview`, { headers })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) return;
        const comm: Community = json.data.community;
        setCommunity(comm);
        setSpaces(json.data.spaces ?? []);
        if (json.data.influencer) setInfluencer(json.data.influencer);

        fetch(`/api/communities/${comm.id}/join`, { headers })
          .then((r) => r.json())
          .then((jd) => {
            if (jd.success) setOptedIn(jd.data?.joined ?? false);
          })
          .catch(() => {});
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

  const channelSpaces = spaces.filter((s) => s.type !== "COURSE");

  const SidebarNav = () => (
    <nav className="flex-1 overflow-y-auto py-3 px-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-600 px-2 mb-2">
        Canais
      </p>

      {channelSpaces.length === 0 && (
        <p className="text-xs text-gray-600 px-2 py-2">Nenhum canal disponível</p>
      )}

      {channelSpaces.map((space) => {
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
            {isActive && (
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                style={{ backgroundColor: community?.primaryColor ?? "#009CD9" }}
              />
            )}
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
                    isActive ? "text-[#EEE6E4]" : "text-gray-600 group-hover:text-gray-400",
                  ].join(" ")}
                />
              )}
              <span className="truncate">{space.name}</span>
            </span>
          </Link>
        );
      })}

      {/* Back to home */}
      <div className="mt-4 pt-3 border-t border-white/8">
        <Link
          href="/inicio"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-all"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Início
        </Link>
      </div>
    </nav>
  );

  const activeSpace = activeSpaceSlug
    ? spaces.find((s) => s.slug === activeSpaceSlug)
    : null;

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col">

      {/* Sticky top bar — z-30 */}
      <header className="h-14 bg-[#1A1A1A]/90 border-b border-white/8 flex items-center px-4 gap-3 flex-shrink-0 sticky top-0 z-30 backdrop-blur-sm">

        {/* Mobile: ← Início + nome da comunidade */}
        <div className="flex items-center gap-2 flex-1 min-w-0 md:hidden">
          <Link
            href="/inicio"
            className="flex items-center gap-1.5 text-gray-400 hover:text-[#EEE6E4] transition-colors shrink-0 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5"
            aria-label="Voltar ao início"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Início</span>
          </Link>
          <span className="text-sm font-semibold text-[#EEE6E4] truncate">
            {community?.name ?? "Comunidade"}
          </span>
        </div>

        {/* Mobile: canais + notificações */}
        <div className="flex items-center gap-2 shrink-0 md:hidden">
          <NotificationBell />
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-[#EEE6E4] transition-colors p-1.5 bg-white/5 border border-white/10 rounded-lg"
            aria-label="Ver canais"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop: logo + breadcrumb */}
        <Link href="/inicio" className="hidden md:flex items-center flex-shrink-0">
          <LogoType height={18} variant="light" />
        </Link>

        <ChevronRight className="w-3.5 h-3.5 text-gray-600 hidden md:block" />
        <Link
          href={`/community/${communitySlug}/feed`}
          className="text-gray-400 hover:text-[#EEE6E4] text-sm truncate hidden md:block max-w-[160px] transition-colors font-medium"
        >
          {community?.name ?? communitySlug}
        </Link>

        {activeSpaceSlug && activeSpace && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 hidden md:block flex-shrink-0" />
            <span className="text-[#EEE6E4] text-sm truncate hidden md:block max-w-[140px] font-medium">
              {activeSpace.icon ? `${activeSpace.icon} ` : "#"}
              {activeSpace.name}
            </span>
          </>
        )}

        {/* Desktop: notificações + avatar */}
        <div className="ml-auto hidden md:flex items-center gap-3">
          <NotificationBell />
          <Link
            href="/dashboard/settings"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-lg"
            style={{ background: "linear-gradient(135deg, #006079, #009CD9)" }}
            title={userName}
            aria-label="Configurações da conta"
          >
            {userInitials}
          </Link>
        </div>
      </header>

      {/* Community hero */}
      {community ? (
        <CommunityHeader
          community={community}
          influencer={influencer}
          optedIn={optedIn}
          onOptIn={handleOptIn}
          optInLoading={optInLoading}
        />
      ) : (
        /* Skeleton for banner + info bar */
        <div className="flex-shrink-0">
          <div className="h-28 md:h-40 bg-white/5 animate-pulse" />
          <div className="bg-[#151515] border-b border-white/8 px-4 md:px-6 py-3">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 -mt-10 bg-white/10 rounded-2xl animate-pulse flex-shrink-0" />
              <div className="flex-1 pb-1 space-y-2">
                <div className="h-5 bg-white/10 rounded w-48 animate-pulse" />
                <div className="h-3 bg-white/10 rounded w-32 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab navigation — z-20 */}
      <CommunityTabs
        communitySlug={communitySlug}
        primaryColor={community?.primaryColor}
      />

      {/* Two-column body */}
      <div className="flex flex-1">

        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-48 flex-col border-r border-white/8 bg-[#181818] flex-shrink-0">
          <SidebarNav />
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile sidebar drawer */}
        <aside
          className={`md:hidden fixed top-0 left-0 h-full w-56 z-50 flex flex-col bg-[#181818] border-r border-white/8 transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-3 border-b border-white/8">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {community?.name ?? "Canais"}
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-[#EEE6E4] p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <SidebarNav />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>

      {/* Chat widget */}
      {community && (
        optInLoading ? null : activeSpace ? (
          <ChatWidget
            communityId={community.id}
            spaceId={activeSpace.id}
            label={`Chat: ${activeSpace.name}`}
          />
        ) : (
          <ChatWidget communityId={community.id} />
        )
      )}

      {/* Inline loading indicator while community loads */}
      {!community && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-[#151515] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
          <Loader2 className="w-4 h-4 animate-spin text-[#009CD9]" />
          <span className="text-xs text-gray-400">Carregando...</span>
        </div>
      )}
    </div>
  );
}
