"use client";

import { useState, useEffect, useCallback } from "react";
import { PlayCircle, Calendar, Users, Video, Clock, Check, HelpCircle, X as XIcon } from "lucide-react";

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledAt: string;
  streamUrl: string | null;
  replayUrl: string | null;
  _count: { attendees: number };
  community: { id: string; name: string; primaryColor: string };
}

type RsvpStatus = "GOING" | "MAYBE" | "NOT_GOING";
type RsvpMap = Record<string, RsvpStatus | null>;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Agendada", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  LIVE: { label: "Ao Vivo", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  ENDED: { label: "Encerrada", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  CANCELED: { label: "Cancelada", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
};

const FILTERS = [
  { value: "ALL", label: "Todas" },
  { value: "LIVE", label: "Ao Vivo" },
  { value: "SCHEDULED", label: "Agendadas" },
  { value: "ENDED", label: "Encerradas" },
];

const RSVP_OPTIONS: { value: RsvpStatus; label: string; icon: React.ElementType; active: string; inactive: string }[] = [
  { value: "GOING",     label: "Vou",      icon: Check,       active: "bg-green-600 text-white border-green-500",       inactive: "border-white/10 text-gray-400 hover:border-green-500/50 hover:text-green-400" },
  { value: "MAYBE",     label: "Talvez",   icon: HelpCircle,  active: "bg-yellow-600 text-white border-yellow-500",     inactive: "border-white/10 text-gray-400 hover:border-yellow-500/50 hover:text-yellow-400" },
  { value: "NOT_GOING", label: "Não vou",  icon: XIcon,       active: "bg-red-700 text-white border-red-600",           inactive: "border-white/10 text-gray-400 hover:border-red-500/50 hover:text-red-400" },
];

export default function LivesPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [rsvps, setRsvps] = useState<RsvpMap>({});
  const [rsvpLoading, setRsvpLoading] = useState<Record<string, boolean>>({});

  const token = () => localStorage.getItem("detailhub_access_token") ?? "";

  useEffect(() => {
    fetch("/api/live-sessions", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setSessions(d.data ?? []);
        // Fetch RSVPs for SCHEDULED sessions in parallel
        const scheduled: LiveSession[] = (d.data ?? []).filter((s: LiveSession) => s.status === "SCHEDULED");
        if (scheduled.length === 0) return;
        Promise.all(
          scheduled.map((s: LiveSession) =>
            fetch(`/api/live-sessions/${s.id}/rsvp`, { headers: { Authorization: `Bearer ${token()}` } })
              .then((r) => r.json())
              .then((r) => ({ id: s.id, status: r.data?.status ?? null }))
              .catch(() => ({ id: s.id, status: null }))
          )
        ).then((results) => {
          const map: RsvpMap = {};
          results.forEach(({ id, status }) => { map[id] = status; });
          setRsvps(map);
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleRsvp = useCallback(async (sessionId: string, status: RsvpStatus) => {
    // Optimistic update
    const prev = rsvps[sessionId];
    const next = prev === status ? null : status;
    setRsvps((r) => ({ ...r, [sessionId]: next }));
    setRsvpLoading((l) => ({ ...l, [sessionId]: true }));
    try {
      const res = await fetch(`/api/live-sessions/${sessionId}/rsvp`, {
        method: next ? "POST" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status: next ?? "NOT_GOING" }),
      });
      const d = await res.json();
      if (!d.success) setRsvps((r) => ({ ...r, [sessionId]: prev }));
    } catch {
      setRsvps((r) => ({ ...r, [sessionId]: prev }));
    } finally {
      setRsvpLoading((l) => ({ ...l, [sessionId]: false }));
    }
  }, [rsvps]);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const dayMs = 86400000;
    if (diff > 0 && diff < dayMs)
      return `Hoje às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    if (diff > dayMs && diff < 2 * dayMs)
      return `Amanhã às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const liveNow = sessions.filter((s) => s.status === "LIVE");
  const filtered = filter === "ALL" ? sessions : sessions.filter((s) => s.status === filter);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Lives</h1>
        <p className="text-gray-400 text-sm mt-1">Sessões ao vivo das suas comunidades</p>
      </div>

      {/* Live now banner */}
      {liveNow.length > 0 && (
        <div className="glass-card border-red-500/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-semibold text-sm uppercase tracking-wide">Acontecendo Agora</span>
          </div>
          <div className="space-y-3">
            {liveNow.map((session) => (
              <div key={session.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-red-500/20">
                <div>
                  <p className="font-semibold text-white text-sm">{session.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{session.community?.name}</p>
                </div>
                {session.streamUrl ? (
                  <button
                    onClick={() => window.open(session.streamUrl!, "_blank")}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Entrar
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex items-center gap-2 bg-red-600/40 text-red-300/60 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-not-allowed"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Aguardando link
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              filter === value
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "glass-card hover:border-white/20 text-gray-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Video className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Nenhuma live encontrada</h3>
          <p className="text-gray-400 text-sm">Nenhuma live disponível no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => {
            const statusConf = STATUS_CONFIG[session.status] ?? { label: session.status, color: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
            return (
              <div key={session.id} className={`glass-card p-5 hover:border-white/20 transition-all ${session.status === "LIVE" ? "border-red-500/30" : ""}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Video className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border flex items-center gap-1 ${statusConf.color}`}>
                        {session.status === "LIVE" && <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
                        {statusConf.label}
                      </span>
                      <span className="text-xs text-gray-500">{session.community?.name}</span>
                    </div>
                    <h3 className="font-semibold text-white">{session.title}</h3>
                    {session.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-1">{session.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(session.scheduledAt)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="w-3.5 h-3.5" />
                        {session._count.attendees} participante(s)
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {session.status === "LIVE" && (
                      session.streamUrl ? (
                        <button
                          onClick={() => window.open(session.streamUrl!, "_blank")}
                          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Entrar
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex items-center gap-1.5 bg-red-600/40 text-red-300/60 px-3 py-2 rounded-xl text-sm font-semibold cursor-not-allowed"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Aguardando link
                        </button>
                      )
                    )}
                    {session.status === "ENDED" && session.replayUrl && (
                      <a
                        href={session.replayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 glass-card hover:border-white/20 text-gray-300 hover:text-white px-3 py-2 rounded-xl text-sm font-medium transition-all"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Replay
                      </a>
                    )}
                    {session.status === "SCHEDULED" && (
                      <div className="flex items-center gap-1.5">
                        {RSVP_OPTIONS.map(({ value, label, icon: Icon, active, inactive }) => {
                          const isActive = rsvps[session.id] === value;
                          return (
                            <button
                              key={value}
                              onClick={() => handleRsvp(session.id, value)}
                              disabled={rsvpLoading[session.id]}
                              title={label}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 ${isActive ? active : inactive}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
