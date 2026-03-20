"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Sparkles,
  Film,
  User,
  FileText,
  Globe,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Zap,
  ArrowRight,
  Trash2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { STORAGE_KEYS } from "@/lib/constants";
import type { AIAnalysisType, AIAnalysisDetail, AIAnalysisResult } from "@/types";

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  AIAnalysisType,
  { label: string; icon: React.ElementType; color: string }
> = {
  AD_CREATIVE: {
    label: "Criativo de Anúncio",
    icon: Film,
    color: "from-[#006079] to-[#009CD9]",
  },
  PROFILE_AUDIT: {
    label: "Auditoria de Perfil",
    icon: User,
    color: "from-[#007A99] to-[#33A7BF]",
  },
  POST_ANALYSIS: {
    label: "Análise de Post",
    icon: FileText,
    color: "from-[#006079] to-[#007A99]",
  },
  SITE_ANALYSIS: {
    label: "Análise de Site",
    icon: Globe,
    color: "from-[#004D61] to-[#006079]",
  },
};

const BREAKDOWN_LABELS: Record<string, string> = {
  hook: "Hook",
  clareza: "Clareza",
  cta: "CTA",
  ritmo: "Ritmo",
  valor: "Proposta de Valor",
  impacto_emocional: "Impacto Emocional",
  design: "Design",
  fit_audiencia: "Fit de Audiência",
};

const READINESS_CONFIG = {
  SCALE: {
    label: "ESCALAR",
    description: "Este criativo está pronto para escalar com budget.",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    icon: TrendingUp,
  },
  ITERATE: {
    label: "ITERAR",
    description: "Bom potencial, mas precisa de ajustes antes de escalar.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    icon: Lightbulb,
  },
  KILL: {
    label: "DESCARTAR",
    description: "Falhas estruturais. Recomendamos criar um novo criativo.",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    icon: TrendingDown,
  },
};

// ─── Score gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 75
      ? "#22c55e"
      : score >= 50
      ? "#eab308"
      : "#ef4444";

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#EEE6E4]">{score}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 font-medium">Score Geral</span>
    </div>
  );
}

