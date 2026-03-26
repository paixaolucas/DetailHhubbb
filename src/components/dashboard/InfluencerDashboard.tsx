"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users, TrendingUp, DollarSign, Activity, Star, BookOpen, PlayCircle, Bot, Trophy, Settings,
  CheckSquare, Square, BarChart2, Sliders, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { getInfluencerHealth, getInfluencerHealthEmoji } from "@/lib/points";
import { STORAGE_KEYS } from "@/lib/constants";
import { getGreeting } from "@/lib/greeting";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InfluencerSummary {
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

// ---------------------------------------------------------------------------
// Chart style constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// StatsCard
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// LiveIndicator
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Community types
// ---------------------------------------------------------------------------

interface CommunityStats {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  memberCount: number;
  postCount: number;
  spaces: { id: string; name: string; slug: string }[];
}

interface RecentMember {
  id: string;
  createdAt: string;
  user: { firstName: string; lastName: string; avatarUrl: string | null };
}

// ---------------------------------------------------------------------------
// PerformanceMetricBar — sub-component for 18.1
// ---------------------------------------------------------------------------

function PerformanceMetricBar({
  label, weight, score,
}: {
  label: string;
  weight: number;
  score: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#EEE6E4]">{label}</span>
        <span className="text-xs text-gray-500">{weight}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#006079] to-[#009CD9] transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{score} pts</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PerformanceBox — 18.1
// ---------------------------------------------------------------------------

function PerformanceBox({
  influencerScore,
  health,
  healthEmoji,
  healthColor,
}: {
  influencerScore: number;
  health: string;
  healthEmoji: string;
  healthColor: string;
}) {
  const POOL_ESTIMADO = 8000;
  const prevScore = Math.max(0, influencerScore - 8); // simula mês anterior

  const viewScore = Math.min(100, Math.round(influencerScore * 0.9));
  const engagementScore = Math.min(100, Math.round(influencerScore * 0.8));
  const newMembersScore = Math.min(100, Math.round(influencerScore * 0.7));
  const retentionScore = Math.min(100, Math.round(influencerScore * 0.85));
  const deliveriesScore = 100;

  const estimatedRevenue = Math.round(POOL_ESTIMADO * (influencerScore / 100));

  const metrics = [
    { label: "Views qualificados (≥60%)", weight: 30, score: viewScore },
    { label: "Engajamento da comunidade", weight: 25, score: engagementScore },
    { label: "Novos membros ativos (30 dias)", weight: 20, score: newMembersScore },
    { label: "Taxa de retenção", weight: 15, score: retentionScore },
    { label: "Entregas contratuais", weight: 10, score: deliveriesScore },
  ];

  return (
    <div className="glass-card p-5 border-[#007A99]/20">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-[#EEE6E4] flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#009CD9]" /> Caixa de Performance
        </h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${healthColor}`}>
          {healthEmoji} {health}
        </span>
      </div>

      {/* Score total */}
      <div className="flex items-center gap-4 mb-5 p-3 bg-white/5 rounded-xl">
        <div className="text-center flex-shrink-0">
          <p className="text-3xl font-bold text-[#EEE6E4]">{influencerScore}</p>
          <p className="text-xs text-gray-400 mt-0.5">Score atual</p>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">Mês anterior: {prevScore}</span>
            <span className={`text-xs font-semibold ${influencerScore >= prevScore ? "text-green-400" : "text-red-400"}`}>
              {influencerScore >= prevScore ? "+" : ""}{influencerScore - prevScore} pts
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${health === "Saudável" ? "bg-gradient-to-r from-green-600 to-green-400" : health === "Atenção" ? "bg-gradient-to-r from-yellow-600 to-yellow-400" : "bg-gradient-to-r from-red-600 to-red-400"}`}
              style={{ width: `${Math.min(100, influencerScore)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5 métricas */}
      <div className="space-y-3 mb-5">
        {metrics.map((m) => (
          <PerformanceMetricBar key={m.label} {...m} />
        ))}
      </div>

      {/* Estimativa de receita */}
      <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
        <DollarSign className="w-4 h-4 text-green-400 flex-shrink-0" />
        <p className="text-xs text-gray-300">
          Baseado no seu score atual, você receberia{" "}
          <span className="text-green-400 font-semibold">
            ~R$ {estimatedRevenue.toLocaleString("pt-BR")}
          </span>{" "}
          este mês da caixa de performance.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CommissionReport — 18.2
// ---------------------------------------------------------------------------

interface MonthlyRow {
  month: string;
  members: number;
  direct: number;
  performance: number;
  total: number;
}

function CommissionReport({
  activeMembers,
  influencerScore,
}: {
  activeMembers: number;
  influencerScore: number;
}) {
  const POOL_BASE = 8000;
  const PRICE_PER_MEMBER = 79;
  const COMMISSION_RATE = 0.35;

  const directCommission = Math.round(activeMembers * PRICE_PER_MEMBER * COMMISSION_RATE);
  const performanceBonus = Math.round(POOL_BASE * Math.min(1, influencerScore / 100));
  const totalEstimated = directCommission + performanceBonus;

  // Gerar histórico mock de 6 meses com variação ±15%
  const monthNames = ["Out/24", "Nov/24", "Dez/24", "Jan/25", "Fev/25", "Mar/25"];
  const history: MonthlyRow[] = monthNames.map((month, i) => {
    const variation = 0.85 + Math.random() * 0.3; // 0.85 a 1.15
    const mMembers = Math.max(1, Math.round(activeMembers * variation * (0.6 + i * 0.08)));
    const mDirect = Math.round(mMembers * PRICE_PER_MEMBER * COMMISSION_RATE);
    const mPerf = Math.round(POOL_BASE * Math.min(1, (influencerScore * variation) / 100));
    return { month, members: mMembers, direct: mDirect, performance: mPerf, total: mDirect + mPerf };
  });

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <BarChart2 className="w-4 h-4 text-[#009CD9]" />
        <h2 className="text-sm font-semibold text-[#EEE6E4]">Minha Receita</h2>
      </div>

      {/* 3 colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#EEE6E4]">{activeMembers}</p>
          <p className="text-xs text-gray-400 mt-1">Membros ativos (via referral)</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#009CD9]">
            R$ {directCommission.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-gray-400 mt-1">Comissão direta (35%)</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#007A99]">
            R$ {performanceBonus.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-gray-400 mt-1">Caixa de performance (est.)</p>
        </div>
      </div>

      {/* Total em destaque */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
        <div>
          <p className="text-xs text-gray-400 mb-1">Total estimado este mês</p>
          <p className="text-3xl font-bold text-green-400">
            R$ {totalEstimated.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#009CD9] bg-[#007A99]/10 border border-[#007A99]/20 px-3 py-1.5 rounded-full">
            Pagamento previsto para dia 15 do mês seguinte
          </span>
        </div>
      </div>

      {/* Tabela histórico */}
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Histórico (6 meses)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-500 pb-2 font-medium">Mês</th>
                <th className="text-right text-gray-500 pb-2 font-medium">Membros</th>
                <th className="text-right text-gray-500 pb-2 font-medium">Comissão</th>
                <th className="text-right text-gray-500 pb-2 font-medium">Caixa Perf.</th>
                <th className="text-right text-gray-500 pb-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.month} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-2 text-gray-300 font-medium">{row.month}</td>
                  <td className="py-2 text-right text-gray-400">{row.members}</td>
                  <td className="py-2 text-right text-[#009CD9]">R$ {row.direct.toLocaleString("pt-BR")}</td>
                  <td className="py-2 text-right text-[#007A99]">R$ {row.performance.toLocaleString("pt-BR")}</td>
                  <td className="py-2 text-right text-green-400 font-semibold">R$ {row.total.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GrowthSimulator — 18.3
// ---------------------------------------------------------------------------

function GrowthSimulator() {
  const [members, setMembers] = useState(200);

  const PRICE_PER_MEMBER = 79;
  const COMMISSION_RATE = 0.35;
  const POOL_BASE = 8000;

  const directCommission = Math.round(members * PRICE_PER_MEMBER * COMMISSION_RATE);
  const performanceBonus = Math.round(POOL_BASE * (members / 1000));
  const total = directCommission + performanceBonus;

  return (
    <div className="glass-card p-5 border-[#007A99]/20">
      <div className="flex items-center gap-2 mb-1">
        <Sliders className="w-4 h-4 text-[#009CD9]" />
        <span className="text-xs font-semibold text-[#009CD9] uppercase tracking-widest">E SE...</span>
      </div>
      <h2 className="text-base font-semibold text-[#EEE6E4] mb-5">
        Quanto você vai receber com mais membros?
      </h2>

      {/* Slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Membros na plataforma</span>
          <span className="text-lg font-bold text-[#EEE6E4]">{members.toLocaleString("pt-BR")} membros</span>
        </div>
        <input
          type="range"
          min={50}
          max={2000}
          step={50}
          value={members}
          onChange={(e) => setMembers(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10"
          style={{ accentColor: "#009CD9" }}
          aria-label="Quantidade de membros para simulação"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>50</span>
          <span>500</span>
          <span>1.000</span>
          <span>1.500</span>
          <span>2.000</span>
        </div>
      </div>

      {/* Resultado em 2 colunas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Comissão Direta</p>
          <p className="text-xl font-bold text-[#009CD9]">
            R$ {directCommission.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-gray-500 mt-1">35% × {members} × R$79</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Caixa de Performance</p>
          <p className="text-xl font-bold text-[#007A99]">
            R$ {performanceBonus.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-gray-500 mt-1">Proporcional ao pool</p>
        </div>
      </div>

      {/* Total destacado */}
      <div className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/20 rounded-xl mb-4">
        <span className="text-sm font-semibold text-gray-300">Total por mês</span>
        <span className="text-2xl font-bold text-green-400">
          R$ {total.toLocaleString("pt-BR")}
        </span>
      </div>

      <p className="text-xs text-gray-500">
        Projeção baseada em R$79/mês por membro (plano mensal). Valores reais variam conforme mix de planos.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecordingChecklist — 18.4
// ---------------------------------------------------------------------------

const CHECKLIST_ITEMS = [
  "Áudio: microfone conectado, nível testado entre -12 e -6 dB, ruído de fundo eliminado",
  "Câmera: 1080p mínimo, orientação horizontal, foco travado, estabilização ativada",
  "Iluminação: sem janela atrás, temperatura de cor consistente, sem sombra dura no rosto",
  "Enquadramento: verificado no monitor/tela antes de começar, headroom adequado",
  "Bateria e espaço: câmera com carga suficiente, cartão/memória com espaço suficiente",
  "Teste de 30 segundos: gravou, assistiu com fone, áudio e imagem ok",
  "Roteiro ou guia: sabe o que vai cobrir no vídeo, na ordem certa",
  "Notificações: modo não perturbe ativado no celular e em qualquer dispositivo próximo",
  "Nomenclatura: já sabe o nome do arquivo que vai usar após a gravação",
];

function RecordingChecklist() {
  const [checked, setChecked] = useState<boolean[]>(Array(CHECKLIST_ITEMS.length).fill(false));

  const toggle = (index: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const clearAll = () => setChecked(Array(CHECKLIST_ITEMS.length).fill(false));

  const checkedCount = checked.filter(Boolean).length;
  const allDone = checkedCount === CHECKLIST_ITEMS.length;
  const anyDone = checkedCount > 0;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-[#009CD9]" />
          <h2 className="text-sm font-semibold text-[#EEE6E4]">Guia de Conteúdo</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{checkedCount}/{CHECKLIST_ITEMS.length}</span>
          {anyDone && (
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-[#EEE6E4] transition-colors underline"
              aria-label="Limpar checklist"
            >
              Limpar checklist
            </button>
          )}
        </div>
      </div>

      {/* Barra de progresso do checklist */}
      <div className="mb-5">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#006079] to-[#009CD9] transition-all duration-500"
            style={{ width: `${(checkedCount / CHECKLIST_ITEMS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Mensagem de sucesso */}
      {allDone && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
          <p className="text-sm font-semibold text-green-400">Tudo pronto! Pode apertar o REC. 🎬</p>
        </div>
      )}

      {/* Itens */}
      <div className="space-y-2 mb-6">
        {CHECKLIST_ITEMS.map((item, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
            aria-label={`${checked[i] ? "Desmarcar" : "Marcar"}: ${item}`}
          >
            {checked[i] ? (
              <CheckSquare className="w-4 h-4 text-[#009CD9] flex-shrink-0 mt-0.5" />
            ) : (
              <Square className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            )}
            <span className={`text-sm leading-snug transition-colors ${checked[i] ? "text-gray-500 line-through" : "text-gray-300"}`}>
              {item}
            </span>
          </button>
        ))}
      </div>

      {/* Links de ação */}
      <div className="border-t border-white/10 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          { label: "Ver pautas do módulo", href: "/dashboard/content" },
          { label: "Status de entregas", href: "/dashboard/entregas" },
          { label: "Criar novo conteúdo", href: "/dashboard/content" },
        ].map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-[#006079]/10 border border-white/10 hover:border-[#009CD9]/20 transition-colors text-xs font-medium text-gray-400 hover:text-[#EEE6E4]"
          >
            <span>{label}</span>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InfluencerDashboard — main component
// ---------------------------------------------------------------------------

export function InfluencerDashboard({ userName }: { userName: string }) {
  const [summary, setSummary] = useState<InfluencerSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<CommunityStats | null>(null);
  const [members, setMembers] = useState<RecentMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [influencerScore, setInfluencerScore] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return;
    fetch("/api/dashboard/influencer-summary", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSummary(d.data.summary);
          setTimeSeries(d.data.timeSeries ?? []);
          setLastUpdated(new Date());
          if (d.data.communities?.length > 0) setCommunity(d.data.communities[0]);
          setMembers(d.data.members ?? []);
          setInfluencerScore(d.data.influencerScore ?? 0);
        }
      })
      .catch(console.error)
      .finally(() => { setLoading(false); setMembersLoading(false); });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useAutoRefresh(fetchData, 60_000);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-white/10 rounded-xl w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 space-y-3">
            <div className="h-4 bg-white/10 rounded w-24" />
            <div className="h-7 bg-white/10 rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  );

  const firstName = userName.split(" ")[0] || "Criador";
  const greeting = getGreeting(firstName);

  const health = getInfluencerHealth(influencerScore);
  const healthEmoji = getInfluencerHealthEmoji(health);
  const healthColor =
    health === "Saudável" ? "text-green-400 border-green-500/20 bg-green-500/10" :
    health === "Atenção"  ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/10" :
                             "text-red-400 border-red-500/20 bg-red-500/10";

  return (
    <div className="space-y-6">
      {/* 1 — Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#009CD9]/10 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-[#009CD9]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#EEE6E4]">{greeting}</h1>
            <p className="text-gray-400 text-sm">Visão geral da sua comunidade automotiva</p>
          </div>
        </div>
        <LiveIndicator lastUpdated={lastUpdated} />
      </div>

      {/* 2 — Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard title="Meu MRR" value={summary?.mrr ?? 0} growth={summary?.mrrGrowth} prefix="R$ " icon={DollarSign} iconColor="text-green-400" iconBg="bg-green-500/10" />
        <StatsCard title="Membros Ativos" value={summary?.activeMembers ?? 0} icon={Users} iconColor="text-[#009CD9]" iconBg="bg-[#007A99]/10" />
        <StatsCard title="Receita Total" value={summary?.totalRevenue ?? 0} growth={summary?.revenueGrowth} prefix="R$ " icon={TrendingUp} iconColor="text-[#009CD9]" iconBg="bg-[#009CD9]/10" />
        <StatsCard title="Churn Rate" value={summary?.churnRate ?? 0} suffix="%" icon={Activity} iconColor="text-orange-400" iconBg="bg-orange-500/10" />
      </div>

      {/* 3 — Caixa de Performance (18.1) */}
      <PerformanceBox
        influencerScore={influencerScore}
        health={health}
        healthEmoji={healthEmoji}
        healthColor={healthColor}
      />

      {/* 4 — Gráfico + Acesso rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-base font-semibold text-[#EEE6E4] mb-6">Receita nos últimos 30 dias</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="inflRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#009CD9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#009CD9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartStyle.cartesianGrid} />
              <XAxis dataKey="date" {...chartStyle.xAxis} tickFormatter={(v: string) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} />
              <YAxis {...chartStyle.yAxis} tickFormatter={(v: number) => `R$${v}`} />
              <Tooltip {...chartStyle.tooltip} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
              <Area type="monotone" dataKey="revenue" stroke="#009CD9" strokeWidth={2} fill="url(#inflRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-[#EEE6E4] mb-3">Acesso Rápido</h2>
            <div className="space-y-1">
              {[
                { label: "Minhas Comunidades", href: "/dashboard/communities", icon: Users },
                { label: "Criar Conteúdo", href: "/dashboard/content", icon: BookOpen },
                { label: "Agendar Live", href: "/dashboard/live", icon: PlayCircle },
                { label: "Auto AI", href: "/dashboard/ai", icon: Bot },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#006079]/10 transition-colors text-sm text-gray-400 hover:text-[#EEE6E4] font-medium">
                  <Icon className="w-4 h-4 text-[#009CD9]" />{label}
                </Link>
              ))}
            </div>
          </div>
          <div className="glass-card border-[#007A99]/20 p-5 bg-gradient-to-br from-[#006079]/10 to-[#009CD9]/5">
            <div className="w-8 h-8 bg-[#007A99]/20 rounded-lg flex items-center justify-center mb-3">
              <Bot className="w-4 h-4 text-[#009CD9]" />
            </div>
            <p className="font-semibold text-[#EEE6E4] text-sm mb-1">Auto AI</p>
            <p className="text-gray-400 text-xs mb-3">Crie conteúdo, diagnostique veículos e estratégias com IA</p>
            <Link href="/dashboard/ai" className="bg-[#006079]/30 hover:bg-[#006079]/50 transition-colors text-[#009CD9] text-xs font-semibold px-3 py-1.5 rounded-lg inline-block">
              Acessar →
            </Link>
          </div>
        </div>
      </div>

      {/* 5 — Relatório de Comissões (18.2) */}
      <CommissionReport
        activeMembers={summary?.activeMembers ?? 0}
        influencerScore={influencerScore}
      />

      {/* 6 — Simulador de Crescimento (18.3) */}
      <GrowthSimulator />

      {/* 7 — Guia de Conteúdo / Checklist (18.4) */}
      <RecordingChecklist />

      {/* 8 — Seção de comunidade + membros recentes */}
      {community && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              {community.logoUrl ? (
                <Image src={community.logoUrl} alt={community.name} width={40} height={40} className="w-10 h-10 rounded-xl object-cover border border-white/10 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#006079] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {community.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-[#EEE6E4] text-sm truncate">{community.name}</p>
                <p className="text-xs text-gray-400">{community.memberCount ?? 0} membros · {community.postCount ?? 0} posts</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Ver Feed", href: `/community/${community.slug}/feed`, icon: Activity, color: "text-[#006079] bg-[#006079]/10 border-[#009CD9]/20" },
                { label: "Configurações", href: `/dashboard/communities/${community.id}/settings`, icon: Settings, color: "text-gray-400 bg-white/5 border-white/10" },
                { label: "Canais", href: `/dashboard/communities/${community.id}/spaces`, icon: BookOpen, color: "text-[#006079] bg-[#006079]/10 border-[#009CD9]/20" },
                { label: "Broadcast", href: `/dashboard/communities/${community.id}/settings?tab=broadcast`, icon: Trophy, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
              ].map(({ label, href, icon: Icon, color }) => (
                <Link key={href} href={href} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${color}`}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />{label}
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#EEE6E4]">Membros Recentes</h2>
              <Link href={`/dashboard/communities/${community.id}/settings?tab=members`} className="text-xs text-[#007A99] hover:text-[#006079] font-medium transition-colors">
                Ver todos →
              </Link>
            </div>
            {membersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-white/10 rounded w-1/3" />
                      <div className="h-2.5 bg-white/10 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum membro ainda.</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => {
                  const name = `${m.user.firstName} ${m.user.lastName}`;
                  const initials = `${m.user.firstName[0] ?? ""}${m.user.lastName[0] ?? ""}`.toUpperCase();
                  const joined = new Date(m.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
                  return (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#006079]/10 transition-colors">
                      {m.user.avatarUrl ? (
                        <Image src={m.user.avatarUrl} alt={name} width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#006079]/10 flex items-center justify-center text-xs font-bold text-[#006079] flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#EEE6E4] truncate">{name}</p>
                        <p className="text-xs text-gray-400">Entrou em {joined}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
