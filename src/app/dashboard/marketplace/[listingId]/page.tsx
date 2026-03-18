"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star, ShoppingBag, Sparkles, User } from "lucide-react";
import { BuyButton } from "@/components/marketplace/buy-button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { STORAGE_KEYS } from "@/lib/constants";

interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface ListingDetail {
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
  features: string[];
  tags: string[];
  seller: Seller;
  _count: { purchases: number; reviews: number };
  otherListings: ListingDetail[];
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  COURSE: { label: "Curso", color: "bg-[#007A99]/10 text-[#009CD9] border-[#007A99]/20" },
  TEMPLATE: { label: "Templates", color: "bg-[#007A99]/10 text-[#009CD9] border-[#007A99]/20" },
  EBOOK: { label: "E-book", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  COACHING: { label: "Coaching", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  TOOL: { label: "Ferramenta", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  SERVICE: { label: "Serviço", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
};

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-64 bg-white/10 rounded-2xl" />
          <div className="h-6 bg-white/10 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-3 bg-white/10 rounded" />
            <div className="h-3 bg-white/10 rounded w-5/6" />
            <div className="h-3 bg-white/10 rounded w-4/6" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass-card p-6 space-y-4">
            <div className="h-8 bg-white/10 rounded w-24" />
            <div className="h-10 bg-white/10 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplaceListingPage() {
  const params = useParams();
  const listingId = params?.listingId as string;
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    fetch(`/api/marketplace/listings/${listingId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setListing(d.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [listingId]);

  if (isLoading) return <SkeletonDetail />;

  if (notFound || !listing) {
    return (
      <div className="glass-card p-16 text-center">
        <ShoppingBag className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-300 mb-2">Produto não encontrado</h2>
        <Link href="/dashboard/marketplace" className="text-blue-400 text-sm hover:underline">
          Voltar ao marketplace
        </Link>
      </div>
    );
  }

  const typeInfo = TYPE_LABELS[listing.type] ?? {
    label: listing.type,
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Marketplace", href: "/dashboard/marketplace" },
          { label: listing.title },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover image */}
          {listing.coverImageUrl ? (
            <div className="rounded-2xl overflow-hidden h-72">
              <Image
                src={listing.coverImageUrl}
                alt={listing.title}
                width={800}
                height={288}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-72 glass-card flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-gray-600" />
            </div>
          )}

          {/* Title + badges */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              {listing.isFeatured && (
                <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-medium">
                  <Sparkles className="w-3 h-3" />
                  Destaque
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">{listing.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              {listing.averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium text-white">{listing.averageRating}</span>
                  <span>({listing.reviewCount} avaliações)</span>
                </div>
              )}
              <span>{listing._count.purchases} vendas</span>
            </div>
          </div>

          {/* Description */}
          <div className="glass-card p-6">
            <h2 className="text-base font-semibold text-white mb-3">Sobre este produto</h2>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
          </div>

          {/* Features */}
          {listing.features && listing.features.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-base font-semibold text-white mb-3">O que está incluso</h2>
              <ul className="space-y-2">
                {listing.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {listing.tags.map((tag, i) => (
                <span key={i} className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2.5 py-1 rounded-lg">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price + Buy */}
          <div className="glass-card p-6 space-y-4 sticky top-4">
            <div className="text-3xl font-bold text-white">
              R${" "}
              {Number(listing.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <BuyButton
              listingId={listing.id}
              price={Number(listing.price)}
              title={listing.title}
            />
            <Link
              href="/dashboard/marketplace"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao marketplace
            </Link>
          </div>

          {/* Seller info */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Vendedor</h3>
            <div className="flex items-center gap-3">
              {listing.seller.avatarUrl ? (
                <Image
                  src={listing.seller.avatarUrl}
                  alt={listing.seller.firstName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-[#006079] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {listing.seller.firstName[0]}{listing.seller.lastName[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {listing.seller.firstName} {listing.seller.lastName}
                </p>
                <p className="text-xs text-gray-400">Vendedor</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other listings from same seller */}
      {listing.otherListings && listing.otherListings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Outros produtos de {listing.seller.firstName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {listing.otherListings.map((other) => {
              const otherType = TYPE_LABELS[other.type] ?? {
                label: other.type,
                color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
              };
              return (
                <Link
                  key={other.id}
                  href={`/dashboard/marketplace/${other.id}`}
                  className="glass-card p-4 hover:border-[#99D3DF]/30 transition-all group"
                >
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${otherType.color}`}>
                    {otherType.label}
                  </span>
                  <p className="mt-2 text-sm font-medium text-white group-hover:text-[#33A7BF] transition-colors line-clamp-2">
                    {other.title}
                  </p>
                  <p className="mt-2 text-base font-bold text-gray-200">
                    R$ {Number(other.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
