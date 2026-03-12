"use client";

import { useCallback, useEffect, useState } from "react";
import {
  HelpCircle, Plus, Pencil, Trash2, ChevronUp, ChevronDown,
  X, Check, GripVertical,
} from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";
import { useToast } from "@/components/ui/toast-provider";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

interface Community {
  id: string;
  name: string;
}

const EMPTY_FORM = { question: "", answer: "", sortOrder: 0 };

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="glass-card p-4 space-y-2">
          <div className="h-4 bg-gray-50 rounded w-2/3" />
          <div className="h-3 bg-gray-50 rounded w-full" />
          <div className="h-3 bg-gray-50 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

export default function FaqsPage() {
  const toast = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [commLoading, setCommLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);
  const [deleting, setDeleting] = useState(false);

  function token() { return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? ""; }

  // Load influencer's communities
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

  const loadFaqs = useCallback((communityId: string) => {
    if (!communityId) return;
    setLoading(true);
    fetch(`/api/communities/${communityId}/faqs`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => setFaqs(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadFaqs(selectedId); }, [selectedId, loadFaqs]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sortOrder: faqs.length });
    setShowForm(true);
  }

  function openEdit(faq: FAQ) {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder });
    setShowForm(true);
  }

  function cancelForm() { setShowForm(false); setEditing(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      const url = editing
        ? `/api/communities/${selectedId}/faqs/${editing.id}`
        : `/api/communities/${selectedId}/faqs`;
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(editing ? "FAQ atualizada!" : "FAQ criada!");
        cancelForm();
        loadFaqs(selectedId);
      } else {
        toast.error(d.error ?? "Erro ao salvar");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !selectedId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/communities/${selectedId}/faqs/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await res.json();
      if (d.success) {
        toast.success("FAQ removida");
        setFaqs((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      } else {
        toast.error(d.error ?? "Erro ao deletar");
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  async function moveFaq(faq: FAQ, direction: "up" | "down") {
    const idx = faqs.findIndex((f) => f.id === faq.id);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= faqs.length) return;

    const newOrder = faqs[targetIdx].sortOrder;
    const res = await fetch(`/api/communities/${selectedId}/faqs/${faq.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ sortOrder: newOrder }),
    });
    if ((await res.json()).success) loadFaqs(selectedId);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FAQs</h1>
            <p className="text-gray-400 text-sm mt-0.5">Perguntas frequentes das suas comunidades</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          disabled={!selectedId}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova FAQ
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
          <p className="text-sm font-semibold text-gray-900">{editing ? "Editar FAQ" : "Nova FAQ"}</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Pergunta *</label>
              <input
                required
                value={form.question}
                onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
                placeholder="Qual é a pergunta?"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Resposta *</label>
              <textarea
                required
                rows={3}
                value={form.answer}
                onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
                placeholder="Resposta detalhada..."
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Ordem de exibição</label>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                  className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none"
                />
              </div>
              <div className="flex gap-2 mt-5">
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

      {/* FAQ list */}
      {loading ? (
        <Skeleton />
      ) : faqs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <HelpCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {communities.length === 0
              ? "Crie uma comunidade para adicionar FAQs."
              : "Nenhuma FAQ ainda. Crie a primeira!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={faq.id} className="glass-card p-4">
              <div className="flex items-start gap-3">
                <GripVertical className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{faq.question}</p>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">{faq.answer}</p>
                  <p className="text-xs text-gray-600 mt-2">Ordem: {faq.sortOrder}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => moveFaq(faq, "up")}
                    disabled={idx === 0}
                    className="p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Mover para cima"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveFaq(faq, "down")}
                    disabled={idx === faqs.length - 1}
                    className="p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Mover para baixo"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEdit(faq)}
                    className="p-1.5 text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(faq)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remover FAQ"
        description={`Tem certeza que deseja remover a pergunta "${deleteTarget?.question}"? Esta ação não pode ser desfeita.`}
        confirmLabel={deleting ? "Removendo..." : "Remover"}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
