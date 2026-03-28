"use client";

import { useEffect, useState } from "react";
import { Flame, Bell } from "lucide-react";
import Link from "next/link";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { apiClient } from "@/lib/api-client";
import { getGreeting } from "@/lib/greeting";

interface HealthScoreData {
  score: number;
  level: string;
  xp_current: number;
  xp_next: number;
  streak: number;
}

function getContextualSubtitle(
  streak: number,
  absentDays: number,
  newContentSinceLogin: number,
  lastInfluencerWithContent: string | null,
  isNewMember: boolean
): string {
  if (isNewMember) return "Bem-vindo à plataforma! Explore as comunidades.";
  if (absentDays >= 3) return "Sentimos sua falta. Veja o que aconteceu.";
  if (streak >= 3) return "Continue assim, você está em sequência!";
  if (newContentSinceLogin > 0 && lastInfluencerWithContent) {
    return `${lastInfluencerWithContent} publicou ${newContentSinceLogin} aula${newContentSinceLogin > 1 ? "s" : ""} nova${newContentSinceLogin > 1 ? "s" : ""}.`;
  }
  return "Que bom que voltou.";
}

export function GreetingBar({ firstName }: { firstName: string }) {
  const { data: ctx } = useDashboardContext();
  const [health, setHealth] = useState<HealthScoreData | null>(null);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(getGreeting(firstName));
  }, [firstName]);

  useEffect(() => {
    apiClient<HealthScoreData>("/api/dashboard/health-score")
      .then((d) => {
        if (d.success && d.data) setHealth(d.data);
      })
      .catch(() => {});
  }, []);

  const streak = ctx?.streak ?? health?.streak ?? 0;
  const subtitle = ctx
    ? getContextualSubtitle(
        ctx.streak,
        ctx.absentDays,
        ctx.newContentSinceLogin,
        ctx.lastInfluencerWithContent,
        ctx.isNewMember
      )
    : "";

  const xpPct =
    health && health.xp_next > 0
      ? Math.min(100, Math.round((health.xp_current / health.xp_next) * 100))
      : 0;

  return (
    <div className="space-y-2 px-1">
      {/* Linha principal */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-black text-[#EEE6E4] leading-tight">
            {greeting || `Olá, ${firstName}!`}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Pills */}
        <div className="flex items-center gap-2 flex-shrink-0 pt-1">
          {streak >= 2 && (
            <span
              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                streak >= 7
                  ? "bg-orange-500/15 text-orange-400 border-orange-500/25 animate-pulse"
                  : "bg-orange-500/10 text-orange-400 border-orange-500/20"
              }`}
            >
              <Flame className="w-3 h-3" />
              {streak}d
            </span>
          )}

          {health && (
            <span className="text-xs font-bold bg-[#006079]/20 text-[#009CD9] border border-[#009CD9]/20 px-2.5 py-1 rounded-full">
              {health.level}
            </span>
          )}

          {(ctx?.unreadNotifications ?? 0) > 0 && (
            <Link
              href="/dashboard/notifications"
              className="flex items-center gap-1 text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#EEE6E4] border border-white/10 px-2.5 py-1 rounded-full transition-all"
            >
              <Bell className="w-3 h-3" />
              {ctx!.unreadNotifications}
            </Link>
          )}
        </div>
      </div>

      {/* XP bar compacta */}
      {health && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#006079] to-[#009CD9] rounded-full transition-all duration-700"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 tabular-nums flex-shrink-0">
            {health.xp_current.toLocaleString("pt-BR")} xp
          </span>
        </div>
      )}
    </div>
  );
}
