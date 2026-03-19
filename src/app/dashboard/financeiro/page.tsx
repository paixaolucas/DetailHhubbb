"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, Users, TrendingUp, TrendingDown, Trophy,
  ArrowUpRight, UserPlus, Award, CreditCard, Repeat,
} from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";

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

interface RecentPayment {
  id: string;
  memberName: string;
  type: "annual" | "monthly";
  typeLabel: string;
  amount: number;
  commission: number;
  createdAt: string;
}

interface FinanceiroData {
  summary: FinanceiroSummary;
  monthlyHistory: { month: string; newMembers: number; commission: number; annualNew: number; monthlyNew: number }[];
  recentPayments: RecentPayment[];
  badge: {
    current: BadgeInfo | null;
    next: (BadgeInfo & { membersNeeded: number; progress: number }) | null;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
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
  label, value, sub, icon: Icon, accent = false, highlight = false,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; accent?: boolean; highlight?: boolean;
}) {
  return (
    <div className={`glass-card p-5 ${highlight ? "border-green-200 bg-green-50/50" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ? "bg-blue-500/10" : highlight ? "bg-green-500/10" : "bg-[#007A99]/10"}`}>
          <Icon className={`w-4 h-4 ${accent ? "text-blue-500" : highlight ? "text-green-500" : "text-[#007A99]"}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold mb-1 ${highlight ? "text-green-600" : "text-[#EEE6E4]"}`}>{value}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card p-5 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-3 bg-white/10 rounded w-20" />
        <div className="w-8 h-8 bg-white/10 rounded-xl" />
      </div>
      <div className="h-7 bg-white/10 rounded w-28" />
      <div className="h-3 bg-white/10 rounded w-24" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"visao-geral" | "pagamentos">("visao-geral");

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
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
        <div className="h-8 bg-white/10 rounded-xl w-40 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="glass-card p-6 h-64 animate-pulse bg-white/5" />
      </div>
    );
  }

  if (error) return <div className="glass-card p-8 text-center text-gray-500 text-sm">{error}</div>;
  if (!data) return null;

  const { summary, monthlyHistory, recentPayments, badge } = data;

  const annualCommissionPerMember = summary.annualTicket * 0.35;
  const monthlyCommissionPerMember = summary.monthlyTicket * 0.35;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#EEE6E4]">Dashboard Financeiro</h1>
          <p className="text-gray-400 text-sm mt-1">Sua comissão, membros captados e posição no ranking</p>
        </div>
        <div className="flex items-center gap-2 glass-card px-4 py-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-semibold text-[#EEE6E4]">
            #{summary.rank}
            <span className="text-gray-400 font-normal"> de {summary.totalInfluencers} influenciadores</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass-card p-1 rounded-xl w-fit">
        {(["visao-geral", "pagamentos"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? "bg-[#006079] text-white shadow-sm" : "text-gray-500 hover:text-[#EEE6E4]"
            }`}
          >
            {t === "visao-geral" ? "Visão Geral" : "Pagamentos"}
          </button>
        ))}
      </div>

      {/* ── Aba: Visão Geral ────────────────────────────────────────────────── */}
      {tab === "visao-geral" && (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Comissão Mensal"
              value={fmt(summary.projectedMonthlyCommission)}
              sub={
                summary.monthlyMembersCount > 0
                  ? `35% × ${summary.monthlyMembersCount} mensal${summary.monthlyMembersCount !== 1 ? "is" : ""} × ${fmt(summary.monthlyTicket)}`
                  : summary.annualMembersCount > 0
                  ? "Membros anuais — veja aba Pagamentos"
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

          {/* Earnings row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Ganho (histórico)</p>
              <p className="text-3xl font-bold text-[#EEE6E4]">{fmt(summary.totalEarnings)}</p>
              <p className="text-xs text-gray-400 mt-1">Acumulado desde o início</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Aguardando Pagamento</p>
              <p className="text-3xl font-bold text-blue-600">{fmt(summary.pendingPayout)}</p>
              <p className="text-xs text-gray-400 mt-1">Pago no dia 15 do mês seguinte</p>
            </div>
          </div>

          {/* Monthly history chart */}
          <div className="glass-card p-6">
            <h2 className="text-base font-semibold text-[#EEE6E4] mb-5">
              Novos Membros & Comissão — últimos 6 meses
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyHistory} barGap={4}>
                <CartesianGrid {...chartStyle.grid} />
                <XAxis dataKey="month" {...chartStyle.axis} />
                <YAxis yAxisId="members" {...chartStyle.axis} allowDecimals={false} />
                <YAxis yAxisId="commission" orientation="right" {...chartStyle.axis} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  {...chartStyle.tooltip}
                  formatter={(value: number, name: string) =>
                    name === "Comissão (R$)" ? [fmt(value), name] : [value, name]
                  }
                />
                <Bar yAxisId="members" dataKey="newMembers" fill="#009CD9" radius={[4, 4, 0, 0]} name="Novos membros" />
                <Bar yAxisId="commission" dataKey="commission" fill="#10b981" radius={[4, 4, 0, 0]} name="Comissão (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Badge progress */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-[#007A99]" />
              <h2 className="text-base font-semibold text-[#EEE6E4]">Progresso de Badge</h2>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
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
                  <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-dashed border-gray-300 flex items-center justify-center text-2xl mx-auto">—</div>
                )}
                <p className="text-xs font-medium text-gray-400 mt-1.5">{badge.current?.name ?? "Nenhum"}</p>
              </div>
              {badge.next && (
                <div className="flex-1 min-w-48">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-[#EEE6E4]">Próximo: {badge.next.name}</p>
                    <p className="text-xs text-gray-500">{summary.activeReferred} / {badge.next.threshold} membros</p>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(badge.next.progress, 100)}%`, backgroundColor: badge.next.color }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Faltam {badge.next.membersNeeded} membros ativos para {badge.next.name}</p>
                </div>
              )}
              {!badge.next && (
                <div className="flex-1 text-center">
                  <p className="text-sm font-semibold text-yellow-500">Parabéns! Você atingiu o nível máximo.</p>
                  <p className="text-xs text-gray-400 mt-1">Mantenha 500+ membros ativos para manter o Ouro.</p>
                </div>
              )}
            </div>
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
                    className={`rounded-xl p-3 text-center border transition-all ${achieved ? "border-opacity-50 bg-opacity-10" : "border-white/5 bg-white/5 opacity-50"}`}
                    style={achieved ? { borderColor: b.color, backgroundColor: `${b.color}10` } : {}}
                  >
                    <span className="text-2xl">{b.emoji}</span>
                    <p className="text-xs font-semibold mt-1" style={achieved ? { color: b.color } : {}}>{b.name}</p>
                    <p className="text-xs text-gray-400">{b.threshold} membros</p>
                    {achieved && <span className="text-xs text-green-500 font-medium">Conquistado</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Commission info footer */}
          <div className="glass-card p-4 flex items-start gap-3">
            <ArrowUpRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong className="text-gray-300">Como funciona:</strong> você recebe 35% de cada pagamento dos membros que indicou.{" "}
              <strong className="text-gray-400">Plano anual (cartão à vista):</strong> comissão de {fmt(annualCommissionPerMember)} entra de uma vez por membro (35% de {fmt(summary.annualTicket)}).{" "}
              <strong className="text-gray-400">Plano mensal (PIX/recorrente):</strong> comissão de {fmt(monthlyCommissionPerMember)}/mês por membro ativo (35% de {fmt(summary.monthlyTicket)}).{" "}
              Pagamento no dia 15 do mês seguinte. Holdback de 20% retido por 30 dias (proteção contra chargebacks).
            </p>
          </div>
        </>
      )}

      {/* ── Aba: Pagamentos ─────────────────────────────────────────────────── */}
      {tab === "pagamentos" && (
        <>
          {/* Dois cards lado a lado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Cartão à Vista (Anual) */}
            <div className="glass-card p-5 border-blue-200/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#EEE6E4]">Cartão à Vista (Anual)</p>
                  <p className="text-xs text-gray-400">Pagamento único por ano</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#EEE6E4] mb-1">{summary.annualMembersCount}</p>
              <p className="text-xs text-gray-500 mb-4">membros ativos nesse plano</p>
              <div className="space-y-2 text-sm border-t border-white/5 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ticket por membro</span>
                  <span className="font-semibold text-[#EEE6E4]">{fmt(summary.annualTicket)}/ano</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Comissão por membro</span>
                  <span className="font-semibold text-blue-600">{fmt(annualCommissionPerMember)}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-2">
                  <span className="text-gray-500">Comissão total na renovação</span>
                  <span className="font-bold text-blue-600">{fmt(summary.annualRenewalCommission)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Comissão entra toda de uma vez quando cada membro renova ou quando um novo membro indica entra.
              </p>
            </div>

            {/* PIX / Mensal (Recorrente) */}
            <div className="glass-card p-5 border-[#99D3DF]/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#007A99]/10 flex items-center justify-center">
                  <Repeat className="w-4 h-4 text-[#007A99]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#EEE6E4]">PIX / Mensal (Recorrente)</p>
                  <p className="text-xs text-gray-400">Cobrança todo mês</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#EEE6E4] mb-1">{summary.monthlyMembersCount}</p>
              <p className="text-xs text-gray-500 mb-4">membros ativos nesse plano</p>
              <div className="space-y-2 text-sm border-t border-white/5 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ticket por membro</span>
                  <span className="font-semibold text-[#EEE6E4]">{fmt(summary.monthlyTicket)}/mês</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Comissão por membro/mês</span>
                  <span className="font-semibold text-[#006079]">{fmt(monthlyCommissionPerMember)}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-2">
                  <span className="text-gray-500">Comissão mensal total</span>
                  <span className="font-bold text-[#006079]">{fmt(summary.projectedMonthlyCommission)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Comissão recorrente enquanto o membro mantiver a assinatura ativa.
              </p>
            </div>
          </div>

          {/* Resumo combinado */}
          <div className="glass-card p-4 bg-white/5/50">
            <div className="flex flex-wrap gap-6 items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-500">Total membros ativos: </span>
                <span className="font-semibold text-[#EEE6E4]">{summary.activeReferred}</span>
                <span className="text-gray-400 ml-2">
                  ({summary.annualMembersCount} anuais + {summary.monthlyMembersCount} mensais)
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Comissão mensal recorrente: </span>
                <span className="font-semibold text-green-600">{fmt(summary.projectedMonthlyCommission)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Comissão projetada nas renovações anuais: </span>
                <span className="font-semibold text-blue-600">{fmt(summary.annualRenewalCommission)}</span>
              </div>
            </div>
          </div>

          {/* Tabela de pagamentos recentes */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h2 className="text-base font-semibold text-[#EEE6E4]">Pagamentos Recentes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Últimos 20 pagamentos dos membros que você indicou</p>
            </div>
            {recentPayments.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">Nenhum pagamento encontrado ainda.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5/50">
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Data</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Membro</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Valor Pago</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Sua Comissão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {recentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                        <td className="px-5 py-3 font-medium text-[#EEE6E4]">{p.memberName}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                            p.type === "annual"
                              ? "bg-blue-50 text-blue-600 border border-blue-100"
                              : "bg-[#E6F4F7] text-[#006079] border border-[#CCE9EF]"
                          }`}>
                            {p.type === "annual"
                              ? <><CreditCard className="w-3 h-3" /> Anual (cartão)</>
                              : <><Repeat className="w-3 h-3" /> Mensal (PIX/rec.)</>
                            }
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-[#EEE6E4]">{fmt(p.amount)}</td>
                        <td className="px-5 py-3 text-right font-semibold text-green-600">{fmt(p.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Nota explicativa */}
          <div className="glass-card p-4 flex items-start gap-3">
            <ArrowUpRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong className="text-gray-300">Cartão à Vista (Anual):</strong> o membro paga {fmt(summary.annualTicket)} de uma vez. Você recebe {fmt(annualCommissionPerMember)} na entrada e novamente a cada renovação anual.{" "}
              <strong className="text-gray-300">PIX / Mensal:</strong> o membro paga {fmt(summary.monthlyTicket)}/mês. Você recebe {fmt(monthlyCommissionPerMember)} todo mês enquanto ele estiver ativo.{" "}
              Holdback de 20% retido por 30 dias. Pagamento no dia 15 do mês seguinte.
            </p>
          </div>
        </>
      )}

    </div>
  );
}
