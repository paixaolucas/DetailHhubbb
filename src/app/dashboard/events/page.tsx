"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Video, X, ChevronDown, Users, Clock } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

interface Community { id: string; name: string; primaryColor: string }
interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELED";
  isPublic: boolean;
  isRecorded: boolean;
  community: { id: string; name: string; primaryColor: string };
  host: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  _count: { attendees: number };
}

const STATUS_CONFIG = {
  SCHEDULED: { label: "Agendada",  color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  LIVE:      { label: "Ao Vivo",   color: "text-red-400 bg-red-500/10 border-red-500/20" },
  ENDED:     { label: "Encerrada", color: "text-gray-400 bg-white/5 border-white/10" },
  CANCELED:  { label: "Cancelada", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
};

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-white/10 rounded-xl w-40" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 bg-white/10 rounded w-48" />
            <div className="h-6 bg-white/10 rounded-full w-20" />
          </div>
          <div className="h-3 bg-white/10 rounded w-32" />
        </div>
      ))}
    </div>
  );
}

export default function EventsPage() {
  const toast = useToast();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "all">("upcoming");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    communityId: "",
    title: "",
    description: "",
    scheduledAt: "",
    isPublic: false,
    isRecorded: true,
  });
  const [creating, setCreating] = useState(false);

  const token = () => localStorage.getItem("detailhub_access_token") ?? "";

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token()}` };
    Promise.all([
      fetch("/api/live-sessions", { headers }).then((r) => r.json()),
      fetch("/api/communities/mine", { headers }).then((r) => r.json()),
    ])
      .then(([lv, cm]) => {
        if (lv.success) setSessions(lv.data ?? []);
        if (cm.success) {
          setCommunities(cm.data ?? []);
          if (cm.data?.[0]) setForm((f) => ({ ...f, communityId: cm.data[0].id }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const displayed = filter === "upcoming"
    ? sessions.filter((s) => s.status === "SCHEDULED" || s.status === "LIVE")
    : sessions;

  async function handleCreate() {
    if (!form.communityId || !form.title.trim() || !form.scheduledAt) return;
    setCreating(true);
    try {
      const res = await fetch("/api/live-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          communityId: form.communityId,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          isPublic: form.isPublic,
          isRecorded: form.isRecorded,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setSessions((prev) => [d.data, ...prev]);
        setShowCreate(false);
        setForm((f) => ({ ...f, title: "", description: "", scheduledAt: "" }));
        toast.success("Live agendada com sucesso!");
      } else {
        toast.error(d.error ?? "Erro ao criar live");
      }
    } catch {
      toast.error("Erro ao criar live");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Eventos & Lives</h1>
            <p className="text-gray-400 text-sm">Gerencie as lives e eventos das suas comunidades</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={communities.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/30"
        >
          <Plus className="w-4 h-4" />
          Agendar Live
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["upcoming", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-gray-400 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            {f === "upcoming" ? "Próximas" : "Todas"}
          </button>
        ))}
      </div>

      {/* Sessions */}
      {displayed.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Video className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Nenhuma live encontrada</p>
          <p className="text-gray-500 text-sm">
            {filter === "upcoming" ? "Agende sua próxima live para engajar a comunidade." : "Nenhuma live registrada ainda."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((session) => {
            const st = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.SCHEDULED;
            const date = new Date(session.scheduledAt);
            return (
              <div key={session.id} className="glass-card p-5 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${session.community.primaryColor}20` }}
                    >
                      <Video className="w-5 h-5" style={{ color: session.community.primaryColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{session.title}</p>
                      <p className="text-xs text-blue-400 mt-0.5">{session.community.name}</p>
                      {session.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{session.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          {date.toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3.5 h-3.5" />
                          {session._count.attendees} participante{session._count.attendees !== 1 ? "s" : ""}
                        </span>
                        {session.isRecorded && (
                          <span className="text-xs text-gray-500">Gravada</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border flex-shrink-0 font-medium ${st.color}`}>
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Agendar Live</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {communities.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Comunidade</label>
                <div className="relative">
                  <select
                    value={form.communityId}
                    onChange={(e) => setForm((f) => ({ ...f, communityId: e.target.value }))}
                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 transition-all"
                  >
                    {communities.map((c) => (
                      <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Título</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Masterclass Mecânica"
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Descrição <span className="text-gray-600">(opcional)</span></label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Descreva o conteúdo da live..."
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Data e Hora</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all [color-scheme:dark]"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
                  className="w-4 h-4 accent-blue-500 rounded"
                />
                <span className="text-sm text-gray-300">Pública</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRecorded}
                  onChange={(e) => setForm((f) => ({ ...f, isRecorded: e.target.checked }))}
                  className="w-4 h-4 accent-blue-500 rounded"
                />
                <span className="text-sm text-gray-300">Gravar</span>
              </label>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-xl text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.title.trim() || !form.scheduledAt}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                {creating ? "Agendando..." : "Agendar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
