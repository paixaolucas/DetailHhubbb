"use client";

import { useState, useEffect, useCallback } from "react";
import { Wrench, Plus, Pencil, Trash2, Star, ExternalLink, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface SaasTool {
  id: string;
  name: string;
  description: string;
  shortDesc: string | null;
  category: string;
  logoUrl: string | null;
  websiteUrl: string;
  affiliateUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  rating: number | null;
}

const CATEGORIES = [
  { value: "PRODUCTIVITY", label: "Produtividade" },
  { value: "MARKETING", label: "Marketing" },
  { value: "ANALYTICS", label: "Analytics" },
  { value: "DESIGN", label: "Design" },
  { value: "DEVELOPMENT", label: "Desenvolvimento" },
  { value: "FINANCE", label: "Financeiro" },
  { value: "COMMUNICATION", label: "Comunicação" },
];

const CATEGORY_COLOR: Record<string, string> = {
  PRODUCTIVITY: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  MARKETING: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  ANALYTICS: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  DESIGN: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  DEVELOPMENT: "text-green-400 bg-green-500/10 border-green-500/20",
  FINANCE: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  COMMUNICATION: "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

const EMPTY_FORM = {
  name: "", description: "", shortDesc: "", category: "PRODUCTIVITY",
  logoUrl: "", websiteUrl: "", affiliateUrl: "",
  isActive: true, isFeatured: false, sortOrder: 0, rating: "",
};

export default function AdminFerramentasPage() {
  const toast = useToast();
  const [tools, setTools] = useState<SaasTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SaasTool | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SaasTool | null>(null);

  const token = () => localStorage.getItem("autoclub_access_token") ?? "";
  const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

  const load = useCallback(() => {
    setIsLoading(true);
    fetch("/api/admin/saas-tools?pageSize=100", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setTools(d.data?.items ?? []); })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(tool: SaasTool) {
    setEditing(tool);
    setForm({
      name: tool.name,
      description: tool.description,
      shortDesc: tool.shortDesc ?? "",
      category: tool.category,
      logoUrl: tool.logoUrl ?? "",
      websiteUrl: tool.websiteUrl,
      affiliateUrl: tool.affiliateUrl ?? "",
      isActive: tool.isActive,
      isFeatured: tool.isFeatured,
      sortOrder: tool.sortOrder,
      rating: tool.rating != null ? String(tool.rating) : "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.description.trim() || !form.websiteUrl.trim()) {
      toast.error("Preencha nome, descrição e URL do site.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        shortDesc: form.shortDesc || null,
        logoUrl: form.logoUrl || null,
        affiliateUrl: form.affiliateUrl || null,
        sortOrder: Number(form.sortOrder) || 0,
        rating: form.rating !== "" ? Number(form.rating) : null,
      };
      const url = editing ? `/api/admin/saas-tools/${editing.id}` : "/api/admin/saas-tools";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(payload) });
      const d = await res.json();
      if (!d.success) { toast.error(d.error ?? "Erro ao salvar."); return; }
      toast.success(editing ? "Ferramenta atualizada." : "Ferramenta criada.");
      setShowModal(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/saas-tools/${deleteTarget.id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token()}` },
    });
    const d = await res.json();
    if (!d.success) { toast.error("Erro ao excluir."); return; }
    toast.success("Ferramenta excluída.");
    setDeleteTarget(null);
    load();
  }

  async function toggleActive(tool: SaasTool) {
    const res = await fetch(`/api/admin/saas-tools/${tool.id}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ isActive: !tool.isActive }),
    });
    const d = await res.json();
    if (d.success) setTools((prev) => prev.map((t) => t.id === tool.id ? { ...t, isActive: !t.isActive } : t));
    else toast.error("Erro ao atualizar.");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ferramentas SaaS</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie as ferramentas exibidas no marketplace</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Ferramenta
        </button>
      </div>

      {tools.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Nenhuma ferramenta cadastrada</h3>
          <p className="text-gray-400 text-sm mb-6">Adicione ferramentas para exibir no marketplace.</p>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
            Adicionar primeira ferramenta
          </button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <span className="text-sm text-gray-400">{tools.length} ferramenta(s) cadastrada(s)</span>
          </div>
          <div className="divide-y divide-white/5">
            {tools.map((tool) => {
              const catColor = CATEGORY_COLOR[tool.category] ?? "text-gray-400 bg-gray-500/10 border-gray-500/20";
              const catLabel = CATEGORIES.find((c) => c.value === tool.category)?.label ?? tool.category;
              return (
                <div key={tool.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    {tool.logoUrl ? (
                      <img src={tool.logoUrl} alt={tool.name} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <span className="text-blue-400 font-bold">{tool.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-white text-sm">{tool.name}</p>
                      {tool.isFeatured && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs border px-1.5 py-0.5 rounded-full ${catColor}`}>{catLabel}</span>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{tool.shortDesc ?? tool.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={tool.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:text-blue-400 transition-colors"
                      title="Abrir site"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => toggleActive(tool)}
                      className="p-2 transition-colors"
                      title={tool.isActive ? "Desativar" : "Ativar"}
                    >
                      {tool.isActive
                        ? <ToggleRight className="w-5 h-5 text-green-400" />
                        : <ToggleLeft className="w-5 h-5 text-gray-500" />}
                    </button>
                    <button
                      onClick={() => openEdit(tool)}
                      className="p-2 text-gray-500 hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(tool)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">{editing ? "Editar Ferramenta" : "Nova Ferramenta"}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Nome *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-600"
                    placeholder="Ex: HubSpot CRM"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Descrição curta</label>
                  <input
                    value={form.shortDesc}
                    onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-600"
                    placeholder="Resumo em até 200 caracteres"
                    maxLength={200}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Descrição completa *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-600 resize-none"
                    placeholder="Descrição detalhada da ferramenta"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Categoria *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value} className="bg-gray-900">{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Avaliação (0–5)</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={form.rating}
                    onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-600"
                    placeholder="Ex: 4.5"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">URL do site *</label>
                  <input
                    value={form.websiteUrl}
                    onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-600"
                    placeholder="https://exemplo.com"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">URL afiliado</label>
                  <input
                    value={form.affiliateUrl}
                    onChange={(e) => setForm((f) => ({ ...f, affiliateUrl: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-600"
                    placeholder="https://ref.exemplo.com/?ref=autoclub"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">URL do logo</label>
                  <input
                    value={form.logoUrl}
                    onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-600"
                    placeholder="https://cdn.exemplo.com/logo.png"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Ordem de exibição</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="flex flex-col gap-3 justify-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm text-gray-300">Ativo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                      className="w-4 h-4 accent-yellow-500"
                    />
                    <span className="text-sm text-gray-300">Destaque</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 glass-card hover:border-white/20 text-gray-300 text-sm font-medium rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
              >
                {saving ? "Salvando…" : editing ? "Salvar alterações" : "Criar ferramenta"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Excluir ferramenta"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
