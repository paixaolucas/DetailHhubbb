"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users, Car } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { LogoType } from "@/components/ui/logo";

interface Community {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string;
  memberCount: number;
  tags: string[];
  influencer: {
    displayName: string;
    user: { firstName: string; lastName: string; avatarUrl: string | null };
  };
  subscriptionPlans: { price: number; currency: string; interval: string }[];
}

const CATEGORIES = [
  { label: "Todas", value: "" },
  { label: "Tuning", value: "tuning" },
  { label: "Racing", value: "racing" },
  { label: "Mecânica", value: "mecanica" },
  { label: "Elétricos", value: "eletrico" },
  { label: "Off-Road", value: "offroad" },
];

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: "1", pageSize: "12" });
    if (query) params.set("search", query);
    if (category) params.set("tag", category);

    fetch(`/api/communities?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCommunities(d.communities ?? []);
          setTotal(d.pagination?.totalCount ?? 0);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [query, category]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search);
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      {/* Header */}
      <header className="bg-white/5 border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <LogoType height={28} variant="light" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-gray-400 hover:text-[#EEE6E4] text-sm transition-colors">
              Entrar
            </Link>
            <Link
              href="/register"
              className="bg-[#006079] hover:bg-[#007A99] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#007A99]/30"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#222222] border-b border-white/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#006079]/10 border border-[#006079]/20 rounded-full px-3 py-1 text-xs text-[#009CD9] mb-4">
            <Car className="w-3 h-3" />
            Comunidades automotivas
          </div>
          <h1 className="text-4xl font-bold text-[#EEE6E4] mb-3">
            Explore as comunidades
          </h1>
          <p className="text-gray-400 mb-8">
            Encontre sua tribo automotiva e acelere seu crescimento
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar comunidades..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-[#006079]/40 rounded-xl pl-10 pr-4 py-3 text-[#EEE6E4] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 focus:border-[#009CD9] transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-[#006079] hover:bg-[#007A99] text-white px-5 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-[#007A99]/30"
            >
              Buscar
            </button>
          </form>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {CATEGORIES.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => { setCategory(value); setQuery(""); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  category === value
                    ? "bg-[#006079] text-white"
                    : "bg-white/5 border border-white/10 text-gray-400 hover:text-[#EEE6E4] hover:border-[#006079]/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card overflow-hidden animate-pulse">
                <div className="h-32 bg-white/5" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-white/10 rounded w-3/4" />
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                  <div className="h-4 bg-white/10 rounded w-full" />
                  <div className="h-4 bg-white/10 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {query ? `Nenhuma comunidade para "${query}"` : "Nenhuma comunidade publicada ainda"}
            </h3>
            <p className="text-gray-400 text-sm">
              Seja o primeiro a criar uma comunidade automotiva!
            </p>
            <Link
              href="/register"
              className="inline-block mt-6 bg-[#006079] hover:bg-[#007A99] text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              Criar minha comunidade
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-6">
              {total} comunidade{total !== 1 ? "s" : ""} encontrada{total !== 1 ? "s" : ""}
              {query && ` para "${query}"`}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

function CommunityCard({ community }: { community: Community }) {

  return (
    <Link
      href={`/community/${community.slug}`}
      className="group glass-card overflow-hidden hover:border-[#006079]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#006079]/20 block"
    >
      {/* Banner */}
      <div
        className="h-28 relative"
        style={
          community.bannerUrl
            ? undefined
            : { background: `linear-gradient(135deg, ${community.primaryColor}40, ${community.primaryColor}20), #222222` }
        }
      >
        {community.bannerUrl ? (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={community.bannerUrl}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="absolute inset-0 grid-pattern opacity-20" />
        )}
        <div className="absolute bottom-0 left-5 translate-y-1/2">
          {community.logoUrl ? (
            <img
              src={community.logoUrl}
              alt={community.name}
              className="w-14 h-14 rounded-xl border-2 border-white/10 shadow-lg object-cover"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-xl border-2 border-white/10 flex items-center justify-center text-white font-bold text-xl shadow-lg"
              style={{ backgroundColor: community.primaryColor }}
            >
              {community.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      <div className="pt-10 px-5 pb-5">
        <h3 className="font-bold text-[#EEE6E4] text-lg leading-tight group-hover:text-[#009CD9] transition-colors">
          {community.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-0.5 mb-3">
          {community.influencer.user.avatarUrl ? (
            <img
              src={community.influencer.user.avatarUrl}
              alt={community.influencer.displayName}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#009CD9] flex items-center justify-center text-white text-[9px] font-bold">
              {community.influencer.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="text-sm text-gray-400">
            por {community.influencer.displayName}
          </p>
        </div>

        {community.shortDescription && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-4">
            {community.shortDescription}
          </p>
        )}

        {community.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {community.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-0.5 bg-[#006079]/10 text-[#009CD9] border border-[#006079]/20 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{community.memberCount.toLocaleString("pt-BR")} membros</span>
          </div>
          <span className="text-xs font-semibold text-[#009CD9] group-hover:text-[#009CD9] flex items-center gap-1 transition-all">
            Ver comunidade →
          </span>
        </div>
      </div>
    </Link>
  );
}
