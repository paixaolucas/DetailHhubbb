"use client";

// =============================================================================
// OnboardingChecklist — guides new influencers through community setup
// Shown in the "Geral" tab of community settings until all items are complete
// or user explicitly dismisses it
// =============================================================================

import { useState, useEffect } from "react";
import { CheckCircle, Circle, X, ChevronRight } from "lucide-react";
import Link from "next/link";

interface CommunityForChecklist {
  id: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isPublished?: boolean;
  _count?: {
    spaces?: number;
    subscriptionPlans?: number;
  };
}

interface ChecklistItem {
  label: string;
  description: string;
  done: boolean;
  action?: { href: string; label: string };
}

interface Props {
  community: CommunityForChecklist;
}

export default function OnboardingChecklist({ community }: Props) {
  const storageKey = `detailhub_onboarding_dismissed_${community.id}`;
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem(storageKey) === "1") {
      setDismissed(true);
    }
  }, [storageKey]);

  const items: ChecklistItem[] = [
    {
      label: "Criar a comunidade",
      description: "Comunidade criada com sucesso.",
      done: true,
    },
    {
      label: "Adicionar logo",
      description: "Dê uma identidade visual à sua comunidade.",
      done: !!community.logoUrl,
      action: { href: "?tab=appearance", label: "Configurar aparência" },
    },
    {
      label: "Adicionar banner",
      description: "Um banner atraente aumenta a credibilidade.",
      done: !!community.bannerUrl,
      action: { href: "?tab=appearance", label: "Configurar aparência" },
    },
    {
      label: "Criar primeiro espaço (canal)",
      description: "Espaços organizam as discussões por tema.",
      done: (community._count?.spaces ?? 0) > 0,
    },
    {
      label: "Adicionar plano de assinatura",
      description: "Defina como os membros vão pagar para entrar.",
      done: (community._count?.subscriptionPlans ?? 0) > 0,
      action: { href: "?tab=plans", label: "Ver planos" },
    },
    {
      label: "Publicar a comunidade",
      description: "Torne sua comunidade visível ao público.",
      done: !!community.isPublished,
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const allDone = completedCount === items.length;

  if (!mounted || dismissed || allDone) return null;

  function handleDismiss() {
    localStorage.setItem(storageKey, "1");
    setDismissed(true);
  }

  const progressPct = Math.round((completedCount / items.length) * 100);

  return (
    <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-gray-900 font-semibold text-sm">Configure sua comunidade</h3>
          <p className="text-gray-400 text-xs mt-0.5">
            {completedCount} de {items.length} etapas concluídas
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-600 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          title="Dispensar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-50 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3">
            {item.done ? (
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-tight ${item.done ? "text-gray-500 line-through" : "text-gray-700"}`}>
                {item.label}
              </p>
              {!item.done && (
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              )}
            </div>
            {!item.done && item.action && (
              <Link
                href={item.action.href}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 flex-shrink-0 transition-colors"
              >
                {item.action.label}
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
