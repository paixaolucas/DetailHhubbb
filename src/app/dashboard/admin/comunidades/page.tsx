"use client";

import { useState, useEffect } from "react";
import { Globe, Search, Users, CheckCircle, Archive, Eye, EyeOff } from "lucide-react";

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

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
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

  async function togglePublish(id: string, currentlyPublished: boolean) {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("detailhub_access_token");
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

  const filtered = communities.filter(
    (c) =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { label: "Total", value: stats.total, color: "text-blue-400 bg-blue-500/10" },
    { label: "Publicadas", value: stats.published, color: "text-green-400 bg-green-500/10" },
    { label: "Rascunhos", value: stats.drafts, color: "text-yellow-400 bg-yellow-500/10" },
    { label: "Privadas", value: stats.private, color: "text-purple-400 bg-purple-500/10" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/10 rounded-xl w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="h-6 bg-white/10 rounded w-12" />
              <div className="h-3 bg-white/10 rounded w-20" />
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
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Comunidades (Admin)</h1>
          <p className="text-gray-400 text-sm">Gerencie todas as comunidades da plataforma</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="glass-card p-5">
            <p className="text-xl font-bold text-white">{value}</p>
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
            className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">{filtered.length} comunidade(s)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Comunidade</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Influencer</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Membros</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Privada</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((community) => {
                const hostName =
                  community.influencer.displayName ||
                  `${community.influencer.user.firstName} ${community.influencer.user.lastName}`;
                return (
                  <tr key={community.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-white">{community.name}</p>
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
                        <span className="text-xs text-purple-400">Privada</span>
                      ) : (
                        <span className="text-xs text-gray-600">Pública</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {actionLoading === community.id ? (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <button
                          onClick={() => togglePublish(community.id, community.isPublished)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            community.isPublished
                              ? "text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                              : "text-gray-500 hover:text-green-400 hover:bg-green-500/10"
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
    </div>
  );
}
