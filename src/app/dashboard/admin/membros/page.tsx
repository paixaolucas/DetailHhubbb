"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Users, Search, X, ChevronLeft, ChevronRight, UserCheck } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";
import { useToast } from "@/components/ui/toast-provider";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlatformMembershipStatus = "ACTIVE" | "CANCELED" | "EXPIRED" | "PAST_DUE" | "TRIALING";

interface Member {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: PlatformMembershipStatus;
  planInterval: "year" | "month";
  joinedAt: string;
  currentPeriodEnd: string;
  referredByInfluencer: { id: string; displayName: string | null } | null;
}

interface ApiResponse {
  success: boolean;
  data: {
    members: Member[];
    total: number;
    page: number;
    pageSize: number;
  };
}

interface Influencer {
  id: string;
  displayName: string;
}

interface SummaryStats {
  total: number;
  active: number;
  canceled: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "CANCELED", label: "Cancelado" },
  { value: "EXPIRED", label: "Expirado" },
  { value: "PAST_DUE", label: "Em atraso" },
  { value: "TRIALING", label: "Em teste" },
];

const STATUS_BADGE: Record<PlatformMembershipStatus, { label: string; className: string }> = {
  ACTIVE:   { label: "Ativo",      className: "bg-green-500/20 text-green-400 border-green-500/30" },
  CANCELED: { label: "Cancelado",  className: "bg-red-500/20 text-red-400 border-red-500/30" },
  EXPIRED:  { label: "Expirado",   className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  PAST_DUE: { label: "Em atraso",  className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  TRIALING: { label: "Em teste",   className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getToken(): string {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? "";
}

function buildUrl(params: {
  page: number;
  search: string;
  status: string;
  influencerId: string;
}): string {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page));
  qs.set("pageSize", String(PAGE_SIZE));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.influencerId) qs.set("influencerId", params.influencerId);
  return `/api/admin/members?${qs.toString()}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-0">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-white/5">
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-white/10 rounded w-36" />
            <div className="h-3 bg-white/5 rounded w-48" />
          </div>
          <div className="h-5 bg-white/10 rounded-full w-20 hidden sm:block" />
          <div className="h-3.5 bg-white/5 rounded w-16 hidden md:block" />
          <div className="h-3.5 bg-white/5 rounded w-28 hidden lg:block" />
          <div className="h-3.5 bg-white/5 rounded w-24 hidden xl:block" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMembrosPage() {
  const toast = useToast();
  const showError = useCallback((msg: string) => toast.error(msg), [toast]);

  // Data
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<SummaryStats>({ total: 0, active: 0, canceled: 0 });
  const [influencers, setInfluencers] = useState<Influencer[]>([]);

  // UI state
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [influencerFilter, setInfluencerFilter] = useState("");
  const [page, setPage] = useState(1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Debounce search ────────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, influencerFilter]);

  // ─── Fetch summary stats (parallel requests for counts) ─────────────────────

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [resTotal, resActive, resCanceled] = await Promise.all([
        fetch("/api/admin/members?page=1&pageSize=1", { headers }),
        fetch("/api/admin/members?page=1&pageSize=1&status=ACTIVE", { headers }),
        fetch("/api/admin/members?page=1&pageSize=1&status=CANCELED", { headers }),
      ]);

      const [dTotal, dActive, dCanceled] = await Promise.all([
        resTotal.json() as Promise<ApiResponse>,
        resActive.json() as Promise<ApiResponse>,
        resCanceled.json() as Promise<ApiResponse>,
      ]);

      if (dTotal.success && dActive.success && dCanceled.success) {
        setSummary({
          total: dTotal.data.total,
          active: dActive.data.total,
          canceled: dCanceled.data.total,
        });
      }
    } catch {
      // Summary errors are non-critical
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // ─── Fetch members list ─────────────────────────────────────────────────────

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const url = buildUrl({ page, search: debouncedSearch, status: statusFilter, influencerId: influencerFilter });
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data: ApiResponse = await res.json();

      if (data.success) {
        setMembers(data.data.members);
        setTotal(data.data.total);

        // Build unique influencer list from results
        const seen = new Set<string>();
        const list: Influencer[] = [];
        for (const m of data.data.members) {
          if (m.referredByInfluencer && !seen.has(m.referredByInfluencer.id)) {
            seen.add(m.referredByInfluencer.id);
            list.push({
              id: m.referredByInfluencer.id,
              displayName: m.referredByInfluencer.displayName ?? "Influenciador",
            });
          }
        }
        // Merge with existing so filter stays usable when navigating pages
        setInfluencers((prev) => {
          const merged = [...prev];
          for (const inf of list) {
            if (!merged.find((x) => x.id === inf.id)) merged.push(inf);
          }
          return merged;
        });
      } else {
        showError("Não foi possível carregar os membros.");
      }
    } catch {
      showError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
      setIsFirstLoad(false);
    }
  }, [page, debouncedSearch, statusFilter, influencerFilter, showError]);

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // ─── Pagination ─────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setInfluencerFilter("");
    setPage(1);
  }

  const hasActiveFilters = search !== "" || statusFilter !== "" || influencerFilter !== "";

  // ─── Skeleton for initial load ───────────────────────────────────────────────

  if (isFirstLoad && isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl" />
          <div className="space-y-1.5">
            <div className="h-6 bg-white/10 rounded w-52" />
            <div className="h-3.5 bg-white/5 rounded w-80" />
          </div>
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-2">
              <div className="h-7 bg-white/10 rounded w-16" />
              <div className="h-3.5 bg-white/5 rounded w-28" />
            </div>
          ))}
        </div>

        {/* Filters skeleton */}
        <div className="glass-card p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="h-10 bg-white/5 rounded-xl flex-1" />
            <div className="h-10 bg-white/5 rounded-xl w-full sm:w-44" />
            <div className="h-10 bg-white/5 rounded-xl w-full sm:w-48" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="h-4 bg-white/5 rounded w-32" />
          </div>
          <TableSkeleton />
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#007A99]/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-[#009CD9]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#EEE6E4]">Membros da Plataforma</h1>
          <p className="text-gray-400 text-sm">Total de membros ativos, cancelados e por influenciador</p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total */}
        <div className="glass-card p-5">
          {summaryLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-7 bg-white/10 rounded w-16" />
              <div className="h-3.5 bg-white/5 rounded w-28" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-[#EEE6E4]">{summary.total.toLocaleString("pt-BR")}</p>
              <p className="text-sm text-[#009CD9] mt-1">Total de membros</p>
            </>
          )}
        </div>

        {/* Ativos */}
        <div className="glass-card p-5">
          {summaryLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-7 bg-white/10 rounded w-16" />
              <div className="h-3.5 bg-white/5 rounded w-28" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-[#EEE6E4]">{summary.active.toLocaleString("pt-BR")}</p>
              <p className="text-sm text-green-400 mt-1">Membros ativos</p>
            </>
          )}
        </div>

        {/* Cancelados */}
        <div className="glass-card p-5">
          {summaryLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-7 bg-white/10 rounded w-16" />
              <div className="h-3.5 bg-white/5 rounded w-28" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-[#EEE6E4]">{summary.canceled.toLocaleString("pt-BR")}</p>
              <p className="text-sm text-red-400 mt-1">Cancelados</p>
            </>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              aria-label="Buscar membros"
              className="w-full bg-white/5 border border-white/10 focus:border-[#009CD9] rounded-xl pl-10 pr-4 py-2.5 text-[#EEE6E4] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#009CD9]/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por status"
            className="bg-white/5 border border-white/10 focus:border-[#009CD9] rounded-xl px-3 py-2.5 text-sm text-[#EEE6E4] focus:outline-none focus:ring-2 focus:ring-[#009CD9]/20 transition-all w-full sm:w-44 appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#1A1A1A] text-[#EEE6E4]">
                {opt.label}
              </option>
            ))}
          </select>

          {/* Influencer select */}
          <select
            value={influencerFilter}
            onChange={(e) => setInfluencerFilter(e.target.value)}
            aria-label="Filtrar por influenciador"
            className="bg-white/5 border border-white/10 focus:border-[#009CD9] rounded-xl px-3 py-2.5 text-sm text-[#EEE6E4] focus:outline-none focus:ring-2 focus:ring-[#009CD9]/20 transition-all w-full sm:w-52 appearance-none cursor-pointer"
          >
            <option value="" className="bg-[#1A1A1A] text-[#EEE6E4]">Todos os influenciadores</option>
            {influencers.map((inf) => (
              <option key={inf.id} value={inf.id} className="bg-[#1A1A1A] text-[#EEE6E4]">
                {inf.displayName}
              </option>
            ))}
          </select>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-white/10 text-gray-400 hover:text-[#EEE6E4] hover:border-white/20 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-[#EEE6E4]">
            {isLoading ? (
              <span className="text-gray-500">Carregando...</span>
            ) : (
              <>
                {total === 0
                  ? "Nenhum membro encontrado"
                  : `Exibindo ${rangeStart}–${rangeEnd} de ${total.toLocaleString("pt-BR")} membro${total !== 1 ? "s" : ""}`}
              </>
            )}
          </p>

          {/* Inline spinner while re-fetching (not first load) */}
          {isLoading && !isFirstLoad && (
            <div
              className="w-4 h-4 border-[3px] border-[#009CD9] border-t-transparent rounded-full animate-spin"
              aria-label="Carregando"
            />
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  Membro
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">
                  Plano
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    Referido por
                  </span>
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden xl:table-cell">
                  Entrou em
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && !isFirstLoad ? (
                // Show skeleton rows while re-fetching
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5">
                      <div className="space-y-1.5">
                        <div className="h-3.5 bg-white/10 rounded w-36" />
                        <div className="h-3 bg-white/5 rounded w-48" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-5 bg-white/10 rounded-full w-20" />
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="h-3.5 bg-white/5 rounded w-16" />
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="h-3.5 bg-white/5 rounded w-28" />
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <div className="h-3.5 bg-white/5 rounded w-24" />
                    </td>
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-gray-600" />
                      <p className="text-gray-500 text-sm">Nenhum membro encontrado.</p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-[#009CD9] text-xs hover:underline mt-1"
                        >
                          Limpar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const badge = STATUS_BADGE[member.status] ?? { label: member.status, className: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
                  const influencerName = member.referredByInfluencer?.displayName ?? "Direto";
                  const initials = member.userName
                    .split(" ")
                    .map((n) => n[0] ?? "")
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr key={member.id} className="hover:bg-[#006079]/10 transition-colors">
                      {/* Membro */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            aria-hidden="true"
                          >
                            {initials || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#EEE6E4] truncate">
                              {member.userName || "Sem nome"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{member.userEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full border font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Plano */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-gray-400">
                          {member.planInterval === "year" ? "Anual" : "Mensal"}
                        </span>
                      </td>

                      {/* Referido por */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span
                          className={`text-sm ${
                            member.referredByInfluencer
                              ? "text-[#009CD9]"
                              : "text-gray-500 italic"
                          }`}
                        >
                          {influencerName}
                        </span>
                      </td>

                      {/* Entrou em */}
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <span className="text-sm text-gray-400">{formatDate(member.joinedAt)}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {total > PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500 order-2 sm:order-1">
              Exibindo {rangeStart}–{rangeEnd} de {total.toLocaleString("pt-BR")} membros
            </p>

            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                aria-label="Página anterior"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 border border-white/10 rounded-lg hover:bg-white/5 hover:text-[#EEE6E4] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <span className="text-xs text-gray-500 px-1">
                {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                aria-label="Próxima página"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 border border-white/10 rounded-lg hover:bg-white/5 hover:text-[#EEE6E4] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
