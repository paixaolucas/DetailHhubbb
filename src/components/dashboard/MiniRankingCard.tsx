"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface LeaderboardEntry {
  userId: string;
  totalPoints: number;
  rank: number;
  user: { firstName: string; lastName: string | null; avatarUrl: string | null } | null;
}

interface SidebarCommunity {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
}

const MEDAL_STYLES: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-amber-500/20", text: "text-amber-400" },
  2: { bg: "bg-gray-400/20", text: "text-gray-300" },
  3: { bg: "bg-orange-600/20", text: "text-orange-400" },
};

function EntryAvatar({ entry }: { entry: LeaderboardEntry }) {
  const name = entry.user
    ? `${entry.user.firstName} ${entry.user.lastName ?? ""}`.trim()
    : "Usuário";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  if (entry.user?.avatarUrl) {
    return (
      <Image
        src={entry.user.avatarUrl}
        alt={name}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

export function MiniRankingCard() {
  const [community, setCommunity] = useState<SidebarCommunity | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<unknown>("/api/communities?view=sidebar")
      .then(async (d) => {
        if (!d.success) return;
        const raw = d as unknown as { communities?: SidebarCommunity[] };
        const communities = raw.communities ?? [];
        if (communities.length === 0) return;

        const first = communities[0];
        setCommunity(first);

        const lb = await apiClient<LeaderboardEntry[]>(
          `/api/communities/${first.id}/leaderboard?period=all&limit=3`
        );
        if (lb.success) setLeaderboard(lb.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[#111] border border-white/[0.06] rounded-xl p-4 animate-pulse space-y-3">
        <div className="h-4 bg-white/10 rounded w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-white/10 rounded-xl" />
        ))}
      </div>
    );
  }

  // No community joined yet
  if (!community) {
    return (
      <div className="bg-[#111] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-[#009CD9]" />
          <span className="text-sm font-bold text-[#EEE6E4]">Ranking</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Entre em uma comunidade para ver o ranking!
        </p>
        <Link
          href="/dashboard/communities"
          className="text-xs text-[#009CD9] hover:underline"
        >
          Explorar comunidades →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <Trophy className="w-4 h-4 text-[#009CD9] flex-shrink-0" />
        <span className="text-sm font-bold text-[#EEE6E4]">Ranking</span>
        <span
          className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full truncate max-w-[100px]"
          style={{
            backgroundColor: `${community.primaryColor}20`,
            color: community.primaryColor,
          }}
        >
          {community.name}
        </span>
      </div>

      {/* Top 3 rows */}
      <div className="px-4 py-2 divide-y divide-white/[0.04]">
        {leaderboard.length === 0 ? (
          <p className="text-xs text-gray-500 py-3 text-center">
            Nenhum dado de ranking ainda.
          </p>
        ) : (
          leaderboard.slice(0, 3).map((entry, idx) => {
            const rank = idx + 1;
            const medal = MEDAL_STYLES[rank] ?? { bg: "bg-white/10", text: "text-gray-400" };
            const name = entry.user
              ? `${entry.user.firstName} ${entry.user.lastName ?? ""}`.trim()
              : "Usuário";

            return (
              <div key={entry.userId} className="flex items-center gap-2 py-2">
                {/* Medal */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${medal.bg} ${medal.text}`}
                >
                  {rank}
                </div>

                {/* Avatar */}
                <EntryAvatar entry={entry} />

                {/* Name */}
                <span className="text-sm text-[#EEE6E4] truncate flex-1">{name}</span>

                {/* Points */}
                <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">
                  {entry.totalPoints.toLocaleString("pt-BR")}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.06]">
        <Link
          href={`/community/${community.slug}/ranking`}
          className="text-xs text-[#009CD9] hover:underline"
        >
          Ver ranking completo →
        </Link>
      </div>
    </div>
  );
}
