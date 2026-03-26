import Link from "next/link";
import { ArrowRight, CheckCircle, Star } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

const pricingFeatures = [
  "Acesso a todos os 4 pilares de crescimento",
  "Módulos técnicos com os maiores influenciadores",
  "Planilha de Precificação Dinâmica",
  "Mapeamento de preços por região",
  "Scripts e templates prontos para usar",
  "Comunidade ativa com feedback real",
  "Lives mensais com especialistas",
  "Cancele quando quiser — sem multa",
];

export function PricingSection() {
  return (
    <section id="preco" className="bg-[#1A1A1A] py-20 border-b border-white/5">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-12">
          <p className="text-[#009CD9] text-xs font-bold tracking-[2.5px] uppercase mb-4">
            INVESTIMENTO
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#EEE6E4] mb-4">
            Um plano. Acesso a tudo.
          </h2>
          <p className="text-gray-400 text-lg">Sem tiers confusos. Sem surpresas.</p>
          <p className="text-gray-500 text-sm mt-2">
            Valor total dos entregáveis separados:{" "}
            <span className="text-gray-400 line-through">R$3.000+</span>
          </p>
        </ScrollReveal>

        <div className="max-w-lg mx-auto">
          <ScrollReveal direction="up">
            <div className="glass-card border-[#006079]/30 relative overflow-hidden">
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#006079]/5 to-transparent pointer-events-none" />

              <div className="relative p-8">
                {/* Badge fundador */}
                <div className="flex items-center justify-between mb-6">
                  <div className="inline-flex items-center gap-2 bg-[#006079]/10 border border-[#006079]/30 rounded-full px-3 py-1 text-xs text-[#009CD9]">
                    <Star className="w-3 h-3 fill-[#009CD9]" />
                    Preço de Fundador — 500 vagas
                  </div>
                </div>

                {/* Preço anterior riscado */}
                <div className="text-center mb-6">
                  <p className="text-gray-500 text-sm line-through mb-1">
                    R$197/mês (preço após período de fundador)
                  </p>

                  {/* Preço principal */}
                  <div className="flex items-end justify-center gap-1 mb-1">
                    <span className="text-gray-400 text-xl">R$</span>
                    <span className="text-6xl font-bold text-[#EEE6E4]">79</span>
                    <span className="text-gray-400 text-xl mb-2">/mês</span>
                  </div>

                  {/* Opção anual */}
                  <div className="inline-flex items-center gap-2 bg-[#006079]/10 border border-[#006079]/20 rounded-lg px-4 py-2 mt-3">
                    <span className="text-gray-400 text-sm">Ou</span>
                    <span className="text-[#EEE6E4] font-bold">R$59/mês</span>
                    <span className="text-gray-400 text-sm">no plano anual — R$708 à vista</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {pricingFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-[#009CD9] flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className="btn-premium w-full flex items-center justify-center gap-2 py-4 text-base font-bold rounded-xl"
                >
                  Começar agora por R$79/mês <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-center text-xs text-gray-500 mt-3">
                  Acesso imediato · Sem fidelidade · Cancele quando quiser
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Box de comparação */}
          <ScrollReveal direction="up" delay={120}>
            <div className="mt-5 bg-[#006079]/10 border border-[#006079]/30 rounded-xl p-5">
              <p className="text-gray-300 text-sm leading-relaxed text-center">
                <strong className="text-[#EEE6E4]">
                  &ldquo;R$79 é o que você cobra a mais em um único serviço
                </strong>{" "}
                depois de aprender a precificar. Um serviço paga 8 meses de assinatura.&rdquo;
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
