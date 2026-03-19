"use client";

// =============================================================================
// MEMBERSHIP SECTION — Community public page
// Checks platform membership (current model) — a single subscription gives
// access to all communities. Falls back to showing legacy per-community plans
// if the platform model is not active.
// =============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, ArrowRight, Zap, Lock } from "lucide-react";
import { PlanCheckoutButton } from "@/components/community/plan-checkout-button";
import { STORAGE_KEYS } from "@/lib/constants";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  isDefault: boolean;
};

const INTERVAL_LABELS: Record<string, string> = {
  month: "mês",
  year: "ano",
  week: "semana",
  day: "dia",
};

export function MembershipSection({
  communityId,
  communitySlug,
  primaryColor,
  plans,
}: {
  communityId: string;
  communitySlug: string;
  primaryColor: string;
  plans: Plan[];
}) {
  const [status, setStatus] = useState<"loading" | "platform" | "community" | "none">("loading");

  useEffect(() => {
    async function checkAccess() {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (!token) {
          setStatus("none");
          return;
        }

        // Check platform membership first (current model)
        const [platformRes, communityRes] = await Promise.all([
          fetch("/api/platform-membership/me", {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null),
          fetch("/api/memberships/me", {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null),
        ]);

        // Platform membership (single subscription = access to all)
        if (platformRes?.ok) {
          const data = await platformRes.json();
          if (data.data?.hasMembership === true) {
            setStatus("platform");
            return;
          }
        }

        // Legacy community membership
        if (communityRes?.ok) {
          const data = await communityRes.json();
          const ids: string[] = data.data ?? [];
          if (ids.includes(communityId)) {
            setStatus("community");
            return;
          }
        }

        setStatus("none");
      } catch {
        setStatus("none");
      }
    }
    checkAccess();
  }, [communityId]);

  if (status === "loading") {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 animate-pulse">
        <div className="h-5 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-3 bg-white/10 rounded w-1/2 mb-6" />
        <div className="h-44 bg-white/10 rounded-2xl" />
      </div>
    );
  }

  // User has platform subscription — full access
  if (status === "platform" || status === "community") {
    return (
      <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-[#EEE6E4] mb-2">
          {status === "platform" ? "Você tem acesso completo!" : "Você já é membro!"}
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          {status === "platform"
            ? "Sua assinatura Detailer'HUB dá acesso a esta e todas as outras comunidades."
            : "Sua assinatura está ativa. Explore o conteúdo exclusivo."}
        </p>
        <Link
          href={`/community/${communitySlug}/feed`}
          className="inline-flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-[#006079]/30"
        >
          Acessar comunidade <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Filter out free/zero-price plans — those are test/seed data, show platform CTA instead
  const paidPlans = plans.filter((p) => p.price > 0);

  // No membership — show subscription CTA
  // If platform model (no legacy plans or only zero-price plans), show platform subscription CTA
  if (paidPlans.length === 0) {
    return (
      <div className="relative bg-gradient-to-br from-[#006079]/10 to-[#009CD9]/5 border border-[#006079]/30 rounded-2xl p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#009CD9]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative text-center">
          <div className="w-16 h-16 bg-[#006079]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#009CD9]" />
          </div>
          <h3 className="text-xl font-bold text-[#EEE6E4] mb-2">Acesso exclusivo para assinantes</h3>
          <p className="text-gray-400 text-sm mb-2 max-w-sm mx-auto">
            Uma assinatura Detailer&apos;HUB dá acesso a esta e todas as outras comunidades da plataforma.
          </p>
          <p className="text-2xl font-black text-[#EEE6E4] mb-1">
            R$79<span className="text-gray-400 text-sm font-normal">/mês</span>
          </p>
          <p className="text-gray-500 text-xs mb-6">ou R$948/ano — cancele quando quiser</p>
          <Link
            href={`/register?community=${communitySlug}`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] text-white px-8 py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-[#006079]/30"
          >
            Assinar agora <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-gray-500 text-xs mt-3">
            Já tem conta?{" "}
            <Link href="/login" className="text-[#009CD9] hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Legacy per-community plans (paid only)
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
      <h2 className="text-xl font-bold text-[#EEE6E4] mb-2">Planos de acesso</h2>
      <p className="text-gray-400 text-sm mb-6">Escolha o plano ideal para você.</p>
      <div
        className={`grid gap-4 ${
          paidPlans.length === 1
            ? "grid-cols-1 max-w-sm mx-auto"
            : "grid-cols-1 sm:grid-cols-2"
        }`}
      >
        {paidPlans.map((plan) => {
          const interval = INTERVAL_LABELS[plan.interval] ?? plan.interval;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 border transition-all ${
                plan.isDefault
                  ? "border-[#009CD9]/50 bg-[#009CD9]/5"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {plan.isDefault && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 text-xs bg-[#006079] text-white px-3 py-0.5 rounded-full font-semibold">
                    <Zap className="w-3 h-3" />
                    Mais popular
                  </span>
                </div>
              )}
              <h3 className="font-semibold text-[#EEE6E4] text-lg mb-1">{plan.name}</h3>
              {plan.description && (
                <p className="text-gray-500 text-xs mb-3">{plan.description}</p>
              )}
              <div className="mb-5">
                <span className="text-3xl font-bold text-[#EEE6E4]">
                  R${" "}
                  {plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-gray-500 text-sm">/{interval}</span>
                {plan.trialDays > 0 && (
                  <p className="text-green-400 text-xs mt-1">
                    {plan.trialDays} dias grátis
                  </p>
                )}
              </div>
              {plan.features.length > 0 && (
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
              <PlanCheckoutButton
                planId={plan.id}
                communitySlug={communitySlug}
                primaryColor={primaryColor}
              />
            </div>
          );
        })}
      </div>
      <p className="text-center text-gray-500 text-xs mt-4">
        Cancelamento a qualquer momento. Sem multa.
      </p>
    </div>
  );
}
