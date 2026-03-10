"use client";

import { useState, useEffect } from "react";
import {
  Video,
  Plus,
  Calendar,
  Users,
  PlayCircle,
  StopCircle,
  XCircle,
  Trash2,
  Pencil,
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  LIVE: "bg-red-500/10 text-red-400 border-red-500/20",
  ENDED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  CANCELED: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Agendada",
  LIVE: "Ao Vivo",
  ENDED: "Encerrada",
  CANCELED: "Cancelada",
};

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledAt: string;
  maxAttendees: number | null;
  isPublic: boolean;
  isRecorded: boolean;
  _count: { attendees: number };
  community: { id: string; name: string; primaryColor: string };
}

interface Community {
  id: string;
  name: string;
}

function fieldClass() {
  return "w-full bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all text-sm";
}

export default function LivePage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; description: string;
    variant?: "danger" | "default"; onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  const [form, setForm] = useState({
    communityId: "",
    title: "",
    description: "",
    scheduledAt: "",
    maxAttendees: "",
    isPublic: false,
    isRecorded: true,
  });
  const [editingSession, setEditingSession] = useState<LiveSession | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    Promise.all([
      fetch("/api/communities/mine", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("/api/live-sessions", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([commData, sessData]) => {
      if (commData.success) {
        setCommunities(commData.data ?? []);
        if (commData.data?.length > 0) {
          setForm((p) => ({ ...p, communityId: commData.data[0].id }));
        }
      }
      if (sessData.success) setSessions(sessData.data ?? []);
    }).finally(() => setIsLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch("/api/live-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          communityId: form.communityId,
          title: form.title,
          description: form.description || undefined,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : undefined,
          isPublic: form.isPublic,
          isRecorded: form.isRecorded,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Erro ao criar live"); return; }
      setSessions((prev) => [data.data, ...prev]);
      setShowNewForm(false);
      setForm((p) => ({ ...p, title: "", description: "", scheduledAt: "", maxAttendees: "" }));
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(session: LiveSession) {
    setEditingSession(session);
    const localDate = new Date(session.scheduledAt);
    const yyyy = localDate.getFullYear();
    const mm = String(localDate.getMonth() + 1).padStart(2, "0");
    const dd = String(localDate.getDate()).padStart(2, "0");
    const hh = String(localDate.getHours()).padStart(2, "0");
    const min = String(localDate.getMinutes()).padStart(2, "0");
    setForm({
      communityId: session.community.id,
      title: session.title,
      description: session.description ?? "",
      scheduledAt: `${yyyy}-${mm}-${dd}T${hh}:${min}`,
      maxAttendees: session.maxAttendees ? String(session.maxAttendees) : "",
      isPublic: session.isPublic,
      isRecorded: session.isRecorded,
    });
    setShowNewForm(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSession) return;
    setError("");
    setSaving(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/live-sessions/${editingSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : undefined,
          isPublic: form.isPublic,
          isRecorded: form.isRecorded,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Erro ao atualizar live"); return; }
      setSessions((prev) => prev.map((s) => s.id === editingSession.id ? { ...s, ...data.data } : s));
      setShowNewForm(false);
      setEditingSession(null);
      setForm((p) => ({ ...p, title: "", description: "", scheduledAt: "", maxAttendees: "" }));
    } finally { setSaving(false); }
  }

  async function updateStatus(sessionId: string, status: string) {
    const token = localStorage.getItem("detailhub_access_token");
    const res = await fetch(`/api/live-sessions/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status } : s)));
  }

  async function deleteSession(sessionId: string) {
    setConfirmState({
      open: true,
      title: "Excluir esta live?",
      description: "A sessão será removida permanentemente.",
      variant: "danger",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        const token = localStorage.getItem("detailhub_access_token");
        await fetch(`/api/live-sessions/${sessionId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      },
    });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function getDefaultDateTime() {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setSeconds(0);
    return d.toISOString().slice(0, 16);
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-4xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl h-24" />
        ))}
      </div>
    );
  }

  const live = sessions.filter((s) => s.status === "LIVE");
  const upcoming = sessions.filter((s) => s.status === "SCHEDULED");
  const past = sessions.filter((s) => s.status === "ENDED" || s.status === "CANCELED");

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lives</h1>
          <p className="text-gray-400 text-sm mt-1">Agende e gerencie suas sessões ao vivo</p>
        </div>
        <button
          onClick={() => { setEditingSession(null); setShowNewForm(!showNewForm); if (!form.scheduledAt) setForm((p) => ({ ...p, scheduledAt: getDefaultDateTime() })); }}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/30"
        >
          <Plus className="w-4 h-4" />
          Agendar Live
        </button>
      </div>

      {/* New form */}
      {showNewForm && (
        <form onSubmit={editingSession ? handleUpdate : handleCreate} className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">{editingSession ? "Editar Live" : "Nova Sessão ao Vivo"}</h2>
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {communities.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Comunidade</label>
                <select value={form.communityId} onChange={(e) => setForm((p) => ({ ...p, communityId: e.target.value }))} className={fieldClass()} required>
                  {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Título da live *</label>
              <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ex: Masterclass: Diagnóstico OBD2" className={fieldClass()} required />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Descrição</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="O que será abordado..." rows={2} className={`${fieldClass()} resize-none`} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Data e hora *</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))} className={fieldClass()} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Limite de participantes</label>
              <input type="number" value={form.maxAttendees} onChange={(e) => setForm((p) => ({ ...p, maxAttendees: e.target.value }))} placeholder="Ilimitado" min="1" className={fieldClass()} />
            </div>
          </div>

          <div className="flex gap-4">
            {[
              { key: "isRecorded", label: "Gravar sessão" },
              { key: "isPublic", label: "Sessão pública" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-200 bg-white"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
              {saving ? "Salvando..." : editingSession ? "Salvar Alterações" : "Agendar Live"}
            </button>
            <button type="button" onClick={() => { setShowNewForm(false); setEditingSession(null); }} className="px-5 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl text-sm text-gray-600 hover:text-gray-900 transition-all">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Live now */}
      {live.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Ao Vivo Agora
          </h2>
          <div className="space-y-3">
            {live.map((s) => <SessionCard key={s.id} session={s} onStatusChange={updateStatus} onDelete={deleteSession} onEdit={handleEdit} formatDate={formatDate} />)}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Próximas Lives</h2>
          <div className="space-y-3">
            {upcoming.map((s) => <SessionCard key={s.id} session={s} onStatusChange={updateStatus} onDelete={deleteSession} onEdit={handleEdit} formatDate={formatDate} />)}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Lives Anteriores</h2>
          <div className="space-y-3">
            {past.map((s) => <SessionCard key={s.id} session={s} onStatusChange={updateStatus} onDelete={deleteSession} onEdit={handleEdit} formatDate={formatDate} />)}
          </div>
        </div>
      )}

      {sessions.length === 0 && !showNewForm && (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Video className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma live agendada</h3>
          <p className="text-gray-400 text-sm mb-6">Agende sua primeira sessão ao vivo para engajar sua audiência.</p>
          <button onClick={() => setShowNewForm(true)} className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
            Agendar Live
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        variant={confirmState.variant}
        confirmLabel="Excluir"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}

function SessionCard({ session, onStatusChange, onDelete, onEdit, formatDate }: {
  session: LiveSession;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onEdit: (session: LiveSession) => void;
  formatDate: (d: string) => string;
}) {
  const statusClass = STATUS_COLORS[session.status] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
  return (
    <div className={`glass-card p-5 hover:border-violet-200 transition-all ${session.status === "LIVE" ? "border-red-500/30" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusClass}`}>
              {session.status === "LIVE" && <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full mr-1 animate-pulse" />}
              {STATUS_LABELS[session.status] ?? session.status}
            </span>
            {session.community?.name && (
              <span className="text-xs text-gray-500">{session.community.name}</span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900">{session.title}</h3>
          {session.description && <p className="text-sm text-gray-400 mt-1 line-clamp-1">{session.description}</p>}
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(session.scheduledAt)}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5" />
              {session._count.attendees}{session.maxAttendees ? ` / ${session.maxAttendees}` : ""} participantes
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {session.status === "SCHEDULED" && (
            <>
              <button onClick={() => onEdit(session)} className="flex items-center gap-1.5 text-xs bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-xl font-medium transition-colors">
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
              <button onClick={() => onStatusChange(session.id, "LIVE")} className="flex items-center gap-1.5 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1.5 rounded-xl font-medium transition-colors">
                <PlayCircle className="w-3.5 h-3.5" />
                Iniciar
              </button>
            </>
          )}
          {session.status === "LIVE" && (
            <button onClick={() => onStatusChange(session.id, "ENDED")} className="flex items-center gap-1.5 text-xs bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 border border-gray-500/20 px-2.5 py-1.5 rounded-xl font-medium transition-colors">
              <StopCircle className="w-3.5 h-3.5" />
              Encerrar
            </button>
          )}
          {session.status === "SCHEDULED" && (
            <button onClick={() => onStatusChange(session.id, "CANCELED")} className="p-1.5 text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors" title="Cancelar">
              <XCircle className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => onDelete(session.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
