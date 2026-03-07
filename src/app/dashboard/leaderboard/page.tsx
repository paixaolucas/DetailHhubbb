"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Crown, Car, Users } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";

interface LeaderEntry {
  rank: number;
  userId: string;
  points: number;
  totalPoints?: number;
  level: number;
  user: { firstName: string; lastName: string; avatarUrl: string | null };
}

interface Community {
  id: string;
  name: string;
  logoUrl: string | null;
  slug: string;
}

type Period = "week" | "month" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  week: "Esta semana",
  month: "Este mês",
  all: "Geral",
};

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-gray-300" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-orange-400" />;
  return <span className="text-sm font-bold text-gray-500 w-4 text-center">{rank}</span>;
}

function Avatar({ user, size = "md" }: { user: LeaderEntry["user"]; size?: "sm" | "md" }) {
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  const cls = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={initials} className={`${cls} rounded-full object-cover`} />;
  }
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/5">
          <div className="w-4 h-4 bg-white/10 rounded" />
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-white/10 rounded w-32" />
            <div className="h-3 bg-white/10 rounded w-20" />
          </div>
          <div className="h-5 bg-white/10 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [period, setPeriod] = useState<Period>("month");
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [commLoading, setCommLoading] = useState(true);

  // Load user's communities
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return;
    fetch("/api/communities/mine", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const list: Community[] = d.data?.communities ?? d.data ?? [];
        setCommunities(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(console.error)
      .finally(() => setCommLoading(false));
  }, []);

  // Load leaderboard when community or period changes
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);

    fetch(`/api/communities/${selectedId}/leaderboard?period=${period}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const list: LeaderEntry[] = d.data ?? [];
        setEntries(list);
        const me = list.find((e) => e.userId === userId) ?? null;
        setMyRank(me);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedId, period]);

  const selectedComm = communities.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-500/15 rounded-xl flex items-center justify-center">
          <Trophy className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Ranking de pontos nas suas comunidades</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Community selector */}
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={commLoading}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
        >
          {commLoading && <option>Carregando...</option>}
          {communities.map((c) => (
            <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>
          ))}
          {!commLoading && communities.length === 0 && (
            <option disabled>Nenhuma comunidade encontrada</option>
          )}
        </select>

        {/* Period tabs */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
          {(["week", "month", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* My position highlight */}
      {myRank && (
        <div className="glass-card p-4 border-blue-500/30 bg-blue-500/5">
          <p className="text-xs text-blue-400 font-medium mb-2 uppercase tracking-wide">Sua posição</p>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center">
              <RankIcon rank={myRank.rank} />
            </div>
            <Avatar user={myRank.user} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{myRank.user.firstName} {myRank.user.lastName}</p>
              <p className="text-xs text-gray-500">Nível {myRank.level}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-blue-400">{(myRank.points ?? myRank.totalPoints ?? 0).toLocaleString("pt-BR")}</p>
              <p className="text-xs text-gray-500">pontos</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard list */}
      {loading ? (
        <Skeleton />
      ) : entries.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {communities.length === 0
              ? "Você não é membro de nenhuma comunidade."
              : "Nenhum dado de pontos para este período."}
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">
              {selectedComm?.name ?? "Comunidade"}
            </span>
            <span className="text-xs text-gray-500">{PERIOD_LABELS[period]}</span>
          </div>
          <div className="divide-y divide-white/5">
            {entries.map((entry) => {
              const isMe = entry.userId === localStorage.getItem(STORAGE_KEYS.USER_ID);
              const pts = (entry.points ?? entry.totalPoints ?? 0).toLocaleString("pt-BR");
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                    isMe ? "bg-blue-500/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="w-5 flex items-center justify-center flex-shrink-0">
                    <RankIcon rank={entry.rank} />
                  </div>
                  <Avatar user={entry.user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isMe ? "text-blue-300" : "text-white"}`}>
                      {entry.user.firstName} {entry.user.lastName}
                      {isMe && <span className="ml-1 text-xs text-blue-400">(você)</span>}
                    </p>
                    <p className="text-xs text-gray-500">Nível {entry.level}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${isMe ? "text-blue-400" : "text-gray-200"}`}>{pts}</p>
                    <p className="text-xs text-gray-600">pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
