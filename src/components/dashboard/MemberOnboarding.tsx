"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle, ChevronUp, Circle, Rocket } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingState {
  dismissed: boolean;
  completedSteps: number[];
}

interface Step {
  id: number;
  label: string;
  actionLabel: string;
  type: "mark" | "link" | "input";
  href?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "detailhub_onboarding_member_v1";

const STEPS: Step[] = [
  {
    id: 1,
    label: "Assistir Aula 1.1 — Preparação de Superfície",
    actionLabel: "Marcar como feito",
    type: "mark",
    href: "/dashboard/meu-aprendizado",
  },
  {
    id: 2,
    label: "Abrir a Planilha de Precificação",
    actionLabel: "Abrir planilha",
    type: "link",
    href: "#",
  },
  {
    id: 3,
    label: "Calcular custo de 1 serviço",
    actionLabel: "Marcar como feito",
    type: "mark",
  },
  {
    id: 4,
    label: "Assistir Aula 5.1 — Por que você cobra menos",
    actionLabel: "Marcar como feito",
    type: "mark",
    href: "/dashboard/meu-aprendizado",
  },
  {
    id: 5,
    label: "Definir novo preço para o serviço",
    actionLabel: "Confirmar",
    type: "input",
  },
];

const TOTAL_STEPS = STEPS.length;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readState(): OnboardingState {
  if (typeof window === "undefined") return { dismissed: false, completedSteps: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dismissed: false, completedSteps: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "dismissed" in parsed &&
      "completedSteps" in parsed &&
      typeof (parsed as OnboardingState).dismissed === "boolean" &&
      Array.isArray((parsed as OnboardingState).completedSteps)
    ) {
      return parsed as OnboardingState;
    }
    return { dismissed: false, completedSteps: [] };
  } catch {
    return { dismissed: false, completedSteps: [] };
  }
}

