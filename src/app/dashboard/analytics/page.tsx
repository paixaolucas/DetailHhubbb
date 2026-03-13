"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, Users, DollarSign, Activity, Download, ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";

const chartStyle = {
  grid: { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)" },
  axis: { tick: { fontSize: 11, fill: "#6b7280" }, tickLine: false, axisLine: false },
  tooltip: {
    contentStyle: {
      backgroundColor: "#16152A",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      color: "#f9fafb",
      fontSize: "13px",
    },
  },
};

function KpiCard({
  label, value, sub, icon: Icon, trend, trendPositive,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; trend?: string; trendPositive?: boolean;
}) {
  return (
    <div className="glass-card p-5 hover:border-violet-200 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <Icon className="w-4 h-4 text-violet-400" />
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <div className="flex items-center gap-1">
        {trend && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${trendPositive ? "text-green-400" : "text-red-400"}`}>
            {trendPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </span>
        )}
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
    </div>
  );
}

const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
const PERIOD_LABELS: Record<string, string> = { "7d": "7 dias", "30d": "30 dias", "90d": "90 dias", "1y": "1 ano" };

export default function AnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityId = searchParams.get("communityId");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string>("");
  const [period, setPeriod] = useState("30d");
  const [events, setEvents] = useState<{ type: string; count: number }[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventFilter, setEventFilter] = useState("");

  // One-time: set role + fetch admin events
  useEffect(() => {
    const storedRole = localStorage.getItem("detailhub_user_role") ?? "INFLUENCER_ADMIN";
    if (storedRole === "COMMUNITY_MEMBER" || storedRole === "MARKETPLACE_PARTNER") {
      router.replace("/dashboard");
      return;
    }
    setRole(storedRole);
    if (storedRole === "SUPER_ADMIN") {
      const token = localStorage.getItem("detailhub_access_token");
      setEventsLoading(true);
      fetch("/api/admin/analytics/events?pageSize=20", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setEvents(d.data?.typeCounts ?? []);
            setRecentEvents(d.data?.items ?? []);
          }
        })
        .finally(() => setEventsLoading(false));
    }
  }, []);

  // Refetch analytics when role or period changes
  useEffect(() => {
    if (!role) return;
    const token = localStorage.getItem("detailhub_access_token");
    const days = PERIOD_DAYS[period] ?? 30;
    const endpoint = role === "SUPER_ADMIN"
      ? `/api/analytics/platform?days=${days}`
      : `/api/analytics/influencer?days=${days}`;
    setIsLoading(true);
    fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => d.success && setData(d.data))
      .finally(() => setIsLoading(false));
  }, [role, period]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-50 rounded-xl w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 bg-gray-50 rounded w-20" />
                <div className="w-4 h-4 bg-gray-50 rounded" />
              </div>
              <div className="h-7 bg-gray-50 rounded w-28" />
              <div className="h-3 bg-gray-50 rounded w-24" />
            </div>
          ))}
        </div>
        <div className="glass-card p-6 h-64 bg-white" />
      </div>
    );
  }

  const summary = data?.summary;
  const timeSeries = data?.timeSeries ?? [];
  const influencerStats = data?.influencerStats ?? [];

  function exportCSV() {
    const rows = [["Data", "MRR", "Membros Ativos", "Novos Membros"]];
    timeSeries.forEach((row: any) =>
      rows.push([row.date, String(row.mrr ?? row.revenue ?? 0), String(row.activeMembers ?? 0), String(row.newMembers ?? row.newSubscriptions ?? 0)])
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">
            Métricas da sua plataforma automotiva
            {communityId && data?.communities && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
                {data.communities.find((c: any) => c.id === communityId)?.name ?? "Comunidade"}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 glass-card p-1 rounded-xl">
            {Object.keys(PERIOD_DAYS).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === p ? "bg-violet-600 text-white" : "text-gray-400 hover:text-gray-900"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 glass-card hover:border-violet-200 text-gray-600 hover:text-gray-900 text-sm font-medium transition-all rounded-xl">
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="MRR"
          value={`R$ ${(summary?.mrr ?? 0).toLocaleString("pt-BR")}`}
          sub="vs mês anterior"
          icon={DollarSign}
          trend={summary?.mrrGrowth ? `${summary.mrrGrowth >= 0 ? "+" : ""}${summary.mrrGrowth.toFixed(1)}%` : undefined}
          trendPositive={(summary?.mrrGrowth ?? 0) >= 0}
        />
        <KpiCard
          label="Membros Ativos"
          value={(summary?.activeMembers ?? 0).toLocaleString("pt-BR")}
          sub={`+${summary?.newMembersThisMonth ?? 0} esse mês`}
          icon={Users}
          trend={summary?.newMembersThisMonth ? `+${summary.newMembersThisMonth}` : undefined}
          trendPositive
        />
        <KpiCard
          label="Receita Total"
          value={`R$ ${(summary?.totalRevenue ?? 0).toLocaleString("pt-BR")}`}
          sub="Acumulado histórico"
          icon={TrendingUp}
          trend={summary?.revenueGrowth ? `${summary.revenueGrowth >= 0 ? "+" : ""}${summary.revenueGrowth.toFixed(1)}%` : undefined}
          trendPositive={(summary?.revenueGrowth ?? 0) >= 0}
        />
        <KpiCard
          label="Churn Rate"
          value={`${summary?.churnRate?.toFixed(2) ?? "0.00"}%`}
          sub="Últimos 30 dias"
          icon={Activity}
          trend={undefined}
        />
      </div>

      {/* Revenue chart */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Receita & Assinaturas (30 dias)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeSeries}>
            <defs>
              <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...chartStyle.grid} />
            <XAxis
              dataKey="date"
              {...chartStyle.axis}
              tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            />
            <YAxis yAxisId="revenue" {...chartStyle.axis} tickFormatter={(v) => `R$${v}`} />
            <YAxis yAxisId="subs" orientation="right" {...chartStyle.axis} />
            <Tooltip {...chartStyle.tooltip} />
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="#8b5cf6"
              fill="url(#revGrad2)"
              strokeWidth={2}
              name="Receita (R$)"
            />
            <Bar yAxisId="subs" dataKey="newSubscriptions" fill="#10b981" name="Novas assinaturas" radius={[2, 2, 0, 0]} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Analytics Events widget (admin only) */}
      {role === "SUPER_ADMIN" && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h2 className="text-base font-semibold text-gray-900">Eventos Recentes</h2>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-violet-400"
              >
                <option value="" className="bg-white">Todos os tipos</option>
                {events.map((e) => (
                  <option key={e.type} value={e.type} className="bg-white">{e.type} ({e.count})</option>
                ))}
              </select>
            </div>
          </div>
          {events.length > 0 && (
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2">
              {events.slice(0, 8).map((e) => (
                <span
                  key={e.type}
                  onClick={() => setEventFilter(eventFilter === e.type ? "" : e.type)}
                  className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                    eventFilter === e.type
                      ? "bg-violet-600/30 border-violet-500/50 text-violet-300"
                      : "bg-white border-gray-200 text-gray-400 hover:border-violet-200 hover:text-gray-900"
                  }`}
                >
                  {e.type} · {e.count}
                </span>
              ))}
            </div>
          )}
          {eventsLoading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentEvents
                .filter((e) => !eventFilter || e.type === eventFilter)
                .slice(0, 15)
                .map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3 hover:bg-violet-50 transition-colors">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 font-medium flex-shrink-0">
                      {e.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      {e.user && (
                        <span className="text-sm text-gray-600">
                          {e.user.firstName} {e.user.lastName}
                          <span className="text-gray-500 text-xs ml-1">({e.user.email})</span>
                        </span>
                      )}
                      {e.community && (
                        <span className="text-xs text-gray-500 ml-2">· {e.community.name}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {new Date(e.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              {recentEvents.filter((e) => !eventFilter || e.type === eventFilter).length === 0 && (
                <div className="p-8 text-center text-sm text-gray-500">Nenhum evento encontrado.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Influencer stats table (admin only) */}
      {role === "SUPER_ADMIN" && (
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Receita por Influenciador</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white">
                  {["Influenciador", "Comunidade", "MRR", "Membros", "Comissão"].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide ${
                        h !== "Influenciador" && h !== "Comunidade" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {influencerStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                      Nenhum dado disponível
                    </td>
                  </tr>
                ) : (
                  influencerStats.map((inf: any, i: number) => (
                    <tr key={i} className="hover:bg-violet-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{inf.displayName}</td>
                      <td className="px-6 py-4 text-gray-400">{inf.communityName}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        R$ {inf.mrr.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400">
                        {inf.totalMembers.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 text-right text-green-400 font-medium">
                        {(inf.commissionRate * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
