"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trophy } from "lucide-react";
import { getMemberLevel, getMemberLevelColor } from "@/lib/points";
import { apiClient } from "@/lib/api-client";

interface LeaderboardEntry {
  userId: string;
  totalPoints: number;
  level: number;
  user: { firstName: string; lastName: string; avatarUrl: string | null } | null;
}

interface MyScore {
  points: number;
  level: number;
  rank: number | null;
}

function Avatar({
  entry,
  size,
  isMe,
}: {
  entry: LeaderboardEntry;
  size: number;
  isMe: boolean;
}) {
  const name = entry.user
    ? `${entry.user.firstName} ${entry.user.lastName ?? ""}`.trim()
    : "Usuário";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return entry.user?.avatarUrl ? (
    <Image
      src={entry.user.avatarUrl}
      alt={name}
      width={size}
      height={size}
      className={`rounded-full object-cover border-2 flex-shrink-0 ${
        isMe ? "border-[#009CD9]" : "border-white/20"
      }`}
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={`rounded-full bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white font-bold flex-shrink-0 border-2 ${
        isMe ? "border-[#009CD9]" : "border-white/20"
      }`}
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {initials}
    </div>
  );
}

export function RankingBlock({ userId }: { userId: string }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myScore, setMyScore] = useState<MyScore | null>(null);
  const [period, setPeriod] = useState<"all" | "month">("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient<LeaderboardEntry[]>(`/api/leaderboard?limit=10&period=${period}`),
      apiClient<MyScore>(`/api/users/${userId}/score`),
    ])
      .then(([lbData, scoreData]) => {
        if (lbData.success) setLeaderboard(lbData.data ?? []);
        if (scoreData?.success) setMyScore(scoreData.data ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, userId]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const isInTop10 = leaderboard.some((e) => e.userId === userId);

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#009CD9]" />
          <h2 className="text-xl font-bold text-[#EEE6E4]">Ranking</h2>
        </div>
        <Link href="/dashboard/leaderboard" className="text-sm text-[#009CD9] font-medium">
          Ver completo →
        </Link>
      </div>

      {/* Period toggle */}
      <div className="flex items-center bg-white/5 m-4 rounded-xl p-0.5">
        {(["month", "all"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            aria-pressed={period === p}
            aria-label={`Ranking ${p === "month" ? "deste mês" : "geral"}`}
            className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
              period === p ? "bg-[#006079] text-white" : "text-gray-400 hover:text-gray-300"
            }`}
          >
            {p === "month" ? "Este mês" : "Geral"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-4 space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/10 rounded-lg" />
              <div className="w-8 h-8 bg-white/10 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-white/10 rounded w-24" />
                <div className="h-2.5 bg-white/10 rounded w-14" />
              </div>
              <div className="w-12 h-3 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <p className="text-center text-xs text-gray-400 py-6 px-4">
          Nenhum ranking ainda. Participe das comunidades!
        </p>
      ) : (
        <>
          {/* Podium — top 3 */}
          {top3.length >= 2 && (
            <div className="flex items-end justify-center gap-2 sm:gap-4 px-2 sm:px-4 pb-3 pt-2 min-w-0">
              {/* 2nd place */}
              {top3[1] && (
                <div className="flex flex-col items-center gap-1">
                  <Avatar
                    entry={top3[1]}
                    size={40}
                    isMe={top3[1].userId === userId}
                  />
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-400/10 text-gray-400 text-xs font-bold">
                    2
                  </div>
                  <p className="text-[10px] text-gray-400 max-w-[48px] text-center leading-tight truncate">
                    {top3[1].user?.firstName ?? "—"}
                  </p>
                  <p className="text-[10px] font-bold text-[#007A99]">
                    {top3[1].totalPoints.toLocaleString("pt-BR")}
                  </p>
                </div>
              )}

              {/* 1st place — elevated */}
              {top3[0] && (
                <div className="flex flex-col items-center gap-1 -mt-4">
                  <div className="text-base">👑</div>
                  <Avatar
                    entry={top3[0]}
                    size={52}
                    isMe={top3[0].userId === userId}
                  />
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-yellow-500/10 text-yellow-500 text-xs font-bold">
                    1
                  </div>
                  <p className="text-[10px] text-[#EEE6E4] max-w-[56px] text-center leading-tight truncate font-semibold">
                    {top3[0].user?.firstName ?? "—"}
                  </p>
                  <p className="text-[10px] font-bold text-[#009CD9]">
                    {top3[0].totalPoints.toLocaleString("pt-BR")}
                  </p>
                </div>
              )}

              {/* 3rd place */}
              {top3[2] && (
                <div className="flex flex-col items-center gap-1">
                  <Avatar
                    entry={top3[2]}
                    size={40}
                    isMe={top3[2].userId === userId}
                  />
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-bold">
                    3
                  </div>
                  <p className="text-[10px] text-gray-400 max-w-[48px] text-center leading-tight truncate">
                    {top3[2].user?.firstName ?? "—"}
                  </p>
                  <p className="text-[10px] font-bold text-[#007A99]">
                    {top3[2].totalPoints.toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* List — 4th to 10th */}
          {rest.length > 0 && (
            <div className="border-t border-white/10 divide-y divide-white/10">
              {rest.map((entry, idx) => {
                const rank = idx + 4;
                const name = entry.user
                  ? `${entry.user.firstName} ${entry.user.lastName ?? ""}`.trim()
                  : "Usuário";
                const isMe = entry.userId === userId;
                const level = getMemberLevel(entry.totalPoints);
                const levelColor = getMemberLevelColor(level);
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 px-5 py-3 ${
                      isMe ? "bg-[#006079]/10" : "hover:bg-white/5"
                    }`}
                  >
                    <span className="w-5 text-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {rank}
                    </span>
                    <Avatar entry={entry} size={32} isMe={isMe} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isMe ? "text-[#009CD9]" : "text-[#EEE6E4]"}`}>
                        {name}
                      </p>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${levelColor}`}>
                        {level}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#007A99]">
                        {entry.totalPoints.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs text-gray-500">pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* User outside top 10 */}
          {!isInTop10 && myScore !== null && (
            <>
              <div className="mx-4 border-t border-dashed border-white/20 my-1" />
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#006079]/10">
                <span className="w-5 text-center text-[10px] font-bold text-[#009CD9] flex-shrink-0">
                  {myScore.rank ?? "—"}
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[#009CD9]">Você</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#009CD9]">
                    {myScore.points.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-[10px] text-gray-500">pts</p>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* My score footer — always visible */}
      {myScore !== null && (
        <div className="border-t border-white/10 px-5 py-3.5 flex items-center justify-between bg-[#006079]/5">
          <p className="text-sm text-gray-400">Meu score</p>
          <p className="text-base font-bold text-[#009CD9]">
            {myScore.points.toLocaleString("pt-BR")} pts
          </p>
        </div>
      )}
    </div>
  );
}
