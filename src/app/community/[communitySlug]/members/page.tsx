"use client";

// =============================================================================
// Community Members Directory — searchable list of active members + ranking sub-tab
// Uses GET /api/communities/[id]/members (paginated)
// Uses GET /api/communities/[id]/leaderboard for ranking tab
// Unified layout with CommunityHeader + CommunityTabs
// =============================================================================

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, Users, Award, Trophy, MapPin, Wifi, Clock, Tag, X, ArrowLeft } from "lucide-react";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunityTabs } from "@/components/community/CommunityTabs";
import { LeaderboardRow } from "@/components/gamification/LeaderboardRow";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { STORAGE_KEYS } from "@/lib/constants";

interface MemberUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  profile?: {
    bio?: string | null;
  } | null;
  badges?: { badge: { name: string; icon: string; color: string } }[];
  points?: { points: number; level: number }[];
}

interface Member {
  id: string;
  role: string;
  status: string;
  joinedAt: string;
  user: MemberUser;
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

interface LeaderboardEntry {
  userId?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  } | null;
  points: number;
  level: number;
}

type ActiveTab = "membros" | "ranking";
type Period = "all" | "month" | "week";
type FilterChip = "recent" | null;

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "all", label: "Geral" },
  { value: "month", label: "Mês" },
  { value: "week", label: "Semana" },
];

function MemberCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-full bg-white/10" />
      <div className="h-4 bg-white/10 rounded w-24" />
      <div className="h-3 bg-white/10 rounded w-32" />
    </div>
  );
}

function CommunityMembersPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const communitySlug = params.communitySlug as string;

  const initialTab: ActiveTab =
    searchParams.get("tab") === "ranking" ? "ranking" : "membros";

  const [community, setCommunity] = useState<Community | null>(null);
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [optedIn, setOptedIn] = useState<boolean | null>(null);
  const [optInLoading, setOptInLoading] = useState(false);

  // Filters
  const [filterRecent, setFilterRecent] = useState(false);
  const [filterLocation, setFilterLocation] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [rankingPeriod, setRankingPeriod] = useState<Period>("all");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  const fetchMembers = useCallback(
    async (communityId: string, pageNum: number) => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch(
        `/api/communities/${communityId}/members?page=${pageNum}&pageSize=20&status=ACTIVE`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json.success) {
        setMembers(json.data ?? []);
        setTotalPages(json.pagination?.totalPages ?? 1);
      }
    },
    []
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const headers = { Authorization: `Bearer ${token ?? ""}` };

        const overviewRes = await fetch(`/api/communities/${communitySlug}/overview`, {
          headers,
        });
        const overviewJson = overviewRes.ok ? await overviewRes.json() : { success: false };

        if (!overviewJson.success) {
          setError("Comunidade não encontrada.");
          return;
        }

        const found: Community = overviewJson.data.community;
        setCommunity(found);
        if (overviewJson.data.influencer) setInfluencer(overviewJson.data.influencer);

        // Fetch opt-in status in parallel with members
        fetch(`/api/communities/${found.id}/join`, { headers })
          .then((r) => r.json())
          .then((jd) => {
            if (jd.success) setOptedIn(jd.data?.joined ?? false);
          })
          .catch(() => {});

        await fetchMembers(found.id, 1);
      } catch {
        setError("Erro de conexão.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [communitySlug, fetchMembers]);

  // Fetch leaderboard when switching to ranking tab or period changes
  useEffect(() => {
    if (!community || activeTab !== "ranking") return;

    setRankingLoading(true);
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    fetch(
      `/api/communities/${community.id}/leaderboard?period=${rankingPeriod}&limit=50`,
      { headers: { Authorization: `Bearer ${token ?? ""}` } }
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setLeaderboard(d.data ?? []);
      })
      .catch(() => {})
      .finally(() => setRankingLoading(false));
  }, [community, activeTab, rankingPeriod]);

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

  const filtered = members.filter((m) => {
    if (search) {
      const name = `${m.user.firstName} ${m.user.lastName}`.toLowerCase();
      if (!name.includes(search.toLowerCase())) return false;
    }
    if (filterRecent) {
      const days = m.joinedAt
        ? Math.floor((Date.now() - new Date(m.joinedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      if (days > 30) return false;
    }
    if (filterLocation) {
      const bio = (m.user.profile?.bio ?? "").toLowerCase();
      if (!bio.includes(filterLocation.toLowerCase())) return false;
    }
    if (filterTag) {
      const hasBadge = m.user.badges?.some((b) =>
        b.badge.name.toLowerCase().includes(filterTag.toLowerCase())
      );
      if (!hasBadge) return false;
    }
    return true;
  });

  async function changePage(newPage: number) {
    if (!community) return;
    setPage(newPage);
    await fetchMembers(community.id, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="text-[#EEE6E4]">
      {/* Mobile top bar */}
      <header className="h-14 bg-[#1A1A1A]/90 border-b border-white/8 flex items-center px-4 gap-3 sticky top-0 z-30 backdrop-blur-sm md:hidden">
        <Link href="/inicio" className="flex items-center gap-1.5 text-gray-400 hover:text-[#EEE6E4] transition-colors shrink-0 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-medium">Início</span>
        </Link>
        <span className="text-sm font-semibold text-[#EEE6E4] truncate flex-1 min-w-0">
          {community?.name ?? "Comunidade"}
        </span>
        <NotificationBell />
      </header>

      {community && (
        <>
          <CommunityHeader
            community={community}
            influencer={influencer}
            optedIn={optedIn}
            onOptIn={handleOptIn}
            optInLoading={optInLoading}
          />
          <CommunityTabs
            communitySlug={communitySlug}
            primaryColor={community.primaryColor}
            hasLive={false}
          />
        </>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Sub-tabs */}
        <div className="border-b border-white/8 mb-6">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab("membros")}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "membros"
                  ? "text-[#EEE6E4] border-[#009CD9]"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              Membros
            </button>
            <button
              onClick={() => setActiveTab("ranking")}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "ranking"
                  ? "text-[#EEE6E4] border-[#009CD9]"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              Ranking
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Membros tab */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "membros" && (
          <>
            {/* Header */}
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-[#EEE6E4] flex items-center gap-2 mb-1">
                <Users className="w-6 h-6 text-[#009CD9]" />
                Encontrar membros
              </h1>
              <p className="text-gray-400 text-sm">Conheça quem faz parte desta comunidade.</p>
            </div>

            {/* Search + filters */}
            <div className="space-y-3 mb-6">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-[#EEE6E4] placeholder-gray-400 text-sm focus:outline-none focus:border-[#009CD9] transition-all"
                />
              </div>

              {/* Filter chips */}
              <div className="flex flex-wrap gap-2">
                {/* Entrou recentemente */}
                <button
                  onClick={() => setFilterRecent((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    filterRecent
                      ? "bg-[#006079] border-[#006079] text-white"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-[#006079]/40 hover:text-gray-300"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Entrou recentemente
                  {filterRecent && (
                    <X className="w-3 h-3 ml-0.5" onClick={(e) => { e.stopPropagation(); setFilterRecent(false); }} />
                  )}
                </button>

                {/* Localidade */}
                <div className="relative">
                  {filterLocation ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border bg-[#006079] border-[#006079] text-white">
                      <MapPin className="w-3.5 h-3.5" />
                      {filterLocation}
                      <button onClick={() => { setFilterLocation(""); }} className="ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="📍 Localidade"
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-gray-400 placeholder-gray-500 text-xs focus:outline-none focus:border-[#009CD9] transition-all w-36"
                    />
                  )}
                </div>

                {/* Tag */}
                {filterTag ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border bg-[#006079] border-[#006079] text-white">
                    <Tag className="w-3.5 h-3.5" />
                    {filterTag}
                    <button onClick={() => setFilterTag("")} className="ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : showTagInput ? (
                  <input
                    type="text"
                    placeholder="Tag..."
                    autoFocus
                    onBlur={() => setShowTagInput(false)}
                    onChange={(e) => { setFilterTag(e.target.value); if (e.target.value) setShowTagInput(false); }}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-gray-400 placeholder-gray-500 text-xs focus:outline-none focus:border-[#009CD9] transition-all w-28"
                  />
                ) : (
                  <button
                    onClick={() => setShowTagInput(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border bg-white/5 border-white/10 text-gray-400 hover:border-[#006079]/40 hover:text-gray-300 transition-all"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Tag
                  </button>
                )}

                {/* Clear all */}
                {(filterRecent || filterLocation || filterTag) && (
                  <button
                    onClick={() => { setFilterRecent(false); setFilterLocation(""); setFilterTag(""); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <MemberCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-16 text-center">
                <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">
                  {search ? "Nenhum membro encontrado." : "Nenhum membro ativo ainda."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.map((member) => {
                    const fullName = `${member.user.firstName} ${member.user.lastName}`;
                    const initials = `${member.user.firstName?.[0] ?? ""}${member.user.lastName?.[0] ?? ""}`.toUpperCase();
                    const totalPoints =
                      member.user.points?.reduce((acc, p) => acc + p.points, 0) ?? 0;
                    const level = member.user.points?.[0]?.level;
                    const badges = member.user.badges?.slice(0, 3) ?? [];
                    const joinedDays = member.joinedAt
                      ? Math.floor(
                          (Date.now() - new Date(member.joinedAt).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : null;
                    const roleLabel =
                      member.role === "ADMIN"
                        ? "Admin"
                        : member.role === "MODERATOR"
                        ? "Mod"
                        : null;

                    return (
                      <Link
                        key={member.id}
                        href={`/community/${communitySlug}/members/${member.user.id}`}
                        className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col items-center text-center gap-2 hover:bg-white/10 hover:border-[#006079]/40 transition-all group"
                      >
                        {/* Avatar */}
                        {member.user.avatarUrl ? (
                          <Image
                            src={member.user.avatarUrl}
                            alt={fullName}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white font-bold text-lg">
                            {initials}
                          </div>
                        )}

                        {/* Name */}
                        <p className="text-[#EEE6E4] font-semibold text-sm group-hover:text-[#009CD9] transition-colors leading-tight line-clamp-1 w-full">
                          {fullName}
                        </p>

                        {/* Role / Level badges */}
                        {(roleLabel || level != null) && (
                          <div className="flex items-center gap-1 flex-wrap justify-center">
                            {roleLabel && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-[#006079]/20 text-[#009CD9] rounded-full font-medium">
                                {roleLabel}
                              </span>
                            )}
                            {level != null && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full font-medium">
                                Nível {level}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bio truncada */}
                        {member.user.profile?.bio && (
                          <p className="text-gray-400 text-xs line-clamp-1 w-full">
                            {member.user.profile.bio}
                          </p>
                        )}

                        {/* Joined days */}
                        {joinedDays != null && (
                          <p className="text-[10px] text-gray-500">
                            Membro há{" "}
                            {joinedDays === 0
                              ? "menos de 1 dia"
                              : `${joinedDays} dia${joinedDays !== 1 ? "s" : ""}`}
                          </p>
                        )}

                        {/* Badges row */}
                        {badges.length > 0 && (
                          <div className="flex items-center gap-1 justify-center">
                            {badges.map((b, i) => (
                              <span key={i} className="text-sm" title={b.badge.name}>
                                {b.badge.icon}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Points */}
                        {totalPoints > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                            <Award className="w-3 h-3" />
                            {totalPoints.toLocaleString("pt-BR")} pts
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && !search && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      disabled={page === 1}
                      onClick={() => changePage(page - 1)}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:bg-white/10 disabled:opacity-40 transition-all"
                    >
                      &larr; Anterior
                    </button>
                    <span className="text-sm text-gray-400">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => changePage(page + 1)}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:bg-white/10 disabled:opacity-40 transition-all"
                    >
                      Próxima &rarr;
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Ranking tab */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "ranking" && (
          <>
            {/* Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-500/15 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#EEE6E4]">Ranking</h1>
                <p className="text-gray-400 text-sm mt-0.5">
                  {community?.name} — pontuação acumulada
                </p>
              </div>
            </div>

            {/* Period filter */}
            <div className="flex gap-2 mb-6">
              {PERIOD_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setRankingPeriod(value)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    rankingPeriod === value
                      ? "bg-[#006079] text-white shadow-lg shadow-[#006079]/20"
                      : "bg-white/5 border border-white/10 text-gray-400 hover:text-[#EEE6E4] hover:border-[#006079]/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Leaderboard rows */}
            <div className="space-y-2">
              {rankingLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
                ))
              ) : leaderboard.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-16 text-center">
                  <Trophy className="w-10 h-10 text-yellow-400/40 mx-auto mb-3" />
                  <p className="text-[#EEE6E4] font-semibold mb-1">
                    Nenhum ranking ainda
                  </p>
                  <p className="text-gray-400 text-sm">
                    Seja o primeiro a acumular pontos nesta comunidade!
                  </p>
                </div>
              ) : (
                leaderboard.map((entry, index) => {
                  const user = entry.user;
                  if (!user) return null;
                  return (
                    <LeaderboardRow
                      key={user.id}
                      rank={index + 1}
                      user={user}
                      points={entry.points}
                      level={entry.level ?? 1}
                    />
                  );
                })
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function CommunityMembersPage() {
  return (
    <Suspense>
      <CommunityMembersPageInner />
    </Suspense>
  );
}