function writeState(state: OnboardingState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MemberOnboarding() {
  const [state, setState] = useState<OnboardingState>({ dismissed: false, completedSteps: [] });
  const [mounted, setMounted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [priceValue, setPriceValue] = useState("");
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setState(readState());
    setMounted(true);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
    };
  }, []);

  const completeStep = useCallback(
    (stepId: number) => {
      setState((prev) => {
        if (prev.completedSteps.includes(stepId)) return prev;
        const next: OnboardingState = {
          ...prev,
          completedSteps: [...prev.completedSteps, stepId],
        };
        writeState(next);

        // If all steps done → celebrate
        if (next.completedSteps.length === TOTAL_STEPS) {
          setCelebrating(true);
          celebrationTimer.current = setTimeout(() => {
            const final: OnboardingState = { ...next, dismissed: true };
            writeState(final);
            setState(final);
            setCelebrating(false);
          }, 3000);
        }

        return next;
      });
    },
    []
  );

  const handleLinkStep = useCallback(
    (step: Step) => {
      if (step.href && step.href !== "#") {
        window.open(step.href, "_blank", "noopener,noreferrer");
      } else if (step.href === "#") {
        window.open(step.href, "_blank", "noopener,noreferrer");
      }
      completeStep(step.id);
    },
    [completeStep]
  );

  const handleStep5Confirm = useCallback(() => {
    const trimmed = priceValue.trim();
    if (!trimmed) return;
    completeStep(5);
  }, [priceValue, completeStep]);

  // Don't render until mounted (avoid SSR mismatch)
  if (!mounted) return null;
  if (state.dismissed) return null;

  const { completedSteps } = state;
  const completedCount = completedSteps.length;
  const progressPercent = Math.round((completedCount / TOTAL_STEPS) * 100);

  // ── Celebration state ──
  if (celebrating) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl border-t-2 border-t-[#009CD9] p-5 animate-fade-in">
        <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
          <span className="text-3xl" role="img" aria-label="celebração">
            🎉
          </span>
          <p className="text-[#EEE6E4] font-bold text-base leading-snug">
            Quick win concluído! Você identificou quanto pode ganhar a mais.
          </p>
          <p className="text-gray-400 text-sm">Agora é ir ao cliente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
      {/* Top accent border */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#006079] via-[#007A99] to-[#009CD9]" />

      <div className="p-5">
        {/* Header — sempre visível */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Rocket className="text-[#009CD9] shrink-0" size={16} aria-hidden="true" />
            <h3 className="text-[#EEE6E4] font-bold text-sm leading-tight truncate">
              Jornada 7 dias — Quick Win
            </h3>
          </div>
          <button
            onClick={() => setCollapsed(v => !v)}
            aria-label={collapsed ? "Expandir" : "Minimizar"}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#006079]/20 hover:bg-[#006079]/40 text-[#009CD9] border border-[#006079]/30 transition-all focus:outline-none shrink-0"
          >
            <ChevronUp size={13} className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
            <span>{collapsed ? "Expandir" : "Minimizar"}</span>
          </button>
        </div>
        {!collapsed && (
          <p className="text-gray-400 text-xs mt-2 leading-relaxed">
            Esses 5 passos vão te mostrar quanto você pode ganhar a mais no próximo serviço. Leva menos de 1 hora.
          </p>
        )}

        {/* Conteúdo colapsável */}
        {!collapsed && (
          <div className="space-y-4 mt-4">
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div
                className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={completedCount}
                aria-valuemin={0}
                aria-valuemax={TOTAL_STEPS}
                aria-label={`${completedCount} de ${TOTAL_STEPS} passos concluídos`}
              >
                <div
                  className="h-full bg-gradient-to-r from-[#006079] to-[#009CD9] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-gray-400 text-xs">
                {completedCount} de {TOTAL_STEPS} passos concluídos
              </p>
            </div>

            {/* Steps list */}
            <ul className="space-y-2" role="list">
              {STEPS.map((step) => {
            const isDone = completedSteps.includes(step.id);
            // First non-completed step gets the highlight
            const isNext =
              !isDone &&
              !completedSteps.includes(step.id) &&
              STEPS.filter((s) => s.id < step.id).every((s) =>
                completedSteps.includes(s.id)
              );

            return (
              <li
                key={step.id}
                className={[
                  "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  isNext
                    ? "bg-[#009CD9]/5 border border-[#009CD9]/20"
                    : isDone
                    ? ""
                    : "opacity-60",
                ].join(" ")}
              >
                {/* Icon */}
                <span className="mt-0.5 shrink-0" aria-hidden="true">
                  {isDone ? (
                    <CheckCircle size={16} className="text-emerald-400" />
                  ) : (
                    <Circle size={16} className="text-gray-600" />
                  )}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p
                    className={[
                      "text-sm leading-snug",
                      isDone
                        ? "line-through text-gray-500"
                        : "text-[#EEE6E4]",
                    ].join(" ")}
                  >
                    {step.label}
                  </p>

                  {/* Action — only shown when not done */}
                  {!isDone && (
                    <>
                      {step.type === "mark" && (
                        <button
                          onClick={() => completeStep(step.id)}
                          className="text-xs px-3 py-1 rounded-md bg-white/10 hover:bg-white/15 text-[#EEE6E4] transition-colors focus:outline-none focus:ring-1 focus:ring-[#009CD9]"
                        >
                          {step.actionLabel}
                        </button>
                      )}

                      {step.type === "link" && (
                        <button
                          onClick={() => handleLinkStep(step)}
                          className="text-xs px-3 py-1 rounded-md bg-white/10 hover:bg-white/15 text-[#009CD9] transition-colors focus:outline-none focus:ring-1 focus:ring-[#009CD9]"
                        >
                          {step.actionLabel}
                        </button>
                      )}

                      {step.type === "input" && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-400 text-sm" aria-hidden="true">
                            R$
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="ex: 250"
                            value={priceValue}
                            onChange={(e) => setPriceValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleStep5Confirm();
                            }}
                            aria-label="Novo preço do serviço"
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[#EEE6E4] placeholder-gray-500 text-sm w-24 focus:outline-none focus:border-[#009CD9] transition-colors"
                          />
                          <button
                            onClick={handleStep5Confirm}
                            disabled={!priceValue.trim()}
                            className="btn-premium text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity focus:outline-none focus:ring-1 focus:ring-[#009CD9]"
                          >
                            {step.actionLabel}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
