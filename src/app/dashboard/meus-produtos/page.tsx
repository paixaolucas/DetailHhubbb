"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus, Eye, EyeOff, Star, TrendingUp, DollarSign, ShoppingBag, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const LISTING_TYPES = [
  { value: "COURSE", label: "Curso" },
  { value: "TEMPLATE", label: "Template" },
  { value: "EBOOK", label: "Ebook" },
  { value: "COACHING", label: "Coaching" },
  { value: "TOOL", label: "Ferramenta" },
  { value: "SERVICE", label: "Serviço" },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
  PAUSED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  SOLD_OUT: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  ARCHIVED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho", ACTIVE: "Ativo", PAUSED: "Pausado", SOLD_OUT: "Esgotado", ARCHIVED: "Arquivado",
};

interface Listing {
  id: string;
  title: string;
  shortDesc: string | null;
  type: string;
  status: string;
  price: number;
  totalSales: number;
  averageRating: number | null;
  reviewCount: number;
}

function fieldClass() {
  return "w-full bg-white/5 border border-white/10 hover:border-[#99D3DF] focus:border-[#009CD9] rounded-xl px-4 py-3 text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm";
}

export default function MeusProdutosPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; description: string;
    variant?: "danger" | "default"; onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  const [form, setForm] = useState({
    title: "", description: "", shortDesc: "", type: "COURSE", price: "", tags: "", features: "",
  });

  useEffect(() => {
    const role = localStorage.getItem("detailhub_user_role");
    if (
      !role ||
      (role !== "INFLUENCER_ADMIN" &&
        role !== "MARKETPLACE_PARTNER" &&
        role !== "SUPER_ADMIN")
    ) {
      router.push("/dashboard");
      return;
    }
    const token = localStorage.getItem("detailhub_access_token");
    fetch("/api/marketplace/listings?mine=true", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => d.success && setListings(d.data ?? []))
      .finally(() => setIsLoading(false));
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          shortDesc: form.shortDesc || undefined,
          type: form.type,
          price: parseFloat(form.price),
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          features: form.features ? form.features.split("\n").map((f) => f.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Erro ao criar produto"); return; }
      setListings((prev) => [data.data, ...prev]);
      setShowNewForm(false);
      setForm({ title: "", description: "", shortDesc: "", type: "COURSE", price: "", tags: "", features: "" });
    } finally { setSaving(false); }
  }

  async function toggleStatus(listingId: string, currentStatus: string) {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const token = localStorage.getItem("detailhub_access_token");
    const res = await fetch(`/api/marketplace/listings/${listingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.success) setListings((prev) => prev.map((l) => l.id === listingId ? { ...l, status: newStatus } : l));
  }

  async function deleteListing(listingId: string) {
    setConfirmState({
      open: true,
      title: "Arquivar produto?",
      description: "O produto será removido do marketplace.",
      variant: "danger",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        const token = localStorage.getItem("detailhub_access_token");
        await fetch(`/api/marketplace/listings/${listingId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        setListings((prev) => prev.filter((l) => l.id !== listingId));
      },
    });
  }

  const totalRevenue = listings.reduce((s, l) => s + l.totalSales * Number(l.price), 0);
  const totalSales = listings.reduce((s, l) => s + l.totalSales, 0);
  const activeCount = listings.filter((l) => l.status === "ACTIVE").length;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-4xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#EEE6E4]">Meus Produtos</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie seus produtos no marketplace</p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#006079] to-[#007A99] hover:from-[#007A99] hover:to-[#007A99] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#007A99]/30"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Produtos Ativos", value: activeCount, icon: Package, color: "text-green-400 bg-green-500/10" },
          { label: "Total de Vendas", value: totalSales, icon: ShoppingBag, color: "text-[#009CD9] bg-[#007A99]/10" },
          { label: "Receita Total", value: `R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-[#009CD9] bg-[#007A99]/10" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color.split(" ")[1]}`}>
              <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
            </div>
            <p className="text-xl font-bold text-[#EEE6E4]">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* New form */}
      {showNewForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#EEE6E4]">Novo Produto</h2>
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Título *</label>
              <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ex: Pack de Templates para Mecânicos" className={fieldClass()} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Tipo</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className={`${fieldClass()} bg-white`}>
                {LISTING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Preço (R$) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="0.00" min="0.01" step="0.01" className={fieldClass()} required />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Descrição curta</label>
              <input type="text" value={form.shortDesc} onChange={(e) => setForm((p) => ({ ...p, shortDesc: e.target.value }))} placeholder="Uma frase de impacto" className={fieldClass()} maxLength={300} />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Descrição completa *</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descreva o produto em detalhes..." rows={3} className={`${fieldClass()} resize-none`} required minLength={10} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Tags</label>
              <input type="text" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="tuning, motor, diagnóstico" className={fieldClass()} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">O que está incluso (uma por linha)</label>
              <textarea value={form.features} onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))} placeholder={"100 templates\nSuporte por email"} rows={3} className={`${fieldClass()} resize-none`} />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
              {saving ? "Criando..." : "Criar Produto"}
            </button>
            <button type="button" onClick={() => setShowNewForm(false)} className="px-5 py-2.5 border border-white/10 hover:border-gray-300 rounded-xl text-sm text-gray-400 hover:text-[#EEE6E4] transition-all">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {listings.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-[#EEE6E4] mb-2">Nenhum produto ainda</h3>
          <p className="text-gray-400 text-sm mb-6">Crie seu primeiro produto automotivo e comece a vender.</p>
          <button onClick={() => setShowNewForm(true)} className="bg-[#006079] hover:bg-[#007A99] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
            Criar produto
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="glass-card p-5 hover:border-[#99D3DF] transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${STATUS_COLORS[listing.status] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                      {STATUS_LABELS[listing.status] ?? listing.status}
                    </span>
                    <span className="text-xs text-gray-500">{LISTING_TYPES.find((t) => t.value === listing.type)?.label ?? listing.type}</span>
                  </div>
                  <h3 className="font-semibold text-[#EEE6E4] group-hover:text-[#33A7BF] transition-colors">{listing.title}</h3>
                  {listing.shortDesc && <p className="text-sm text-gray-400 mt-0.5">{listing.shortDesc}</p>}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-base font-bold text-[#EEE6E4]">R$ {Number(listing.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {listing.totalSales} vendas
                    </span>
                    {listing.averageRating && (
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Star className="w-3.5 h-3.5 text-yellow-400" />
                        {listing.averageRating.toFixed(1)} ({listing.reviewCount})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {listing.status !== "ARCHIVED" && (
                    <button onClick={() => toggleStatus(listing.id, listing.status)} className="p-1.5 text-gray-500 hover:text-[#009CD9] hover:bg-[#007A99]/10 rounded-lg transition-colors" title={listing.status === "ACTIVE" ? "Pausar" : "Ativar"}>
                      {listing.status === "ACTIVE" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                  <button onClick={() => deleteListing(listing.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Arquivar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        variant={confirmState.variant}
        confirmLabel="Arquivar"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
