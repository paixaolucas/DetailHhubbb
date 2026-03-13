"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Trophy,
  ArrowUpRight,
  UserPlus,
  Award,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FinanceiroSummary {
  activeReferred: number;
  totalReferred: number;
  newThisMonth: number;
  annualMembersCount: number;
  monthlyMembersCount: number;
  projectedMonthlyCommission: number;
  annualRenewalCommission: number;
  totalEarnings: number;
  pendingPayout: number;
  retentionRate: number;
  churnRate: number;
  rank: number;
  totalInfluencers: number;
  monthlyTicket: number;
  annualTicket: number;
}

interface BadgeInfo {
  name: string;
  threshold: number;
  color: string;
}

interface FinanceiroData {
  summary: FinanceiroSummary;
  monthlyHistory: { month: string; newMembers: number; commission: number }[];
  badge: {
    current: BadgeInfo | null;
    next: (BadgeInfo & { membersNeeded: number; progress: number }) | null;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const chartStyle = {
  grid: { strokeDasharray: "3 3", stroke: "rgba(0,0,0,0.06)" },
  axis: { tick: { fontSize: 11, fill: "#9ca3af" }, tickLine: false, axisLine: false },
  tooltip: {
    contentStyle: {
      backgroundColor: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      fontSize: "13px",
      color: "#111827",
    },
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
  highlight = false,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`glass-card p-5 ${
        highlight ? "border-green-200 bg-green-50/50" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            accent ? "bg-blue-500/10" : highlight ? "bg-green-500/10" : "bg-violet-500/10"
          }`}
        >
          <Icon
            className={`w-4 h-4 ${
              accent ? "text-blue-500" : highlight ? "text-green-500" : "text-violet-500"
            }`}
          />
        </div>
      </div>
      <p
        className={`text-2xl font-bold mb-1 ${
          highlight ? "text-green-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card p-5 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-3 bg-gray-100 rounded w-20" />
        <div className="w-8 h-8 bg-gray-100 rounded-xl" />
      </div>
      <div className="h-7 bg-gray-100 rounded w-28" />
      <div className="h-3 bg-gray-100 rounded w-24" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    fetch("/api/influencers/me/financeiro", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.error ?? "Erro ao carregar dados");
      })
      .catch(() => setError("Erro de conexão"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-100 rounded-xl w-40 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="glass-card p-6 h-64 animate-pulse bg-gray-50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center text-gray-500 text-sm">{error}</div>
    );
  }

  if (!data) return null;

  const { summary, monthlyHistory, badge } = data;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
          <p className="text-gray-400 text-sm mt-1">
            Sua comissão, membros captados e posição no ranking
          </p>
        </div>
        {/* Rank badge */}
        <div className="flex items-center gap-2 glass-card px-4 py-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-semibold text-gray-900">
            #{summary.rank}
            <span className="text-gray-400 font-normal"> de {summary.totalInfluencers} influenciadores</span>
          </span>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Comissão Mensal"
          value={fmt(summary.projectedMonthlyCommission)}
          sub={
            summary.monthlyMembersCount > 0
              ? `35% × ${summary.monthlyMembersCount} mensal${summary.monthlyMembersCount !== 1 ? "is" : ""} × ${fmt(summary.monthlyTicket)}`
              : summary.annualMembersCount > 0
              ? "Todos seus membros são plano anual (à vista)"
              : "Nenhum membro ativo ainda"
          }
          icon={DollarSign}
          highlight
        />
        <KpiCard
          label="Membros Ativos"
          value={summary.activeReferred.toString()}
          sub={`+${summary.newThisMonth} esse mês`}
          icon={Users}
        />
        <KpiCard
          label="Retenção"
          value={`${summary.retentionRate.toFixed(1)}%`}
          sub={`Churn: ${summary.churnRate.toFixed(1)}% este mês`}
          icon={summary.retentionRate >= 80 ? TrendingUp : TrendingDown}
          accent
        />
        <KpiCard
          label="Total Captados"
          value={summary.totalReferred.toString()}
          sub="Todos os tempos"
          icon={UserPlus}
        />
      </div>

      {/* Breakdown anual vs mensal */}
      {summary.activeReferred > 0 && (
        <div className="glass-card p-4 flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span className="text-gray-500">À vista (anual):</span>
            <span className="font-semibold text-gray-900">{summary.annualMembersCount} membros</span>
            {summary.annualMembersCount > 0 && (
              <span className="text-gray-400">
                — comissão de {fmt(summary.annualRenewalCommission)} na renovação
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
            <span className="text-gray-500">Mensal (recorrente):</span>
            <span className="font-semibold text-gray-900">{summary.monthlyMembersCount} membros</span>
            {summary.monthlyMembersCount > 0 && (
              <span className="text-gray-400">
                — {fmt(summary.projectedMonthlyCommission)}/mês
              </span>
            )}
          </div>
        </div>
      )}

      {/* Earnings row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Total Ganho (histórico)
          </p>
          <p className="text-3xl font-bold text-gray-900">{fmt(summary.totalEarnings)}</p>
          <p className="text-xs text-gray-400 mt-1">Acumulado desde o início</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Aguardando Pagamento
          </p>
          <p className="text-3xl font-bold text-blue-600">{fmt(summary.pendingPayout)}</p>
          <p className="text-xs text-gray-400 mt-1">Pago no dia 15 do mês seguinte</p>
        </div>
      </div>

      {/* Monthly history chart */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          Novos Membros & Comissão — últimos 6 meses
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyHistory} barGap={4}>
            <CartesianGrid {...chartStyle.grid} />
            <XAxis dataKey="month" {...chartStyle.axis} />
            <YAxis yAxisId="members" {...chartStyle.axis} allowDecimals={false} />
            <YAxis
              yAxisId="commission"
              orientation="right"
              {...chartStyle.axis}
              tickFormatter={(v) => `R$${v}`}
            />
            <Tooltip
              {...chartStyle.tooltip}
              formatter={(value: number, name: string) =>
                name === "Comissão (R$)" ? [fmt(value), name] : [value, name]
              }
            />
            <Bar
              yAxisId="members"
              dataKey="newMembers"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              name="Novos membros"
            />
            <Bar
              yAxisId="commission"
              dataKey="commission"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="Comissão (R$)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Badge progress */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-violet-500" />
          <h2 className="text-base font-semibold text-gray-900">Progresso de Badge</h2>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          {/* Current badge */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Badge atual</p>
            {badge.current ? (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 mx-auto"
                style={{ borderColor: badge.current.color, color: badge.current.color, backgroundColor: `${badge.current.color}15` }}
              >
                {badge.current.name === "Bronze" ? "🥉" : badge.current.name === "Prata" ? "🥈" : "🥇"}
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-2xl mx-auto">
                —
              </div>
            )}
            <p className="text-xs font-medium text-gray-600 mt-1.5">
              {badge.current?.name ?? "Nenhum"}
            </p>
          </div>

          {/* Progress bar to next badge */}
          {badge.next && (
            <div className="flex-1 min-w-48">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-900">
                  Próximo: {badge.next.name}
                </p>
                <p className="text-xs text-gray-500">
                  {summary.activeReferred} / {badge.next.threshold} membros
                </p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(badge.next.progress, 100)}%`,
                    backgroundColor: badge.next.color,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Faltam {badge.next.membersNeeded} membros ativos para {badge.next.name}
              </p>
            </div>
          )}

          {/* All badges overview */}
          {!badge.next && (
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold text-yellow-500">Parabéns! Você atingiu o nível máximo.</p>
              <p className="text-xs text-gray-400 mt-1">Mantenha 500+ membros ativos para manter o Ouro.</p>
            </div>
          )}
        </div>

        {/* Badges roadmap */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { name: "Bronze", threshold: 50, emoji: "🥉", color: "#cd7f32" },
            { name: "Prata", threshold: 200, emoji: "🥈", color: "#a8a9ad" },
            { name: "Ouro", threshold: 500, emoji: "🥇", color: "#ffd700" },
          ].map((b) => {
            const achieved = summary.activeReferred >= b.threshold;
            return (
              <div
                key={b.name}
                className={`rounded-xl p-3 text-center border transition-all ${
                  achieved
                    ? "border-opacity-50 bg-opacity-10"
                    : "border-gray-100 bg-gray-50 opacity-50"
                }`}
                style={achieved ? { borderColor: b.color, backgroundColor: `${b.color}10` } : {}}
              >
                <span className="text-2xl">{b.emoji}</span>
                <p className="text-xs font-semibold mt-1" style={achieved ? { color: b.color } : {}}>
                  {b.name}
                </p>
                <p className="text-xs text-gray-400">{b.threshold} membros</p>
                {achieved && (
                  <span className="text-xs text-green-500 font-medium">Conquistado</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Commission info footer */}
      <div className="glass-card p-4 flex items-start gap-3">
        <ArrowUpRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong className="text-gray-700">Como funciona:</strong> você recebe 35% de cada pagamento dos membros que trouxe via seu link de convite.{" "}
          <strong className="text-gray-600">Plano anual (à vista):</strong> a comissão entra de uma vez (35% de {fmt(summary.annualTicket)}).{" "}
          <strong className="text-gray-600">Plano mensal:</strong> a comissão entra todo mês (35% de {fmt(summary.monthlyTicket)}).{" "}
          O pagamento é feito no dia 15 do mês seguinte. Um holdback de 20% é retido por 30 dias para proteção contra chargebacks.
        </p>
      </div>
    </div>
  );
}
