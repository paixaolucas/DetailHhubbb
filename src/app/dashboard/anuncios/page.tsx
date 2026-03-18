"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Plus,
  Eye,
  MousePointerClick,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  Trash2,
  Send,
  ChevronRight,
  AlertCircle,
  BarChart2,
  Image as ImageIcon,
  Mail,
  Layers,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AdFormat = "BANNER_FEED" | "SPONSORED_POST" | "EMAIL_BLAST";
type AdStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "REJECTED";

interface AdCampaign {
  id: string;
  title: string;
  format: AdFormat;
  status: AdStatus;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface AdvertiserProfile {
  id: string;
  companyName: string;
  website: string | null;
  logoUrl: string | null;
  bio: string | null;
  phone: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const FORMAT_LABEL: Record<AdFormat, string> = {
  BANNER_FEED: "Banner no Feed",
  SPONSORED_POST: "Post Patrocinado",
  EMAIL_BLAST: "E-mail para Membros",
};

const FORMAT_ICON: Record<AdFormat, React.ElementType> = {
  BANNER_FEED: ImageIcon,
  SPONSORED_POST: Layers,
  EMAIL_BLAST: Mail,
};

const STATUS_CONFIG: Record<
  AdStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  DRAFT: { label: "Rascunho", color: "text-gray-400 bg-gray-400/10", icon: Clock },
  PENDING_REVIEW: { label: "Em Revisão", color: "text-yellow-400 bg-yellow-400/10", icon: Clock },
  ACTIVE: { label: "Ativa", color: "text-green-400 bg-green-400/10", icon: CheckCircle },
  PAUSED: { label: "Pausada", color: "text-orange-400 bg-orange-400/10", icon: PauseCircle },
  COMPLETED: { label: "Concluída", color: "text-[#009CD9] bg-[#009CD9]/10", icon: CheckCircle },
  REJECTED: { label: "Rejeitada", color: "text-red-400 bg-red-400/10", icon: XCircle },
};

function fmtNum(n: number) {
  return n.toLocaleString("pt-BR");
}

function fmtBrl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ctr(impressions: number, clicks: number) {
  if (!impressions) return "0%";
  return ((clicks / impressions) * 100).toFixed(2) + "%";
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: AdStatus }) {
  const { label, color, icon: Icon } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Create Campaign Modal
// ---------------------------------------------------------------------------
function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    format: "BANNER_FEED" as AdFormat,
    budget: "",
    startDate: "",
    endDate: "",
    targetUrl: "",
    creativeUrl: "",
    ctaText: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.budget) {
      toast.error("Preencha título e orçamento");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/advertisers/me/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          budget: parseFloat(form.budget),
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Campanha criada com sucesso!");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar campanha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="glass-card w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-white mb-4">Nova Campanha</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Título *</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#009CD9]"
              placeholder="Ex: Lançamento Kit Premium Detailing"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Formato *</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#009CD9]"
              value={form.format}
              onChange={(e) => set("format", e.target.value as AdFormat)}
            >
              <option value="BANNER_FEED">Banner no Feed</option>
              <option value="SPONSORED_POST">Post Patrocinado</option>
              <option value="EMAIL_BLAST">E-mail para Membros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Orçamento Total (R$) *</label>
            <input
              type="number"
              min="100"
              step="50"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#009CD9]"
              placeholder="Ex: 1500"
              value={form.budget}
              onChange={(e) => set("budget", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data Início</label>
              <input
                type="datetime-local"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#009CD9]"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data Fim</label>
              <input
                type="datetime-local"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#009CD9]"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">URL do Criativo (imagem)</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#009CD9]"
              placeholder="https://..."
              value={form.creativeUrl}
              onChange={(e) => set("creativeUrl", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">URL de Destino (clique)</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#009CD9]"
              placeholder="https://seusite.com.br"
              value={form.targetUrl}
              onChange={(e) => set("targetUrl", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Texto do Botão (CTA)</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#009CD9]"
              placeholder="Ex: Compre Agora"
              value={form.ctaText}
              onChange={(e) => set("ctaText", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <textarea
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#009CD9] resize-none"
              placeholder="Descreva sua campanha..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-premium py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar Rascunho"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile Modal
// ---------------------------------------------------------------------------
function ProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: AdvertiserProfile | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: profile?.companyName ?? "",
    website: profile?.website ?? "",
    logoUrl: profile?.logoUrl ?? "",
    bio: profile?.bio ?? "",
    phone: profile?.phone ?? "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.companyName) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/advertisers/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Perfil salvo!");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="glass-card w-full max-w-md p-6 animate-slide-up">
        <h2 className="text-lg font-semibold text-white mb-4">Perfil de Anunciante</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome da Empresa *</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#009CD9]"
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Website</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#009CD9]"
              placeholder="https://..."
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Logo (URL)</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#009CD9]"
              placeholder="https://..."
              value={form.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Telefone</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#009CD9]"
              placeholder="(11) 9 9999-9999"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Sobre a empresa</label>
            <textarea
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#009CD9] resize-none"
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-premium py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Campaign Card
// ---------------------------------------------------------------------------
function CampaignCard({
  campaign,
  onSubmit,
  onDelete,
}: {
  campaign: AdCampaign;
  onSubmit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const FormatIcon = FORMAT_ICON[campaign.format];
  const budget = Number(campaign.budget);
  const spent = Number(campaign.spent);
  const spentPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#009CD9]/10 border border-[#009CD9]/20 flex items-center justify-center flex-shrink-0">
            <FormatIcon size={16} className="text-[#009CD9]" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{campaign.title}</p>
            <p className="text-gray-500 text-xs">{FORMAT_LABEL[campaign.format]}</p>
          </div>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/3 rounded-lg p-2.5 text-center">
          <p className="text-white text-sm font-semibold">{fmtNum(campaign.impressions)}</p>
          <p className="text-gray-500 text-xs">Impressões</p>
        </div>
        <div className="bg-white/3 rounded-lg p-2.5 text-center">
          <p className="text-white text-sm font-semibold">{fmtNum(campaign.clicks)}</p>
          <p className="text-gray-500 text-xs">Cliques</p>
        </div>
        <div className="bg-white/3 rounded-lg p-2.5 text-center">
          <p className="text-white text-sm font-semibold">{ctr(campaign.impressions, campaign.clicks)}</p>
          <p className="text-gray-500 text-xs">CTR</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Orçamento gasto</span>
          <span>{fmtBrl(spent)} / {fmtBrl(budget)}</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#009CD9] rounded-full transition-all"
            style={{ width: `${spentPct}%` }}
          />
        </div>
        <p className="text-right text-xs text-gray-500 mt-1">{spentPct}% utilizado</p>
      </div>

      {(campaign.startDate || campaign.endDate) && (
        <p className="text-xs text-gray-500">
          {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString("pt-BR") : "—"}
          {" → "}
          {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString("pt-BR") : "—"}
        </p>
      )}

      {campaign.status === "REJECTED" && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-300 text-xs">Campanha rejeitada. Edite e envie novamente.</p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {campaign.status === "DRAFT" && (
          <button
            onClick={() => onSubmit(campaign.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#009CD9]/10 border border-[#009CD9]/20 rounded-lg text-[#009CD9] text-xs hover:bg-[#009CD9]/20 transition-colors"
          >
            <Send size={12} />
            Enviar para Revisão
          </button>
        )}
        {(campaign.status === "DRAFT" || campaign.status === "REJECTED") && (
          <button
            onClick={() => onDelete(campaign.id)}
            className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
        {campaign.status === "PENDING_REVIEW" && (
          <p className="flex-1 text-center text-xs text-yellow-400 py-1.5">
            Aguardando aprovação...
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AnunciosPage() {
  const toast = useToast();
  const [profile, setProfile] = useState<AdvertiserProfile | null>(null);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/advertisers/me", { credentials: "include" }),
        fetch("/api/advertisers/me/campaigns", { credentials: "include" }),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      if (pData.success) setProfile(pData.data);
      if (cData.success) setCampaigns(cData.data ?? []);
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(id: string) {
    try {
      const res = await fetch(`/api/advertisers/me/campaigns/${id}/submit`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Campanha enviada para revisão!");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta campanha?")) return;
    try {
      const res = await fetch(`/api/advertisers/me/campaigns/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Campanha excluída");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    }
  }

  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalSpent = campaigns.reduce((s, c) => s + Number(c.spent), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;

  const filtered =
    statusFilter === "ALL" ? campaigns : campaigns.filter((c) => c.status === statusFilter);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-white/5 rounded animate-pulse w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse" />
          ))}
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
            <Megaphone size={24} className="text-[#009CD9]" />
            Meus Anúncios
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gerencie suas campanhas publicitárias na plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowProfile(true)}
            className="px-3 py-2 border border-white/10 rounded-lg text-gray-300 text-sm hover:bg-white/5 transition-colors"
          >
            Perfil
          </button>
          <button
            onClick={() => {
              if (!profile) {
                toast.error("Complete seu perfil de anunciante primeiro");
                setShowProfile(true);
                return;
              }
              setShowCreate(true);
            }}
            className="btn-premium px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} />
            Nova Campanha
          </button>
        </div>
      </div>

      {/* Profile missing warning */}
      {!profile && (
        <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <AlertCircle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 text-sm font-medium">Complete seu perfil de anunciante</p>
            <p className="text-yellow-300/70 text-xs mt-0.5">
              Antes de criar campanhas, preencha as informações da sua empresa.
            </p>
            <button
              onClick={() => setShowProfile(true)}
              className="mt-2 text-xs text-yellow-400 flex items-center gap-1 hover:text-yellow-300"
            >
              Completar perfil <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Campanhas Ativas", value: activeCampaigns.toString(), icon: PlayCircle, color: "text-green-400" },
          { label: "Total Impressões", value: fmtNum(totalImpressions), icon: Eye, color: "text-[#009CD9]" },
          { label: "Total Cliques", value: fmtNum(totalClicks), icon: MousePointerClick, color: "text-[#009CD9]" },
          { label: "Total Investido", value: fmtBrl(totalSpent), icon: DollarSign, color: "text-yellow-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={color} />
              <span className="text-gray-400 text-xs">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Format info */}
      <div className="glass-card p-4">
        <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <BarChart2 size={16} className="text-[#009CD9]" />
          Formatos disponíveis
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          {(Object.entries(FORMAT_LABEL) as [AdFormat, string][]).map(([key, label]) => {
            const Icon = FORMAT_ICON[key];
            return (
              <div key={key} className="flex items-center gap-3 bg-white/3 rounded-lg p-3">
                <Icon size={18} className="text-[#009CD9] flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-gray-500 text-xs">
                    {key === "BANNER_FEED" && "Exibido entre posts no feed"}
                    {key === "SPONSORED_POST" && "Post nativo no feed da comunidade"}
                    {key === "EMAIL_BLAST" && "Enviado a todos os membros ativos"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter + Campaign List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">
            Campanhas ({filtered.length})
          </h2>
          <select
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-gray-300 text-sm focus:outline-none focus:border-[#009CD9]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos os status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="PENDING_REVIEW">Em Revisão</option>
            <option value="ACTIVE">Ativa</option>
            <option value="PAUSED">Pausada</option>
            <option value="COMPLETED">Concluída</option>
            <option value="REJECTED">Rejeitada</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Megaphone size={40} className="text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {campaigns.length === 0
                ? "Você ainda não criou nenhuma campanha."
                : "Nenhuma campanha com esse status."}
            </p>
            {campaigns.length === 0 && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 btn-premium px-4 py-2 rounded-lg text-sm"
              >
                Criar primeira campanha
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onSubmit={handleSubmit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
      {showProfile && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfile(false)}
          onSaved={() => { setShowProfile(false); load(); }}
        />
      )}
    </div>
  );
}
