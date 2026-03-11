"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Crown,
  CheckCircle,
  XCircle,
  Zap,
  BookOpen,
  Headphones,
  Star,
  Shield,
  Gift,
  ChevronRight,
  Lock,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

interface MembershipData {
  hasMembership: boolean;
  membership: {
    id: string;
    status: string;
    tier: "STANDARD" | "PREMIUM";
    currentPeriodEnd: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Feature comparison data
// ---------------------------------------------------------------------------
const FEATURES = [
  { label: "Acesso a todas as comunidades", standard: true, premium: true },
  { label: "Feed e fórum das comunidades", standard: true, premium: true },
  { label: "Lives e eventos gratuitos", standard: true, premium: true },
  { label: "Conteúdo padrão em módulos", standard: true, premium: true },
  { label: "Certificados de conclusão", standard: true, premium: true },
  { label: "Conteúdo exclusivo Premium", standard: false, premium: true },
  { label: "Workshops avançados de detailing", standard: false, premium: true },
  { label: "Acesso antecipado a novos conteúdos", standard: false, premium: true },
  { label: "Suporte prioritário (chat dedicado)", standard: false, premium: true },
  { label: "Sessões Q&A exclusivas com influencers", standard: false, premium: true },
  { label: "Descontos em eventos pagos (20%)", standard: false, premium: true },
  { label: "Badge exclusivo Premium no perfil", standard: false, premium: true },
];

const PREMIUM_BENEFITS = [
  {
    icon: BookOpen,
    title: "Conteúdo Exclusivo",
    desc: "Módulos e aulas marcadas como Premium, incluindo técnicas avançadas de polimento, correção de pintura e detalhamento de alto nível.",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Headphones,
    title: "Suporte Prioritário",
    desc: "Canal de suporte dedicado com resposta em até 2h durante dias úteis. Fale diretamente com nossa equipe.",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: Star,
    title: "Acesso Antecipado",
    desc: "Seja o primeiro a acessar novos conteúdos, cursos e funcionalidades da plataforma antes do lançamento público.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  {
    icon: Gift,
    title: "Descontos e Eventos",
    desc: "20% de desconto em todos os eventos pagos da plataforma. Convites para encontros e workshops presenciais exclusivos.",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AssinarPremiumPage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast.success("Upgrade para Premium realizado com sucesso!");
    } else if (payment === "canceled") {
      toast.info("Upgrade cancelado.");
    }
  }, [searchParams, toast]);

  useEffect(() => {
    fetch("/api/platform-membership/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setMembership(d.data); })
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/premium-upgrade", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      window.location.href = data.data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao iniciar upgrade");
      setUpgrading(false);
    }
  }

  const isPremium = membership?.membership?.tier === "PREMIUM";
  const hasStandard = membership?.hasMembership === true;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-10 bg-white/5 rounded animate-pulse w-64" />
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 mb-4">
          <Crown size={16} className="text-yellow-400" />
          <span className="text-yellow-300 text-sm font-medium">DetailHub Premium</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Eleve sua experiência ao próximo nível
        </h1>
        <p className="text-gray-400">
          Desbloqueie conteúdo exclusivo, suporte prioritário e muito mais
        </p>
      </div>

      {/* Already premium */}
      {isPremium && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5">
          <Crown size={24} className="text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-yellow-300 font-semibold">Você já é Premium!</p>
            <p className="text-yellow-300/70 text-sm mt-0.5">
              Continue aproveitando todos os benefícios exclusivos da plataforma.
            </p>
          </div>
        </div>
      )}

      {/* Plan comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Standard */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">Standard</p>
            <p className="text-3xl font-bold text-white mt-1">
              R$ 600<span className="text-gray-400 text-base font-normal">/ano</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">Sua assinatura atual</p>
          </div>
          <div className="space-y-2">
            {FEATURES.filter((f) => f.standard).map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                {f.label}
              </div>
            ))}
            {FEATURES.filter((f) => !f.standard).map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-sm text-gray-600">
                <XCircle size={14} className="text-gray-600 flex-shrink-0" />
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Premium */}
        <div className="relative glass-card p-6 space-y-4 border-yellow-500/30 bg-yellow-500/5">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              RECOMENDADO
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-yellow-400" />
              <p className="text-yellow-300 text-sm font-medium uppercase tracking-wide">Premium</p>
            </div>
            <p className="text-3xl font-bold text-white mt-1">
              R$ 1.200<span className="text-gray-400 text-base font-normal">/ano</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">
              + R$ 600/ano sobre o plano Standard
            </p>
          </div>
          <div className="space-y-2">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle size={14} className={f.premium ? "text-yellow-400 flex-shrink-0" : "text-green-400 flex-shrink-0"} />
                <span className={!f.standard && f.premium ? "text-yellow-200 font-medium" : ""}>
                  {f.label}
                </span>
                {!f.standard && f.premium && (
                  <Crown size={11} className="text-yellow-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
          {!isPremium && (
            <button
              onClick={handleUpgrade}
              disabled={upgrading || !hasStandard}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {upgrading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  <Crown size={18} />
                  {hasStandard ? "Fazer Upgrade Agora" : "Assine o plano Standard primeiro"}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          )}
          {!hasStandard && (
            <a
              href="/dashboard/assinar"
              className="block text-center text-xs text-blue-400 hover:text-blue-300 mt-2"
            >
              Ver plano Standard →
            </a>
          )}
        </div>
      </div>

      {/* Benefits detail */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap size={18} className="text-yellow-400" />
          O que você ganha com o Premium
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {PREMIUM_BENEFITS.map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className={`glass-card p-4 border ${bg}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={color} />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium content lock example */}
      <div className="glass-card p-5 border border-yellow-500/20">
        <div className="flex items-start gap-3">
          <Lock size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white text-sm font-semibold">Como funciona o conteúdo Premium?</p>
            <p className="text-gray-400 text-sm mt-1">
              Conteúdos marcados com o ícone <Crown size={12} className="inline text-yellow-400" /> só são
              acessíveis para assinantes Premium. No seu painel de aprendizado você verá esses módulos bloqueados
              com um cadeado — ao fazer o upgrade, eles serão liberados automaticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 text-gray-500 text-xs justify-center">
        <Shield size={14} />
        Pagamento processado com segurança pelo Stripe. Cancele quando quiser.
      </div>
    </div>
  );
}
