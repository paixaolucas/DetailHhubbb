"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Users, Search, Ban, CheckCircle, ShieldAlert, ShieldCheck, UserX, ChevronLeft, ChevronRight } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast-provider";
import { STORAGE_KEYS } from "@/lib/constants";

const ALL_ROLES = ["SUPER_ADMIN", "INFLUENCER_ADMIN", "COMMUNITY_MEMBER", "MARKETPLACE_PARTNER"] as const;

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  INFLUENCER_ADMIN: "Influencer",
  COMMUNITY_MEMBER: "Membro",
  MARKETPLACE_PARTNER: "Parceiro",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-400 border-red-500/20",
  INFLUENCER_ADMIN: "bg-[#009CD9]/10 text-[#009CD9] border-[#009CD9]/20",
  COMMUNITY_MEMBER: "bg-[#007A99]/10 text-[#009CD9] border-[#007A99]/20",
  MARKETPLACE_PARTNER: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  avatarUrl: string | null;
}

interface Stats {
  total: number;
  active: number;
  banned: number;
  influencers: number;
}

const PAGE_SIZE = 20;

export default function UsuariosPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, banned: 0, influencers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [banTarget, setBanTarget] = useState<string | null>(null);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState("");

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCurrentUserId(localStorage.getItem(STORAGE_KEYS.USER_ID));
  }, []);

  const fetchUsers = useCallback(async (p: number, q: string, role: string, status: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE) });
      if (q) params.set("search", q);
      if (role !== "ALL") params.set("role", role);
      // Note: status filtering is client-side since API doesn't support it yet

      const res = await fetch(`/api/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.success) {
        let list: User[] = d.data ?? [];
        // Client-side status filter
        if (status === "ACTIVE") list = list.filter((u) => u.isActive && !u.isBanned);
        else if (status === "BANNED") list = list.filter((u) => u.isBanned);
        else if (status === "INACTIVE") list = list.filter((u) => !u.isActive);

        setUsers(list);
        setTotal(d.pagination?.total ?? list.length);
        setTotalPages(d.pagination?.totalPages ?? 1);
        // Compute stats from first page response (approximation)
        setStats({
          total: d.pagination?.total ?? list.length,
          active: list.filter((u) => u.isActive && !u.isBanned).length,
          banned: list.filter((u) => u.isBanned).length,
          influencers: list.filter((u) => u.role === "INFLUENCER_ADMIN").length,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1, val, roleFilter, statusFilter);
    }, 300);
  };

  useEffect(() => {
    fetchUsers(page, search, roleFilter, statusFilter);
    setSelected(new Set());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, statusFilter]);

  async function updateRole(userId: string, role: string) {
    if (userId === currentUserId) return;
    setRoleLoading(userId);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Erro ao alterar role");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
        toast.success("Role atualizado com sucesso");
      } else {
        toast.error(data.error ?? "Erro ao alterar role");
      }
    } finally { setRoleLoading(null); }
  }

  async function updateStatus(userId: string, action: "ban" | "unban" | "deactivate" | "activate") {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const body =
        action === "ban" ? { isBanned: true }
        : action === "unban" ? { isBanned: false }
        : action === "deactivate" ? { isActive: false }
        : { isActive: true };

      const res = await fetch(`/api/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Erro ao alterar status");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...body } : u));
        toast.success("Status atualizado com sucesso");
      } else {
        toast.error(data.error ?? "Erro ao alterar status");
      }
    } finally { setActionLoading(null); }
  }

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === users.length) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  };

  async function bulkAction(action: "ban" | "activate") {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setBulkLoading(true);
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const body = action === "ban" ? { isBanned: true } : { isActive: true, isBanned: false };
    let done = 0;
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/users/${id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        }).then(() => {
          done++;
          setBulkProgress(`Processando ${done} de ${ids.length}...`);
        })
      )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    setBulkLoading(false);
    setBulkProgress("");
    setSelected(new Set());
    if (failed > 0) toast.error(`${failed} erro(s) ao processar`);
    else toast.success(`${ids.length} usuário(s) atualizados`);
    fetchUsers(page, search, roleFilter, statusFilter);
  }

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  }

  if (isLoading && users.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/5 rounded-xl w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="w-9 h-9 bg-white/5 rounded-xl" />
              <div className="h-6 bg-white/5 rounded w-16" />
              <div className="h-3 bg-white/5 rounded w-20" />
            </div>
          ))}
        </div>
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10 h-12 bg-white/5" />
          <div className="divide-y divide-white/5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="w-4 h-4 bg-white/5 rounded" />
                <div className="w-8 h-8 bg-white/5 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-white/5 rounded w-36" />
                  <div className="h-3 bg-white/5 rounded w-48" />
                </div>
                <div className="h-6 bg-white/5 rounded-full w-20 hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#EEE6E4]">Usuários</h1>
        <p className="text-gray-400 text-sm mt-1">Gerencie todos os usuários da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "text-[#009CD9] bg-[#007A99]/10" },
          { label: "Ativos", value: stats.active, icon: CheckCircle, color: "text-green-400 bg-green-500/10" },
          { label: "Banidos", value: stats.banned, icon: Ban, color: "text-red-400 bg-red-500/10" },
          { label: "Influencers", value: stats.influencers, icon: ShieldCheck, color: "text-[#009CD9] bg-[#009CD9]/10" },
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

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full bg-white/5 border border-white/10 focus:border-[#009CD9] rounded-xl pl-10 pr-4 py-2.5 text-[#EEE6E4] placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-white/5 border border-white/10 hover:border-[#009CD9]/30 rounded-xl px-4 py-2.5 text-[#EEE6E4] text-sm focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30"
          >
            <option value="ALL">Todos os roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="INFLUENCER_ADMIN">Influencer</option>
            <option value="COMMUNITY_MEMBER">Membro</option>
            <option value="MARKETPLACE_PARTNER">Parceiro</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white/5 border border-white/10 hover:border-[#009CD9]/30 rounded-xl px-4 py-2.5 text-[#EEE6E4] text-sm focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30"
          >
            <option value="ALL">Todos os status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="BANNED">Banidos</option>
            <option value="INACTIVE">Inativos</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {users.length === 0 && !isLoading ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#EEE6E4]">
              {isLoading ? "Carregando..." : `${total} usuário(s)`}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selected.size === users.length}
                      onChange={toggleSelectAll}
                      className="rounded border-white/10 text-[#006079] focus:ring-[#009CD9]"
                    />
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Usuário</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Role</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Cadastro</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Último login</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden xl:table-cell">Mudar Role</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className={`hover:bg-[#006079]/10 transition-colors ${selected.has(user.id) ? "bg-[#006079]/10" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="rounded border-white/10 text-[#006079] focus:ring-[#009CD9]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#007A99]/20 rounded-xl flex items-center justify-center text-[#009CD9] font-semibold text-xs flex-shrink-0">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#EEE6E4] truncate">
                            {user.firstName} {user.lastName}
                            {user.isBanned && <span className="ml-2 text-xs text-red-400">[banido]</span>}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${ROLE_COLORS[user.role] ?? "bg-white/50/10 text-gray-400 border-gray-500/20"}`}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                        user.isBanned ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : user.isActive ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-white/50/10 text-gray-400 border-gray-500/20"
                      }`}>
                        {user.isBanned ? "Banido" : user.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{formatDate(user.lastLoginAt)}</td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {roleLoading === user.id ? (
                        <div className="w-4 h-4 border-2 border-[#007A99] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <select
                          value={user.role}
                          disabled={user.id === currentUserId || !!roleLoading}
                          onChange={(e) => updateRole(user.id, e.target.value)}
                          className="bg-white/5 border border-white/10 hover:border-[#009CD9]/30 rounded-lg px-2 py-1 text-[#EEE6E4] text-xs focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r} className="bg-white/5">{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {actionLoading === user.id ? (
                          <div className="w-4 h-4 border-2 border-[#007A99] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            {!user.isBanned ? (
                              <button onClick={() => setBanTarget(user.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Banir usuário">
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button onClick={() => updateStatus(user.id, "unban")} className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-500/100/10 rounded-lg transition-colors" title="Desbanir usuário">
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {user.isActive ? (
                              <button onClick={() => updateStatus(user.id, "deactivate")} className="p-1.5 text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors" title="Desativar conta">
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button onClick={() => updateStatus(user.id, "activate")} className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-500/100/10 rounded-lg transition-colors" title="Ativar conta">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-sm text-gray-500">Página {page} de {totalPages}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-lg text-gray-400 hover:bg-white/5 disabled:opacity-40 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-lg text-gray-400 hover:bg-white/5 disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-2xl px-5 py-3 shadow-2xl">
          <span className="text-sm text-white font-medium">
            {bulkLoading ? bulkProgress : `${selected.size} selecionado(s)`}
          </span>
          <div className="w-px h-5 bg-white/20" />
          <button
            onClick={() => bulkAction("ban")}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <Ban className="w-3.5 h-3.5" />
            Banir
          </button>
          <button
            onClick={() => bulkAction("activate")}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/100/30 text-green-400 text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Ativar
          </button>
          <button
            onClick={() => setSelected(new Set())}
            disabled={bulkLoading}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={banTarget !== null}
        title="Banir usuário"
        description="Tem certeza que deseja banir este usuário? Ele não poderá acessar a plataforma."
        confirmLabel="Banir"
        variant="danger"
        onConfirm={() => { if (banTarget) updateStatus(banTarget, "ban"); setBanTarget(null); }}
        onCancel={() => setBanTarget(null)}
      />
    </div>
  );
}
