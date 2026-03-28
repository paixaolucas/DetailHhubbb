"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Users,
  BookOpen,
  Video,
  UserCheck,
  Compass,
} from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExploreCommunity {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string;
  memberCount: number;
  /** ISO date string returned by the API */
  createdAt: string;
  isMember: boolean;
  /** Derived client-side: true when community was created within the last 30 days */
  isNew: boolean;
  influencer: {
    displayName: string;
    user: { firstName: string; lastName: string; avatarUrl: string | null } | null;
  } | null;
  livesCount?: number;
  moduleSpaceCount?: number;
}

type SortOption = "popular" | "new" | "active";

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-[#151515] border border-white/[0.08] rounded-2xl overflow-hidden animate-pulse">
      <div className="h-32 bg-white/10" />
      <div className="p-4 space-y-3">
        <div className="h-10 w-10 bg-white/10 rounded-xl -mt-6 mb-3" />
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
        <div className="h-3 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/10 rounded w-2/3" />
        <div className="h-9 bg-white/10 rounded-xl mt-1" />
      </div>
    </div>
  );
}

// ─── Community card ───────────────────────────────────────────────────────────

function ExploreCard({ c }: { c: ExploreCommunity }) {
  const influencerName =
    c.influencer?.displayName ||
    (c.influencer?.user
      ? `${c.influencer.user.firstName} ${c.influencer.user.lastName}`.trim()
      : null);

  const logoFallbackGradient = {
    background: `linear-gradient(135deg, ${c.primaryColor} 0%, ${c.primaryColor}99 100%)`,
  };

  return (
    <div className="bg-[#151515] border border-white/[0.08] rounded-2xl overflow-hidden group hover:border-white/20 transition-all duration-200">
      {/* Banner */}
      <div className="relative h-32 bg-[#111] overflow-hidden">
        {c.bannerUrl ? (
          <Image
            src={c.bannerUrl}
            alt={`Banner de ${c.name}`}
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={logoFallbackGradient}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />

        {/* isNew badge */}
        {c.isNew && (
          <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 bg-[#009CD9]/20 text-[#009CD9] border border-[#009CD9]/30 rounded-full font-medium">
            Novo
          </span>
        )}

        {/* isMember badge */}
        {c.isMember && (
          <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 bg-[#006079]/30 text-[#009CD9] border border-[#006079]/40 rounded-full font-medium flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            Seguindo
          </span>
        )}
      </div>

      {/* Logo overlapping banner */}
      <div className="px-4 -mt-6 relative z-10 mb-3">
        {c.logoUrl ? (
          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[#151515] flex-shrink-0">
            <Image
              src={c.logoUrl}
              alt={`Logo de ${c.name}`}
              width={48}
              height={48}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className="w-12 h-12 rounded-xl border-2 border-[#151515] flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={logoFallbackGradient}
          >
            {c.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <h3 className="text-base font-bold text-[#EEE6E4] mb-0.5 truncate">
          {c.name}
        </h3>

        {influencerName && (
          <p className="text-xs text-gray-500 mb-2">
            por{" "}
            <span style={{ color: c.primaryColor }}>{influencerName}</span>
          </p>
        )}

        {c.shortDescription && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">
            {c.shortDescription}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-3 flex-wrap">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {c.memberCount.toLocaleString("pt-BR")}
          </span>
          {(c.moduleSpaceCount ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {c.moduleSpaceCount} trilha{c.moduleSpaceCount !== 1 ? "s" : ""}
            </span>
          )}
          {(c.livesCount ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3" />
              {c.livesCount} live{c.livesCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/community/${c.slug}/feed`}
          className={`block w-full text-center text-sm font-semibold py-2 rounded-xl transition-all ${
            c.isMember
              ? "bg-white/5 border border-white/10 text-gray-300 hover:text-[#EEE6E4] hover:bg-white/10"
              : "text-white hover:opacity-90"
          }`}
          style={!c.isMember ? { backgroundColor: c.primaryColor } : undefined}
        >
          {c.isMember ? "Acessar" : "Ver comunidade"}
        </Link>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const SORT_TABS: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Populares" },
  { value: "new", label: "Novidades" },
  { value: "active", label: "Mais ativas" },
];

export default function ExplorarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSort = (searchParams.get("sort") as SortOption) ?? "popular";
  const initialSearch = searchParams.get("search") ?? "";

  const [communities, setCommunities] = useState<ExploreCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [sort, setSort] = useState<SortOption>(initialSort);

  // ─── Debounce search ───────────────────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ─── Fetch communities ─────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        : null;

    const params = new URLSearchParams({ view: "explore", sort });
    if (debouncedSearch) params.set("search", debouncedSearch);

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    fetch(`/api/communities?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token ?? ""}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const raw: Omit<ExploreCommunity, "isNew">[] = d.communities ?? [];
          setCommunities(
            raw.map((c) => ({
              ...c,
              isNew: new Date(c.createdAt).getTime() >= thirtyDaysAgo,
            }))
          );
        }
      })
      .catch(() => {
        // Silently fail — communities remain empty
      })
      .finally(() => setLoading(false));
  }, [sort, debouncedSearch]);

  // ─── Sync URL params (shallow) ─────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams();
    if (sort !== "popular") params.set("sort", sort);
    if (debouncedSearch) params.set("search", debouncedSearch);
    const qs = params.toString();
    router.replace(qs ? `/explorar?${qs}` : "/explorar", { scroll: false });
  }, [sort, debouncedSearch, router]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main>
      {/* Hero / controls */}
      <div className="px-4 pt-8 pb-6 max-w-5xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-bold text-[#EEE6E4] mb-1">Explorar</h1>
        <p className="text-gray-400 mb-6 text-sm">
          Descubra comunidades automotivas e mergulhe no conhecimento.
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar comunidade..."
            aria-label="Buscar comunidade"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[#EEE6E4] placeholder-gray-500 text-sm focus:outline-none focus:border-[#009CD9] transition-colors"
          />
        </div>

        {/* Sort tabs */}
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Ordenação">
          {SORT_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              aria-pressed={sort === value}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                sort === value
                  ? "bg-[#006079] text-white"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-[#EEE6E4] hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : communities.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <Compass className="w-12 h-12 text-gray-600 mb-4" strokeWidth={1.5} />
            <p className="text-[#EEE6E4] font-semibold mb-1">
              Nenhuma comunidade encontrada
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Tente outro termo ou explore sem filtros.
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-[#EEE6E4] hover:bg-white/10 transition-all"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {communities.map((c) => (
              <ExploreCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
