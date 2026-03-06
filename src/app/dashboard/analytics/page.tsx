"use client";

import { useEffect, useState } from "react";
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
import { TrendingUp, Users, DollarSign, Activity, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";

const chartStyle = {
  grid: { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)" },
  axis: { tick: { fontSize: 11, fill: "#6b7280" }, tickLine: false, axisLine: false },
  tooltip: {
    contentStyle: {
      backgroundColor: "#1f2937",
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
    <div className="glass-card p-5 hover:border-white/20 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <Icon className="w-4 h-4 text-blue-400" />
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
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

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string>("INFLUENCER_ADMIN");

  useEffect(() => {
    setRole(localStorage.getItem("autoclub_user_role") ?? "INFLUENCER_ADMIN");
    const token = localStorage.getItem("autoclub_access_token");
    const endpoint =
      localStorage.getItem("autoclub_user_role") === "SUPER_ADMIN"
        ? "/api/analytics/platform"
        : "/api/analytics/influencer";
    fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => d.success && setData(d.data))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/10 rounded-xl w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 bg-white/10 rounded w-20" />
                <div className="w-4 h-4 bg-white/10 rounded" />
              </div>
              <div className="h-7 bg-white/10 rounded w-28" />
              <div className="h-3 bg-white/10 rounded w-24" />
            </div>
          ))}
        </div>
        <div className="glass-card p-6 h-64 bg-white/5" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">Métricas da sua plataforma automotiva</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 glass-card hover:border-white/20 text-gray-300 hover:text-white text-sm font-medium transition-all rounded-xl">
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
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
        <h2 className="text-base font-semibold text-white mb-6">Receita & Assinaturas (30 dias)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeSeries}>
            <defs>
              <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
              stroke="#3b82f6"
              fill="url(#revGrad2)"
              strokeWidth={2}
              name="Receita (R$)"
            />
            <Bar yAxisId="subs" dataKey="newSubscriptions" fill="#10b981" name="Novas assinaturas" radius={[2, 2, 0, 0]} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Influencer stats table (admin only) */}
      {role === "SUPER_ADMIN" && (
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-base font-semibold text-white">Receita por Influenciador</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5">
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
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{inf.displayName}</td>
                      <td className="px-6 py-4 text-gray-400">{inf.communityName}</td>
                      <td className="px-6 py-4 text-right font-semibold text-white">
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
