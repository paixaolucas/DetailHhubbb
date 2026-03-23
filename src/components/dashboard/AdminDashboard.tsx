"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Users, TrendingUp, DollarSign, Activity, ArrowUpRight, Shield, BarChart2, ShoppingBag } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { STORAGE_KEYS } from "@/lib/constants";
import { getGreeting } from "@/lib/greeting";

interface PlatformSummary {
  mrr: number;
  mrrGrowth: number;
  activeMembers: number;
  totalRevenue: number;
  revenueGrowth: number;
  churnRate: number;
}

interface TimeSeriesPoint {
  date: string;
  revenue: number;
}

const chartStyle = {
  cartesianGrid: { strokeDasharray: "3 3", stroke: "rgba(0,0,0,0.06)" },
  xAxis: { tick: { fontSize: 11, fill: "#6b7280" }, tickLine: false, axisLine: false },
  yAxis: { tick: { fontSize: 11, fill: "#6b7280" }, tickLine: false, axisLine: false },
  tooltip: {
    contentStyle: {
      backgroundColor: "#1A1A1A",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      color: "#EEE6E4",
    },
  },
};

function StatsCard({
  title, value, growth, prefix = "", suffix = "", icon: Icon, iconColor = "text-[#009CD9]", iconBg = "bg-[#007A99]/10",
}: {
  title: string; value: number | string; growth?: number;
  prefix?: string; suffix?: string; icon: React.ElementType;
  iconColor?: string; iconBg?: string;
}) {
  const isPositive = (growth ?? 0) >= 0;
  return (
    <div className="glass-card p-4 sm:p-6 hover:border-[#009CD9]/20 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-xl sm:text-2xl font-bold text-[#EEE6E4]">
          {prefix}{typeof value === "number" ? value.toLocaleString("pt-BR") : value}{suffix}
        </p>
        {growth !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {Math.abs(growth).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

function LiveIndicator({ lastUpdated }: { lastUpdated: Date | null }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
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

export function AdminDashboard() {
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return;
    fetch("/api/analytics/platform", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSummary(d.data.summary);
          setTimeSeries(d.data.timeSeries ?? []);
          setLastUpdated(new Date());
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useAutoRefresh(fetchData, 60_000);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-white/10 rounded-xl w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="glass-card p-6 space-y-3"><div className="h-4 bg-white/10 rounded w-24" /><div className="h-7 bg-white/10 rounded w-32" /></div>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#EEE6E4]">Painel Administrativo</h1>
            <p className="text-gray-400 text-sm">Visão geral da plataforma Detailer&apos;HUB</p>
          </div>
        </div>
        <LiveIndicator lastUpdated={lastUpdated} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard title="MRR da Plataforma" value={summary?.mrr ?? 0} growth={summary?.mrrGrowth} prefix="R$ " icon={DollarSign} iconColor="text-green-400" iconBg="bg-green-500/10" />
        <StatsCard title="Membros Ativos" value={summary?.activeMembers ?? 0} icon={Users} iconColor="text-[#009CD9]" iconBg="bg-[#007A99]/10" />
        <StatsCard title="Receita Total" value={summary?.totalRevenue ?? 0} growth={summary?.revenueGrowth} prefix="R$ " icon={TrendingUp} iconColor="text-[#009CD9]" iconBg="bg-[#009CD9]/10" />
        <StatsCard title="Churn Rate" value={summary?.churnRate ?? 0} suffix="%" icon={Activity} iconColor="text-orange-400" iconBg="bg-orange-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-4 sm:p-6 overflow-x-auto">
          <h2 className="text-base font-semibold text-[#EEE6E4] mb-6">Receita nos últimos 30 dias</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#009CD9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#009CD9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartStyle.cartesianGrid} />
              <XAxis dataKey="date" {...chartStyle.xAxis} tickFormatter={(v: string) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} />
              <YAxis {...chartStyle.yAxis} tickFormatter={(v: number) => `R$${v}`} />
              <Tooltip {...chartStyle.tooltip} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
              <Area type="monotone" dataKey="revenue" stroke="#009CD9" strokeWidth={2} fill="url(#adminRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#EEE6E4] mb-4">Ações Rápidas</h2>
          <div className="space-y-2">
            {[
              { label: "Ver comunidades", href: "/dashboard/communities", icon: Users, color: "text-[#009CD9] bg-[#007A99]/10" },
              { label: "Gerenciar usuários", href: "/dashboard/usuarios", icon: Shield, color: "text-red-400 bg-red-500/10" },
              { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2, color: "text-[#009CD9] bg-[#009CD9]/10" },
              { label: "Marketplace", href: "/dashboard/marketplace", icon: ShoppingBag, color: "text-green-400 bg-green-500/10" },
            ].map(({ label, href, icon: Icon, color }) => (
              <Link key={href} href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#006079]/10 transition-colors border border-white/10 hover:border-[#009CD9]/20">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color.split(" ")[1]}`}>
                  <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
                </div>
                <span className="text-sm font-medium text-gray-400">{label}</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
