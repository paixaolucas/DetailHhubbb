"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users, Car, Gauge, Wrench, Star } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Logo } from "@/components/ui/logo";

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
    <div className="min-h-screen bg-chrome-900">
      {/* Header */}
      <header className="bg-chrome-950 border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
            <Logo size="md" />
            <span className="text-white">DetailHub</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
              Entrar
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/30"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-chrome-950 border-b border-white/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 text-xs text-blue-400 mb-4">
            <Car className="w-3 h-3" />
            Comunidades automotivas
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
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
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/30"
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
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
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
                  <div className="h-5 bg-white/5 rounded w-3/4" />
                  <div className="h-4 bg-white/5 rounded w-1/2" />
                  <div className="h-4 bg-white/5 rounded w-full" />
                  <div className="h-4 bg-white/5 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {query ? `Nenhuma comunidade para "${query}"` : "Nenhuma comunidade publicada ainda"}
            </h3>
            <p className="text-gray-600 text-sm">
              Seja o primeiro a criar uma comunidade automotiva!
            </p>
            <Link
              href="/register"
              className="inline-block mt-6 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              Criar minha comunidade
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
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
  const defaultPlan = community.subscriptionPlans[0];

  return (
    <Link
      href={`/community/${community.slug}`}
      className="group glass-card overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 block"
    >
      {/* Banner */}
      <div
        className="h-28 relative"
        style={{
          background: `linear-gradient(135deg, ${community.primaryColor}40, ${community.primaryColor}20), #1f2937`,
        }}
      >
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute bottom-0 left-5 translate-y-1/2">
          <div
            className="w-14 h-14 rounded-xl border-2 border-chrome-900 flex items-center justify-center text-white font-bold text-xl shadow-lg"
            style={{ backgroundColor: community.primaryColor }}
          >
            {community.name.charAt(0)}
          </div>
        </div>
      </div>

      <div className="pt-10 px-5 pb-5">
        <h3 className="font-bold text-white text-lg leading-tight group-hover:text-blue-300 transition-colors">
          {community.name}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5 mb-3">
          por {community.influencer.displayName}
        </p>

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
                className="text-xs px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>{community.memberCount.toLocaleString("pt-BR")} membros</span>
          </div>
          {defaultPlan && (
            <span className="text-sm font-semibold text-blue-400">
              R$ {Number(defaultPlan.price).toLocaleString("pt-BR")}/mês
            </span>
          )}
          {!defaultPlan && (
            <span className="text-xs text-green-400 font-medium">Grátis</span>
          )}
        </div>
      </div>
    </Link>
  );
}
