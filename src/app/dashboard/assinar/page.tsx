"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Zap, Car, BookOpen, Video, ShoppingBag, Bot, Trophy } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { STORAGE_KEYS } from "@/lib/constants";

const FEATURES = [
  "Acesso a todas as comunidades automotivas da plataforma",
  "Conteúdo em módulos: cursos, aulas e tutoriais",
  "Lives & streaming com todos os influencers",
  "Marketplace com produtos e ferramentas exclusivas",
  "Auto AI — assistente mecânico com IA",
  "Leaderboard e sistema de badges",
  "Suporte prioritário",
  "Cancele quando quiser",
];

export default function AssinarPage() {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "canceled") {
      toast.error("Pagamento cancelado. Tente novamente quando quiser.");
    }
  }, [searchParams, toast]);

  useEffect(() => {
    // Fetch active platform plan
    fetch("/api/platform/plan")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPlan(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleCheckout() {
    if (!plan) return;
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) { router.push("/login"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/stripe/platform-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platformPlanId: plan.id }),
      });
      const data = await res.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        toast.error(data.error ?? "Erro ao iniciar pagamento.");
        setSubmitting(false);
      }
    } catch {
      toast.error("Erro ao conectar com o servidor.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-[#007A99]/10 border border-[#007A99]/30 rounded-full px-4 py-1.5 text-sm text-[#006079] mb-4">
          <Car className="w-4 h-4" />
          Assinatura Única
        </div>
        <h1 className="text-3xl font-bold text-[#EEE6E4] mb-3">Detailer'HUB</h1>
        <p className="text-gray-400">Acesso completo à plataforma. Sem limites.</p>
      </div>

      {loading ? (
        <div className="glass-card p-8 animate-pulse space-y-4">
          <div className="h-12 bg-white/10 rounded w-40 mx-auto" />
          <div className="h-4 bg-white/10 rounded w-64 mx-auto" />
          <div className="space-y-3 mt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 border-[#007A99]/30">
          {/* Price */}
          <div className="text-center mb-8">
            <div className="flex items-end justify-center gap-1 mb-2">
              <span className="text-gray-400 text-lg">R$</span>
              <span className="text-5xl font-bold text-[#EEE6E4]">
                {plan ? Number(plan.price).toLocaleString("pt-BR") : "837"}
              </span>
              <span className="text-gray-400 text-lg mb-1">/ano</span>
            </div>
            <p className="text-gray-500 text-sm">
              {plan?.name ?? "Detailer'HUB Anual"} — R$69,75/mês
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={handleCheckout}
            disabled={submitting || !plan}
            className="btn-premium w-full text-center justify-center flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {submitting ? "Redirecionando..." : "Assinar agora — R$837/ano"}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Pagamento seguro via Stripe. Cancele quando quiser.
          </p>
        </div>
      )}
    </div>
  );
}
