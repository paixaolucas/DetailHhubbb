"use client";

// =============================================================================
// Community Members Directory — searchable list of active members
// Uses GET /api/communities/[id]/members (paginated)
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, Users, ArrowLeft, Award } from "lucide-react";
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
  primaryColor: string;
}

function MemberCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse flex items-center gap-4">
      <div className="w-12 h-12 bg-white/10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-32" />
        <div className="h-3 bg-white/10 rounded w-48" />
      </div>
    </div>
  );
}

export default function CommunityMembersPage() {
  const params = useParams();
  const communitySlug = params.communitySlug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        // Find community by slug
        const mineRes = await fetch("/api/communities/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mineJson = await mineRes.json();
        let found: Community | null = null;
        if (mineJson.success && Array.isArray(mineJson.data)) {
          found = mineJson.data.find((c: Community) => c.slug === communitySlug) ?? null;
        }

        // Fallback: fetch all public communities
        if (!found) {
          const allRes = await fetch("/api/communities?pageSize=100");
          const allJson = await allRes.json();
          if (allJson.success) {
            found = (allJson.communities ?? []).find(
              (c: Community) => c.slug === communitySlug
            ) ?? null;
          }
        }

        if (!found) {
          setError("Comunidade não encontrada.");
          return;
        }

        setCommunity(found);
        await fetchMembers(found.id, 1);
      } catch {
        setError("Erro de conexão.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [communitySlug, fetchMembers]);

  const filtered = members.filter((m) => {
    if (!search) return true;
    const name = `${m.user.firstName} ${m.user.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  async function changePage(newPage: number) {
    if (!community) return;
    setPage(newPage);
    await fetchMembers(community.id, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#EEE6E4]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1A1A1A]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href={`/community/${communitySlug}/feed`}
            className="p-1.5 text-gray-400 hover:text-[#EEE6E4] hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          {community?.logoUrl ? (
            <Image src={community.logoUrl} alt={community.name} width={28} height={28} className="w-7 h-7 rounded-lg object-cover" />
          ) : (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-[#EEE6E4]"
              style={{ backgroundColor: community?.primaryColor ?? "#007A99" }}
            >
              {community?.name.charAt(0) ?? "C"}
            </div>
          )}
          <span className="text-sm font-semibold text-[#EEE6E4]">{community?.name}</span>
          <span className="text-gray-400 text-sm">/</span>
          <span className="text-sm text-gray-400">Membros</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Title + search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#EEE6E4] flex items-center gap-2">
              <Users className="w-6 h-6 text-[#009CD9]" />
              Membros
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Conheça quem faz parte desta comunidade.
            </p>
          </div>
          <div className="sm:ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar membro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-[#EEE6E4] placeholder-gray-400 text-sm focus:outline-none focus:border-[#009CD9] w-64 transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <MemberCardSkeleton key={i} />)}
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
            <div className="space-y-3">
              {filtered.map((member) => {
                const fullName = `${member.user.firstName} ${member.user.lastName}`;
                const initials = `${member.user.firstName?.[0] ?? ""}${member.user.lastName?.[0] ?? ""}`.toUpperCase();
                const totalPoints = member.user.points?.reduce((acc, p) => acc + p.points, 0) ?? 0;
                const level = member.user.points?.[0]?.level;
                const badges = member.user.badges?.slice(0, 3) ?? [];
                const joinedDays = member.joinedAt
                  ? Math.floor((Date.now() - new Date(member.joinedAt).getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const roleLabel = member.role === "ADMIN" ? "Admin" : member.role === "MODERATOR" ? "Mod" : null;

                return (
                  <Link
                    key={member.id}
                    href={`/community/${communitySlug}/members/${member.user.id}`}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 hover:border-[#006079]/40 transition-all group"
                  >
                    {/* Avatar */}
                    {member.user.avatarUrl ? (
                      <Image
                        src={member.user.avatarUrl}
                        alt={fullName}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {initials}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[#EEE6E4] font-semibold group-hover:text-[#009CD9] transition-colors truncate">
                          {fullName}
                        </p>
                        {roleLabel && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#006079]/20 text-[#009CD9] rounded-full font-medium flex-shrink-0">
                            {roleLabel}
                          </span>
                        )}
                        {level != null && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full font-medium flex-shrink-0">
                            Nível {level}
                          </span>
                        )}
                      </div>
                      {member.user.profile?.bio && (
                        <p className="text-gray-400 text-xs mt-0.5 truncate">
                          {member.user.profile.bio}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {joinedDays != null && (
                          <span className="text-[10px] text-gray-400">
                            Membro há {joinedDays === 0 ? "menos de 1 dia" : `${joinedDays} dia${joinedDays !== 1 ? "s" : ""}`}
                          </span>
                        )}
                        {badges.length > 0 && (
                          <div className="flex items-center gap-1">
                            {badges.map((b, i) => (
                              <span key={i} className="text-sm" title={b.badge.name}>
                                {b.badge.icon}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Points */}
                    {totalPoints > 0 && (
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-medium flex-shrink-0">
                        <Award className="w-3.5 h-3.5" />
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
      </main>
    </div>
  );
}
