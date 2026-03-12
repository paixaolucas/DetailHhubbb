"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Percent,
  ArrowUpRight,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
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
  grid: { strokeDasharray: "3 3", stroke: "rgba(0,0,0,0.08)" },
  axis: { tick: { fontSize: 11, fill: "#6b7280" }, tickLine: false, axisLine: false },
  tooltip: {
    contentStyle: {
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      color: "#111827",
      fontSize: "13px",
    },
  },
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Pendente",   color: "text-yellow-400 bg-yellow-500/10" },
  CONFIRMED: { label: "Confirmado", color: "text-violet-400 bg-violet-500/10" },
  PAID_OUT:  { label: "Pago",       color: "text-green-400 bg-green-500/10" },
  REVERSED:  { label: "Estornado",  color: "text-red-400 bg-red-500/10" },
};

const COMM_TYPE_LABEL: Record<string, string> = {
  PERCENTAGE: "Percentual",
  FLAT_FEE: "Valor Fixo",
  TIERED: "Escalonado",
};

export default function FinanceiroPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comissao, setComissao] = useState(0.15);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [commTotal, setCommTotal] = useState(0);

  // Commission rules state
  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>("");
  const [commRules, setCommRules] = useState<any[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [ruleForm, setRuleForm] = useState({ name: "", type: "PERCENTAGE", rate: "", isActive: true });
  const [ruleSaving, setRuleSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("/api/analytics/platform", { headers }).then((r) => r.json()),
      fetch("/api/admin/platform-config", { headers }).then((r) => r.json()),
      fetch("/api/admin/commissions?pageSize=10", { headers }).then((r) => r.json()),
      fetch("/api/communities?pageSize=100", { headers }).then((r) => r.json()),
    ])
      .then(([analytics, config, comms, commsData]) => {
        if (analytics.success) setData(analytics.data);
        if (config.success && config.data.config?.comissao) {
          const rate = parseFloat(config.data.config.comissao) / 100;
          if (!isNaN(rate)) setComissao(rate);
        }
        if (comms.success) {
          setCommissions(comms.data.items ?? []);
          setCommTotal(comms.data.pagination?.total ?? 0);
        }
        if (commsData.success) {
          const list = commsData.data?.communities ?? commsData.data ?? [];
          setCommunities(list);
          if (list.length > 0) setSelectedCommunity(list[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  async function loadRules(communityId: string) {
    if (!communityId) return;
    setRulesLoading(true);
    const token = localStorage.getItem("detailhub_access_token");
    try {
      const res = await fetch(`/api/communities/${communityId}/commission-rules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) setCommRules(d.data ?? []);
    } finally {
      setRulesLoading(false);
    }
  }

  async function saveRule(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCommunity) return;
    setRuleSaving(true);
    const token = localStorage.getItem("detailhub_access_token");
    try {
      const url = editingRule
        ? `/api/communities/${selectedCommunity}/commission-rules/${editingRule.id}`
        : `/api/communities/${selectedCommunity}/commission-rules`;
      const res = await fetch(url, {
        method: editingRule ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: ruleForm.name, type: ruleForm.type, rate: parseFloat(ruleForm.rate) || 0, isActive: ruleForm.isActive }),
      });
      const d = await res.json();
      if (d.success) {
        setShowRuleForm(false);
        setEditingRule(null);
        setRuleForm({ name: "", type: "PERCENTAGE", rate: "", isActive: true });
        loadRules(selectedCommunity);
      }
    } finally {
      setRuleSaving(false);
    }
  }

  async function deleteRule(ruleId: string) {
    if (!selectedCommunity) return;
    const token = localStorage.getItem("detailhub_access_token");
    await fetch(`/api/communities/${selectedCommunity}/commission-rules/${ruleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setCommRules((r) => r.filter((x) => x.id !== ruleId));
  }

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
      color: "text-violet-400",
      bg: "bg-violet-500/10",
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
        <div className="h-8 bg-gray-50 rounded-xl w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 bg-gray-50 rounded w-24" />
                <div className="w-9 h-9 bg-gray-50 rounded-xl" />
              </div>
              <div className="h-7 bg-gray-50 rounded w-32" />
            </div>
          ))}
        </div>
        <div className="glass-card p-6 h-72 bg-white" />
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
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-400 text-sm">Visão financeira da plataforma DetailHub</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card p-5 hover:border-violet-200 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {timeSeries.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Receita (últimos 30 dias)</h2>
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
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Top Influencers por Receita</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
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
                    <tr key={inf.influencerId ?? i} className="hover:bg-violet-50 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-500 font-mono">#{i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(inf.displayName ?? inf.name ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
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

      {/* Commission Rules */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 flex-1">Regras de Comissão</h2>
          {communities.length > 0 && (
            <select
              value={selectedCommunity}
              onChange={(e) => { setSelectedCommunity(e.target.value); loadRules(e.target.value); }}
              className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-gray-900 text-xs focus:outline-none"
            >
              {communities.map((c: any) => (
                <option key={c.id} value={c.id} className="bg-white">{c.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => { setShowRuleForm(true); setEditingRule(null); setRuleForm({ name: "", type: "PERCENTAGE", rate: "", isActive: true }); if (selectedCommunity) loadRules(selectedCommunity); }}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Regra
          </button>
        </div>

        {showRuleForm && (
          <form onSubmit={saveRule} className="p-5 border-b border-gray-200 space-y-3 bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-gray-900">{editingRule ? "Editar Regra" : "Nova Regra"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                required
                placeholder="Nome da regra"
                value={ruleForm.name}
                onChange={(e) => setRuleForm((p) => ({ ...p, name: e.target.value }))}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
              <select
                value={ruleForm.type}
                onChange={(e) => setRuleForm((p) => ({ ...p, type: e.target.value }))}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none"
              >
                <option value="PERCENTAGE" className="bg-white">Percentual (%)</option>
                <option value="FLAT_FEE" className="bg-white">Valor Fixo (R$)</option>
                <option value="TIERED" className="bg-white">Escalonado</option>
              </select>
              <input
                required
                type="number"
                step="0.01"
                placeholder={ruleForm.type === "PERCENTAGE" ? "Ex: 15 (para 15%)" : "Ex: 50 (R$)"}
                value={ruleForm.rate}
                onChange={(e) => setRuleForm((p) => ({ ...p, rate: e.target.value }))}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ruleForm.isActive}
                  onChange={(e) => setRuleForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded"
                />
                Regra ativa
              </label>
              <div className="flex gap-2 ml-auto">
                <button type="button" onClick={() => { setShowRuleForm(false); setEditingRule(null); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-900 border border-gray-200 rounded-xl transition-colors">
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button type="submit" disabled={ruleSaving} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all">
                  <Check className="w-3.5 h-3.5" /> {ruleSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </form>
        )}

        {rulesLoading ? (
          <div className="p-6 text-center text-sm text-gray-500">Carregando regras...</div>
        ) : commRules.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {selectedCommunity ? "Nenhuma regra configurada para esta comunidade." : "Selecione uma comunidade para ver as regras."}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {commRules.map((rule: any) => (
              <div key={rule.id} className="flex items-center gap-3 px-5 py-3 hover:bg-violet-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{rule.name}</p>
                  <p className="text-xs text-gray-500">
                    {COMM_TYPE_LABEL[rule.type] ?? rule.type} · Taxa: {Number(rule.rate)}{rule.type === "PERCENTAGE" ? "%" : " R$"}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${rule.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                  {rule.isActive ? "Ativa" : "Inativa"}
                </span>
                <button onClick={() => { setEditingRule(rule); setRuleForm({ name: rule.name, type: rule.type, rate: String(rule.rate), isActive: rule.isActive }); setShowRuleForm(true); }} className="p-1.5 text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteRule(rule.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commission Transactions */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Transações de Comissão</h2>
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
                <tr className="bg-white">
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
                    <tr key={tx.id} className="hover:bg-violet-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{tx.community?.name ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-400">
                        {tx.recipient ? `${tx.recipient.firstName} ${tx.recipient.lastName}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
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
