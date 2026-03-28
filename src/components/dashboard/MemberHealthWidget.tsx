"use client";

import { useEffect, useState } from "react";
import { Heart, Flame } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface HealthData {
  score: number;
  canPost: boolean;
  reactions: number;
  comments: number;
  threshold: number;
}

export function MemberHealthWidget() {
  const [data, setData] = useState<HealthData | null>(null);

  useEffect(() => {
    apiClient<HealthData>("/api/users/me/health")
      .then((d) => { if (d.success && d.data) setData(d.data); })
      .catch(() => {});
  }, []);

  if (!data) return null;

  const pct = Math.min(100, Math.round((data.score / data.threshold) * 100));
  const isActive = pct >= 60;

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#009CD9]" />
          <span className="text-sm font-semibold text-[#EEE6E4]">Saúde do membro</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
          isActive
            ? "text-green-400 bg-green-500/10 border-green-500/20"
            : "text-[#009CD9] bg-[#006079]/10 border-[#006079]/20"
        }`}>
          {isActive ? "Ativo" : "Engaje mais"}
        </span>
      </div>

      {/* Barra */}
      <div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isActive
                ? "bg-gradient-to-r from-green-600 to-green-400"
                : "bg-gradient-to-r from-[#006079] to-[#009CD9]"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Engajamento: {data.score}%</p>
      </div>

      {/* Contadores */}
      <div className="flex gap-3">
        <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-[#EEE6E4]">{data.reactions}</p>
          <p className="text-[11px] text-gray-500">reações este mês</p>
        </div>
        <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-[#EEE6E4]">{data.comments}</p>
          <p className="text-[11px] text-gray-500">comentários este mês</p>
        </div>
      </div>

      {/* Dica quando baixo engajamento */}
      {!isActive && (
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2">
          <Flame className="w-3.5 h-3.5 text-[#009CD9] mt-0.5 flex-shrink-0" />
          <span>Reaja e comente nos posts das comunidades para aumentar seu engajamento.</span>
        </div>
      )}
    </div>
  );
}
