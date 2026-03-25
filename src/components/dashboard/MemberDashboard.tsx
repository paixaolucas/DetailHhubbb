"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { apiClient } from "@/lib/api-client";
import { HeroBanner } from "./HeroBanner";
import { HealthScore } from "./HealthScore";
import { getGreeting } from "@/lib/greeting";
import { TrackInProgress } from "./TrackInProgress";
import { CommunitiesRow } from "./CommunitiesRow";
import { RankingBlock } from "./RankingBlock";
import { NextLiveCard } from "./NextLiveCard";
import { TrendingFeed } from "./TrendingFeed";
import { MemberHealthWidget } from "./MemberHealthWidget";

export function MemberDashboard({
  userName,
  userId,
  forcePaid,
}: {
  userName: string;
  userId: string;
  forcePaid?: boolean | null;
}) {
  const firstName = userName.split(" ")[0] || "Aluno";
  const [hasPlatform, setHasPlatform] = useState<boolean | null>(
    forcePaid !== undefined ? forcePaid : null
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // Payment redirect toast
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast.success("Assinatura confirmada! Bem-vindo à plataforma.");
      router.replace("/inicio");
    } else if (payment === "canceled") {
      toast.error("Pagamento cancelado. Tente novamente se quiser.");
      router.replace("/inicio");
    }
  }, [searchParams, toast, router]);

  const fetchMembership = useCallback(() => {
    if (forcePaid !== undefined) return;
    apiClient<{ hasMembership: boolean }>("/api/platform-membership/me")
      .then((d) => { if (d.success) setHasPlatform(d.data?.hasMembership === true); })
      .catch(console.error);
  }, [forcePaid]);

  useEffect(() => { fetchMembership(); }, [fetchMembership]);
  useAutoRefresh(fetchMembership, 60_000);

  const [greeting, setGreeting] = useState("");

  // Calcula no cliente com o timezone real do browser — evita SSR com UTC do servidor
  useEffect(() => {
    setGreeting(getGreeting(firstName));
  }, [firstName]);

  return (
    <div className="space-y-4">
      {/* Block 1: Hero banner */}
      <HeroBanner />

      {/* Block 2: Saudação + Score */}
      <div className="animate-fade-in space-y-3">
        <div className="flex items-baseline gap-2 px-1">
          <h2 className="text-2xl sm:text-3xl font-black text-[#EEE6E4] leading-tight">
            {greeting}
          </h2>
          <span className="text-gray-500 text-sm hidden sm:inline">que bom que voltou.</span>
        </div>
        <HealthScore />
      </div>

      {/* Block 3: Comunidades — largura total */}
      <div className="animate-slide-up delay-75">
        <CommunitiesRow hasPlatform={hasPlatform} />
      </div>

      {/* Block 4: Trilha em andamento */}
      <div className="animate-slide-up delay-150">
        <TrackInProgress />
      </div>

      {/* Block 5: Em alta (2/3) + Ranking (1/3) */}
      <div className="animate-slide-up delay-225 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <TrendingFeed />
          <NextLiveCard />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <MemberHealthWidget />
          <RankingBlock userId={userId} />
        </div>
      </div>
    </div>
  );
}
