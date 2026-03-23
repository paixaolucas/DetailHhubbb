"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { apiClient } from "@/lib/api-client";
import { HeroBanner } from "./HeroBanner";
import { HealthScore } from "./HealthScore";
import { TrackInProgress } from "./TrackInProgress";
import { CommunitiesRow } from "./CommunitiesRow";
import { RankingBlock } from "./RankingBlock";
import { NextLiveCard } from "./NextLiveCard";
import { TrendingFeed } from "./TrendingFeed";

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
      router.replace("/dashboard");
    } else if (payment === "canceled") {
      toast.error("Pagamento cancelado. Tente novamente se quiser.");
      router.replace("/dashboard");
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

  return (
    <div className="space-y-4">
      {/* Block 1: Hero banner com saudação integrada */}
      <HeroBanner firstName={firstName} />

      {/* Block 2: Score — barra horizontal compacta */}
      <div className="animate-fade-in">
        <HealthScore />
      </div>

      {/* Block 3: Comunidades (2/3) + Ranking (1/3) — lado a lado em telas médias+ */}
      <div className="animate-slide-up delay-75 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CommunitiesRow hasPlatform={hasPlatform} />
        </div>
        <div className="lg:col-span-1">
          <RankingBlock userId={userId} />
        </div>
      </div>

      {/* Block 4: Trilha em andamento (só aparece se tiver progresso ativo) */}
      <div className="animate-slide-up delay-150">
        <TrackInProgress />
      </div>

      {/* Block 5: Feed em alta + Próxima live */}
      <div className="animate-slide-up delay-225 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <TrendingFeed />
        </div>
        <div className="xl:col-span-1">
          <NextLiveCard />
        </div>
      </div>
    </div>
  );
}
