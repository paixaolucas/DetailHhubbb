"use client";

import { useState, useEffect } from "react";
import {
  DollarSign, TrendingUp, Users, Percent, ArrowUpRight,
  Plus, Trash2, Pencil, X, Check, Calendar, CreditCard, Smartphone,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
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

// Preços da plataforma
const PRECO_ANUAL = 837;      // R$837/ano
const PRECO_PIX = 837 / 12;   // R$69,75/mês (equivalente mensal do plano anual)
const COMISSAO = 0.15;        // 15% plataforma

const QUICK_PERIODS = [
  { key: "7d", label: "7 dias", days: 7 },
  { key: "15d", label: "15 dias", days: 15 },
  { key: "30d", label: "30 dias", days: 30 },
  { key: "1m", label: "1 mês", days: 30 },
  { key: "2m", label: "2 meses", days: 60 },
  { key: "3m", label: "3 meses", days: 90 },
  { key: "4m", label: "4 meses", days: 120 },
  { key: "5m", label: "5 meses", days: 150 },
];

// ── Mock data ──────────────────────────────────────────────────────────────────

function mockSeed(i: number, s: number) {
  return Math.abs(Math.sin(i * 11.3 + s * 8.7) * 1000) % 100;
}

function generateMockSeries(days: number) {
  const result: any[] = [];
  const base = new Date("2026-03-13");
  let annualRev = 21000;
  let pixRev = 14000;
  for (let i = days; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    annualRev = Math.max(12000, annualRev + (mockSeed(i, 1) - 47) * 220);
    pixRev = Math.max(8000, pixRev + (mockSeed(i, 2) - 50) * 160);
    result.push({
      date: d.toISOString().split("T")[0],
      revenue: Math.round(annualRev + pixRev),
      revenueAnual: Math.round(annualRev),
      revenuePix: Math.round(pixRev),
    });
  }
  return result;
}

// Membros fictícios com separação de tipo
const MOCK_INFLUENCERS = [
  { displayName: "Lucas Exotic",     communityName: "Exotic Cars Club",    annualMembers: 110, pixMembers: 68 },
  { displayName: "João Silva",       communityName: "Cars & Coffee SP",    annualMembers: 89,  pixMembers: 56 },
  { displayName: "Marcos Detailer",  communityName: "Detailing Pro BR",    annualMembers: 67,  pixMembers: 45 },
  { displayName: "Rafael Auto",      communityName: "Tuning Culture BR",   annualMembers: 52,  pixMembers: 32 },
  { displayName: "Pedro Moto",       communityName: "Motores & Mecânica",  annualMembers: 38,  pixMembers: 25 },
];

function calcInfluencer(inf: typeof MOCK_INFLUENCERS[0]) {
  const mrrAnual = (inf.annualMembers * PRECO_ANUAL) / 12;
  const mrrPix   = inf.pixMembers * PRECO_PIX;
  const mrrTotal = mrrAnual + mrrPix;
  const commAnual = mrrAnual * COMISSAO;
  const commPix   = mrrPix * COMISSAO;
  const netAnual  = mrrAnual - commAnual;
  const netPix    = mrrPix - commPix;
  return { mrrAnual, mrrPix, mrrTotal, commAnual, commPix, netAnual, netPix, commTotal: commAnual + commPix, netTotal: netAnual + netPix };
}

// ── Period Selector ────────────────────────────────────────────────────────────

function PeriodSelector({
  period, onChange, customStart, customEnd, onCustomApply,
}: {
  period: string;
  onChange: (p: string) => void;
  customStart: string;
  customEnd: string;
  onCustomApply: (s: string, e: string) => void;
}) {
  const [showCal, setShowCal] = useState(false);
  const [tmpStart, setTmpStart] = useState(customStart || "");
  const [tmpEnd, setTmpEnd] = useState(customEnd || "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center flex-wrap gap-1 glass-card p-1 rounded-xl">
        {QUICK_PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { onChange(key); setShowCal(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              period === key ? "bg-green-600 text-white" : "text-gray-400 hover:text-gray-900"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setShowCal((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            period === "custom" ? "bg-green-600 text-white" : "text-gray-400 hover:text-gray-900"
          }`}
        >
          <Calendar className="w-3 h-3" />
          {period === "custom" && customStart
            ? `${new Date(customStart).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} → ${new Date(customEnd).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
            : "Personalizado"}
        </button>
      </div>
      {showCal && (
        <div className="flex items-center gap-2 glass-card p-2 rounded-xl flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">De</span>
            <input
              type="date"
              value={tmpStart}
              max={tmpEnd || undefined}
              onChange={(e) => setTmpStart(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900 focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">até</span>
            <input
              type="date"
              value={tmpEnd}
              min={tmpStart || undefined}
              onChange={(e) => setTmpEnd(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900 focus:outline-none focus:border-green-500"
            />
          </div>
          <button
            onClick={() => { if (tmpStart && tmpEnd) { onCustomApply(tmpStart, tmpEnd); onChange("custom"); setShowCal(false); } }}
            disabled={!tmpStart || !tmpEnd}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          >
            Aplicar
          </button>
          <button onClick={() => setShowCal(false)} className="p-1.5 text-gray-400 hover:text-gray-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const [apiData, setApiData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [commTotal, setCommTotal] = useState(0);
  const [period, setPeriod] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [timeSeries, setTimeSeries] = useState<any[]>([]);

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
      fetch("/api/admin/commissions?pageSize=10", { headers }).then((r) => r.json()),
      fetch("/api/communities?pageSize=100", { headers }).then((r) => r.json()),
    ])
      .then(([comms, commsData]) => {
        if (comms.success) { setCommissions(comms.data.items ?? []); setCommTotal(comms.data.pagination?.total ?? 0); }
        if (commsData.success) {
          const list = commsData.data?.communities ?? commsData.data ?? [];
          setCommunities(list);
          if (list.length > 0) setSelectedCommunity(list[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Rebuild time series when period changes
  useEffect(() => {
    let days = QUICK_PERIODS.find((p) => p.key === period)?.days ?? 30;
    if (period === "custom" && customStart && customEnd) {
      const ms = new Date(customEnd).getTime() - new Date(customStart).getTime();
      days = Math.max(1, Math.round(ms / 86400000));
    }
    setTimeSeries(generateMockSeries(days));
  }, [period, customStart, customEnd]);

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
    } finally { setRulesLoading(false); }
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
      if (d.success) { setShowRuleForm(false); setEditingRule(null); setRuleForm({ name: "", type: "PERCENTAGE", rate: "", isActive: true }); loadRules(selectedCommunity); }
    } finally { setRuleSaving(false); }
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

  // ── Computed payment totals (reativos ao período) ────────────────────────────
  const days = (() => {
    if (period === "custom" && customStart && customEnd) {
      const ms = new Date(customEnd).getTime() - new Date(customStart).getTime();
      return Math.max(1, Math.round(ms / 86400000));
    }
    return QUICK_PERIODS.find((p) => p.key === period)?.days ?? 30;
  })();
  const periodScale = days / 30;
  const isMonthly   = days >= 28 && days <= 31;

  const totalAnnualMembers = MOCK_INFLUENCERS.reduce((s, i) => s + i.annualMembers, 0);
  const totalPixMembers    = MOCK_INFLUENCERS.reduce((s, i) => s + i.pixMembers, 0);

  // MRR base (sempre mensal — independe do período)
  const mrrAnualBase = (totalAnnualMembers * PRECO_ANUAL) / 12;
  const mrrPixBase   = totalPixMembers * PRECO_PIX;

  // Receita bruta escalada pelo período
  const receitaBrutaAnual = mrrAnualBase * periodScale;
  const receitaBrutaPix   = mrrPixBase   * periodScale;
  const receitaBrutaTotal = receitaBrutaAnual + receitaBrutaPix;

  // Comissão da plataforma
  const commPlataformaAnual = receitaBrutaAnual * COMISSAO;
  const commPlataformaPix   = receitaBrutaPix * COMISSAO;
  const commPlataformaTotal = commPlataformaAnual + commPlataformaPix;

  // Repasse ao influencer
  const repasseAnual = receitaBrutaAnual - commPlataformaAnual;
  const repassePix   = receitaBrutaPix - commPlataformaPix;
  const repasseTotal = repasseAnual + repassePix;

  const periodLabel = period === "custom"
    ? `${new Date(customStart).toLocaleDateString("pt-BR")} – ${new Date(customEnd).toLocaleDateString("pt-BR")}`
    : QUICK_PERIODS.find((p) => p.key === period)?.label ?? period;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-50 rounded-xl w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="flex justify-between"><div className="h-3 bg-gray-50 rounded w-24" /><div className="w-9 h-9 bg-gray-50 rounded-xl" /></div>
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
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
            <p className="text-gray-400 text-sm">Visão financeira · <span className="text-green-400">{periodLabel}</span></p>
          </div>
        </div>
        <PeriodSelector
          period={period}
          onChange={setPeriod}
          customStart={customStart}
          customEnd={customEnd}
          onCustomApply={(s, e) => { setCustomStart(s); setCustomEnd(e); }}
        />
      </div>

      {/* KPIs gerais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: isMonthly ? "MRR Total" : `Receita — ${days}d`,
            value: `R$ ${receitaBrutaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10",
          },
          {
            label: "Membros Ativos", value: (totalAnnualMembers + totalPixMembers).toLocaleString("pt-BR"),
            icon: Users, color: "text-violet-400", bg: "bg-violet-500/10",
          },
          {
            label: isMonthly ? "Repasse Influencers" : `Repasse — ${days}d`,
            value: `R$ ${repasseTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            icon: ArrowUpRight, color: "text-purple-400", bg: "bg-purple-500/10",
          },
          {
            label: `Comissão Plataforma (${(COMISSAO * 100).toFixed(0)}%)`,
            value: `R$ ${commPlataformaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            icon: Percent, color: "text-cyan-400", bg: "bg-cyan-500/10",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card p-5 hover:border-green-200 transition-all group">
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

      {/* ── Separação de Pagamentos ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-green-500 rounded-full" />
          Pagamentos por Tipo — <span className="text-green-400 font-normal">{periodLabel}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Anual */}
          <div className="glass-card p-5 border-l-4 border-blue-500/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Plano Anual</p>
                <p className="text-xs text-gray-500">R$ {PRECO_ANUAL.toLocaleString("pt-BR")}/ano por membro</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Assinantes ativos</span>
                <span className="font-semibold text-gray-900">{totalAnnualMembers.toLocaleString("pt-BR")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{isMonthly ? "Receita bruta (MRR)" : `Receita bruta (${days}d)`}</span>
                <span className="font-semibold text-green-400">
                  R$ {receitaBrutaAnual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Comissão plataforma (15%)</span>
                <span className="text-red-400">
                  − R$ {commPlataformaAnual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-900 font-semibold">Repasse líquido (influencers)</span>
                <span className="text-blue-400 font-bold">
                  R$ {repasseAnual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-3 p-2.5 bg-blue-500/5 rounded-xl border border-blue-500/10">
                <p className="text-xs text-blue-400 text-center">
                  Equivalente mensal por membro: <strong>R$ {(PRECO_ANUAL / 12).toFixed(2)}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* PIX Mensal */}
          <div className="glass-card p-5 border-l-4 border-emerald-500/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">PIX Mensal</p>
                <p className="text-xs text-gray-500">R$ {PRECO_PIX.toFixed(2).replace(".", ",")}/mês por membro</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Assinantes ativos</span>
                <span className="font-semibold text-gray-900">{totalPixMembers.toLocaleString("pt-BR")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{isMonthly ? "Receita bruta (MRR)" : `Receita bruta (${days}d)`}</span>
                <span className="font-semibold text-green-400">
                  R$ {receitaBrutaPix.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Comissão plataforma (15%)</span>
                <span className="text-red-400">
                  − R$ {commPlataformaPix.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-900 font-semibold">Repasse líquido (influencers)</span>
                <span className="text-emerald-400 font-bold">
                  R$ {repassePix.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-3 p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <p className="text-xs text-emerald-400 text-center">
                  Mesmo valor do plano anual fracionado: <strong>R$837 ÷ 12</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart (stacked) */}
      {timeSeries.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h2 className="text-base font-semibold text-gray-900">Receita por Tipo de Pagamento</h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Anual</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> PIX Mensal</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timeSeries}>
                <defs>
                  <linearGradient id="gradAnual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPix" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...chartStyle.grid} />
                <XAxis
                  dataKey="date"
                  {...chartStyle.axis}
                  tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                />
                <YAxis {...chartStyle.axis} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  {...chartStyle.tooltip}
                  formatter={(v: number, name: string) => [
                    `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                    name === "revenueAnual" ? "Anual" : "PIX Mensal",
                  ]}
                  labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                />
                <Area type="monotone" dataKey="revenueAnual" stackId="1" stroke="#3b82f6" fill="url(#gradAnual)" strokeWidth={2} />
                <Area type="monotone" dataKey="revenuePix"   stackId="1" stroke="#10b981" fill="url(#gradPix)"   strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Repasse por Influencer ───────────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Repasse por Influencer — Anual vs PIX Mensal</h2>
          <p className="text-xs text-gray-500 mt-1">
            Comissão de {(COMISSAO * 100).toFixed(0)}% · período de {days} dias · {isMonthly ? "valores mensais (MRR)" : `receita proporcional a ${days}d`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Influencer</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Membros Anuais</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Membros PIX</th>
                <th className="text-right text-xs font-medium text-blue-500 uppercase tracking-wide px-5 py-3">Repasse Anual</th>
                <th className="text-right text-xs font-medium text-emerald-500 uppercase tracking-wide px-5 py-3 hidden md:table-cell">Repasse PIX</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Total Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_INFLUENCERS.map((inf, i) => {
                const c = calcInfluencer(inf);
                const netAnualScaled = c.netAnual * periodScale;
                const netPixScaled   = c.netPix   * periodScale;
                return (
                  <tr key={i} className="hover:bg-green-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {inf.displayName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{inf.displayName}</p>
                          <p className="text-xs text-gray-500">{inf.communityName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-400 hidden sm:table-cell">
                      <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">{inf.annualMembers}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-400 hidden sm:table-cell">
                      <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">{inf.pixMembers}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-blue-400 font-medium">
                      R$ {netAnualScaled.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-right text-emerald-400 font-medium hidden md:table-cell">
                      R$ {netPixScaled.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-green-400">
                      R$ {(netAnualScaled + netPixScaled).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="bg-green-500/5 font-semibold">
                <td className="px-5 py-3 text-sm text-gray-900">Total Geral</td>
                <td className="px-5 py-3 text-right text-gray-500 hidden sm:table-cell">{totalAnnualMembers}</td>
                <td className="px-5 py-3 text-right text-gray-500 hidden sm:table-cell">{totalPixMembers}</td>
                <td className="px-5 py-3 text-right text-blue-400">
                  R$ {repasseAnual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3 text-right text-emerald-400 hidden md:table-cell">
                  R$ {repassePix.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3 text-right text-green-400 text-base">
                  R$ {repasseTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

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
                required placeholder="Nome da regra" value={ruleForm.name}
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
                required type="number" step="0.01"
                placeholder={ruleForm.type === "PERCENTAGE" ? "Ex: 15 (para 15%)" : "Ex: 50 (R$)"}
                value={ruleForm.rate}
                onChange={(e) => setRuleForm((p) => ({ ...p, rate: e.target.value }))}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={ruleForm.isActive} onChange={(e) => setRuleForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded" />
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
            {selectedCommunity ? "Nenhuma regra configurada para esta comunidade." : "Selecione uma comunidade."}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {commRules.map((rule: any) => (
              <div key={rule.id} className="flex items-center gap-3 px-5 py-3 hover:bg-violet-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{rule.name}</p>
                  <p className="text-xs text-gray-500">{COMM_TYPE_LABEL[rule.type] ?? rule.type} · Taxa: {Number(rule.rate)}{rule.type === "PERCENTAGE" ? "%" : " R$"}</p>
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
          {commTotal > 10 && <span className="text-xs text-gray-500">{commTotal} no total</span>}
        </div>
        {commissions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">Nenhuma transação encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white">
                  {["Comunidade", "Destinatário", "Bruto", "Taxa", "Líquido", "Status"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {commissions.map((tx: any) => {
                  const st = STATUS_LABEL[tx.status] ?? { label: tx.status, color: "text-gray-400" };
                  return (
                    <tr key={tx.id} className="hover:bg-green-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{tx.community?.name ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-400">{tx.recipient ? `${tx.recipient.firstName} ${tx.recipient.lastName}` : "—"}</td>
                      <td className="px-5 py-3 text-gray-600">R$ {Number(tx.grossAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3 text-red-400">R$ {Number(tx.platformFee).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3 text-green-400 font-semibold">R$ {Number(tx.netAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
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
