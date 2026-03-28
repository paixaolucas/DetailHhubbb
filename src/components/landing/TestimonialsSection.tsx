import { Star, BadgeCheck } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

const testimonials = [
  {
    name: "Lucas Ferreira",
    handle: "@lucas.detailing.sp",
    city: "São Paulo, SP",
    tag: "Ceramic: R$450 → R$1.800",
    text: "Eu sabia executar. Não sabia cobrar. A planilha de precificação me mostrou que estava com lucro negativo em metade dos meus serviços. Corrigi isso em uma tarde.",
    stars: 5,
    avatarColor: "from-[#006079] to-[#009CD9]",
    initials: "LF",
    time: "3 meses de membro",
  },
  {
    name: "Rodrigo Alves",
    handle: "@rd_detailing_rj",
    city: "Rio de Janeiro, RJ",
    tag: "Primeiro Porsche — indicação da comunidade",
    text: "Entrei pela comunidade do Corujão. Em dois meses tinha portfólio profissional. O cliente de alto padrão veio por indicação feita dentro da plataforma — isso não acontece no WhatsApp.",
    stars: 5,
    avatarColor: "from-[#006079] to-[#009CD9]",
    initials: "RA",
    time: "5 meses de membro",
  },
  {
    name: "Marina Costa",
    handle: "@marinaauto_bh",
    city: "Belo Horizonte, MG",
    tag: "Taxa de conversão dobrou sem baixar preço",
    text: "Os scripts de WhatsApp mudaram meu atendimento. Parei de dar desconto e comecei a explicar o valor. Fechei mais clientes no mês seguinte cobrando mais caro.",
    stars: 5,
    avatarColor: "from-orange-600 to-amber-500",
    initials: "MC",
    time: "2 meses de membro",
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-[#222222] py-24">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#EEE6E4] mb-4">
            Resultados reais de quem entrou
          </h2>
          <p className="text-gray-400 text-lg">Detailers que sabiam executar e aprenderam a cobrar.</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map(({ name, handle, city, tag, text, stars, avatarColor, initials, time }, i) => (
            <ScrollReveal key={handle} delay={i * 100} direction="up">
            <div className="glass-card p-7 flex flex-col gap-4 h-full">
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Tag de resultado */}
              <div className="self-start flex items-center max-w-full bg-[#006079]/10 border border-[#006079]/20 rounded-full px-3 py-1 text-xs text-[#009CD9] font-semibold">
                <span className="truncate">{tag}</span>
              </div>

              {/* Texto */}
              <p className="text-gray-400 text-sm leading-relaxed flex-1">&quot;{text}&quot;</p>

              {/* Autor */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[#EEE6E4] font-semibold text-sm">{name}</p>
                    <BadgeCheck className="w-4 h-4 text-[#009CD9] flex-shrink-0" />
                  </div>
                  <p className="text-gray-500 text-xs">{handle} · {city}</p>
                  <p className="text-gray-600 text-xs">{time}</p>
                </div>
              </div>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
