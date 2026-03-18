"use client";

import { useEffect, useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Trophy,
  Eye,
  MessageSquare,
  UserPlus,
  TrendingUp,
  CheckSquare,
  Video,
  Mic,
  Users,
  Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PPCurrent {
  scoreViews: number;
  scoreEngagement: number;
  scoreNewMembers: number;
  scoreRetention: number;
  scoreDeliveries: number;
  totalPP: number;
  poolShare: number;
  poolSharePct: number;
  rank: number;
  totalInfluencers: number;
  qualifiedViews: number;
  engagementActions: number;
  activeMembers: number;
  newActiveMembers: number;
  retentionRate: number;
  deliveriesCompleted: number;
  deliveriesRequired: number;
  videosPublished: number;
  livesHeld: number;
  forumInteractions: number;
  period: { year: number; month: number };
}

interface PPHistory {
  label: string;
  totalPP: number;
  scoreViews: number;
  scoreEngagement: number;
  scoreNewMembers: number;
  scoreRetention: number;
  scoreDeliveries: number;
  poolShare: number;
}

interface PerformanceData {
  current: PPCurrent;
  history: PPHistory[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ppColor(score: number) {
  if (score >= 75) return "#10b981"; // green
  if (score >= 50) return "#f59e0b"; // amber
  return "#ef4444";                  // red
}

function ppLabel(score: number) {
  if (score >= 75) return "Ótimo";
  if (score >= 50) return "Regular";
  return "Baixo";
}

const chartStyle = {
  grid: { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)" },
  axis: { tick: { fontSize: 11, fill: "#9ca3af" }, tickLine: false, axisLine: false },
  tooltip: {
    contentStyle: {
      backgroundColor: "#1A1A1A",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      fontSize: "13px",
    },
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ComponentBar({
  label,
  score,
  weight,
  detail,
  icon: Icon,
}: {
  label: string;
  score: number;
  weight: number;
  detail: string;
  icon: React.ElementType;
}) {
  const color = ppColor(score);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#006079]/10 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-[#007A99]" />
          </div>
          <div>
            <span className="text-sm font-medium text-[#EEE6E4]">{label}</span>
            <span className="text-xs text-gray-400 ml-2">peso {(weight * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold" style={{ color }}>{score.toFixed(0)}</span>
          <span className="text-xs text-gray-400">/100</span>
          <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded-full" style={{ color, backgroundColor: `${color}15` }}>
            {ppLabel(score)}
          </span>
        </div>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(score, 100)}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-gray-400">{detail}</p>
    </div>
  );
}

function DeliveryItem({
  icon: Icon,
  label,
  done,
  required,
}: {
  icon: React.ElementType;
  label: string;
  done: number;
  required: number;
}) {
  const ok = done >= required;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${ok ? "border-green-200 bg-green-50" : "border-white/10 bg-white/5"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ok ? "bg-green-100" : "bg-white/5"}`}>
        <Icon className={`w-4 h-4 ${ok ? "text-green-600" : "text-gray-400"}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[#EEE6E4]">{label}</p>
        <p className="text-xs text-gray-400">
          {done} de {required} {ok ? "✓ concluído" : "pendente"}
        </p>
      </div>
      <div className={`text-xs font-semibold ${ok ? "text-green-600" : "text-gray-400"}`}>
        {done}/{required}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    fetch("/api/influencers/me/performance", {
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
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/5 rounded-xl w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-28 bg-white/5" />
          ))}
        </div>
        <div className="glass-card p-6 h-80 bg-white/5" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card p-8 text-center text-gray-500 text-sm">
        {error ?? "Sem dados"}
      </div>
    );
  }

  const { current, history } = data;
  const ppColor_ = ppColor(current.totalPP);

  const monthName = new Date(current.period.year, current.period.month - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // Radar chart data
  const radarData = [
    { label: "Views", value: current.scoreViews, fullMark: 100 },
    { label: "Engajamento", value: current.scoreEngagement, fullMark: 100 },
    { label: "Novos Mbrs", value: current.scoreNewMembers, fullMark: 100 },
    { label: "Retenção", value: current.scoreRetention, fullMark: 100 },
    { label: "Entregas", value: current.scoreDeliveries, fullMark: 100 },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#EEE6E4]">Pontuação de Performance</h1>
          <p className="text-gray-400 text-sm mt-1 capitalize">{monthName} — dados em tempo real</p>
        </div>
        <div className="flex items-center gap-2 glass-card px-4 py-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-semibold text-[#EEE6E4]">
            #{current.rank}
            <span className="text-gray-400 font-normal"> de {current.totalInfluencers}</span>
          </span>
        </div>
      </div>

      {/* Top 3 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* PP Score */}
        <div className="glass-card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">PP do Mês</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold" style={{ color: ppColor_ }}>
              {current.totalPP.toFixed(0)}
            </p>
            <p className="text-gray-400 text-sm mb-1">/100</p>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 mt-3">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${current.totalPP}%`, backgroundColor: ppColor_ }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: ppColor_ }}>{ppLabel(current.totalPP)}</p>
        </div>

        {/* Pool share */}
        <div className="glass-card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Fatia da Caixa
          </p>
          <p className="text-4xl font-bold text-[#009CD9]">{current.poolSharePct.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-3">
            Sua % do pool de performance deste mês.
            Baseado nos scores já registrados.
          </p>
        </div>

        {/* Deliveries summary */}
        <div className="glass-card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Entregas do Mês
          </p>
          <div className="flex items-end gap-2">
            <p className={`text-4xl font-bold ${current.deliveriesCompleted >= current.deliveriesRequired ? "text-green-600" : "text-amber-500"}`}>
              {current.deliveriesCompleted}
            </p>
            <p className="text-gray-400 text-sm mb-1">/ {current.deliveriesRequired}</p>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Vídeos, lives e interações no fórum verificadas na plataforma.
          </p>
        </div>
      </div>

      {/* Radar + Component bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#EEE6E4] mb-4">Perfil de Performance</h2>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#6b7280" }}
              />
              <Radar
                name="PP"
                dataKey="value"
                stroke="#009CD9"
                fill="#009CD9"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Component breakdown */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-[#EEE6E4]">Componentes do PP</h2>
          <ComponentBar
            label="Views Qualificados"
            score={current.scoreViews}
            weight={0.30}
            detail={`${current.qualifiedViews} visualizações ≥60% do vídeo este mês`}
            icon={Eye}
          />
          <ComponentBar
            label="Engajamento"
            score={current.scoreEngagement}
            weight={0.25}
            detail={`${current.engagementActions} ações (comentários + reações) / ${current.activeMembers} membros`}
            icon={MessageSquare}
          />
          <ComponentBar
            label="Novos Membros Ativos"
            score={current.scoreNewMembers}
            weight={0.20}
            detail={`${current.newActiveMembers} membros novos via link, ativos há 30+ dias`}
            icon={UserPlus}
          />
          <ComponentBar
            label="Retenção"
            score={current.scoreRetention}
            weight={0.15}
            detail={`${current.retentionRate.toFixed(1)}% dos membros captados ainda ativos`}
            icon={TrendingUp}
          />
          <ComponentBar
            label="Entregas Contratuais"
            score={current.scoreDeliveries}
            weight={0.10}
            detail={`${current.deliveriesCompleted} de ${current.deliveriesRequired} tipos de entrega concluídos`}
            icon={CheckSquare}
          />
        </div>
      </div>

      {/* Deliveries detail */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="w-4 h-4 text-[#007A99]" />
          <h2 className="text-base font-semibold text-[#EEE6E4]">Entregas Contratuais do Mês</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DeliveryItem
            icon={Video}
            label="Vídeos exclusivos"
            done={current.videosPublished}
            required={2}
          />
          <DeliveryItem
            icon={Mic}
            label="Lives / Q&As"
            done={current.livesHeld}
            required={1}
          />
          <DeliveryItem
            icon={Users}
            label="Interações no fórum"
            done={current.forumInteractions}
            required={4}
          />
        </div>
        <div className="mt-3 flex items-start gap-2 p-3 bg-[#006079]/10 rounded-xl border border-[#006079]/20">
          <Info className="w-4 h-4 text-[#009CD9] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#009CD9]">
            Menções externas (stories, links na bio) não são contabilizadas automaticamente — apenas ações dentro da plataforma geram pontuação.
          </p>
        </div>
      </div>

      {/* Historical PP trend */}
      {history.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#EEE6E4] mb-5">Evolução do PP — histórico</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history}>
              <CartesianGrid {...chartStyle.grid} />
              <XAxis dataKey="label" {...chartStyle.axis} />
              <YAxis domain={[0, 100]} {...chartStyle.axis} />
              <Tooltip {...chartStyle.tooltip} />
              <Line
                type="monotone"
                dataKey="totalPP"
                stroke="#009CD9"
                strokeWidth={2.5}
                dot={{ fill: "#009CD9", r: 4 }}
                name="PP Total"
              />
              <Line type="monotone" dataKey="scoreViews" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Views" />
              <Line type="monotone" dataKey="scoreEngagement" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Engajamento" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Histórico baseado em scores fechados. O mês atual é calculado em tempo real.
          </p>
        </div>
      )}

      {/* Formula explanation */}
      <div className="glass-card p-5">
        <p className="text-xs font-semibold text-gray-400 mb-2">Fórmula do PP</p>
        <code className="text-xs text-[#006079] bg-[#006079]/10 px-3 py-2 rounded-lg block leading-relaxed">
          PP = (Views × 0,30) + (Engajamento × 0,25) + (Novos Membros × 0,20) + (Retenção × 0,15) + (Entregas × 0,10)
        </code>
        <p className="text-xs text-gray-400 mt-2">
          Fatia da caixa = PP_seu ÷ Σ PP_todos_os_influenciadores. Somente ações dentro da plataforma contam.
        </p>
      </div>
    </div>
  );
}
