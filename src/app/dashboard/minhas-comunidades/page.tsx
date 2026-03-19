"use client";

// =============================================================================
// MEMBER — MINHAS COMUNIDADES
// Shows all communities: active ones in color, others greyed out with lock icon
// Platform members (single subscription) have access to ALL communities.
// =============================================================================

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users, Lock, CheckCircle, Search, BookOpen, TrendingUp } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";

type Community = {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor: string;
  memberCount: number;
  tags: string[];
  influencer: {
    displayName: string;
    user: { firstName: string; lastName: string; avatarUrl?: string | null };
  };
};

export default function MinhasComunidadesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunityIds, setMyCommunityIds] = useState<string[]>([]);
  const [hasPlatformMembership, setHasPlatformMembership] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // Get token, try refresh if missing
        let token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (!token) {
          const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (refreshToken) {
            try {
              const r = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
              });
              const d = await r.json();
              if (r.ok && d.data?.accessToken) {
                token = d.data.accessToken;
                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token!);
              }
            } catch { /* ignore */ }
          }
        }

        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // Fetch all communities + platform membership + per-community membership in parallel
        const [commRes, platformRes, myRes] = await Promise.all([
          fetch("/api/communities?published=true&pageSize=50"),
          token ? fetch("/api/platform-membership/me", { headers }).catch(() => null) : Promise.resolve(null),
          token ? fetch("/api/memberships/me", { headers }).catch(() => null) : Promise.resolve(null),
        ]);

        const commData = await commRes.json();
        const platformData = platformRes?.ok ? await platformRes.json() : null;
        const myData = myRes?.ok ? await myRes.json() : { data: [] };

        const allCommunities: Community[] = commData.success ? (commData.communities ?? []) : [];
        setCommunities(allCommunities);

        // If platform membership is active → access to ALL communities
        if (platformData?.data?.hasMembership === true) {
          setHasPlatformMembership(true);
          setMyCommunityIds(allCommunities.map((c) => c.id));
        } else {
          // Fall back to per-community memberships
          setHasPlatformMembership(false);
          setMyCommunityIds(myData.data ?? []);
        }
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

  // Top 3 by memberCount for "Explore mais" section
  const topCommunities = [...communities]
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 3);

  const hostName = (c: Community) =>
    c.influencer.displayName ||
    `${c.influencer.user.firstName} ${c.influencer.user.lastName}`;

  const avatarInitial = (c: Community) =>
    (c.influencer.displayName || c.influencer.user.firstName || "?")[0].toUpperCase();

  function CommunityCard({ community, hasAccess }: { community: Community; hasAccess: boolean }) {
    const card = (
      <div
        className={`relative rounded-2xl border transition-all duration-300 group cursor-pointer overflow-hidden ${
          hasAccess
            ? "bg-white/5 border-white/10 hover:border-white/25"
            : "bg-white/[0.02] border-white/5 hover:border-[#007A99]/30"
        }`}
      >
        {/* Lock overlay for no-access */}
        {!hasAccess && (
          <div className="absolute inset-0 rounded-2xl bg-[#1A1A1A]/40 backdrop-blur-[1px] flex items-center justify-center z-10 group-hover:bg-[#1A1A1A]/20 transition-colors">
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
          <div className="absolute top-3 right-3 z-20">
            <span className="flex items-center gap-1 text-xs bg-green-500/15 border border-green-500/25 text-green-400 px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">
              <CheckCircle className="w-3 h-3" /> Acesso ativo
            </span>
          </div>
        )}

        {/* Banner */}
        <div className={`relative h-28 overflow-hidden rounded-t-2xl ${!hasAccess ? "grayscale opacity-50" : ""}`}>
          {community.bannerUrl ? (
            <Image
              src={community.bannerUrl}
              alt={`${community.name} banner`}
              fill
              className="object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ backgroundColor: `${community.primaryColor}30` }}
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/80 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Influencer row */}
          <div className="flex items-center gap-2 mb-3 -mt-1">
            {community.influencer.user.avatarUrl ? (
              <Image
                src={community.influencer.user.avatarUrl}
                alt={hostName(community)}
                width={28}
                height={28}
                className={`w-7 h-7 rounded-full object-cover border-2 border-[#1A1A1A] flex-shrink-0 ${!hasAccess ? "opacity-40 grayscale" : ""}`}
              />
            ) : (
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-[#1A1A1A] flex-shrink-0 ${!hasAccess ? "opacity-40 grayscale" : ""}`}
                style={{ backgroundColor: community.primaryColor }}
              >
                {avatarInitial(community)}
              </div>
            )}
            <p className={`text-xs truncate ${hasAccess ? "text-gray-400" : "text-gray-600"}`}>
              {hostName(community)}
            </p>
          </div>

          {/* Community name */}
          <h3 className={`font-semibold text-lg leading-tight mb-1 ${hasAccess ? "text-[#EEE6E4] group-hover:text-[#009CD9] transition-colors" : "text-gray-500"}`}>
            {community.name}
          </h3>

          {/* Description */}
          {community.shortDescription && (
            <p className={`text-sm leading-relaxed mb-3 line-clamp-2 ${hasAccess ? "text-gray-400" : "text-gray-600"}`}>
              {community.shortDescription}
            </p>
          )}

          {/* Tags */}
          {community.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {community.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className={`px-2.5 py-0.5 rounded-full text-xs capitalize ${!hasAccess ? "opacity-40" : ""}`}
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
          <div className={`flex items-center justify-between text-xs pt-3 border-t ${hasAccess ? "border-white/5 text-gray-500" : "border-white/[0.03] text-gray-600"}`}>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {community.memberCount.toLocaleString("pt-BR")} membros
            </div>
            {hasAccess && (
              <span className="text-[#009CD9] font-medium">
                Entrar →
              </span>
            )}
          </div>
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
          {hasPlatformMembership
            ? "Sua assinatura Detailer'HUB dá acesso a todas as comunidades da plataforma."
            : "Comunidades com acesso ativo aparecem em destaque. As demais estão disponíveis para solicitar acesso."}
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
            <div key={i} className="glass-card overflow-hidden h-64 animate-pulse rounded-2xl">
              <div className="h-28 bg-white/5" />
              <div className="p-5 space-y-3">
                <div className="flex gap-3">
                  <div className="w-7 h-7 bg-white/5 rounded-full" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-full" />
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

          {/* Explore mais — top communities by memberCount */}
          {topCommunities.length > 0 && !search && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#009CD9]" />
                Em alta
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {topCommunities.map((c) => {
                  const hasAccess = myCommunityIds.includes(c.id);
                  return (
                    <Link
                      key={c.id}
                      href={hasAccess ? `/community/${c.slug}/feed` : `/community/${c.slug}`}
                      className="relative overflow-hidden rounded-2xl border border-[#006079]/30 bg-gradient-to-br from-[#006079]/10 to-[#009CD9]/5 hover:border-[#009CD9]/40 transition-all group"
                    >
                      {c.bannerUrl && (
                        <div className="relative h-20 overflow-hidden">
                          <Image src={c.bannerUrl} alt={c.name} fill className="object-cover opacity-40" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/80 to-transparent" />
                        </div>
                      )}
                      <div className="p-4">
                        <p className="font-semibold text-[#EEE6E4] group-hover:text-[#009CD9] transition-colors truncate">
                          {c.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          {c.memberCount.toLocaleString("pt-BR")} membros
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
