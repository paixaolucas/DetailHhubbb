import { CheckCircle } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

const painPoints = [
  "Faz o mesmo serviço que outra estética cobra R$2.500, mas você cobra R$350.",
  "Sabe que o trabalho é bom, mas não consegue provar isso para o cliente certo.",
  "Clientes tratam o seu trabalho como 'lavagem cara' e você não sabe como reverter isso.",
  "Aprende sozinho, via YouTube, WhatsApp, tentativa e erro, sem ninguém para te ajudar a crescer mais.",
  "Sente que fica para trás porque curso presencial custa caro e dura pouco tempo.",
  "Não consegue calcular o custo real por hora, então precifica no chute e às vezes trabalha no prejuízo.",
];

export function PainSection() {
  return (
    <section className="bg-[#1A1A1A] py-20 border-b border-white/5">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-12">
          <p className="text-[#009CD9] text-xs font-bold tracking-[2.5px] uppercase mb-4">
            VOCÊ SE RECONHECE?
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#EEE6E4] mb-4 max-w-2xl mx-auto">
            Se algum desses é você, o Detailer&apos;HUB foi feito para você.
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Não como crítica, como reconhecimento. Esses não são problemas de quem faz mal feito.
            São problemas de quem faz bem e ainda não aprendeu a cobrar por isso.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12">
          {painPoints.map((point, i) => (
            <ScrollReveal key={i} delay={i * 80} direction="up">
              <div className="glass-card p-5 flex items-start gap-3 h-full">
                <CheckCircle className="w-5 h-5 text-[#009CD9] flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm leading-relaxed">{point}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal direction="up" delay={100}>
          <div className="max-w-3xl mx-auto bg-[#006079]/10 border border-[#006079]/30 rounded-xl p-8">
            <p className="text-gray-300 text-base leading-relaxed mb-6">
              Um ceramic coating aplicado por você custa o mesmo tempo e produto que de outra estética
              automotiva. A diferença de R$600 para R$2.500 não está na técnica. Está em como o serviço
              é apresentado, documentado e cobrado.
            </p>
            <p className="text-gray-300 text-base leading-relaxed mb-8">
              Grupos de WhatsApp têm dicas. Não têm método. Curso presencial pontual de R$3.000 atualiza
              a técnica por três dias. Não te acompanha nos meses seguintes.
            </p>
            <div className="border-t border-white/10 pt-6">
              <p className="text-gray-400 text-sm mb-2">Diagnóstico real</p>
              <p className="text-[#EEE6E4] text-lg leading-relaxed">
                A grande maioria dos detailers no Brasil sabem executar serviços de alto valor mas cobram
                como iniciantes, e estão deixando{" "}
                <strong className="text-[#009CD9]">R$75.600/ano na mesa</strong>, cada um.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
