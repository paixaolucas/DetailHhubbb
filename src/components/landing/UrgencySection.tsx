import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

export function UrgencySection() {
  return (
    <section className="bg-[#1A1A1A] py-20 border-b border-white/5">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-10">
          <p className="text-[#009CD9] text-xs font-bold tracking-[2.5px] uppercase mb-4">
            AGIR AGORA
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#EEE6E4] mb-4 max-w-2xl mx-auto">
            500 vagas. Preço de fundador. Janela aberta.
          </h2>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={80}>
          <div className="max-w-2xl mx-auto bg-[#006079]/10 border border-[#006079]/30 rounded-xl p-8 mb-10">
            <div className="flex items-start gap-3 mb-5">
              <span className="text-xl" aria-hidden="true">⏳</span>
              <div>
                <p className="text-[#EEE6E4] font-semibold mb-1">
                  Preço de fundador: R$79/mês para as primeiras 500 vagas
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Na vaga 501, o preço sobe para R$97/mês. Quem entrar agora trava R$79/mês enquanto
                  mantiver a assinatura ativa, mesmo quando o preço mudar para novos membros.
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-5">
              <p className="text-gray-400 text-xs font-bold tracking-wider uppercase mb-2">
                Custo de esperar
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                10 serviços/mês a R$300 quando deveria cobrar R$700 ={" "}
                <strong className="text-[#EEE6E4]">R$4.000/mês perdidos</strong>. 3 meses esperando ={" "}
                <strong className="text-[#EEE6E4]">R$12.000 em receita que nunca vai ser cobrada</strong>.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={150} className="text-center">
          <Link
            href="/register"
            className="btn-premium inline-flex items-center gap-3 px-10 py-5 text-lg font-bold rounded-xl"
          >
            Quero entrar por R$79/mês <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            Acesso imediato · Sem fidelidade · Cancele quando quiser
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
