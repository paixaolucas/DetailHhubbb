"use client";

import { useState, useEffect } from "react";
import { Award, Plus, X, ChevronDown, Users } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

interface Community { id: string; name: string; primaryColor: string }
interface Badge {
  id: string; name: string; description: string;
  icon: string; color: string; communityId: string | null; isActive: boolean;
}
interface Member {
  id: string; userId: string; status: string;
  user: { firstName: string; lastName: string; email: string };
}

const PRESET_COLORS = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444",
  "#F97316", "#EAB308", "#22C55E", "#06B6D4",
];

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-white/10 rounded-xl w-36" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl" />
            <div className="h-4 bg-white/10 rounded w-24" />
            <div className="h-3 bg-white/10 rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BadgesPage() {
  const toast = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newBadge, setNewBadge] = useState({ name: "", description: "", icon: "🏆", color: "#3B82F6" });
  const [creating, setCreating] = useState(false);

  // Award modal
  const [awardBadge, setAwardBadge] = useState<Badge | null>(null);
  const [awardUserId, setAwardUserId] = useState("");
  const [awarding, setAwarding] = useState(false);

  const token = () => localStorage.getItem("autoclub_access_token") ?? "";

  useEffect(() => {
    fetch("/api/communities/mine", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data.length > 0) {
          setCommunities(d.data);
          setSelectedCommunity(d.data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCommunity) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/communities/${selectedCommunity.id}/badges`).then((r) => r.json()),
      fetch(`/api/communities/${selectedCommunity.id}/members`, {
        headers: { Authorization: `Bearer ${token()}` },
      }).then((r) => r.json()),
    ])
      .then(([b, m]) => {
        if (b.success) setBadges(b.data ?? []);
        if (m.success) setMembers((m.data?.members ?? m.data ?? []).filter((mb: Member) => mb.status === "ACTIVE"));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCommunity]);

  async function handleCreate() {
    if (!selectedCommunity || !newBadge.name.trim() || !newBadge.description.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/communities/${selectedCommunity.id}/badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          name: newBadge.name.trim(),
          description: newBadge.description.trim(),
          icon: newBadge.icon.trim() || "🏆",
          color: newBadge.color,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setBadges((prev) => [...prev, d.data]);
        setShowCreate(false);
        setNewBadge({ name: "", description: "", icon: "🏆", color: "#3B82F6" });
        toast.success("Badge criado com sucesso!");
      } else {
        toast.error(d.error ?? "Erro ao criar badge");
      }
    } catch {
      toast.error("Erro ao criar badge");
    } finally {
      setCreating(false);
    }
  }

  async function handleAward() {
    if (!selectedCommunity || !awardBadge || !awardUserId) return;
    setAwarding(true);
    try {
      const res = await fetch(`/api/communities/${selectedCommunity.id}/badges/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ badgeId: awardBadge.id, userId: awardUserId }),
      });
      const d = await res.json();
      if (d.success) {
        const member = members.find((m) => m.userId === awardUserId);
        toast.success(`Badge "${awardBadge.name}" concedido para ${member?.user.firstName ?? "membro"}!`);
        setAwardBadge(null);
        setAwardUserId("");
      } else {
        toast.error(d.error ?? "Erro ao conceder badge");
      }
    } catch {
      toast.error("Erro ao conceder badge");
    } finally {
      setAwarding(false);
    }
  }

  if (loading && badges.length === 0 && communities.length === 0) return <Skeleton />;

  const communityBadges = badges.filter((b) => b.communityId !== null);
  const platformBadges = badges.filter((b) => b.communityId === null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Badges</h1>
            <p className="text-gray-400 text-sm">Gerencie e conceda badges aos membros</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!selectedCommunity}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/30"
        >
          <Plus className="w-4 h-4" />
          Criar Badge
        </button>
      </div>

      {/* Community selector */}
      {communities.length > 1 && (
        <div className="relative w-56">
          <select
            value={selectedCommunity?.id ?? ""}
            onChange={(e) => {
              const c = communities.find((c) => c.id === e.target.value);
              if (c) setSelectedCommunity(c);
            }}
            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 transition-all"
          >
            {communities.map((c) => (
              <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-32 bg-white/5" />
          ))}
        </div>
      ) : (
        <>
          {/* Community-specific badges */}
          {communityBadges.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Badges da Comunidade
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {communityBadges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    onAward={() => { setAwardBadge(badge); setAwardUserId(""); }}
                    canAward={members.length > 0}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Platform-wide badges */}
          {platformBadges.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Badges da Plataforma
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {platformBadges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    onAward={() => { setAwardBadge(badge); setAwardUserId(""); }}
                    canAward={members.length > 0}
                  />
                ))}
              </div>
            </div>
          )}

          {badges.length === 0 && (
            <div className="glass-card p-16 text-center">
              <Award className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">Nenhum badge ainda</p>
              <p className="text-gray-500 text-sm">Crie badges para recompensar seus membros.</p>
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Criar Badge</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome</label>
              <input
                type="text"
                value={newBadge.name}
                onChange={(e) => setNewBadge((b) => ({ ...b, name: e.target.value }))}
                placeholder="Ex: Membro VIP"
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Descrição</label>
              <input
                type="text"
                value={newBadge.description}
                onChange={(e) => setNewBadge((b) => ({ ...b, description: e.target.value }))}
                placeholder="Ex: Concedido a membros exemplares"
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Ícone (emoji)</label>
                <input
                  type="text"
                  value={newBadge.icon}
                  onChange={(e) => setNewBadge((b) => ({ ...b, icon: e.target.value }))}
                  placeholder="🏆"
                  maxLength={4}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-2xl text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Cor</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewBadge((b) => ({ ...b, color: c }))}
                      className={`w-8 h-8 rounded-lg transition-all ${newBadge.color === c ? "ring-2 ring-white scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: `${newBadge.color}30` }}>
                {newBadge.icon || "🏆"}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{newBadge.name || "Nome do Badge"}</p>
                <p className="text-xs text-gray-500">{newBadge.description || "Descrição"}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-xl text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newBadge.name.trim() || !newBadge.description.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                {creating ? "Criando..." : "Criar Badge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Award modal */}
      {awardBadge && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Conceder Badge</h2>
              <button onClick={() => setAwardBadge(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Badge preview */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: `${awardBadge.color}30` }}
              >
                {awardBadge.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{awardBadge.name}</p>
                <p className="text-xs text-gray-500">{awardBadge.description}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <Users className="w-4 h-4 inline mr-1" />
                Selecionar membro
              </label>
              {members.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">Nenhum membro ativo encontrado.</p>
              ) : (
                <div className="relative">
                  <select
                    value={awardUserId}
                    onChange={(e) => setAwardUserId(e.target.value)}
                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 transition-all"
                  >
                    <option value="" className="bg-gray-900">Escolha um membro...</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId} className="bg-gray-900">
                        {m.user.firstName} {m.user.lastName} — {m.user.email}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setAwardBadge(null)}
                className="flex-1 px-4 py-2.5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-xl text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAward}
                disabled={awarding || !awardUserId}
                className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                <Award className="w-4 h-4" />
                {awarding ? "Concedendo..." : "Conceder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BadgeCard({ badge, onAward, canAward }: { badge: Badge; onAward: () => void; canAward: boolean }) {
  return (
    <div className="glass-card p-5 hover:border-white/20 transition-all group flex flex-col gap-3">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${badge.color}20` }}>
        {badge.icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white leading-snug">{badge.name}</p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{badge.description}</p>
      </div>
      <button
        onClick={onAward}
        disabled={!canAward}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-white/10 hover:border-white/20 text-gray-300 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <Award className="w-3.5 h-3.5" />
        Conceder
      </button>
    </div>
  );
}
