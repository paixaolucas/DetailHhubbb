"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  Clock,
  Eye,
  MousePointerClick,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Building2,
  AlertCircle,
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

interface Campaign {
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
  rejectionReason: string | null;
  createdAt: string;
  advertiser: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    user: { email: string };
  };
}

interface Meta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const FORMAT_LABEL: Record<AdFormat, string> = {
  BANNER_FEED: "Banner no Feed",
  SPONSORED_POST: "Post Patrocinado",
  EMAIL_BLAST: "E-mail",
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
  COMPLETED: { label: "Concluída", color: "text-blue-400 bg-blue-400/10", icon: CheckCircle },
  REJECTED: { label: "Rejeitada", color: "text-red-400 bg-red-400/10", icon: XCircle },
};

function fmtNum(n: number) {
  return n.toLocaleString("pt-BR");
}

function fmtBrl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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
// Reject Modal
// ---------------------------------------------------------------------------
function RejectModal({
  campaignId,
  onClose,
  onDone,
}: {
  campaignId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ad-campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reject", reason }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Campanha rejeitada");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="glass-card w-full max-w-md p-6 animate-slide-up">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <XCircle size={18} className="text-red-400" />
          Rejeitar Campanha
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Motivo da rejeição *</label>
            <textarea
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none"
              placeholder="Explique ao anunciante o motivo da rejeição..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
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
              className="flex-1 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {loading ? "Rejeitando..." : "Confirmar Rejeição"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function AdminAnunciosPage() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING_REVIEW");
  const [page, setPage] = useState(1);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/ad-campaigns?${params}`, { credentials: "include" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setCampaigns(data.data ?? []);
      setMeta(data.meta);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [toast, statusFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  async function doAction(id: string, action: string) {
    try {
      const res = await fetch(`/api/admin/ad-campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const labels: Record<string, string> = {
        approve: "Campanha aprovada!",
        pause: "Campanha pausada",
        activate: "Campanha ativada",
        complete: "Campanha concluída",
      };
      toast.success(labels[action] ?? "Ação realizada");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  const pendingCount = campaigns.filter((c) => c.status === "PENDING_REVIEW").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone size={24} className="text-blue-400" />
            Gestão de Anúncios
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Revise e gerencie campanhas dos anunciantes
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
            <AlertCircle size={16} className="text-yellow-400" />
            <span className="text-yellow-300 text-sm">{pendingCount} aguardando revisão</span>
          </div>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "PENDING_REVIEW", "ACTIVE", "PAUSED", "REJECTED", "COMPLETED", "DRAFT"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-blue-500 text-white"
                : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            {s === "ALL" ? "Todos" : STATUS_CONFIG[s as AdStatus]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Campaign list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Megaphone size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhuma campanha encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const FormatIcon = FORMAT_ICON[campaign.format];
            return (
              <div key={campaign.id} className="glass-card p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <FormatIcon size={18} className="text-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-white text-sm font-medium">{campaign.title}</p>
                      <StatusBadge status={campaign.status} />
                      <span className="text-gray-500 text-xs">{FORMAT_LABEL[campaign.format]}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Building2 size={12} />
                      <span>{campaign.advertiser.companyName}</span>
                      <span>·</span>
                      <span>{campaign.advertiser.user.email}</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <DollarSign size={11} />
                        {fmtBrl(Number(campaign.budget))}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={11} />
                        {fmtNum(campaign.impressions)} impr.
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick size={11} />
                        {fmtNum(campaign.clicks)} cliques
                      </span>
                      <span>
                        Criada em {new Date(campaign.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    {campaign.rejectionReason && (
                      <p className="text-xs text-red-400 mt-1">
                        Motivo: {campaign.rejectionReason}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {campaign.status === "PENDING_REVIEW" && (
                      <>
                        <button
                          onClick={() => doAction(campaign.id, "approve")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs hover:bg-green-500/20 transition-colors"
                        >
                          <CheckCircle size={13} />
                          Aprovar
                        </button>
                        <button
                          onClick={() => setRejectId(campaign.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                        >
                          <XCircle size={13} />
                          Rejeitar
                        </button>
                      </>
                    )}
                    {campaign.status === "ACTIVE" && (
                      <>
                        <button
                          onClick={() => doAction(campaign.id, "pause")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 text-xs hover:bg-orange-500/20 transition-colors"
                        >
                          <PauseCircle size={13} />
                          Pausar
                        </button>
                        <button
                          onClick={() => doAction(campaign.id, "complete")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-xs hover:bg-blue-500/20 transition-colors"
                        >
                          <CheckCircle size={13} />
                          Concluir
                        </button>
                      </>
                    )}
                    {campaign.status === "PAUSED" && (
                      <button
                        onClick={() => doAction(campaign.id, "activate")}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs hover:bg-green-500/20 transition-colors"
                      >
                        <PlayCircle size={13} />
                        Reativar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {meta.total} campanhas · pág. {meta.page} de {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {rejectId && (
        <RejectModal
          campaignId={rejectId}
          onClose={() => setRejectId(null)}
          onDone={() => { setRejectId(null); load(); }}
        />
      )}
    </div>
  );
}
