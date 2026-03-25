"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface HealthScoreData {
  score: number;
  level: string;
  xp_current: number;
  xp_next: number;
  streak: number;
}

const DEV_FALLBACK: HealthScoreData = {
  score: 43,
  level: "Novo",
  xp_current: 27,
  xp_next: 100,
  streak: 0,
};

function barColor(score: number): string {
  if (score >= 80) return "from-[#006079] to-[#009CD9]";
  if (score >= 50) return "from-yellow-600 to-yellow-400";
  return "from-red-700 to-red-500";
}

function scoreTextColor(score: number): string {
  if (score >= 80) return "text-[#009CD9]";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

export function HealthScore() {
  const [data, setData] = useState<HealthScoreData | null | undefined>(undefined);

  useEffect(() => {
    apiClient<HealthScoreData>("/api/dashboard/health-score")
      .then((d) => {
        const resolved = d.success ? (d.data ?? null) : null;
        if (!resolved && process.env.NODE_ENV === "development") {
          setData(DEV_FALLBACK);
        } else {
          setData(resolved);
        }
      })
      .catch(() => {
        if (process.env.NODE_ENV === "development") {
          setData(DEV_FALLBACK);
        } else {
          setData(null);
        }
      });
  }, []);

  if (data === undefined) {
    return (
      <div className="bg-[#111] border border-white/[0.06] rounded-xl px-4 py-3 animate-pulse flex items-center gap-4">
        <div className="w-8 h-8 bg-white/10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/10 rounded w-40" />
          <div className="h-1.5 bg-white/10 rounded-full" />
        </div>
        <div className="w-10 h-7 bg-white/10 rounded flex-shrink-0" />
      </div>
    );
  }

  if (!data) return null;

  const xpPct =
    data.xp_next > 0 ? Math.min(100, Math.round((data.xp_current / data.xp_next) * 100)) : 100;

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl px-5 py-4 flex items-center gap-4 sm:gap-6">
      {/* Icon */}
      <div className="w-10 h-10 bg-[#007A99]/10 rounded-xl flex items-center justify-center flex-shrink-0">
        <Shield className="w-5 h-5 text-[#009CD9]" />
      </div>

      {/* Label + level badge */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-gray-400 leading-none">Seu score na plataforma</p>
          <p className="text-xs text-gray-600 mt-0.5">Engaje para subir de nível</p>
        </div>
        <p className="text-sm font-semibold text-gray-400 sm:hidden">Score</p>
        <span className="text-xs font-bold bg-[#006079]/30 text-[#009CD9] border border-[#009CD9]/20 px-2.5 py-0.5 rounded-full">
          {data.level}
        </span>
      </div>

      {/* Score number */}
      <span className={`text-3xl font-black tabular-nums flex-shrink-0 ${scoreTextColor(data.score)}`}>
        {data.score}
      </span>

      {/* Progress bar + xp info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${barColor(data.score)}`}
            style={{ width: `${xpPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 truncate tabular-nums">
          {data.xp_current.toLocaleString("pt-BR")} xp
          {data.level !== "Superfã" && (
            <> · próximo nível: {data.xp_next.toLocaleString("pt-BR")} xp</>
          )}
        </p>
      </div>

      {/* Streak badge (optional) */}
      {data.streak > 0 && (
        <div className="flex-shrink-0 text-center hidden sm:block">
          <p className="text-base font-bold text-[#EEE6E4] tabular-nums leading-none">{data.streak}</p>
          <p className="text-xs text-gray-500 leading-tight">
            {data.streak === 1 ? "dia" : "dias"}
          </p>
        </div>
      )}
    </div>
  );
}
