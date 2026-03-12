"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Calendar,
  Plus,
  MapPin,
  Globe,
  Users,
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Edit3,
  Send,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Video,
  Building,
  Layers,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { STORAGE_KEYS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Auth helper — adds Bearer token from localStorage to every request
// ---------------------------------------------------------------------------
function authedFetch(url: string, options?: RequestInit): Promise<Response> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      : null;
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type EventType = "ONLINE" | "IN_PERSON" | "HYBRID";
type EventStatus = "DRAFT" | "PUBLISHED" | "SOLD_OUT" | "CANCELED" | "COMPLETED";

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number | null;
  sold: number;
  isActive: boolean;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  type: EventType;
  status: EventStatus;
  startAt: string;
  endAt: string | null;
  location: string | null;
  capacity: number | null;
  isPublic: boolean;
  coverImageUrl: string | null;
  community: { id: string; name: string; logoUrl: string | null } | null;
  ticketTypes: TicketType[];
  _count: { registrations: number };
}

interface Attendee {
  id: string;
  status: string;
  amount: number;
  checkedInAt: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string; avatarUrl: string | null };
  ticketType: { id: string; name: string; price: number };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TYPE_CONFIG: Record<EventType, { label: string; icon: React.ElementType; color: string }> = {
  ONLINE: { label: "Online", icon: Video, color: "text-blue-400" },
  IN_PERSON: { label: "Presencial", icon: Building, color: "text-green-400" },
  HYBRID: { label: "Híbrido", icon: Layers, color: "text-purple-400" },
};

const STATUS_CONFIG: Record<EventStatus, { label: string; color: string }> = {
  DRAFT: { label: "Rascunho", color: "text-gray-400 bg-gray-400/10" },
  PUBLISHED: { label: "Publicado", color: "text-green-400 bg-green-400/10" },
  SOLD_OUT: { label: "Esgotado", color: "text-orange-400 bg-orange-400/10" },
  CANCELED: { label: "Cancelado", color: "text-red-400 bg-red-400/10" },
  COMPLETED: { label: "Concluído", color: "text-blue-400 bg-blue-400/10" },
};

