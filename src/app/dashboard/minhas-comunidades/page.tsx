"use client";

// =============================================================================
// MEMBER — MINHAS COMUNIDADES
// Shows all communities: active ones in color, others greyed out with lock icon
// =============================================================================

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users, Lock, CheckCircle, Search, BookOpen, Video } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";

type Community = {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  memberCount: number;
  tags: string[];
  influencer: {
    displayName: string;
    user: { firstName: string; lastName: string };
  };
};

export default function MinhasComunidadesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunityIds, setMyCommunityIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const [commRes, myRes] = await Promise.all([
          fetch("/api/communities?pageSize=100"),
          fetch("/api/memberships/me", { headers }),
        ]);

        const commData = await commRes.json();
        const myData = myRes.ok ? await myRes.json() : { data: [] };

        if (commData.success) setCommunities(commData.communities ?? []);
        if (myData.success) setMyCommunityIds(myData.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = communities.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.shortDescription ?? "").toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const mine = filtered.filter((c) => myCommunityIds.includes(c.id));
  const others = filtered.filter((c) => !myCommunityIds.includes(c.id));

  const hostName = (c: Community) =>
    c.influencer.displayName ||
    `${c.influencer.user.firstName} ${c.influencer.user.lastName}`;

  function CommunityCard({ community, hasAccess }: { community: Community; hasAccess: boolean }) {
    const card = (
      <div
        className={`relative rounded-2xl p-6 border transition-all duration-300 group cursor-pointer ${
          hasAccess
            ? "bg-white border-white/10 hover:border-white/25"
            : "bg-white/[0.02] border-white/5 hover:border-[#007A99]/30"
        }`}
      >
        {/* Lock overlay for no-access */}
        {!hasAccess && (
          <div className="absolute inset-0 rounded-2xl bg-[#F8F7FF]/40 backdrop-blur-[1px] flex items-center justify-center z-10 group-hover:bg-[#F8F7FF]/20 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:border-[#007A99]/40 transition-colors">
                <Lock className="w-5 h-5 text-gray-400 group-hover:text-[#009CD9] transition-colors" />
              </div>
              <span className="text-xs text-gray-500 font-medium group-hover:text-[#009CD9] transition-colors">Ver planos</span>
            </div>
          </div>
        )}

        {/* Active badge */}
        {hasAccess && (
          <div className="absolute top-4 right-4">
            <span className="flex items-center gap-1 text-xs bg-green-500/15 border border-green-500/25 text-green-400 px-2.5 py-1 rounded-full font-medium">
              <CheckCircle className="w-3 h-3" /> Acesso ativo
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-4 mb-4 pr-6">
          {community.logoUrl ? (
            <Image
              src={community.logoUrl}
              alt={community.name}
              width={48}
              height={48}
              className={`w-12 h-12 rounded-xl object-cover flex-shrink-0 ${!hasAccess ? "opacity-40 grayscale" : ""}`}
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-[#EEE6E4] font-bold text-lg flex-shrink-0 ${!hasAccess ? "opacity-40 grayscale" : ""}`}
              style={{ backgroundColor: community.primaryColor }}
            >
              {community.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-lg leading-tight truncate ${hasAccess ? "text-[#EEE6E4] group-hover:text-[#009CD9] transition-colors" : "text-gray-500"}`}>
              {community.name}
            </h3>
            <p className={`text-xs mt-0.5 truncate ${hasAccess ? "text-gray-500" : "text-gray-400"}`}>
              {hostName(community)}
            </p>
          </div>
        </div>

        {/* Description */}
        {community.shortDescription && (
          <p className={`text-sm leading-relaxed mb-4 line-clamp-2 ${hasAccess ? "text-gray-400" : "text-gray-400"}`}>
            {community.shortDescription}
          </p>
        )}

        {/* Tags */}
        {community.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {community.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={`px-2.5 py-0.5 rounded-full text-xs capitalize ${
                  hasAccess ? "" : "opacity-40"
                }`}
                style={
                  hasAccess
                    ? { backgroundColor: `${community.primaryColor}20`, color: community.primaryColor }
                    : { backgroundColor: "rgba(255,255,255,0.05)", color: "#6b7280" }
                }
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center justify-between text-xs pt-4 border-t ${hasAccess ? "border-white/5 text-gray-500" : "border-white/[0.03] text-gray-400"}`}>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {community.memberCount.toLocaleString("pt-BR")} membros
          </div>
          {hasAccess && (
            <span className="text-[#009CD9] font-medium">
              Entrar na comunidade →
            </span>
          )}
        </div>
      </div>
    );

    return (
      <div className="flex flex-col gap-2">
        <Link href={hasAccess ? `/community/${community.slug}/feed` : `/community/${community.slug}`}>
          {card}
        </Link>
        {hasAccess && (
          <Link
            href="/dashboard/meu-aprendizado"
            className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 transition-colors py-1"
          >
            <BookOpen className="w-3 h-3" />
            Meu Aprendizado
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#EEE6E4] mb-1">Minhas Comunidades</h1>
        <p className="text-gray-400 text-sm">
          Comunidades com acesso ativo aparecem em destaque. As demais estão disponíveis para solicitar acesso.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#EEE6E4]">{myCommunityIds.length}</p>
              <p className="text-xs text-gray-500">Com acesso</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#007A99]/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-[#009CD9]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#EEE6E4]">{communities.length}</p>
              <p className="text-xs text-gray-500">Total disponíveis</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 hidden md:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-500/10 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#EEE6E4]">{communities.length - myCommunityIds.length}</p>
              <p className="text-xs text-gray-500">Sem acesso</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar comunidades..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-[#EEE6E4] placeholder-gray-500 text-sm focus:outline-none focus:border-[#009CD9] focus:bg-white/8 transition-all md:w-80"
        />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-6 h-52 animate-pulse">
              <div className="flex gap-4 mb-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-white rounded" />
                <div className="h-3 bg-white rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* My communities */}
          {mine.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Com acesso ({mine.length})
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mine.map((c) => (
                  <CommunityCard key={c.id} community={c} hasAccess={true} />
                ))}
              </div>
            </div>
          )}

          {/* Other communities */}
          {others.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500" />
                Disponíveis para solicitar ({others.length})
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {others.map((c) => (
                  <CommunityCard key={c.id} community={c} hasAccess={false} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="glass-card p-16 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Nenhuma comunidade encontrada</p>
              <p className="text-gray-400 text-sm mt-1">Tente buscar por outro termo</p>
            </div>
          )}

          {communities.length === 0 && !search && (
            <div className="glass-card p-16 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Nenhuma comunidade disponível ainda</p>
              <p className="text-gray-400 text-sm mt-1">Volte em breve para ver as primeiras comunidades da plataforma</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
