"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star, Sparkles, Search, ChevronDown } from "lucide-react";
import { SellButton } from "@/components/marketplace/sell-button";
import { Pagination } from "@/components/ui/pagination";

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
  COURSE: { label: "Curso", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  TEMPLATE: { label: "Templates", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  EBOOK: { label: "E-book", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  COACHING: { label: "Coaching", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  TOOL: { label: "Ferramenta", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  SERVICE: { label: "Serviço", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
};

const SORT_OPTIONS = [
  { value: "featured", label: "Destaques" },
  { value: "newest", label: "Mais recentes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
];

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
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchListings = useCallback(async (p: number, q: string, type: string, s: string) => {
    const token = localStorage.getItem("detailhub_access_token");
    if (!token) { setIsLoading(false); return; }

    const params = new URLSearchParams();
    if (q) params.set("search", q);
    if (type) params.set("type", type);
    params.set("sort", s);
    params.set("page", String(p));
    params.set("pageSize", "12");

    try {
      const res = await fetch(`/api/marketplace/listings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) {
        setListings(d.data ?? []);
        setTotalPages(d.pagination?.totalPages ?? 1);
        setTotal(d.pagination?.totalCount ?? 0);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => fetchListings(page, search, typeFilter, sort), search ? 300 : 0);
    return () => clearTimeout(t);
  }, [page, search, typeFilter, sort, fetchListings]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, typeFilter, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-400 text-sm mt-1">Produtos e serviços premium das suas comunidades</p>
        </div>
        <SellButton />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produtos…"
            className="bg-transparent text-sm text-gray-900 placeholder-gray-600 outline-none flex-1"
          />
        </div>
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-gray-600 outline-none"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(TYPE_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-gray-600 outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <ListingSkeleton key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-violet-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum produto disponível</h3>
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
              <Link
                key={listing.id}
                href={`/dashboard/marketplace/${listing.id}`}
                className="glass-card overflow-hidden hover:border-violet-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10 group relative block"
              >
                {/* Cover */}
                {listing.coverImageUrl ? (
                  <div className="h-40 overflow-hidden">
                    <Image
                      src={listing.coverImageUrl}
                      alt={listing.title}
                      width={400}
                      height={160}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-violet-600/20 to-purple-600/10 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 grid-pattern opacity-20" />
                    <ShoppingBag className="w-12 h-12 text-violet-400/50 relative" />
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

                  <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-violet-300 transition-colors">
                    {listing.title}
                  </h3>

                  <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                    {listing.shortDesc ?? listing.description}
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-gray-500">por</span>
                    <span className="text-xs font-medium text-gray-600">
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

                  <div className="pt-3 border-t border-gray-200">
                    <span className="text-xl font-bold text-gray-900">
                      R${" "}
                      {Number(listing.price).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!isLoading && listings.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={total}
        />
      )}
    </div>
  );
}
