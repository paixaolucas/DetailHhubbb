"use client";

import Link from "next/link";
import { BookOpen, Video } from "lucide-react";
import { useDashboardContext } from "@/hooks/useDashboardContext";

function formatLiveTime(scheduledAt: string, status: string): string {
  if (status === "LIVE") return "Ao vivo agora";
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return "Começando";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours >= 24) return `em ${Math.floor(hours / 24)}d`;
  if (hours > 0) return `em ${hours}h${mins > 0 ? `${mins}m` : ""}`;
  return `em ${mins}min`;
}

export function ActivityPulse() {
  const { data, loading } = useDashboardContext();

  if (loading) return null;
  if (!data) return null;

  const hasNew =
    data.newContentSinceLogin > 0 ||
    data.nextLive !== null ||
    data.unreadNotifications > 0;
  if (!hasNew) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap px-1">
      <span className="text-xs text-gray-600 flex-shrink-0">Desde ontem:</span>

      {data.newContentSinceLogin > 0 && (
        <Link
          href="/dashboard/meu-aprendizado"
          className="flex items-center gap-1.5 text-xs font-semibold bg-[#006079]/10 hover:bg-[#006079]/20 text-[#009CD9] border border-[#006079]/20 px-2.5 py-1 rounded-full transition-all"
        >
          <BookOpen className="w-3 h-3" />
          {data.newContentSinceLogin} nova
          {data.newContentSinceLogin > 1 ? "s aulas" : " aula"}
        </Link>
      )}

      {data.nextLive && (
        <Link
          href="/dashboard/lives"
          className={`flex items-center gap-1.5 text-xs font-semibold border px-2.5 py-1 rounded-full transition-all ${
            data.nextLive.status === "LIVE"
              ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
              : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              data.nextLive.status === "LIVE"
                ? "bg-red-500 animate-pulse"
                : "bg-gray-500"
            }`}
          />
          <Video className="w-3 h-3" />
          {data.nextLive.status === "LIVE"
            ? "Ao vivo"
            : formatLiveTime(data.nextLive.scheduledAt, data.nextLive.status)}
        </Link>
      )}
    </div>
  );
}
