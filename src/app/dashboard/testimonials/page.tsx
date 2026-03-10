"use client";

import { useEffect, useState } from "react";
import {
  Star, Plus, Pencil, Trash2, X, Check, Eye, EyeOff,
} from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";
import { useToast } from "@/components/ui/toast-provider";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface Testimonial {
  id: string;
  authorName: string;
  authorTitle: string | null;
  avatarUrl: string | null;
  body: string;
  rating: number;
  sortOrder: number;
  isActive: boolean;
}

interface Community {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  authorName: "",
  authorTitle: "",
  avatarUrl: "",
  body: "",
  rating: 5,
  sortOrder: 0,
  isActive: true,
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
        />
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-50" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-gray-50 rounded w-24" />
              <div className="h-3 bg-gray-50 rounded w-16" />
            </div>
          </div>
          <div className="h-3 bg-gray-50 rounded w-full" />
          <div className="h-3 bg-gray-50 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

export default function TestimonialsPage() {
  const toast = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);
  const [commLoading, setCommLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState(false);

  function token() { return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? ""; }

  useEffect(() => {
    fetch("/api/communities/mine", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => {
        const list: Community[] = d.data?.communities ?? d.data ?? [];
        setCommunities(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(console.error)
      .finally(() => setCommLoading(false));
  }, []);

  function loadTestimonials(communityId: string) {
    if (!communityId) return;
    setLoading(true);
    // Use PATCH endpoint that accepts all (active + inactive) for admin view
    fetch(`/api/communities/${communityId}/testimonials?all=true`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.json())
      .then((d) => setTestimonials(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadTestimonials(selectedId); }, [selectedId]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sortOrder: testimonials.length });
    setShowForm(true);
  }

  function openEdit(t: Testimonial) {
    setEditing(t);
    setForm({
      authorName: t.authorName,
      authorTitle: t.authorTitle ?? "",
      avatarUrl: t.avatarUrl ?? "",
      body: t.body,
      rating: t.rating,
      sortOrder: t.sortOrder,
      isActive: t.isActive,
    });
    setShowForm(true);
  }

  function cancelForm() { setShowForm(false); setEditing(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      const body = {
        authorName: form.authorName,
        authorTitle: form.authorTitle || undefined,
        avatarUrl: form.avatarUrl || undefined,
        body: form.body,
        rating: form.rating,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };
      const url = editing
        ? `/api/communities/${selectedId}/testimonials/${editing.id}`
        : `/api/communities/${selectedId}/testimonials`;
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(editing ? "Depoimento atualizado!" : "Depoimento criado!");
        cancelForm();
        loadTestimonials(selectedId);
      } else {
        toast.error(d.error ?? "Erro ao salvar");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(t: Testimonial) {
    const res = await fetch(`/api/communities/${selectedId}/testimonials/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    if ((await res.json()).success) {
      setTestimonials((prev) => prev.map((x) => x.id === t.id ? { ...x, isActive: !x.isActive } : x));
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !selectedId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/communities/${selectedId}/testimonials/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if ((await res.json()).success) {
        toast.success("Depoimento removido");
        setTestimonials((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      } else {
        toast.error("Erro ao deletar");
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500/15 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Depoimentos</h1>
            <p className="text-gray-400 text-sm mt-0.5">Gerencie os depoimentos das suas comunidades</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          disabled={!selectedId}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Depoimento
        </button>
      </div>

      {/* Community selector */}
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        disabled={commLoading}
        className="w-full sm:w-72 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50"
      >
        {commLoading && <option>Carregando...</option>}
        {communities.map((c) => (
          <option key={c.id} value={c.id} className="bg-white">{c.name}</option>
        ))}
        {!commLoading && communities.length === 0 && <option disabled>Nenhuma comunidade</option>}
      </select>

      {/* Form */}
      {showForm && (
        <div className="glass-card p-5 space-y-4 border-violet-500/20">
          <p className="text-sm font-semibold text-gray-900">{editing ? "Editar Depoimento" : "Novo Depoimento"}</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nome do autor *</label>
                <input
                  required
                  value={form.authorName}
                  onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
                  placeholder="Ex: João Silva"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Cargo / Título</label>
                <input
                  value={form.authorTitle}
                  onChange={(e) => setForm((p) => ({ ...p, authorTitle: e.target.value }))}
                  placeholder="Ex: Empreendedor"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">URL do avatar</label>
              <input
                type="url"
                value={form.avatarUrl}
                onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Depoimento *</label>
              <textarea
                required
                rows={3}
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                placeholder="O que o membro disse sobre a comunidade..."
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none"
              />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Avaliação</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, rating: n }))}
                      className="p-0.5"
                    >
                      <Star className={`w-5 h-5 ${n <= form.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"} transition-colors`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Ordem</label>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                  className="w-20 bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mt-5">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded"
                />
                Ativo
              </label>
              <div className="flex gap-2 ml-auto mt-5">
                <button type="button" onClick={cancelForm} className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-gray-900 border border-gray-200 rounded-xl transition-colors">
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors">
                  <Check className="w-3.5 h-3.5" /> {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Testimonials grid */}
      {loading ? (
        <Skeleton />
      ) : testimonials.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Star className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {communities.length === 0
              ? "Crie uma comunidade para adicionar depoimentos."
              : "Nenhum depoimento ainda. Adicione o primeiro!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className={`glass-card p-4 space-y-3 ${!t.isActive ? "opacity-60" : ""}`}
            >
              {/* Author */}
              <div className="flex items-center gap-3">
                {t.avatarUrl ? (
                  <img src={t.avatarUrl} alt={t.authorName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {t.authorName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.authorName}</p>
                  {t.authorTitle && <p className="text-xs text-gray-500 truncate">{t.authorTitle}</p>}
                </div>
                <Stars rating={t.rating} />
              </div>

              {/* Body */}
              <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{t.body}</p>

              {/* Footer */}
              <div className="flex items-center gap-2 pt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${t.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                  {t.isActive ? "Ativo" : "Inativo"}
                </span>
                <span className="text-xs text-gray-600 ml-auto">Ordem: {t.sortOrder}</span>
                <button onClick={() => toggleActive(t)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title={t.isActive ? "Desativar" : "Ativar"}>
                  {t.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => openEdit(t)} className="p-1.5 text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remover depoimento"
        description={`Tem certeza que deseja remover o depoimento de "${deleteTarget?.authorName}"?`}
        confirmLabel={deleting ? "Removendo..." : "Remover"}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
