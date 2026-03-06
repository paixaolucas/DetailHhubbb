"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Percent,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Pendente",   color: "text-yellow-400 bg-yellow-500/10" },
  CONFIRMED: { label: "Confirmado", color: "text-blue-400 bg-blue-500/10" },
  PAID_OUT:  { label: "Pago",       color: "text-green-400 bg-green-500/10" },
  REVERSED:  { label: "Estornado",  color: "text-red-400 bg-red-500/10" },
};

export default function FinanceiroPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comissao, setComissao] = useState(0.15);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [commTotal, setCommTotal] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("autoclub_access_token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("/api/analytics/platform", { headers }).then((r) => r.json()),
      fetch("/api/admin/platform-config", { headers }).then((r) => r.json()),
      fetch("/api/admin/commissions?pageSize=10", { headers }).then((r) => r.json()),
    ])
      .then(([analytics, config, comms]) => {
        if (analytics.success) setData(analytics.data);
        if (config.success && config.data.config?.comissao) {
          const rate = parseFloat(config.data.config.comissao) / 100;
          if (!isNaN(rate)) setComissao(rate);
        }
        if (comms.success) {
          setCommissions(comms.data.items ?? []);
          setCommTotal(comms.data.pagination?.total ?? 0);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const summary = data?.summary;
  const timeSeries: any[] = data?.timeSeries ?? [];
  const influencers: any[] = data?.influencerStats ?? [];

  const mrr = summary?.mrr ?? 0;
  const totalRevenue = summary?.totalRevenue ?? 0;
  const paidToInfluencers = totalRevenue * (1 - comissao);
  const retained = totalRevenue * comissao;

  const kpis = [
    {
      label: "Receita do Mês",
      value: `R$ ${mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "MRR",
      value: `R$ ${mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Pago a Influencers",
      value: `R$ ${paidToInfluencers.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: `Comissão Retida (${(comissao * 100).toFixed(0)}%)`,
      value: `R$ ${retained.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: Percent,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/10 rounded-xl w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 bg-white/10 rounded w-24" />
                <div className="w-9 h-9 bg-white/10 rounded-xl" />
              </div>
              <div className="h-7 bg-white/10 rounded w-32" />
            </div>
          ))}
        </div>
        <div className="glass-card p-6 h-72 bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Financeiro</h1>
          <p className="text-gray-400 text-sm">Visão financeira da plataforma AutoClub Pro</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card p-5 hover:border-white/20 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {timeSeries.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-6">Receita (últimos 30 dias)</h2>
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timeSeries}>
                <defs>
                  <linearGradient id="finRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...chartStyle.grid} />
                <XAxis
                  dataKey="date"
                  {...chartStyle.axis}
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                  }
                />
                <YAxis
                  {...chartStyle.axis}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  {...chartStyle.tooltip}
                  formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#finRevGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Influencers */}
      {influencers.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-base font-semibold text-white">Top Influencers por Receita</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Influencer</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Membros</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Receita</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3 hidden md:table-cell">
                    Comissão ({(comissao * 100).toFixed(0)}%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {influencers.slice(0, 10).map((inf: any, i: number) => {
                  const rev = inf.totalRevenue ?? 0;
                  const comm = rev * comissao;
                  return (
                    <tr key={inf.influencerId ?? i} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-500 font-mono">#{i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(inf.displayName ?? inf.name ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white">
                            {inf.displayName ?? inf.name ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-400 hidden sm:table-cell">
                        {(inf.memberCount ?? 0).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-green-400">
                            R$ {rev.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          {i === 0 && <ArrowUpRight className="w-3.5 h-3.5 text-green-400" />}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-cyan-400 hidden md:table-cell">
                        R$ {comm.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Commission Transactions */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Transações de Comissão</h2>
          {commTotal > 10 && (
            <span className="text-xs text-gray-500">{commTotal} no total</span>
          )}
        </div>
        {commissions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">Nenhuma transação de comissão encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5">
                  {["Comunidade", "Destinatário", "Bruto", "Taxa", "Líquido", "Status"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {commissions.map((tx: any) => {
                  const st = STATUS_LABEL[tx.status] ?? { label: tx.status, color: "text-gray-400" };
                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 font-medium text-white">{tx.community?.name ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-400">
                        {tx.recipient ? `${tx.recipient.firstName} ${tx.recipient.lastName}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-300">
                        R$ {Number(tx.grossAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-red-400">
                        R$ {Number(tx.platformFee).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-green-400 font-semibold">
                        R$ {Number(tx.netAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
