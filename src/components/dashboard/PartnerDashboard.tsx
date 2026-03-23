"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Package, TrendingUp, DollarSign, Activity, BarChart2, ArrowUpRight } from "lucide-react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { STORAGE_KEYS } from "@/lib/constants";
import { getGreeting } from "@/lib/greeting";

function StatsCard({
  title, value, icon: Icon, iconColor = "text-[#009CD9]", iconBg = "bg-[#007A99]/10",
}: {
  title: string; value: number | string; icon: React.ElementType; iconColor?: string; iconBg?: string;
}) {
  return (
    <div className="glass-card p-5 hover:border-[#009CD9]/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-[#EEE6E4]">
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
      </p>
    </div>
  );
}

function LiveIndicator({ lastUpdated }: { lastUpdated: Date | null }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      {lastUpdated
        ? `Atualizado às ${lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
        : "Ao vivo"}
    </div>
  );
}

interface Listing {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: string;
  _count: { purchases: number };
}

export function PartnerDashboard({ userName }: { userName: string }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchListings = useCallback(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    fetch("/api/marketplace/listings?mine=true&pageSize=5", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) { setListings(d.data ?? []); setLastUpdated(new Date()); } })
      .catch(console.error)
      .finally(() => setListingsLoading(false));
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  useAutoRefresh(fetchListings, 60_000);

  const firstName = userName.split(" ")[0] || "Parceiro";
  const greeting = getGreeting(firstName);
  const activeCount = listings.filter((l) => l.status === "ACTIVE").length;
  const totalSales = listings.reduce((acc, l) => acc + (l._count?.purchases ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#EEE6E4]">{greeting}</h1>
            <p className="text-gray-400 text-sm">Gerencie seus produtos e acompanhe suas vendas</p>
          </div>
        </div>
        <LiveIndicator lastUpdated={lastUpdated} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {listingsLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
              <div className="h-8 bg-white/10 rounded w-1/3" />
            </div>
          ))
        ) : (
          <>
            <StatsCard title="Produtos Ativos" value={activeCount} icon={Package} iconColor="text-green-400" iconBg="bg-green-500/10" />
            <StatsCard title="Vendas totais" value={totalSales} icon={TrendingUp} iconColor="text-[#009CD9]" iconBg="bg-[#007A99]/10" />
            <StatsCard title="Total de produtos" value={listings.length} icon={DollarSign} iconColor="text-[#009CD9]" iconBg="bg-[#009CD9]/10" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#EEE6E4] mb-4">Meus Produtos</h2>
          {listingsLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-white/10 rounded-xl" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <Package className="w-8 h-8 mx-auto mb-2 text-gray-500" />
              Nenhum produto cadastrado ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-[#EEE6E4] truncate max-w-[180px]">{listing.title}</p>
                    <p className="text-xs text-gray-500">{listing._count?.purchases ?? 0} vendas</p>
                  </div>
                  <span className="text-sm font-semibold text-[#009CD9]">
                    R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/meus-produtos" className="mt-4 block text-center text-sm text-[#009CD9] font-medium">
            Gerenciar produtos →
          </Link>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#EEE6E4] mb-4">Ações Rápidas</h2>
          <div className="space-y-2">
            {[
              { label: "Adicionar produto", href: "/dashboard/meus-produtos", icon: Package },
              { label: "Ver vendas recentes", href: "/dashboard/vendas", icon: TrendingUp },
              { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
              { label: "Configurações", href: "/dashboard/settings", icon: Activity },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#006079]/10 transition-colors text-sm text-gray-400 hover:text-[#EEE6E4] font-medium border border-white/10 hover:border-[#009CD9]/20">
                <Icon className="w-4 h-4 text-[#009CD9]" />
                {label}
                <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
