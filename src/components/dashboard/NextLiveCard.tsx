"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlayCircle, Bell, Calendar } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface LiveData {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  scheduledAt: string;
  status: string;
  isFeatured: boolean;
  host: { name: string; avatarUrl: string | null };
  community: { name: string; slug: string };
  rsvpCount: number;
  hasRSVP: boolean;
}

function useLiveBadge(scheduledAt: string, status: string): string {
  const [badge, setBadge] = useState("");

  useEffect(() => {
    function compute() {
      if (status === "LIVE") return "Ao vivo agora";
      const msUntil = new Date(scheduledAt).getTime() - Date.now();
      const days = Math.ceil(msUntil / 86400000);
      const now = new Date();
      const target = new Date(scheduledAt);
      const isToday =
        target.getDate() === now.getDate() &&
        target.getMonth() === now.getMonth() &&
        target.getFullYear() === now.getFullYear();
      if (isToday) {
        return `Hoje às ${target.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
      }
      return `Em ${days} dia${days > 1 ? "s" : ""}`;
    }
    setBadge(compute());
    const id = setInterval(() => setBadge(compute()), 60_000);
    return () => clearInterval(id);
  }, [scheduledAt, status]);

  return badge;
}

function LiveBadge({ scheduledAt, status }: { scheduledAt: string; status: string }) {
  const badge = useLiveBadge(scheduledAt, status);
  const isLive = status === "LIVE";
  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
        isLive
          ? "bg-red-600 text-white"
          : "bg-[#006079]/30 text-[#009CD9] border border-[#009CD9]/20"
      }`}
    >
      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      {!isLive && <Calendar className="w-3 h-3" />}
      {badge}
    </div>
  );
}

export function NextLiveCard() {
  const [live, setLive] = useState<LiveData | null | undefined>(undefined);
  const [rsvping, setRsvping] = useState(false);

  useEffect(() => {
    apiClient<LiveData | null>("/api/lives/next?featured=true")
      .then((d) => {
        setLive(d.success ? (d.data ?? null) : null);
      })
      .catch(() => setLive(null));
  }, []);

  if (live === undefined) {
    return (
      <div className="bg-[#111] border border-white/[0.06] rounded-xl p-4 animate-pulse space-y-3">
        <div className="h-4 bg-white/10 rounded w-32" />
        <div className="h-24 bg-white/10 rounded-xl" />
        <div className="h-8 bg-white/10 rounded-xl" />
      </div>
    );
  }

  // Regra de ouro: sem live featured, retorna null (sem card vazio)
  if (!live) return null;

  const isLive = live.status === "LIVE";

  async function handleRSVP() {
    if (rsvping || !live) return;
    setRsvping(true);
    try {
      await apiClient(`/api/lives/${live.id}/rsvp`, { method: "POST" });
      setLive((prev) =>
        prev ? { ...prev, hasRSVP: true, rsvpCount: prev.rsvpCount + 1 } : prev
      );
    } catch {
      // silent
    } finally {
      setRsvping(false);
    }
  }

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Thumbnail */}
      {live.thumbnailUrl && (
        <div className="relative h-28">
          <Image src={live.thumbnailUrl} alt={live.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-2 left-2">
            <LiveBadge scheduledAt={live.scheduledAt} status={live.status} />
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Label + badge (when no thumbnail) */}
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-[#009CD9] flex-shrink-0" />
            <p className="text-xs font-semibold text-[#009CD9] uppercase tracking-wide">
              {isLive ? "Ao vivo agora" : "Próxima live"}
            </p>
          </div>
          {!live.thumbnailUrl && (
            <LiveBadge scheduledAt={live.scheduledAt} status={live.status} />
          )}
        </div>

        {/* Title */}
        <p className="text-sm font-bold text-[#EEE6E4] leading-tight line-clamp-2">
          {live.title}
        </p>

        {/* Host + community */}
        <div className="flex items-center gap-2">
          {live.host.avatarUrl ? (
            <Image
              src={live.host.avatarUrl}
              alt={live.host.name}
              width={20}
              height={20}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#006079] flex items-center justify-center text-white text-[10px] font-bold">
              {live.host.name[0]}
            </div>
          )}
          <p className="text-xs text-gray-400">{live.host.name}</p>
          <span className="text-gray-600">·</span>
          <p className="text-xs text-gray-400 truncate">{live.community.name}</p>
        </div>

        {/* CTA */}
        {isLive ? (
          <Link
            href={`/community/${live.community.slug}/lives/${live.id}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            <PlayCircle className="w-4 h-4" /> Entrar na live
          </Link>
        ) : live.hasRSVP ? (
          <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20">
            <Bell className="w-3.5 h-3.5" /> Lembrete ativado · {live.rsvpCount} confirmados
          </div>
        ) : (
          <button
            onClick={handleRSVP}
            disabled={rsvping}
            aria-label={`Ativar lembrete para a live: ${live.title}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-[#009CD9] bg-[#006079]/20 hover:bg-[#006079]/30 border border-[#009CD9]/20 transition-colors disabled:opacity-50"
          >
            <Bell className="w-3.5 h-3.5" />
            {rsvping ? "Salvando..." : `Lembrar · ${live.rsvpCount} confirmados`}
          </button>
        )}
      </div>
    </div>
  );
}
