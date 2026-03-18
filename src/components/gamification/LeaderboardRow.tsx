"use client";

import Image from "next/image";

interface LeaderboardUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

interface LeaderboardRowProps {
  rank: number;
  user: LeaderboardUser;
  points: number;
  level: number;
}

const RANK_STYLES: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-yellow-500/20 border-yellow-500/40", text: "text-yellow-400", label: "🥇" },
  2: { bg: "bg-gray-400/15 border-gray-400/30", text: "text-gray-400", label: "🥈" },
  3: { bg: "bg-orange-600/20 border-orange-600/40", text: "text-orange-400", label: "🥉" },
};

export function LeaderboardRow({ rank, user, points, level }: LeaderboardRowProps) {
  const rankStyle = RANK_STYLES[rank];
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/10 ${
        rankStyle ? `bg-white border ${rankStyle.bg}` : "bg-white border border-white/5"
      }`}
    >
      {/* Rank */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {rankStyle ? (
          <span className="text-lg leading-none">{rankStyle.label}</span>
        ) : (
          <span className="text-sm font-bold text-gray-500">#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={fullName}
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#006079]/40 flex items-center justify-center text-xs font-bold text-[#33A7BF]">
            {initials}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#EEE6E4] truncate">{fullName}</p>
      </div>

      {/* Level badge */}
      <div className="flex-shrink-0">
        <span className="text-xs bg-[#007A99]/15 text-[#009CD9] border border-[#007A99]/25 px-2 py-0.5 rounded-full font-medium">
          Nv. {level}
        </span>
      </div>

      {/* Points */}
      <div className="flex-shrink-0 text-right min-w-[64px]">
        <p className={`text-sm font-bold ${rankStyle ? rankStyle.text : "text-gray-400"}`}>
          {points.toLocaleString("pt-BR")}
        </p>
        <p className="text-[10px] text-gray-400 leading-none">pts</p>
      </div>
    </div>
  );
}
