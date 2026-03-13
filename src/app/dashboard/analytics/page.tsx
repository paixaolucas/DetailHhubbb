"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import {
  TrendingUp, Users, DollarSign, Activity, Download,
  ArrowUpRight, ArrowDownRight, Zap, Calendar, X,
  CreditCard, Smartphone, Percent,
} from "lucide-react";

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

const PRECO_ANUAL = 837;
const PRECO_PIX   = 837 / 12; // R$69,75/mês
const COMISSAO    = 0.15;

const QUICK_PERIODS = [
  { key: "7d",  label: "7 dias",   days: 7 },
  { key: "15d", label: "15 dias",  days: 15 },
  { key: "30d", label: "30 dias",  days: 30 },
  { key: "1m",  label: "1 mês",    days: 30 },
  { key: "2m",  label: "2 meses",  days: 60 },
  { key: "3m",  label: "3 meses",  days: 90 },
  { key: "4m",  label: "4 meses",  days: 120 },
  { key: "5m",  label: "5 meses",  days: 150 },
];

function getDays(period: string, customStart: string, customEnd: string) {
  if (period === "custom" && customStart && customEnd) {
    const ms = new Date(customEnd).getTime() - new Date(customStart).getTime();
    return Math.max(1, Math.round(ms / 86400000));
  }
  return QUICK_PERIODS.find((p) => p.key === period)?.days ?? 30;
}

function mockSeed(i: number, s: number) {
  return Math.abs(Math.sin(i * 13.7 + s * 7.3) * 1000) % 100;
}

function generateMockSeries(days: number) {
  const result: any[] = [];
  const base = new Date("2026-03-13");
  let revAnual = 14000;
  let revPix   = 8000;
  let members  = 620;
  for (let i = days; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    revAnual = Math.max(9000, revAnual + (mockSeed(i, 1) - 48) * 120);
    revPix   = Math.max(5000, revPix   + (mockSeed(i, 2) - 50) * 90);
    members += Math.floor(mockSeed(i, 4) / 18);
    result.push({
      date: d.toISOString().split("T")[0],
      revenue: Math.round(revAnual + revPix),
      revenueAnual: Math.round(revAnual),
      revenuePix: Math.round(revPix),
      newSubscriptions: Math.floor(mockSeed(i, 3) / 11) + 1,
      activeMembers: members,
    });
  }
  return result;
}

// Dados do próprio influencer — escalam com o período
function generateMockSummary(days: number) {
  const scale          = days / 30;
  const annualMembers  = Math.round(89 + scale * 3);
  const pixMembers     = Math.round(56 + scale * 2);
  const mrrAnual       = (annualMembers * PRECO_ANUAL) / 12;
  const mrrPix         = pixMembers * PRECO_PIX;
  return {
    mrr: Math.round(mrrAnual + mrrPix),
    mrrAnual:          Math.round(mrrAnual),
    mrrPix:            Math.round(mrrPix),
    totalRevenue:      Math.round((mrrAnual + mrrPix) * scale),
    activeMembers:     annualMembers + pixMembers,
    annualMembers,
    pixMembers,
    newMembersInPeriod: Math.max(1, Math.round(scale * 8)),
    mrrGrowth:         8.4,
    revenueGrowth:     12.3,
    churnRate:         +Math.min(3.5, 1.8 * Math.sqrt(scale)).toFixed(2),
  };
}

// Dados por influencer para tabela do SUPER_ADMIN
const MOCK_INFLUENCER_STATS = [
  { displayName: "Lucas Exotic",    communityName: "Exotic Cars Club",   annualMembers: 110, pixMembers: 68, commissionRate: 0.15 },
  { displayName: "João Silva",      communityName: "Cars & Coffee SP",   annualMembers: 89,  pixMembers: 56, commissionRate: 0.15 },
  { displayName: "Marcos Detailer", communityName: "Detailing Pro BR",   annualMembers: 67,  pixMembers: 45, commissionRate: 0.15 },
  { displayName: "Rafael Auto",     communityName: "Tuning Culture BR",  annualMembers: 52,  pixMembers: 32, commissionRate: 0.15 },
  { displayName: "Pedro Moto",      communityName: "Motores & Mecânica", annualMembers: 38,  pixMembers: 25, commissionRate: 0.15 },
];

