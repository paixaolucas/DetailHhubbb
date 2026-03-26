import { ShieldCheck } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

export function GuaranteeSection() {
  return (
    <section className="bg-[#222222] py-20 border-b border-white/5">
      <div className="container mx-auto px-4">
        <ScrollReveal direction="up">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-[#006079]/10 border border-[#006079]/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-[#009CD9]" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#EEE6E4] mb-4">
              Cancele quando quiser. Sem multa.
            </h2>
            <div className="bg-[#006079]/10 border border-[#006079]/30 rounded-xl p-6 mt-8 text-left">
              <p className="text-gray-300 text-base leading-relaxed">
                Sem fidelidade. Sem contrato. Sem taxa de cancelamento.
              </p>
              <p className="text-gray-300 text-base leading-relaxed mt-3">
                Cancela &rarr; para de ser cobrado &rarr; mantém acesso até o fim do período pago.
              </p>
              <p className="text-gray-400 text-sm mt-4">
                Sem surpresas, sem complicação.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
