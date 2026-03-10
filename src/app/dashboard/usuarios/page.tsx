"use client";

import { useState, useEffect } from "react";
import { Users, Search, Ban, CheckCircle, ShieldAlert, ShieldCheck, UserX } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const ALL_ROLES = ["SUPER_ADMIN", "INFLUENCER_ADMIN", "COMMUNITY_MEMBER", "MARKETPLACE_PARTNER"] as const;

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  INFLUENCER_ADMIN: "Influencer",
  COMMUNITY_MEMBER: "Membro",
  MARKETPLACE_PARTNER: "Parceiro",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-400 border-red-500/20",
  INFLUENCER_ADMIN: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  COMMUNITY_MEMBER: "bg-blue-500/10 text-blue-400 border-blue-500/20",
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

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, banned: 0, influencers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [banTarget, setBanTarget] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUserId(localStorage.getItem("detailhub_user_id"));
  }, []);

  async function updateRole(userId: string, role: string) {
    if (userId === currentUserId) return;
    setRoleLoading(userId);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
      }
    } finally { setRoleLoading(null); }
  }

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const u = d.data ?? [];
          setUsers(u);
          setStats({
            total: u.length,
            active: u.filter((x: User) => x.isActive && !x.isBanned).length,
            banned: u.filter((x: User) => x.isBanned).length,
            influencers: u.filter((x: User) => x.role === "INFLUENCER_ADMIN").length,
          });
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function updateStatus(userId: string, action: "ban" | "unban" | "deactivate" | "activate") {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem("detailhub_access_token");
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
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...body } : u));
      }
    } finally { setActionLoading(null); }
  }

  const filtered = users.filter((u) => {
    const matchSearch =
      search === "" ||
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.isActive && !u.isBanned) ||
      (statusFilter === "BANNED" && u.isBanned) ||
      (statusFilter === "INACTIVE" && !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/10 rounded-xl w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="w-9 h-9 bg-white/10 rounded-xl" />
              <div className="h-6 bg-white/10 rounded w-16" />
              <div className="h-3 bg-white/10 rounded w-20" />
            </div>
          ))}
        </div>
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10 h-12 bg-white/5" />
          <div className="divide-y divide-white/5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-white/10 rounded w-36" />
                  <div className="h-3 bg-white/10 rounded w-48" />
                </div>
                <div className="h-6 bg-white/10 rounded-full w-20 hidden sm:block" />
                <div className="h-6 bg-white/10 rounded-full w-16 hidden md:block" />
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
        <h1 className="text-2xl font-bold text-white">Usuários</h1>
        <p className="text-gray-400 text-sm mt-1">Gerencie todos os usuários da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "text-blue-400 bg-blue-500/10" },
          { label: "Ativos", value: stats.active, icon: CheckCircle, color: "text-green-400 bg-green-500/10" },
          { label: "Banidos", value: stats.banned, icon: Ban, color: "text-red-400 bg-red-500/10" },
          { label: "Influencers", value: stats.influencers, icon: ShieldCheck, color: "text-purple-400 bg-purple-500/10" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color.split(" ")[1]}`}>
              <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="ALL">Todos os roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="INFLUENCER_ADMIN">Influencer</option>
            <option value="COMMUNITY_MEMBER">Membro</option>
            <option value="MARKETPLACE_PARTNER">Parceiro</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="ALL">Todos os status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="BANNED">Banidos</option>
            <option value="INACTIVE">Inativos</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {filtered.length} usuário(s)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
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
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-semibold text-xs flex-shrink-0">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {user.firstName} {user.lastName}
                            {user.isBanned && <span className="ml-2 text-xs text-red-400">[banido]</span>}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${ROLE_COLORS[user.role] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                        user.isBanned ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : user.isActive ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      }`}>
                        {user.isBanned ? "Banido" : user.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{formatDate(user.lastLoginAt)}</td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {roleLoading === user.id ? (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <select
                          value={user.role}
                          disabled={user.id === currentUserId}
                          onChange={(e) => updateRole(user.id, e.target.value)}
                          className="bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r} className="bg-gray-800">{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {actionLoading === user.id ? (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            {!user.isBanned ? (
                              <button
                                onClick={() => setBanTarget(user.id)}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Banir usuário"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => updateStatus(user.id, "unban")}
                                className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                title="Desbanir usuário"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {user.isActive ? (
                              <button
                                onClick={() => updateStatus(user.id, "deactivate")}
                                className="p-1.5 text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                                title="Desativar conta"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => updateStatus(user.id, "activate")}
                                className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                title="Ativar conta"
                              >
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
