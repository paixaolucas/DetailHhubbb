"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Globe, Search, Users, CheckCircle, Archive, UserCheck, X, ExternalLink } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";

interface Community {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  isPrivate: boolean;
  memberCount: number;
  influencer: {
    displayName: string | null;
    user: { firstName: string; lastName: string };
  };
}

interface Stats {
  total: number;
  published: number;
  drafts: number;
  private: number;
}

export default function AdminComunidadesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, drafts: 0, private: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Change influencer modal
  const [changeInfluencerModal, setChangeInfluencerModal] = useState<{ communityId: string; communityName: string } | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalResults, setModalResults] = useState<any[]>([]);
  const [modalSearchLoading, setModalSearchLoading] = useState(false);
  const [modalSelectedUser, setModalSelectedUser] = useState<any>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const modalDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    fetch("/api/communities?admin=true", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const list: Community[] = d.data ?? d.communities ?? [];
        setCommunities(list);
        setStats({
          total: list.length,
          published: list.filter((c) => c.isPublished).length,
          drafts: list.filter((c) => !c.isPublished).length,
          private: list.filter((c) => c.isPrivate).length,
        });
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Modal search debounce
  useEffect(() => {
    if (!changeInfluencerModal || !modalSearch.trim()) {
      setModalResults([]);
      return;
    }
    if (modalDebounceRef.current) clearTimeout(modalDebounceRef.current);
    modalDebounceRef.current = setTimeout(async () => {
      setModalSearchLoading(true);
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const res = await fetch(`/api/users?search=${encodeURIComponent(modalSearch)}&pageSize=6`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await res.json();
        if (d.success) setModalResults(d.data ?? []);
      } catch {
        // ignore
      } finally {
        setModalSearchLoading(false);
      }
    }, 300);
  }, [modalSearch, changeInfluencerModal]);

  async function togglePublish(id: string, currentlyPublished: boolean) {
    setActionLoading(id);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch(`/api/communities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isPublished: !currentlyPublished }),
      });
      const data = await res.json();
      if (data.success) {
        setCommunities((prev) =>
          prev.map((c) => c.id === id ? { ...c, isPublished: !currentlyPublished } : c)
        );
        setStats((prev) => ({
          ...prev,
          published: prev.published + (currentlyPublished ? -1 : 1),
          drafts: prev.drafts + (currentlyPublished ? 1 : -1),
        }));
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function saveInfluencer() {
    if (!changeInfluencerModal || !modalSelectedUser) return;
    setModalSaving(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch(`/api/communities/${changeInfluencerModal.communityId}/influencer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ influencerUserId: modalSelectedUser.id }),
      });
      const data = await res.json();
      if (data.success) {
        setCommunities((prev) => prev.map((c) =>
          c.id === changeInfluencerModal.communityId
            ? { ...c, influencer: { displayName: `${modalSelectedUser.firstName} ${modalSelectedUser.lastName}`, user: { firstName: modalSelectedUser.firstName, lastName: modalSelectedUser.lastName } } }
            : c
        ));
        setChangeInfluencerModal(null);
        setModalSearch("");
        setModalSelectedUser(null);
      }
    } finally {
      setModalSaving(false);
    }
  }

  const filtered = communities.filter(
    (c) =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { label: "Total", value: stats.total, color: "text-[#009CD9] bg-[#007A99]/10" },
    { label: "Publicadas", value: stats.published, color: "text-green-400 bg-green-500/10" },
    { label: "Rascunhos", value: stats.drafts, color: "text-yellow-400 bg-yellow-500/10" },
    { label: "Privadas", value: stats.private, color: "text-[#009CD9] bg-[#009CD9]/10" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/5 rounded-xl w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="h-6 bg-white/5 rounded w-12" />
              <div className="h-3 bg-white/5 rounded w-20" />
            </div>
          ))}
        </div>
        <div className="glass-card p-6 h-64 bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#007A99]/10 rounded-xl flex items-center justify-center">
          <Globe className="w-5 h-5 text-[#009CD9]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#EEE6E4]">Comunidades (Admin)</h1>
          <p className="text-gray-400 text-sm">Gerencie todas as comunidades da plataforma</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="glass-card p-5">
            <p className="text-xl font-bold text-[#EEE6E4]">{value}</p>
            <p className={`text-sm font-medium mt-1 ${color.split(" ")[0]}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou slug..."
            className="w-full bg-white/5 border border-white/10 focus:border-[#009CD9] rounded-xl pl-10 pr-4 py-2.5 text-[#EEE6E4] placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-[#EEE6E4]">{filtered.length} comunidade(s)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Comunidade</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Influencer</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Membros</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Privada</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((community) => {
                const hostName =
                  community.influencer.displayName ||
                  `${community.influencer.user.firstName} ${community.influencer.user.lastName}`;
                return (
                  <tr key={community.id} className="hover:bg-[#006079]/10 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#EEE6E4]">{community.name}</p>
                        <p className="text-xs text-gray-500">/{community.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">{hostName}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Users className="w-3.5 h-3.5" />
                        {community.memberCount.toLocaleString("pt-BR")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                        community.isPublished
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}>
                        {community.isPublished ? "Publicada" : "Rascunho"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {community.isPrivate ? (
                        <span className="text-xs text-[#009CD9]">Privada</span>
                      ) : (
                        <span className="text-xs text-gray-400">Pública</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/community/${community.slug}/feed`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#009CD9] hover:bg-[#009CD9]/10 transition-colors"
                          title="Ver comunidade"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => { setChangeInfluencerModal({ communityId: community.id, communityName: community.name }); setModalSelectedUser(null); setModalSearch(""); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#007A99] hover:bg-[#006079]/10 transition-colors"
                          title="Trocar Influencer"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        {actionLoading === community.id ? (
                          <div className="w-4 h-4 border-2 border-[#007A99] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <button
                            onClick={() => togglePublish(community.id, community.isPublished)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              community.isPublished
                                ? "text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                                : "text-gray-500 hover:text-green-400 hover:bg-green-500/100/10"
                            }`}
                            title={community.isPublished ? "Arquivar" : "Publicar"}
                          >
                            {community.isPublished ? (
                              <Archive className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                    Nenhuma comunidade encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Influencer Modal */}
      {changeInfluencerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/5 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-[#EEE6E4]">Trocar Influencer</h3>
              <p className="text-sm text-gray-400 mt-1">Comunidade: <span className="font-medium text-gray-400">{changeInfluencerModal.communityName}</span></p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-400">Pesquise qualquer membro. Se não for Influencer, será promovido automaticamente.</p>

              {modalSelectedUser ? (
                <div className="flex items-center gap-3 p-3 bg-[#006079]/10 border border-[#009CD9]/30 rounded-xl">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {modalSelectedUser.firstName[0]}{modalSelectedUser.lastName?.[0] ?? ""}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#EEE6E4]">{modalSelectedUser.firstName} {modalSelectedUser.lastName}</p>
                    <p className="text-xs text-gray-500">{modalSelectedUser.email}</p>
                  </div>
                  {modalSelectedUser.role !== "INFLUENCER_ADMIN" && (
                    <span className="text-xs text-yellow-600 bg-yellow-500/10 px-2 py-1 rounded-lg">Será promovido</span>
                  )}
                  <button type="button" onClick={() => setModalSelectedUser(null)} className="text-gray-400 hover:text-gray-400 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    className="w-full bg-white/5 border border-white/10 focus:border-[#009CD9] rounded-xl pl-10 pr-4 py-3 text-sm text-[#EEE6E4] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all"
                  />
                  {modalSearchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#009CD9] border-t-transparent rounded-full animate-spin" />
                  )}
                  {modalResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white/5 border border-white/10 rounded-xl shadow-lg z-20 overflow-hidden">
                      {modalResults.map((user: any) => (
                        <button key={user.id} type="button" onClick={() => { setModalSelectedUser(user); setModalSearch(""); setModalResults([]); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#006079]/10 transition-colors text-left border-b border-white/10 last:border-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user.firstName[0]}{user.lastName?.[0] ?? ""}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#EEE6E4]">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-lg bg-white/5 text-gray-500 flex-shrink-0">{user.role}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button
                type="button"
                onClick={() => { setChangeInfluencerModal(null); setModalSearch(""); setModalSelectedUser(null); setModalResults([]); }}
                className="flex-1 px-4 py-2.5 border border-white/10 text-gray-400 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveInfluencer}
                disabled={!modalSelectedUser || modalSaving}
                className="flex-1 bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
              >
                {modalSaving ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
