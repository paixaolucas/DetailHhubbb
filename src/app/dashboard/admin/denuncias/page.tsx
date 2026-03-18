"use client";

// =============================================================================
// Admin — Fila de Denúncias
// GET  /api/admin/reports  — lista paginada com filtro por status
// PATCH /api/admin/reports/[id] — resolve ou ignora uma denúncia
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, CheckCircle, EyeOff, Filter, RefreshCw, Clock, Eye, X, Ban } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { STORAGE_KEYS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReportStatus = "PENDING" | "RESOLVED" | "IGNORED";

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  description?: string | null;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string | null;
  reportedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
}

const TARGET_LABELS: Record<string, string> = {
  POST: "Post",
  COMMENT: "Comentário",
  USER: "Usuário",
  COMMUNITY: "Comunidade",
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  RESOLVED: { label: "Resolvida", color: "text-green-400 bg-green-400/10 border-green-400/20" },
  IGNORED: { label: "Ignorada", color: "text-gray-400 bg-gray-400/10 border-gray-400/20" },
};

// ---------------------------------------------------------------------------
// ContentPreviewModal
// ---------------------------------------------------------------------------

interface ContentPreview {
  type: string;
  id: string;
  body?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

function ContentPreviewModal({
  report,
  onClose,
  onAction,
}: {
  report: Report;
  onClose: () => void;
  onAction: (id: string, status: "RESOLVED" | "IGNORED") => void;
}) {
  const [content, setContent] = useState<ContentPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    async function load() {
      try {
        let url = "";
        if (report.targetType === "POST") url = `/api/posts/${report.targetId}`;
        else if (report.targetType === "COMMENT") url = `/api/comments/${report.targetId}`;
        else if (report.targetType === "USER") url = `/api/users/${report.targetId}`;
        else { setContent({ type: report.targetType, id: report.targetId }); setLoading(false); return; }

        const res = await fetch(url, { headers });
        const data = await res.json();
        if (data.success) {
          const d = data.data;
          setContent({
            type: report.targetType,
            id: report.targetId,
            body: d.body ?? d.content,
            title: d.title,
            firstName: d.firstName ?? d.author?.firstName,
            lastName: d.lastName ?? d.author?.lastName,
            email: d.email,
            role: d.role,
          });
        } else {
          setContent({ type: report.targetType, id: report.targetId, body: "Conteúdo não disponível ou removido." });
        }
      } catch {
        setContent({ type: report.targetType, id: report.targetId, body: "Erro ao carregar conteúdo." });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [report]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/5 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#EEE6E4]">
            Conteúdo reportado — {TARGET_LABELS[report.targetType] ?? report.targetType}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[#EEE6E4] p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-4 bg-white/10 rounded w-full" />
              <div className="h-4 bg-white/10 rounded w-2/3" />
            </div>
          ) : content ? (
            <div className="space-y-3">
              {content.type === "USER" ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#EEE6E4]">{content.firstName} {content.lastName}</p>
                  {content.email && <p className="text-xs text-gray-500">{content.email}</p>}
                  {content.role && <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-md">{content.role}</span>}
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                  {content.body ?? "Sem conteúdo"}
                </div>
              )}
              <p className="text-xs text-gray-400 font-mono">ID: {content.id}</p>
            </div>
          ) : null}
        </div>

        {report.status === "PENDING" && (
          <div className="p-5 border-t border-white/10 flex items-center gap-2">
            <button
              onClick={() => { onAction(report.id, "RESOLVED"); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Resolver
            </button>
            <button
              onClick={() => { onAction(report.id, "IGNORED"); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-xs font-medium rounded-lg transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Ignorar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ReportSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-white/10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
          <div className="h-3 bg-white/10 rounded w-3/4" />
        </div>
        <div className="h-6 bg-white/10 rounded-full w-20" />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-8 bg-white/10 rounded-lg w-28" />
        <div className="h-8 bg-white/10 rounded-lg w-24" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminDenunciasPage() {
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);

  const fetchReports = useCallback(async (p: number, status: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const params = new URLSearchParams({ page: String(p), pageSize: "20" });
      if (status !== "ALL") params.set("status", status);
      const res = await fetch(`/api/admin/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) {
        setReports(json.data);
        setPagination(json.pagination);
      }
    } catch {
      toast.error("Erro ao carregar denúncias");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReports(page, statusFilter);
  }, [page, statusFilter, fetchReports]);

  async function handleAction(id: string, status: "RESOLVED" | "IGNORED") {
    setActionLoading(id);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status, resolvedAt: new Date().toISOString() } : r))
        );
        toast.success(status === "RESOLVED" ? "Denúncia resolvida" : "Denúncia ignorada");
      } else {
        toast.error(json.error ?? "Erro ao processar");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setActionLoading(null);
    }
  }

  const pendingCount = reports.filter((r) => r.status === "PENDING").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#EEE6E4]">Fila de Denúncias</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie conteúdo reportado pela comunidade</p>
        </div>
        <button
          onClick={() => fetchReports(page, statusFilter)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#EEE6E4] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Stats pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { key: "PENDING", label: "Pendentes", icon: Clock },
          { key: "RESOLVED", label: "Resolvidas", icon: CheckCircle },
          { key: "IGNORED", label: "Ignoradas", icon: EyeOff },
          { key: "ALL", label: "Todas", icon: Filter },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setStatusFilter(key); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              statusFilter === key
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-400 border-white/10 hover:border-gray-400"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {key === "PENDING" && pendingCount > 0 && statusFilter !== "PENDING" && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <ReportSkeleton key={i} />)
        ) : reports.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma denúncia encontrada.</p>
          </div>
        ) : (
          reports.map((report) => {
            const statusCfg = STATUS_CONFIG[report.status];
            const isPending = report.status === "PENDING";
            const isActing = actionLoading === report.id;

            return (
              <div
                key={report.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
              >
                {/* Top row */}
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-[#CCE9EF] flex items-center justify-center text-xs font-bold text-[#006079] flex-shrink-0">
                    {report.reportedBy.firstName[0]}{report.reportedBy.lastName[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#EEE6E4]">
                      {report.reportedBy.firstName} {report.reportedBy.lastName}
                      <span className="text-gray-400 font-normal ml-1.5">· {timeAgo(report.createdAt)}</span>
                    </p>
                    <p className="text-xs text-gray-500">{report.reportedBy.email}</p>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                </div>

                {/* Target + Reason */}
                <div className="space-y-1.5 pl-11">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-md font-medium">
                      {TARGET_LABELS[report.targetType] ?? report.targetType}
                    </span>
                    <span className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                      {report.targetId}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 font-medium">{report.reason}</p>
                  {report.description && (
                    <p className="text-sm text-gray-500 leading-relaxed">{report.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pl-11">
                  <button
                    onClick={() => setPreviewReport(report)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver conteúdo
                  </button>
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleAction(report.id, "RESOLVED")}
                        disabled={isActing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {isActing ? "Processando..." : "Resolver"}
                      </button>
                      <button
                        onClick={() => handleAction(report.id, "IGNORED")}
                        disabled={isActing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        Ignorar
                      </button>
                    </>
                  )}
                </div>

                {/* Resolved timestamp */}
                {!isPending && report.resolvedAt && (
                  <p className="text-xs text-gray-400 pl-11">
                    {report.status === "RESOLVED" ? "Resolvida" : "Ignorada"} {timeAgo(report.resolvedAt)}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Content preview modal */}
      {previewReport && (
        <ContentPreviewModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
          onAction={handleAction}
        />
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            {pagination.total} denúncia{pagination.total !== 1 ? "s" : ""} · página {pagination.page} de {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:bg-white/5 disabled:opacity-40 transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:bg-white/5 disabled:opacity-40 transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
