"use client";

import { useEffect, useState } from "react";
import { Heart, Flame, Lock, CheckCircle2 } from "lucide-react";
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
  const canPost = data.canPost;

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#009CD9]" />
          <span className="text-sm font-semibold text-[#EEE6E4]">Saúde do membro</span>
        </div>
        {canPost ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Pode postar
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            <Lock className="w-3.5 h-3.5" />
            Posts bloqueados
          </div>
        )}
      </div>

      {/* Barra */}
      <div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              canPost
                ? "bg-gradient-to-r from-green-600 to-green-400"
                : "bg-gradient-to-r from-[#006079] to-[#009CD9]"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">Saúde: {data.score}%</span>
          <span className="text-xs text-gray-500">Meta: {data.threshold}%</span>
        </div>
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

      {/* Dica quando bloqueado */}
      {!canPost && (
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2">
          <Flame className="w-3.5 h-3.5 text-[#009CD9] mt-0.5 flex-shrink-0" />
          <span>Reaja e comente nos posts das comunidades para aumentar sua saúde e desbloquear a criação de posts.</span>
        </div>
      )}
    </div>
  );
}
