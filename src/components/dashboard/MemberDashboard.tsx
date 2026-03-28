"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { apiClient } from "@/lib/api-client";
import { GreetingBar } from "./GreetingBar";
import { ActivityPulse } from "./ActivityPulse";
import { HeroContinueWatching } from "./HeroContinueWatching";
import { MemberCommunitiesGrid } from "./MemberCommunitiesGrid";
import { MiniRankingCard } from "./MiniRankingCard";
import { NextLiveCard } from "./NextLiveCard";
import { TrendingHorizontal } from "./TrendingHorizontal";
import { MemberHealthWidget } from "./MemberHealthWidget";
import { MemberOnboarding } from "./MemberOnboarding";

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

  return (
    <div className="space-y-4">
      {/* Block 1: Saudação com streak, XP e contexto */}
      <div className="animate-fade-in">
        <GreetingBar firstName={firstName} />
      </div>

      {/* Block 2: Activity pulse — novidades desde a última visita */}
      <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <ActivityPulse />
      </div>

      {/* Block 3: Hero — continuar assistindo (substitui HeroBanner + TrackInProgress) */}
      <div className="animate-slide-up" style={{ animationDelay: "150ms" }}>
        <HeroContinueWatching hasPlatform={hasPlatform} />
      </div>

      {/* Block 4: Comunidades (2/3) + Live + Saúde + Ranking (1/3) */}
      <div className="animate-slide-up delay-75 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MemberCommunitiesGrid hasPlatform={hasPlatform} />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <NextLiveCard />
          <MemberHealthWidget />
          <MiniRankingCard />
        </div>
      </div>

      {/* Block 5: Em alta — scroll horizontal */}
      <div className="animate-slide-up delay-150">
        <TrendingHorizontal />
      </div>

      {/* Block 6: Onboarding quick win — sempre visível */}
      <div className="animate-fade-in delay-300">
        <MemberOnboarding />
      </div>
    </div>
  );
}