function fmtBrl(n: number) {
  return n === 0 ? "Gratuito" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// CreateEventModal
// ---------------------------------------------------------------------------
function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "ONLINE" as EventType,
    startAt: "",
    endAt: "",
    location: "",
    onlineUrl: "",
    capacity: "",
    isPublic: true,
    coverImageUrl: "",
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.startAt) {
      toast.error("Preencha título e data de início");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        ...form,
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
      };
      const res = await authedFetch("/api/events", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Evento criado!");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar evento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="glass-card w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-white mb-4">Novo Evento</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Título *</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="Ex: Workshop de Polimento Profissional"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Formato *</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              value={form.type}
              onChange={(e) => set("type", e.target.value as EventType)}
            >
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">Presencial</option>
              <option value="HYBRID">Híbrido</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data Início *</label>
              <input
                type="datetime-local"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                value={form.startAt}
                onChange={(e) => set("startAt", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data Fim</label>
              <input
                type="datetime-local"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                value={form.endAt}
                onChange={(e) => set("endAt", e.target.value)}
              />
            </div>
          </div>
          {(form.type === "IN_PERSON" || form.type === "HYBRID") && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Local / Endereço</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Rua, número, cidade"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
          )}
          {(form.type === "ONLINE" || form.type === "HYBRID") && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Link Online</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="https://meet.google.com/..."
                value={form.onlineUrl}
                onChange={(e) => set("onlineUrl", e.target.value)}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Capacidade</label>
              <input
                type="number"
                min="1"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Ilimitado"
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => set("isPublic", !form.isPublic)}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${form.isPublic ? "bg-blue-500" : "bg-white/10"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${form.isPublic ? "translate-x-5 ml-0.5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-gray-300 text-sm">Público</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Capa (URL da imagem)</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="https://..."
              value={form.coverImageUrl}
              onChange={(e) => set("coverImageUrl", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <textarea
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Descreva o evento..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/5 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-premium py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? "Criando..." : "Criar Evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AddTicketModal
// ---------------------------------------------------------------------------
function AddTicketModal({ eventId, onClose, onAdded }: { eventId: string; onClose: () => void; onAdded: () => void }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "0", quantity: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    setLoading(true);
    try {
      const res = await authedFetch(`/api/events/${eventId}/ticket-types`, {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          price: parseFloat(form.price) || 0,
          quantity: form.quantity ? parseInt(form.quantity) : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Ingresso adicionado!");
      onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="glass-card w-full max-w-sm p-6 animate-slide-up">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Ticket size={18} className="text-blue-400" />
          Novo Tipo de Ingresso
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome *</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder="Ex: VIP, Geral, Gratuito" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Preço (R$)</label>
              <input type="number" min="0" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" value={form.price} onChange={(e) => set("price", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Qtd. (vazio=∞)</label>
              <input type="number" min="1" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder="Ilimitado" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder="Benefícios inclusos..." value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/5 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 btn-premium py-2 rounded-lg text-sm font-medium disabled:opacity-50">{loading ? "Adicionando..." : "Adicionar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AttendeesModal
// ---------------------------------------------------------------------------
function AttendeesModal({ eventId, eventTitle, onClose }: { eventId: string; eventTitle: string; onClose: () => void }) {
  const toast = useToast();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch(`/api/events/${eventId}/attendees`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setAttendees(d.data); })
      .catch(() => toast.error("Erro ao carregar participantes"))
      .finally(() => setLoading(false));
  }, [eventId, toast]);

  const STATUS_LABEL: Record<string, string> = {
    CONFIRMED: "Confirmado",
    PENDING_PAYMENT: "Aguardando Pgto",
    CANCELED: "Cancelado",
    ATTENDED: "Presente",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="glass-card w-full max-w-2xl p-6 animate-slide-up max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Participantes — {eventTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XCircle size={20} />
          </button>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />)}
          </div>
        ) : attendees.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">Nenhum participante ainda.</p>
        ) : (
          <div className="overflow-y-auto space-y-2 flex-1">
            {attendees.map((a) => (
              <div key={a.id} className="flex items-center gap-3 bg-white/3 rounded-lg p-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm text-gray-300 font-medium flex-shrink-0">
                  {a.user.firstName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{a.user.firstName} {a.user.lastName}</p>
                  <p className="text-gray-500 text-xs truncate">{a.user.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-gray-300 text-xs">{a.ticketType.name}</p>
                  <p className="text-gray-500 text-xs">{STATUS_LABEL[a.status] ?? a.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-gray-500 text-xs mt-3">{attendees.length} participante(s)</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditEventModal
// ---------------------------------------------------------------------------
function EditEventModal({ event, onClose, onSaved }: { event: Event; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: event.title,
    type: event.type,
    startAt: event.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : "",
    endAt: event.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : "",
    location: event.location ?? "",
    capacity: event.capacity ? String(event.capacity) : "",
    isPublic: event.isPublic,
    coverImageUrl: event.coverImageUrl ?? "",
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.startAt) { toast.error("Preencha título e data de início"); return; }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        type: form.type,
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        location: form.location || null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        isPublic: form.isPublic,
        coverImageUrl: form.coverImageUrl || null,
      };
      const res = await authedFetch(`/api/events/${event.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Evento atualizado!");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="glass-card w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-white mb-4">Editar Evento</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Título *</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Formato *</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" value={form.type} onChange={(e) => set("type", e.target.value as EventType)}>
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">Presencial</option>
              <option value="HYBRID">Híbrido</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data Início *</label>
              <input type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" value={form.startAt} onChange={(e) => set("startAt", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data Fim</label>
              <input type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" value={form.endAt} onChange={(e) => set("endAt", e.target.value)} />
            </div>
          </div>
          {(form.type === "IN_PERSON" || form.type === "HYBRID") && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Local / Endereço</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder="Rua, número, cidade" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Capacidade</label>
              <input type="number" min="1" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder="Ilimitado" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => set("isPublic", !form.isPublic)} className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${form.isPublic ? "bg-blue-500" : "bg-white/10"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${form.isPublic ? "translate-x-5 ml-0.5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-gray-300 text-sm">Público</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Capa (URL)</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder="https://..." value={form.coverImageUrl} onChange={(e) => set("coverImageUrl", e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/5 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 btn-premium py-2 rounded-lg text-sm font-medium disabled:opacity-50">{loading ? "Salvando..." : "Salvar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EventCard
// ---------------------------------------------------------------------------
function EventCard({
  event,
  onPublish,
  onDelete,
  onAddTicket,
  onViewAttendees,
  onEdit,
}: {
  event: Event;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTicket: (id: string) => void;
  onViewAttendees: (event: Event) => void;
  onEdit: (event: Event) => void;
}) {
  const { label, color } = STATUS_CONFIG[event.status];
  const { label: typeLabel, icon: TypeIcon, color: typeColor } = TYPE_CONFIG[event.type];
  const registrations = event._count.registrations;
  const lowestPrice = event.ticketTypes.length > 0
    ? Math.min(...event.ticketTypes.map((t) => Number(t.price)))
    : null;

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Cover */}
      {event.coverImageUrl && (
        <Image src={event.coverImageUrl} alt={event.title} width={600} height={128} className="w-full h-32 object-cover rounded-lg" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{event.title}</p>
          {event.community && (
            <p className="text-gray-500 text-xs mt-0.5">{event.community.name}</p>
          )}
        </div>
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${color}`}>
          {label}
        </span>
      </div>

      {/* Meta */}
      <div className="space-y-1.5 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span>{fmtDate(event.startAt)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TypeIcon size={12} className={typeColor} />
          <span>{typeLabel}</span>
          {event.location && <span className="text-gray-500">· {event.location}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {registrations}{event.capacity ? ` / ${event.capacity}` : ""} inscritos
          </span>
          {lowestPrice !== null && (
            <span className="flex items-center gap-1">
              <Ticket size={12} />
              {fmtBrl(lowestPrice)}
            </span>
          )}
        </div>
      </div>

      {/* Ticket types */}
      {event.ticketTypes.length > 0 && (
        <div className="space-y-1">
          {event.ticketTypes.map((t) => (
            <div key={t.id} className="flex items-center justify-between text-xs bg-white/3 rounded px-2 py-1">
              <span className="text-gray-300">{t.name}</span>
              <span className="text-gray-400">{fmtBrl(Number(t.price))} · {t.sold}{t.quantity ? `/${t.quantity}` : ""} vendidos</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {event.status === "DRAFT" && (
          <button
            onClick={() => onPublish(event.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs hover:bg-green-500/20 transition-colors"
          >
            <Send size={11} />
            Publicar
          </button>
        )}
        <button
          onClick={() => onAddTicket(event.id)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-xs hover:bg-blue-500/20 transition-colors"
        >
          <Ticket size={11} />
          + Ingresso
        </button>
        <button
          onClick={() => onViewAttendees(event)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-xs hover:bg-white/10 transition-colors"
        >
          <Eye size={11} />
          Participantes
        </button>
        <button
          onClick={() => onEdit(event)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs hover:bg-yellow-500/20 transition-colors"
        >
          <Edit3 size={11} />
          Editar
        </button>
        {(event.status === "DRAFT" || event.status === "CANCELED") && (
          <button
            onClick={() => onDelete(event.id)}
            className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function EventsPage() {
  const toast = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [addTicketEventId, setAddTicketEventId] = useState<string | null>(null);
  const [attendeesEvent, setAttendeesEvent] = useState<Event | null>(null);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await authedFetch(`/api/events?${params}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setEvents(data.data ?? []);
      setTotalPages(data.meta.totalPages);
      setTotal(data.meta.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [toast, statusFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  async function handlePublish(id: string) {
    try {
      const res = await authedFetch(`/api/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Evento publicado!");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao publicar");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir ou cancelar este evento?")) return;
    try {
      const res = await authedFetch(`/api/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(data.data?.canceled ? "Evento cancelado" : "Evento excluído");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  const upcomingCount = events.filter((e) => e.status === "PUBLISHED" && new Date(e.startAt) > new Date()).length;
  const draftCount = events.filter((e) => e.status === "DRAFT").length;
  const totalRegistrations = events.reduce((s, e) => s + e._count.registrations, 0);

  if (loading && events.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-white/5 rounded animate-pulse w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-56 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar size={24} className="text-blue-400" />
            Eventos
          </h1>
          <p className="text-gray-400 text-sm mt-1">Crie e gerencie seus eventos com ingressos</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-premium px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Evento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Próximos eventos", value: upcomingCount, icon: Calendar, color: "text-green-400" },
          { label: "Rascunhos", value: draftCount, icon: Edit3, color: "text-yellow-400" },
          { label: "Total inscrições", value: totalRegistrations, icon: Users, color: "text-blue-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={16} className={color} />
              <span className="text-gray-400 text-xs">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {["ALL", "DRAFT", "PUBLISHED", "COMPLETED", "CANCELED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-blue-500 text-white" : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {s === "ALL" ? "Todos" : STATUS_CONFIG[s as EventStatus]?.label ?? s}
            </button>
          ))}
        </div>
        <p className="text-gray-500 text-xs">{total} evento(s)</p>
      </div>

      {/* Events grid */}
      {events.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Calendar size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhum evento encontrado.</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 btn-premium px-4 py-2 rounded-lg text-sm">
            Criar primeiro evento
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPublish={handlePublish}
              onDelete={handleDelete}
              onAddTicket={(id) => setAddTicketEventId(id)}
              onViewAttendees={(e) => setAttendeesEvent(e)}
              onEdit={(e) => setEditEvent(e)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-gray-400 text-sm">pág. {page} de {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
      {addTicketEventId && (
        <AddTicketModal
          eventId={addTicketEventId}
          onClose={() => setAddTicketEventId(null)}
          onAdded={() => { setAddTicketEventId(null); load(); }}
        />
      )}
      {attendeesEvent && (
        <AttendeesModal
          eventId={attendeesEvent.id}
          eventTitle={attendeesEvent.title}
          onClose={() => setAttendeesEvent(null)}
        />
      )}
      {editEvent && (
        <EditEventModal
          event={editEvent}
          onClose={() => setEditEvent(null)}
          onSaved={() => { setEditEvent(null); load(); }}
        />
      )}
    </div>
  );
}
