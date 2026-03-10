"use client";

// =============================================================================
// MARKETPLACE PAGE — DetailHub Dark Theme
// Fetches listings via API (auth-aware: members only see community listings)
// =============================================================================

import { useState, useEffect } from "react";
import { ShoppingBag, Star, Sparkles, Search } from "lucide-react";
import { BuyButton } from "@/components/marketplace/buy-button";
import { SellButton } from "@/components/marketplace/sell-button";

interface Listing {
  id: string;
  title: string;
  description: string;
  shortDesc: string | null;
  type: string;
  price: string | number;
  coverImageUrl: string | null;
  isFeatured: boolean;
  averageRating: number | null;
  reviewCount: number;
  totalSales: number;
  communityId: string | null;
  seller: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  COURSE: { label: "Curso", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  TEMPLATE: { label: "Templates", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  EBOOK: { label: "E-book", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  COACHING: { label: "Coaching", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  TOOL: { label: "Ferramenta", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  SERVICE: { label: "Serviço", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
};

function ListingSkeleton() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="h-40 bg-white/5" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-white/10 rounded w-16" />
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/10 rounded w-2/3" />
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="h-5 bg-white/10 rounded w-20" />
          <div className="h-8 bg-white/10 rounded-xl w-24" />
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);
    params.set("pageSize", "50");

    fetch(`/api/marketplace/listings?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setListings(d.data ?? []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketplace</h1>
          <p className="text-gray-400 text-sm mt-1">Produtos e serviços premium das suas comunidades</p>
        </div>
        <SellButton />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex-1">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produtos…"
            className="bg-transparent text-sm text-white placeholder-gray-600 outline-none flex-1"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 outline-none"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_LABELS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <ListingSkeleton key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Nenhum produto disponível</h3>
          <p className="text-gray-400 text-sm">
            {search || typeFilter
              ? "Nenhum resultado para os filtros selecionados."
              : "Ainda não há produtos no marketplace das suas comunidades."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => {
            const typeInfo = TYPE_LABELS[listing.type] ?? {
              label: listing.type,
              color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
            };

            return (
              <div
                key={listing.id}
                className="glass-card overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 group relative"
              >
                {/* Cover */}
                {listing.coverImageUrl ? (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={listing.coverImageUrl}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-blue-600/20 to-cyan-600/10 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 grid-pattern opacity-20" />
                    <ShoppingBag className="w-12 h-12 text-blue-400/50 relative" />
                  </div>
                )}

                {listing.isFeatured && (
                  <div className="absolute top-3 left-3">
                    <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-medium">
                      <Sparkles className="w-3 h-3" />
                      Destaque
                    </span>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white mb-1.5 line-clamp-2 group-hover:text-blue-300 transition-colors">
                    {listing.title}
                  </h3>

                  <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                    {listing.shortDesc ?? listing.description}
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-gray-500">por</span>
                    <span className="text-xs font-medium text-gray-300">
                      {listing.seller.firstName} {listing.seller.lastName}
                    </span>
                    {listing.averageRating && (
                      <>
                        <span className="text-gray-700">•</span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {listing.averageRating} ({listing.reviewCount})
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-xl font-bold text-white">
                      R${" "}
                      {Number(listing.price).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <BuyButton
                      listingId={listing.id}
                      price={Number(listing.price)}
                      title={listing.title}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
