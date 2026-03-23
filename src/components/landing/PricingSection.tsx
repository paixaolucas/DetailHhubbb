import Link from "next/link";
import { ArrowRight, Car, CheckCircle } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const pricingFeatures = [
  "Acesso a todas as comunidades automotivas",
  "Conteúdo em módulos com progresso rastreável",
  "Lives & streaming com todos os criadores",
  "Marketplace completo",
  "Auto AI — assistente mecânico",
  "Leaderboard e badges",
  "Cancele quando quiser",
];

export function PricingSection() {
  return (
    <section id="preco" className="bg-[#1A1A1A] py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#EEE6E4] mb-4">Um plano. Acesso a tudo.</h2>
          <p className="text-gray-400 text-lg">Sem tiers confusos. Sem surpresas.</p>
        </div>

        <ScrollReveal className="max-w-md mx-auto">
          <div className="glass-card p-8 border-[#006079]/30 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#006079]/5 to-transparent pointer-events-none" />

            <div className="relative">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-[#006079]/10 border border-[#006079]/20 rounded-full px-3 py-1 text-xs text-[#009CD9] mb-4">
                  <Car className="w-3 h-3" />
                  Detailer&apos;HUB — Acesso Completo
                </div>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-gray-400 text-xl">R$</span>
                  <span className="text-6xl font-bold text-[#EEE6E4]">79</span>
                  <span className="text-gray-400 text-xl mb-2">/mês</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">ou R$948/ano — cancele quando quiser</p>
              </div>

              <ul className="space-y-3 mb-8">
                {pricingFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="btn-premium w-full flex items-center justify-center gap-2"
              >
                Começar agora <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-xs text-gray-400 mt-4">
                Pagamento seguro via Stripe. Cancele quando quiser.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