// ─── Breakdown bar ────────────────────────────────────────────────────────────

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 75 ? "bg-green-500" : value >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-[#EEE6E4] font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── List section ─────────────────────────────────────────────────────────────

function ResultList({
  title,
  items,
  icon: Icon,
  color,
}: {
  title: string;
  items: string[];
  icon: React.ElementType;
  color: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <h3 className="text-sm font-semibold text-[#EEE6E4]">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
            <ArrowRight className={`w-3.5 h-3.5 ${color} flex-shrink-0 mt-0.5`} />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyseResultPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const toast = useToast();

  const [analysis, setAnalysis] = useState<AIAnalysisDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? "";
        const res = await fetch(`/api/ai/analise/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setAnalysis(data.data);
        } else {
          toast.error(data.error ?? "Análise não encontrada");
          router.push("/dashboard/analise");
        }
      } catch {
        toast.error("Erro ao carregar análise");
        router.push("/dashboard/analise");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router, toast]);

  async function handleDelete() {
    if (!analysis) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? "";
      const res = await fetch(`/api/ai/analise/${analysis.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Análise removida");
        router.push("/dashboard/analise");
      } else {
        toast.error(data.error ?? "Erro ao remover");
      }
    } catch {
      toast.error("Erro ao remover análise");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-24 h-4 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="glass-card p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-xl" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-3 bg-white/10 rounded w-1/4" />
            </div>
            <div className="w-32 h-32 bg-white/10 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const typeConfig = TYPE_CONFIG[analysis.type];
  const result = analysis.result as AIAnalysisResult | null;
  const Icon = typeConfig?.icon ?? Sparkles;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/analise")}
          className="flex items-center gap-2 text-gray-400 hover:text-[#EEE6E4] text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          IA de Análises
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 px-3 py-1.5 rounded-lg transition-all"
        >
          {deleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          Excluir
        </button>
      </div>

      {/* Status banner for non-completed */}
      {analysis.status === "PENDING" && (
        <div className="glass-card p-4 flex items-center gap-3 border-yellow-500/20 bg-yellow-500/5">
          <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-yellow-300 font-medium">Análise em andamento</p>
            <p className="text-xs text-gray-500">
              Aguarde — a análise está sendo processada.
            </p>
          </div>
        </div>
      )}

      {analysis.status === "FAILED" && (
        <div className="glass-card p-4 flex items-center gap-3 border-red-500/20 bg-red-500/5">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-300 font-medium">Análise falhou</p>
            <p className="text-xs text-gray-500">{analysis.error ?? "Erro desconhecido"}</p>
          </div>
        </div>
      )}

      {analysis.status === "COMPLETED" && result && (
        <>
          {/* Hero card: score + type + readiness */}
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Thumbnail or type icon */}
              {analysis.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={analysis.thumbnailUrl}
                  alt=""
                  className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${typeConfig?.color ?? "from-[#006079] to-[#009CD9]"} rounded-2xl flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
              )}

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-[#EEE6E4] mb-1">
                  {typeConfig?.label}
                </h1>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    Concluída
                  </span>
                  {analysis.platform && (
                    <span className="capitalize">{analysis.platform}</span>
                  )}
                  <span>
                    {new Date(analysis.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  {analysis.tokensUsed > 0 && (
                    <span>{analysis.tokensUsed.toLocaleString()} tokens</span>
                  )}
                </div>

                {/* Summary */}
                {result.summary && (
                  <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                    {result.summary}
                  </p>
                )}
              </div>

              {/* Score gauge */}
              <div className="flex-shrink-0">
                <ScoreGauge score={result.score} />
              </div>
            </div>

            {/* Creative readiness badge (AD_CREATIVE only) */}
            {analysis.type === "AD_CREATIVE" && result.creative_readiness && (
              <div
                className={`mt-5 p-4 rounded-xl border ${
                  READINESS_CONFIG[result.creative_readiness]?.bg ??
                  "bg-white/5 border-white/10"
                } flex items-start gap-3`}
              >
                {(() => {
                  const cfg = READINESS_CONFIG[result.creative_readiness!];
                  const ReadinessIcon = cfg?.icon ?? Lightbulb;
                  return (
                    <>
                      <ReadinessIcon
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg?.color ?? "text-gray-400"}`}
                      />
                      <div>
                        <p className={`text-sm font-bold ${cfg?.color ?? "text-gray-300"}`}>
                          Decisão: {cfg?.label ?? result.creative_readiness}
                        </p>
                        {result.creative_readiness_reasoning && (
                          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                            {result.creative_readiness_reasoning}
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Breakdown (AD_CREATIVE only) */}
          {analysis.type === "AD_CREATIVE" && result.breakdown && (
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-[#EEE6E4] mb-4">
                Detalhamento por Critério
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {Object.entries(result.breakdown).map(([key, value]) => (
                  <BreakdownBar
                    key={key}
                    label={BREAKDOWN_LABELS[key] ?? key}
                    value={value}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Strengths / Weaknesses / Improvements / Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <ResultList
                title="Pontos Fortes"
                items={result.strengths}
                icon={TrendingUp}
                color="text-green-400"
              />
            </div>
            <div className="glass-card p-5">
              <ResultList
                title="Pontos Fracos"
                items={result.weaknesses}
                icon={TrendingDown}
                color="text-red-400"
              />
            </div>
            <div className="glass-card p-5">
              <ResultList
                title="Melhorias Sugeridas"
                items={result.improvements}
                icon={Lightbulb}
                color="text-yellow-400"
              />
            </div>
            <div className="glass-card p-5">
              <ResultList
                title="Ações Imediatas"
                items={result.recommended_actions}
                icon={Zap}
                color="text-[#009CD9]"
              />
            </div>
          </div>

          {/* New analysis CTA */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => router.push("/dashboard/analise")}
              className="flex items-center gap-2 text-sm text-[#009CD9] hover:text-white bg-[#006079]/20 hover:bg-[#006079]/40 border border-[#006079]/30 px-5 py-2.5 rounded-xl transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Nova Análise
            </button>
          </div>
        </>
      )}
    </div>
  );
}
