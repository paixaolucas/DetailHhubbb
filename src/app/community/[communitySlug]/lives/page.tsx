"use client";

// =============================================================================
// Community Lives — ao vivo agora / próximas / replays
// Fetches from /api/communities/[slug]/lives
// Unified layout with CommunityHeader + CommunityTabs
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Video, CalendarDays, Play, Radio, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunityTabs } from "@/components/community/CommunityTabs";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { STORAGE_KEYS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Live {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELED";
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  replayUrl: string | null;
  actualAttendees: number;
  isRecorded: boolean;
  host: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  _count: { rsvps: number };
}

interface Community {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor: string;
  memberCount?: number;
  shortDescription?: string | null;
}

interface Influencer {
  displayName?: string | null;
  user?: { firstName: string; lastName: string; avatarUrl?: string | null } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PT_WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const PT_MONTHS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function formatScheduledDate(dateStr: string): string {
  const d = new Date(dateStr);
  const weekday = PT_WEEKDAYS[d.getDay()];
  const day = d.getDate();
  const month = PT_MONTHS[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${weekday}, ${day} ${month} • ${hours}h${minutes}`;
}

function getDurationMins(start: string, end: string): string {
  const diff = Math.floor(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000
  );
  return `${diff} min`;
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function LiveCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-white/10 rounded-full" />
        <div className="h-4 bg-white/10 rounded w-48" />
      </div>
      <div className="h-3 bg-white/10 rounded w-64" />
      <div className="h-3 bg-white/10 rounded w-32" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section sub-components
// ---------------------------------------------------------------------------

function LiveNowCard({ live }: { live: Live }) {
  const hostName = `${live.host.firstName} ${live.host.lastName}`;
  const hostInitials = `${live.host.firstName[0] ?? ""}${live.host.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="bg-gradient-to-br from-red-950/30 to-[#151515] border border-red-800/30 rounded-xl p-5 space-y-4">
      {/* Badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
          AO VIVO
        </span>
        <span className="text-gray-400 text-xs">
          {live.actualAttendees > 0 && `${live.actualAttendees} assistindo`}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[#EEE6E4] font-bold text-lg leading-tight">{live.title}</h3>
      {live.description && (
        <p className="text-gray-400 text-sm line-clamp-2">{live.description}</p>
      )}

      {/* Host */}
      <div className="flex items-center gap-2">
        {live.host.avatarUrl ? (
          <Image
            src={live.host.avatarUrl}
            alt={hostName}
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover border border-white/10"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {hostInitials}
          </div>
        )}
        <span className="text-gray-300 text-sm">{hostName}</span>
      </div>

      {/* CTA */}
      {live.replayUrl ? (
        <a
          href={live.replayUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
        >
          <Radio className="w-4 h-4" />
          Entrar na live
        </a>
      ) : (
        <button
          disabled
          className="inline-flex items-center gap-2 bg-white/10 text-gray-400 font-semibold px-5 py-2.5 rounded-xl text-sm cursor-not-allowed"
        >
          <Radio className="w-4 h-4" />
          Em breve
        </button>
      )}
    </div>
  );
}

function ScheduledCard({ live }: { live: Live }) {
  const hostName = `${live.host.firstName} ${live.host.lastName}`;
  const hostInitials = `${live.host.firstName[0] ?? ""}${live.host.lastName[0] ?? ""}`.toUpperCase();
  const [reminded, setReminded] = useState(false);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4">
      {/* Thumbnail or date block */}
      {live.thumbnailUrl ? (
        <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={live.thumbnailUrl}
            alt={live.title}
            width={80}
            height={56}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-20 h-14 rounded-lg bg-[#006079]/20 border border-[#006079]/20 flex flex-col items-center justify-center flex-shrink-0">
          <CalendarDays className="w-5 h-5 text-[#009CD9] mb-0.5" />
          <span className="text-[#009CD9] text-[10px] font-medium leading-none">
            {new Date(live.scheduledAt).getDate()}{" "}
            {PT_MONTHS[new Date(live.scheduledAt).getMonth()]}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-[#EEE6E4] font-semibold text-sm leading-tight truncate">
          {live.title}
        </p>
        <div className="flex items-center gap-2">
          {live.host.avatarUrl ? (
            <Image
              src={live.host.avatarUrl}
              alt={hostName}
              width={20}
              height={20}
              className="w-5 h-5 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
              {hostInitials}
            </div>
          )}
          <span className="text-gray-400 text-xs truncate">{hostName}</span>
        </div>
        <p className="text-gray-400 text-xs flex items-center gap-1">
          <CalendarDays className="w-3 h-3 flex-shrink-0" />
          {formatScheduledDate(live.scheduledAt)}
        </p>
        {live._count.rsvps > 0 && (
          <p className="text-gray-500 text-[10px]">
            {live._count.rsvps} confirmado{live._count.rsvps !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Remind button */}
      <div className="flex-shrink-0 flex items-start">
        <button
          onClick={() => setReminded((v) => !v)}
          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
            reminded
              ? "bg-[#006079]/20 border-[#006079]/40 text-[#009CD9]"
              : "bg-white/5 border-white/10 text-gray-400 hover:text-[#EEE6E4] hover:border-white/20"
          }`}
        >
          {reminded ? "Lembrando" : "Lembrar"}
        </button>
      </div>
    </div>
  );
}

function ReplayCard({ live }: { live: Live }) {
  const hostName = `${live.host.firstName} ${live.host.lastName}`;
  const hostInitials = `${live.host.firstName[0] ?? ""}${live.host.lastName[0] ?? ""}`.toUpperCase();
  const duration =
    live.startedAt && live.endedAt
      ? getDurationMins(live.startedAt, live.endedAt)
      : null;

  const inner = (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 hover:bg-white/8 hover:border-white/15 transition-all group">
      {/* Thumbnail or play block */}
      <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 relative bg-[#1A1A1A] border border-white/10">
        {live.thumbnailUrl ? (
          <Image
            src={live.thumbnailUrl}
            alt={live.title}
            width={80}
            height={56}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-5 h-5 text-gray-600" />
          </div>
        )}
        {/* Play overlay */}
        {live.replayUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-[#EEE6E4] font-semibold text-sm leading-tight truncate group-hover:text-[#009CD9] transition-colors">
          {live.title}
        </p>
        <div className="flex items-center gap-2">
          {live.host.avatarUrl ? (
            <Image
              src={live.host.avatarUrl}
              alt={hostName}
              width={20}
              height={20}
              className="w-5 h-5 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
              {hostInitials}
            </div>
          )}
          <span className="text-gray-400 text-xs truncate">{hostName}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span>{formatScheduledDate(live.scheduledAt)}</span>
          {duration && <span>• {duration}</span>}
        </div>
      </div>
    </div>
  );

  if (live.replayUrl) {
    return (
      <a href={live.replayUrl} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return inner;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CommunityLivesPage() {
  const params = useParams();
  const communitySlug = params.communitySlug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [lives, setLives] = useState<Live[]>([]);
  const [hasLive, setHasLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [optedIn, setOptedIn] = useState<boolean | null>(null);
  const [optInLoading, setOptInLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const headers = { Authorization: `Bearer ${token ?? ""}` };

        const overviewRes = await fetch(`/api/communities/${communitySlug}/overview`, {
          headers,
        });
        const overviewJson = overviewRes.ok ? await overviewRes.json() : { success: false };

        if (!overviewJson.success) {
          setError("Comunidade não encontrada.");
          return;
        }

        const found: Community = overviewJson.data.community;
        setCommunity(found);
        if (overviewJson.data.influencer) setInfluencer(overviewJson.data.influencer);

        // Opt-in status in parallel
        fetch(`/api/communities/${found.id}/join`, { headers })
          .then((r) => r.json())
          .then((jd) => {
            if (jd.success) setOptedIn(jd.data?.joined ?? false);
          })
          .catch(() => {});

        // Lives
        const livesRes = await fetch(`/api/communities/${communitySlug}/lives`, { headers });
        const livesJson = livesRes.ok ? await livesRes.json() : { success: false };
        if (livesJson.success) {
          setLives(livesJson.data?.lives ?? []);
          setHasLive(livesJson.data?.hasLive ?? false);
        }
      } catch {
        setError("Erro de conexão.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [communitySlug]);

  const handleOptIn = useCallback(async () => {
    if (!community) return;
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    setOptInLoading(true);
    try {
      const method = optedIn ? "DELETE" : "POST";
      const res = await fetch(`/api/communities/${community.id}/join`, {
        method,
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      const d = await res.json();
      if (d.success) setOptedIn(d.data.joined);
    } catch {
      // ignore
    } finally {
      setOptInLoading(false);
    }
  }, [community, optedIn]);

  // Partition lives by status
  const livesNow = lives.filter((l) => l.status === "LIVE");
  const upcoming = lives.filter(
    (l) =>
      l.status === "SCHEDULED" && new Date(l.scheduledAt).getTime() > Date.now()
  );
  const replays = lives.filter((l) => l.status === "ENDED");

  const isEmpty = !loading && livesNow.length === 0 && upcoming.length === 0 && replays.length === 0;

  return (
    <div className="text-[#EEE6E4]">
      {/* Mobile top bar */}
      <header className="h-14 bg-[#1A1A1A]/90 border-b border-white/8 flex items-center px-4 gap-3 sticky top-0 z-30 backdrop-blur-sm md:hidden">
        <Link href="/inicio" className="flex items-center gap-1.5 text-gray-400 hover:text-[#EEE6E4] transition-colors shrink-0 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-medium">Início</span>
        </Link>
        <span className="text-sm font-semibold text-[#EEE6E4] truncate flex-1 min-w-0">
          {community?.name ?? "Comunidade"}
        </span>
        <NotificationBell />
      </header>

      {community && (
        <>
          <CommunityHeader
            community={community}
            influencer={influencer}
            optedIn={optedIn}
            onOptIn={handleOptIn}
            optInLoading={optInLoading}
          />
          <CommunityTabs
            communitySlug={communitySlug}
            primaryColor={community.primaryColor}
            hasLive={hasLive}
          />
        </>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <LiveCardSkeleton />
            <LiveCardSkeleton />
            <LiveCardSkeleton />
          </div>
        ) : isEmpty ? (
          /* Empty state */
          <div className="bg-white/5 border border-white/10 rounded-xl p-16 text-center">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Video className="w-7 h-7 text-gray-500" />
            </div>
            <p className="text-[#EEE6E4] font-semibold mb-1">
              Nenhuma live disponível ainda
            </p>
            <p className="text-gray-400 text-sm">
              O influenciador ainda não agendou nenhuma live.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Ao vivo agora */}
            {livesNow.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                  Ao vivo agora
                </h2>
                <div className="space-y-4">
                  {livesNow.map((live) => (
                    <LiveNowCard key={live.id} live={live} />
                  ))}
                </div>
              </section>
            )}

            {/* Próximas lives */}
            {upcoming.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Próximas lives
                </h2>
                <div className="space-y-3">
                  {upcoming.map((live) => (
                    <ScheduledCard key={live.id} live={live} />
                  ))}
                </div>
              </section>
            )}

            {/* Replays */}
            {replays.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Replays
                </h2>
                <div className="space-y-3">
                  {replays.map((live) => (
                    <ReplayCard key={live.id} live={live} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
