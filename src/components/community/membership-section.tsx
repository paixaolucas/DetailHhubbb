"use client";

// =============================================================================
// MEMBERSHIP SECTION — Community public page
// Shows "already a member" card or subscription plans depending on membership status
// Server component passes plans as serialized props; client reads localStorage token
// =============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, ArrowRight, Zap } from "lucide-react";
import { PlanCheckoutButton } from "@/components/community/plan-checkout-button";

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
  const [isMember, setIsMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkMembership() {
      try {
        const token = localStorage.getItem("detailhub_access_token");
        if (!token) {
          setIsLoading(false);
          return;
        }
        const res = await fetch("/api/memberships/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const ids: string[] = data.data ?? [];
          setIsMember(ids.includes(communityId));
        }
      } catch {
        // ignore — treat as not a member
      } finally {
        setIsLoading(false);
      }
    }
    checkMembership();
  }, [communityId]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 animate-pulse">
        <div className="h-5 bg-gray-50 rounded w-1/3 mb-4" />
        <div className="h-3 bg-white rounded w-1/2 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-44 bg-white rounded-2xl" />
          <div className="h-44 bg-white rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isMember) {
    return (
      <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Você já tem acesso!</h3>
        <p className="text-gray-400 text-sm mb-6">
          Sua assinatura está ativa. Explore o conteúdo exclusivo da comunidade.
        </p>
        <Link
          href="/dashboard/meu-aprendizado"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-green-500/30"
        >
          Explorar conteúdo <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (plans.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Planos de acesso</h2>
      <p className="text-gray-400 text-sm mb-6">Escolha o plano ideal para você.</p>
      <div
        className={`grid gap-4 ${
          plans.length === 1
            ? "grid-cols-1 max-w-sm mx-auto"
            : "grid-cols-1 sm:grid-cols-2"
        }`}
      >
        {plans.map((plan) => {
          const interval = INTERVAL_LABELS[plan.interval] ?? plan.interval;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 border transition-all ${
                plan.isDefault
                  ? "border-violet-500/50 bg-violet-500/5"
                  : "border-gray-200 bg-white/[0.02]"
              }`}
            >
              {plan.isDefault && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 text-xs bg-violet-600 text-white px-3 py-0.5 rounded-full font-semibold">
                    <Zap className="w-3 h-3" />
                    Mais popular
                  </span>
                </div>
              )}
              <h3 className="font-semibold text-gray-900 text-lg mb-1">{plan.name}</h3>
              {plan.description && (
                <p className="text-gray-500 text-xs mb-3">{plan.description}</p>
              )}
              <div className="mb-5">
                <span className="text-3xl font-bold text-gray-900">
                  R${" "}
                  {plan.price.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
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
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
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
        🔒 Cancelamento a qualquer momento. Sem multa.
      </p>
    </div>
  );
}
