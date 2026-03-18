"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Star } from "lucide-react";
import { LeaderboardRow } from "@/components/gamification/LeaderboardRow";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LeaderboardEntry {
  userId?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  } | null;
  points: number;
  level: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface Community {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  logoUrl: string | null;
}

const PERIOD_OPTIONS = [
  { value: "all", label: "Geral" },
  { value: "month", label: "Mês" },
  { value: "week", label: "Semana" },
];

export default function LeaderboardPage({
  params,
}: {
  params: { communitySlug: string };
}) {
  const { communitySlug } = params;
  const router = useRouter();

  const [community, setCommunity] = useState<Community | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [period, setPeriod] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Resolve slug → community ID
  useEffect(() => {
    fetch(`/api/communities?pageSize=100`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const found: Community | undefined = (d.data ?? d.communities ?? []).find(
            (c: Community) => c.slug === communitySlug
          );
          if (found) {
            setCommunity(found);
          } else {
            setError("Comunidade não encontrada.");
            setIsLoading(false);
          }
        } else {
          setError("Erro ao carregar comunidade.");
          setIsLoading(false);
        }
      })
      .catch(() => {
        setError("Erro de conexão.");
        setIsLoading(false);
      });
  }, [communitySlug]);

  // Step 2: Fetch badges when community is known
  useEffect(() => {
    if (!community) return;

    fetch(`/api/communities/${community.id}/badges`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBadges(d.data ?? []);
      })
      .catch(() => {});
  }, [community]);

  // Step 3: Fetch leaderboard (refetch on period change)
  useEffect(() => {
    if (!community) return;

    setIsLeaderboardLoading(true);
    fetch(`/api/communities/${community.id}/leaderboard?period=${period}&limit=50`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setLeaderboard(d.data ?? []);
      })
      .catch(() => {})
      .finally(() => {
        setIsLeaderboardLoading(false);
        setIsLoading(false);
      });
  }, [community, period]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A]">
        <div className="container mx-auto px-4 py-12 max-w-2xl space-y-4">
          <div className="h-8 bg-white/10 rounded-xl animate-pulse w-48" />
          <div className="h-4 bg-white/5 rounded-xl animate-pulse w-64" />
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Link href="/communities" className="text-[#009CD9] text-sm hover:underline">
            Voltar para comunidades
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1A1A1A]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#EEE6E4] transition-colors"
          >
            <span className="text-[#009CD9]">&larr;</span>
            {community?.name ?? communitySlug}
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500/15 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#EEE6E4]">Ranking</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {community?.name} — pontuação acumulada
            </p>
          </div>
        </div>

        {/* Period filter */}
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                period === value
                  ? "bg-[#006079] text-white shadow-lg shadow-[#006079]/20"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-[#EEE6E4] hover:border-[#006079]/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="space-y-2">
          {isLeaderboardLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ))
          ) : leaderboard.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Medal className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-[#EEE6E4] mb-2">
                Nenhum ranking ainda
              </h3>
              <p className="text-sm text-gray-400">
                Seja o primeiro a acumular pontos nesta comunidade!
              </p>
            </div>
          ) : (
            leaderboard.map((entry, index) => {
              const user = entry.user;
              if (!user) return null;
              return (
                <LeaderboardRow
                  key={user.id}
                  rank={index + 1}
                  user={user}
                  points={entry.points}
                  level={entry.level ?? 1}
                />
              );
            })
          )}
        </div>

        {/* Badges section */}
        {badges.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#009CD9]" />
              <h2 className="text-lg font-bold text-[#EEE6E4]">Badges da comunidade</h2>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <BadgeGrid badges={badges} earnedBadgeIds={[]} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
