import { CheckCircle } from "lucide-react";

const pillars = [
  {
    number: "01",
    title: "Domínio Técnico",
    items: [
      "Nunca mais erre na Lavagem Detalhada",
      "Polimento técnico perfeito",
      "Todos os tipos de proteção",
      "Vidros, faróis e outros serviços que fazem parte de uma estética",
      "Com os maiores nomes da estética automotiva no Brasil",
    ],
  },
  {
    number: "02",
    title: "Precificação Estratégica",
    items: [
      "Precificação sem segredos",
      "Planilha de Precificação Dinâmica com calculadora integrada",
      "Mapeamento de preços das principais regiões",
      "Como calcular lucro real por serviço",
    ],
  },
  {
    number: "03",
    title: "Comunicação e Atração de Clientes",
    items: [
      "Scripts de WhatsApp, Instagram e abordagem presencial",
      "Principais respostas para as objeções mais comuns",
      "Templates de portfólio profissional",
      "Fotografando resultado com celular: luz, ângulo, edição",
    ],
  },
  {
    number: "04",
    title: "Comunidade e Feedback",
    items: [
      "Participe das comunidades das referências do mercado",
      "Agenda mensal de encontros ao vivo",
      "Aprenda com outros profissionais de verdade",
      "Evolua junto",
    ],
  },
];

const deliverables = [
  { label: "Módulos técnicos com influenciadores", value: "R$1.200–3.000" },
  { label: "Precificação Estratégica", value: "R$297" },
  { label: "Planilha de Precificação Dinâmica", value: "R$197" },
  { label: "Mapeamento de Preços por Região", value: "R$97" },
  { label: "Módulo Comunicação e Atração de Clientes", value: "R$197" },
  { label: "Comunidade dos Especialistas", value: "incluso" },
  { label: "Agenda de lives mensais", value: "incluso" },
];

export function PillarsSection() {
  return (
    <section className="bg-[#222222] py-20 border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14 animate-fade-in">
          <p className="text-[#009CD9] text-xs font-bold tracking-[2.5px] uppercase mb-4">
            O MECANISMO
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#EEE6E4] mb-4 max-w-2xl mx-auto">
            Quatro pilares. Um resultado.
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            O Detailer&apos;HUB não é um curso. É uma plataforma de membros com conteúdo contínuo,
            ferramentas práticas e comunidade ativa: tudo construído para que você e o seu negócio
            cresçam.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.number}
              className="bg-[#1F2937] border border-white/10 rounded-xl p-6 h-full animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[#009CD9] text-xs font-bold tracking-[2px]">
                  PILAR {pillar.number}
                </span>
              </div>
              <h3 className="text-[#EEE6E4] text-xl font-bold mb-4">{pillar.title}</h3>
              <ul className="space-y-2.5">
                {pillar.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#009CD9] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto glass-card overflow-hidden animate-slide-up" style={{ animationDelay: "150ms" }}>
          <div className="p-6 border-b border-white/10">
            <h3 className="text-[#EEE6E4] font-bold text-lg">
              O que está incluído — e quanto custaria separado
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {deliverables.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-colors"
              >
                <span className="text-gray-300 text-sm">{item.label}</span>
                <span
                  className={`text-sm font-semibold ${
                    item.value === "incluso" ? "text-[#009CD9]" : "text-gray-400 line-through"
                  }`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-6 py-5 bg-[#006079]/10 border-t border-[#006079]/30">
            <span className="text-[#EEE6E4] font-bold">Valor total se comprasse separado</span>
            <span className="text-[#EEE6E4] font-bold text-lg">R$3.000+</span>
          </div>
        </div>
      </div>
    </section>
  );
}
