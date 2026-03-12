"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { Trophy, Star, Zap, Users, TrendingUp, Award, CheckCircle2, Clock, DollarSign } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AchievedMilestone {
  type: string;
  achievedAt: string;
  bonusAmount: number;
  bonusPaid: boolean;
  metadata: Record<string, unknown>;
}

interface MilestoneProgressData {
  achieved: AchievedMilestone[];
  progress: {
    BRONZE: { achieved: boolean; current: number; required: number; pct: number };
    PRATA: { achieved: boolean; current: number; required: number; membersRequired: number; membersNow: number; pct: number };
    OURO: { achieved: boolean; current: number; required: number; membersRequired: number; membersNow: number; pct: number };
    TOP_CREATOR_MONTH: { achieved: boolean; repeatable: boolean; count: number };
    CRESCIMENTO_ACELERADO: { achieved: boolean; repeatable: boolean; count: number; current: number; required: number; pct: number };
    EMBAIXADOR: { achieved: boolean; current: number; required: number; pct: number };
  };
  newlyAwarded: { type: string; bonusAmount: number }[];
  pendingBonusTotal: number;
}

// ─── Milestone config ─────────────────────────────────────────────────────────

const MILESTONES = [
  {
    type: "BRONZE",
    emoji: "🥉",
    name: "Influenciador Bronze",
    description: "Primeiro mês com 50 membros ativos captados",
    bonus: 500,
    unique: true,
    icon: Award,
    color: "#cd7f32",
    bg: "#cd7f3215",
  },
  {
    type: "PRATA",
    emoji: "🥈",
    name: "Influenciador Prata",
    description: "200 membros ativos por 2 meses consecutivos",
    bonus: 1500,
    unique: true,
    icon: Award,
    color: "#a8a9ad",
    bg: "#a8a9ad15",
  },
  {
    type: "OURO",
    emoji: "🥇",
    name: "Influenciador Ouro",
    description: "500 membros ativos por 3 meses consecutivos",
    bonus: 4000,
    unique: true,
    icon: Trophy,
    color: "#ffd700",
    bg: "#ffd70015",
  },
  {
    type: "TOP_CREATOR_MONTH",
    emoji: "💎",
    name: "Top Creator do Mês",
    description: "Maior PP do mês — ranking #1 entre todos os influenciadores",
    bonus: 800,
    unique: false,
    icon: Star,
    color: "#8b5cf6",
    bg: "#8b5cf615",
  },
  {
    type: "CRESCIMENTO_ACELERADO",
    emoji: "🚀",
    name: "Crescimento Acelerado",
    description: "+100 novos membros em um único mês (máx. 1× por trimestre)",
    bonus: 1000,
    unique: false,
    icon: Zap,
    color: "#3b82f6",
    bg: "#3b82f615",
  },
  {
    type: "EMBAIXADOR",
    emoji: "🎯",
    name: "Embaixador da Plataforma",
    description: "12 meses consecutivos com 100% das entregas contratuais cumpridas",
    bonus: 3000,
    unique: true,
    icon: Users,
    color: "#10b981",
    bg: "#10b98115",
  },
];

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
      <div
        className="h-2 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function MilestoneCard({
  config,
  progress,
  achieved,
}: {
  config: (typeof MILESTONES)[0];
  progress: MilestoneProgressData["progress"];
  achieved: AchievedMilestone[];
}) {
  const p = progress[config.type as keyof typeof progress] as any;
  const isAchieved = p?.achieved || (p?.count > 0);
  const achievedInstances = achieved.filter((a) => a.type === config.type);
  const lastAchieved = achievedInstances[achievedInstances.length - 1];

  return (
    <div
      className={`glass-card p-5 border transition-all ${
        isAchieved ? "border-opacity-40" : "border-gray-100 opacity-80"
      }`}
      style={isAchieved ? { borderColor: config.color, backgroundColor: config.bg } : {}}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: config.bg, border: `1px solid ${config.color}30` }}
        >
          {config.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900">{config.name}</h3>
            {!config.unique && achievedInstances.length > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ color: config.color, backgroundColor: config.bg }}
              >
                ×{achievedInstances.length}
              </span>
            )}
            {isAchieved && config.unique && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{config.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-green-600">{fmt(config.bonus)}</p>
          <p className="text-xs text-gray-400">{config.unique ? "único" : "/vez"}</p>
        </div>
      </div>

      {/* Progress or achievement date */}
      {isAchieved && lastAchieved ? (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          <span>
            Conquistado em{" "}
            {new Date(lastAchieved.achievedAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
          {!lastAchieved.bonusPaid && (
            <span className="ml-2 px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
              Bônus pendente
            </span>
          )}
        </div>
      ) : (
        <>
          {/* Progress bar for milestones with trackable progress */}
          {p?.pct !== undefined && (
            <>
              <ProgressBar pct={p.pct} color={config.color} />
              <p className="text-xs text-gray-400 mt-1.5">
                {getProgressLabel(config.type, p)}
              </p>
            </>
          )}
          {config.type === "TOP_CREATOR_MONTH" && !isAchieved && (
            <p className="text-xs text-gray-400 mt-2">
              Alcance o rank #1 em PP em qualquer mês fechado para conquistar.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function getProgressLabel(type: string, p: any): string {
  switch (type) {
    case "BRONZE":
      return `${p.current} / ${p.required} membros ativos`;
    case "PRATA":
      return `${p.membersNow} / ${p.membersRequired} membros · ${p.current} / ${p.required} meses consecutivos`;
    case "OURO":
      return `${p.membersNow} / ${p.membersRequired} membros · ${p.current} / ${p.required} meses consecutivos`;
    case "CRESCIMENTO_ACELERADO":
      return `${p.current} / ${p.required} novos membros este mês`;
    case "EMBAIXADOR":
      return `${p.current} / ${p.required} meses com 100% das entregas`;
    default:
      return "";
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MilestonesPage() {
  const toast = useToast();
  const [data, setData] = useState<MilestoneProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    fetch("/api/influencers/me/milestones", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setData(d.data);
          // Toast for each newly unlocked milestone
          for (const m of d.data.newlyAwarded ?? []) {
            const config = MILESTONES.find((ml) => ml.type === m.type);
            if (config) {
              toast.success(`${config.emoji} Marco desbloqueado: ${config.name}! Bônus de ${fmt(m.bonusAmount)} registrado.`);
            }
          }
        } else {
          setError(d.error ?? "Erro ao carregar marcos");
        }
      })
      .catch(() => setError("Erro de conexão"))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-xl w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-32 bg-gray-50" />
          ))}
        </div>
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

  const achievedCount = data.achieved.filter(
    (a, i, arr) => arr.findIndex((b) => b.type === a.type) === i
  ).length;
  const uniqueTotal = MILESTONES.filter((m) => m.unique).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marcos & Bônus</h1>
        <p className="text-gray-400 text-sm mt-1">
          Conquiste marcos para receber bônus pagos da caixa de performance
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{achievedCount} / {uniqueTotal}</p>
            <p className="text-xs text-gray-400">Marcos únicos conquistados</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-yellow-600">{fmt(data.pendingBonusTotal)}</p>
            <p className="text-xs text-gray-400">Bônus pendentes de pagamento</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-green-600">
              {fmt(data.achieved.reduce((s, a) => s + a.bonusAmount, 0))}
            </p>
            <p className="text-xs text-gray-400">Total de bônus conquistados</p>
          </div>
        </div>
      </div>

      {/* Milestone cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MILESTONES.map((config) => (
          <MilestoneCard
            key={config.type}
            config={config}
            progress={data.progress}
            achieved={data.achieved}
          />
        ))}
      </div>

      {/* Payment rules */}
      <div className="glass-card p-4 flex items-start gap-3">
        <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong className="text-gray-700">Pagamento dos bônus:</strong> registrados assim que o marco é conquistado e pagos junto com a caixa de performance do mês. Se a caixa do mês não comportar todos os bônus, pagamentos são priorizados por ordem de conquista. Bônus recorrentes (Top Creator, Crescimento) são pagos mensalmente enquanto o marco se mantiver.
        </p>
      </div>
    </div>
  );
}