function calcInfluencer(inf: typeof MOCK_INFLUENCER_STATS[0], scale = 1) {
  const mrrAnual  = (inf.annualMembers * PRECO_ANUAL) / 12;
  const mrrPix    = inf.pixMembers * PRECO_PIX;
  const mrrTotal  = mrrAnual + mrrPix;
  const commAnual = mrrAnual * inf.commissionRate;
  const commPix   = mrrPix * inf.commissionRate;
  const netAnual  = (mrrAnual - commAnual) * scale;
  const netPix    = (mrrPix - commPix) * scale;
  return { mrrAnual: mrrAnual * scale, mrrPix: mrrPix * scale, mrrTotal: mrrTotal * scale, netAnual, netPix, netTotal: netAnual + netPix };
}

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

function PeriodSelector({
  period, onChange, customStart, customEnd, onCustomApply,
}: {
  period: string; onChange: (p: string) => void;
  customStart: string; customEnd: string;
  onCustomApply: (start: string, end: string) => void;
}) {
  const [showCal, setShowCal] = useState(false);
  const [tmpStart, setTmpStart] = useState(customStart || "");
  const [tmpEnd,   setTmpEnd]   = useState(customEnd   || "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center flex-wrap gap-1 glass-card p-1 rounded-xl">
        {QUICK_PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { onChange(key); setShowCal(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              period === key ? "bg-violet-600 text-white" : "text-gray-400 hover:text-gray-900"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setShowCal((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            period === "custom" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-gray-900"
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
            <input type="date" value={tmpStart} max={tmpEnd || undefined}
              onChange={(e) => setTmpStart(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">até</span>
            <input type="date" value={tmpEnd} min={tmpStart || undefined}
              onChange={(e) => setTmpEnd(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900 focus:outline-none focus:border-violet-500"
            />
          </div>
          <button
            onClick={() => { if (tmpStart && tmpEnd) { onCustomApply(tmpStart, tmpEnd); onChange("custom"); setShowCal(false); } }}
            disabled={!tmpStart || !tmpEnd}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
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

export default function AnalyticsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const communityId  = searchParams.get("communityId");

  const [data,         setData]         = useState<any>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [role,         setRole]         = useState<string>("");
  const [period,       setPeriod]       = useState("30d");
  const [customStart,  setCustomStart]  = useState("");
  const [customEnd,    setCustomEnd]    = useState("");
  const [events,       setEvents]       = useState<{ type: string; count: number }[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [eventsLoading,setEventsLoading]= useState(false);
  const [eventFilter,  setEventFilter]  = useState("");

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
          if (d.success) { setEvents(d.data?.typeCounts ?? []); setRecentEvents(d.data?.items ?? []); }
        })
        .finally(() => setEventsLoading(false));
    }
  }, []);

  useEffect(() => {
    if (!role) return;
    const token = localStorage.getItem("detailhub_access_token");
    const days  = getDays(period, customStart, customEnd);

    const endpoint = role === "SUPER_ADMIN"
      ? `/api/analytics/platform?days=${days}`
      : `/api/analytics/influencer?days=${days}`;

    setIsLoading(true);
    fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.summary?.activeMembers) {
          setData(d.data);
        } else {
          setData({
            summary: generateMockSummary(days),
            timeSeries: generateMockSeries(days),
            influencerStats: MOCK_INFLUENCER_STATS,
          });
        }
      })
      .catch(() => {
        setData({
          summary: generateMockSummary(days),
          timeSeries: generateMockSeries(days),
          influencerStats: MOCK_INFLUENCER_STATS,
        });
      })
      .finally(() => setIsLoading(false));
  }, [role, period, customStart, customEnd]);

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

  // ── Computados no render (reativos ao período) ────────────────────────────
  const days        = getDays(period, customStart, customEnd);
  const periodScale = days / 30;
  const isMonthly   = days >= 28 && days <= 31;
  const revenueLabel = isMonthly ? "MRR (mensal)" : `Receita — ${days}d`;

  const summary        = data?.summary;
  const timeSeries     = data?.timeSeries ?? [];
  const influencerStats= data?.influencerStats ?? [];

  const periodLabel = period === "custom"
    ? `${new Date(customStart).toLocaleDateString("pt-BR")} – ${new Date(customEnd).toLocaleDateString("pt-BR")}`
    : QUICK_PERIODS.find((p) => p.key === period)?.label ?? period;

  // Dados do influencer escalados pelo período
  const myAnual     = summary?.annualMembers ?? 89;
  const myPix       = summary?.pixMembers    ?? 56;
  const myMrrAnual  = (myAnual * PRECO_ANUAL) / 12;
  const myMrrPix    = myPix * PRECO_PIX;
  const myRevAnual  = myMrrAnual * periodScale;
  const myRevPix    = myMrrPix   * periodScale;
  const myCommAnual = myRevAnual * COMISSAO;
  const myCommPix   = myRevPix   * COMISSAO;
  const myNetAnual  = myRevAnual - myCommAnual;
  const myNetPix    = myRevPix   - myCommPix;
  const myNetTotal  = myNetAnual + myNetPix;
  const myRevTotal  = myRevAnual + myRevPix;
  const myCommTotal = myCommAnual + myCommPix;

  function exportCSV() {
    const rows = [["Data", "Receita Anual (R$)", "Receita PIX (R$)", "Membros Ativos", "Novas Assinaturas"]];
    timeSeries.forEach((row: any) =>
      rows.push([row.date, String(row.revenueAnual ?? 0), String(row.revenuePix ?? 0),
                 String(row.activeMembers ?? 0), String(row.newSubscriptions ?? 0)])
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `analytics_${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">
            {role === "SUPER_ADMIN" ? "Métricas da plataforma" : "Sua comunidade"} · <span className="text-violet-400">{periodLabel}</span>
            {communityId && data?.communities && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
                {data.communities.find((c: any) => c.id === communityId)?.name ?? "Comunidade"}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodSelector period={period} onChange={setPeriod}
            customStart={customStart} customEnd={customEnd}
            onCustomApply={(s, e) => { setCustomStart(s); setCustomEnd(e); }} />
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 glass-card hover:border-violet-200 text-gray-600 hover:text-gray-900 text-sm font-medium transition-all rounded-xl">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label={revenueLabel}
          value={`R$ ${Math.round((summary?.mrr ?? 0) * periodScale).toLocaleString("pt-BR")}`}
          sub={isMonthly ? "vs mês anterior" : `equiv. R$ ${(summary?.mrr ?? 0).toLocaleString("pt-BR")}/mês`}
          icon={DollarSign}
          trend={summary?.mrrGrowth ? `${summary.mrrGrowth >= 0 ? "+" : ""}${summary.mrrGrowth.toFixed(1)}%` : undefined}
          trendPositive={(summary?.mrrGrowth ?? 0) >= 0}
        />
        <KpiCard
          label="Membros Ativos"
          value={(summary?.activeMembers ?? 0).toLocaleString("pt-BR")}
          sub={`+${summary?.newMembersInPeriod ?? 0} em ${days} dias`}
          icon={Users}
          trend={summary?.newMembersInPeriod ? `+${summary.newMembersInPeriod}` : undefined}
          trendPositive
        />
        <KpiCard
          label={role === "SUPER_ADMIN" ? "Receita no Período" : "Repasse no Período"}
          value={role === "SUPER_ADMIN"
            ? `R$ ${Math.round((summary?.totalRevenue ?? 0)).toLocaleString("pt-BR")}`
            : `R$ ${myNetTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          sub={role === "SUPER_ADMIN" ? `Acumulado ${days} dias` : "Após comissão de 15%"}
          icon={TrendingUp}
          trend={summary?.revenueGrowth ? `${summary.revenueGrowth >= 0 ? "+" : ""}${summary.revenueGrowth.toFixed(1)}%` : undefined}
          trendPositive={(summary?.revenueGrowth ?? 0) >= 0}
        />
        <KpiCard
          label="Churn Rate"
          value={`${summary?.churnRate?.toFixed(2) ?? "0.00"}%`}
          sub={`No período de ${days} dias`}
          icon={Activity}
        />
      </div>

      {/* ── Pagamentos por Tipo (INFLUENCER_ADMIN) ─────────────────────────────── */}
      {role !== "SUPER_ADMIN" && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-violet-500 rounded-full" />
            Pagamentos por Tipo — <span className="text-violet-400 font-normal">{periodLabel}</span>
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
                  <p className="text-xs text-gray-500">R$ {PRECO_ANUAL.toLocaleString("pt-BR")}/ano · {myAnual} membros</p>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Assinantes ativos</span>
                  <span className="font-semibold text-gray-900">{myAnual}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{isMonthly ? "Receita bruta (MRR)" : `Receita bruta (${days}d)`}</span>
                  <span className="font-semibold text-blue-400">
                    R$ {myRevAnual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Comissão plataforma (15%)</span>
                  <span className="text-red-400">
                    − R$ {myCommAnual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-900 font-semibold">Seu repasse líquido</span>
                  <span className="text-blue-400 font-bold">
                    R$ {myNetAnual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
                  <p className="text-xs text-gray-500">R$ {PRECO_PIX.toFixed(2).replace(".", ",")}/mês · {myPix} membros</p>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Assinantes ativos</span>
                  <span className="font-semibold text-gray-900">{myPix}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{isMonthly ? "Receita bruta (MRR)" : `Receita bruta (${days}d)`}</span>
                  <span className="font-semibold text-emerald-400">
                    R$ {myRevPix.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Comissão plataforma (15%)</span>
                  <span className="text-red-400">
                    − R$ {myCommPix.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-900 font-semibold">Seu repasse líquido</span>
                  <span className="text-emerald-400 font-bold">
                    R$ {myNetPix.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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

          {/* Resumo total */}
          <div className="mt-4 glass-card p-4 flex flex-wrap items-center justify-between gap-4 border-violet-500/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-500/10 rounded-xl flex items-center justify-center">
                <Percent className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{isMonthly ? "Receita bruta total (MRR)" : `Receita bruta (${days}d)`}</p>
                <p className="text-sm font-bold text-gray-900">
                  R$ {myRevTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Comissão plataforma (15%)</p>
              <p className="text-sm font-semibold text-red-400">
                − R$ {myCommTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{isMonthly ? "Repasse líquido total" : `Repasse líquido (${days}d)`}</p>
              <p className="text-xl font-bold text-violet-400">
                R$ {myNetTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">{myAnual + myPix} membros · {myAnual} anuais + {myPix} PIX</p>
            </div>
          </div>
        </div>
      )}

      {/* Stacked Revenue Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h2 className="text-base font-semibold text-gray-900">
            Receita por Tipo de Pagamento — {periodLabel}
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Anual</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> PIX Mensal</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
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
            <XAxis dataKey="date" {...chartStyle.axis}
              tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} />
            <YAxis {...chartStyle.axis} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              {...chartStyle.tooltip}
              formatter={(v: number, name: string) => [
                `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                name === "revenueAnual" ? "Anual" : "PIX Mensal",
              ]}
              labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            />
            <Area type="monotone" dataKey="revenueAnual" stackId="1" stroke="#3b82f6" fill="url(#gradAnual)" strokeWidth={2} name="revenueAnual" />
            <Area type="monotone" dataKey="revenuePix"   stackId="1" stroke="#10b981" fill="url(#gradPix)"   strokeWidth={2} name="revenuePix" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Members growth chart */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Crescimento de Membros</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={timeSeries}>
            <defs>
              <linearGradient id="membersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...chartStyle.grid} />
            <XAxis dataKey="date" {...chartStyle.axis}
              tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} />
            <YAxis {...chartStyle.axis} />
            <Tooltip {...chartStyle.tooltip} />
            <Area type="monotone" dataKey="activeMembers" stroke="#10b981" fill="url(#membersGrad)" strokeWidth={2} name="Membros Ativos" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Novas assinaturas por dia */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Novas Assinaturas por Dia</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={timeSeries}>
            <CartesianGrid {...chartStyle.grid} />
            <XAxis dataKey="date" {...chartStyle.axis}
              tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} />
            <YAxis {...chartStyle.axis} />
            <Tooltip {...chartStyle.tooltip} formatter={(v: number) => [v, "Novas assinaturas"]} />
            <Bar dataKey="newSubscriptions" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Novas assinaturas" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Analytics Events (SUPER_ADMIN) */}
      {role === "SUPER_ADMIN" && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h2 className="text-base font-semibold text-gray-900">Eventos Recentes</h2>
            </div>
            <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-violet-400">
              <option value="" className="bg-white">Todos os tipos</option>
              {events.map((e) => (
                <option key={e.type} value={e.type} className="bg-white">{e.type} ({e.count})</option>
              ))}
            </select>
          </div>
          {events.length > 0 && (
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2">
              {events.slice(0, 8).map((e) => (
                <span key={e.type} onClick={() => setEventFilter(eventFilter === e.type ? "" : e.type)}
                  className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                    eventFilter === e.type
                      ? "bg-violet-600/30 border-violet-500/50 text-violet-300"
                      : "bg-white border-gray-200 text-gray-400 hover:border-violet-200 hover:text-gray-900"
                  }`}>
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
              {recentEvents.filter((e) => !eventFilter || e.type === eventFilter).slice(0, 15).map((e) => (
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
                    {e.community && <span className="text-xs text-gray-500 ml-2">· {e.community.name}</span>}
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

      {/* Tabela de influencers (SUPER_ADMIN) — com breakdown anual/PIX escalado pelo período */}
      {role === "SUPER_ADMIN" && (
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Receita por Influenciador — Anual vs PIX Mensal</h2>
            <p className="text-xs text-gray-500 mt-1">
              Comissão de 15% · período de {days} dias · {isMonthly ? "valores mensais (MRR)" : `receita proporcional a ${days}d`}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Influenciador</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Anuais</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">PIX</th>
                  <th className="text-right text-xs font-medium text-blue-500 uppercase tracking-wide px-5 py-3">Repasse Anual</th>
                  <th className="text-right text-xs font-medium text-emerald-500 uppercase tracking-wide px-5 py-3 hidden md:table-cell">Repasse PIX</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Total Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {influencerStats.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500 text-sm">Nenhum dado disponível</td></tr>
                ) : (
                  influencerStats.map((inf: any, i: number) => {
                    const c = calcInfluencer(inf, periodScale);
                    return (
                      <tr key={i} className="hover:bg-violet-50 transition-colors">
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
                        <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                          <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">{inf.annualMembers}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                          <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">{inf.pixMembers}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-blue-400 font-medium">
                          R$ {c.netAnual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5 text-right text-emerald-400 font-medium hidden md:table-cell">
                          R$ {c.netPix.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-violet-400">
                          R$ {c.netTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
                {influencerStats.length > 0 && (
                  <tr className="bg-violet-500/5 font-semibold">
                    <td className="px-5 py-3 text-sm text-gray-900">Total Geral</td>
                    <td className="px-5 py-3 text-right text-blue-400 hidden sm:table-cell">
                      {influencerStats.reduce((s: number, inf: any) => s + (inf.annualMembers ?? 0), 0)}
                    </td>
                    <td className="px-5 py-3 text-right text-emerald-400 hidden sm:table-cell">
                      {influencerStats.reduce((s: number, inf: any) => s + (inf.pixMembers ?? 0), 0)}
                    </td>
                    <td className="px-5 py-3 text-right text-blue-400">
                      R$ {influencerStats.reduce((s: number, inf: any) => s + calcInfluencer(inf, periodScale).netAnual, 0)
                        .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-right text-emerald-400 hidden md:table-cell">
                      R$ {influencerStats.reduce((s: number, inf: any) => s + calcInfluencer(inf, periodScale).netPix, 0)
                        .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-right text-violet-400 text-base">
                      R$ {influencerStats.reduce((s: number, inf: any) => s + calcInfluencer(inf, periodScale).netTotal, 0)
                        .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
