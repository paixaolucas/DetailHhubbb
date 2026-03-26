import { ScrollReveal } from "@/components/landing/ScrollReveal";

const objections = [
  {
    question: '"R$79 é caro, estou apertado."',
    answer:
      "A pergunta certa é: quanto você está perdendo por mês? 10 serviços a R$300 quando deveria cobrar R$600 = R$3.000/mês perdidos. R$79 contra R$3.000 é um cálculo simples. E se não gostar, cancela quando quiser, sem multa.",
  },
  {
    question: '"Já fiz curso de detailing, não preciso de mais conteúdo."',
    answer:
      "O Detailer'HUB não é curso técnico. É para quem já sabe fazer. O problema que resolvemos não é a execução: é o que acontece antes (precificação) e depois (comunicação com o cliente) do serviço.",
  },
  {
    question: '"Não tenho tempo para consumir mais conteúdo."',
    answer:
      "O módulo de precificação tem 6 aulas e 3 horas de duração. A planilha leva 20 minutos para preencher. 4 horas no primeiro mês é o suficiente para ter resultado mensurável.",
  },
  {
    question: '"Como sei que vai funcionar no meu mercado? Minha cidade é diferente."',
    answer:
      "A Tabela de Referência de Preços cobre SP, RJ, BH, Curitiba, Porto Alegre e Fortaleza. Além disso, a Sessão de Diagnóstico Individual (primeiros 50 membros por ciclo) é exatamente para adaptar o método à sua realidade específica.",
  },
  {
    question: '"Tenho medo de entrar e ficar preso."',
    answer:
      "Sem contrato. Sem fidelidade. Sem multa de cancelamento. Cancele quando quiser, em menos de dois cliques. Não existe risco de 'ficar preso'.",
  },
  {
    question: '"YouTube e redes sociais ensinam tudo de graça."',
    answer:
      "YouTube ensina polimento. Não ensina como cobrar R$2.500 por ele. O conteúdo gratuito cobre técnica. O que o Detailer'HUB entrega (método de precificação, planilha, comunidade com feedback real, templates prontos) não existe no YouTube.",
  },
];

export function ObjectionsSection() {
  return (
    <section className="bg-[#1A1A1A] py-20 border-b border-white/5">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-14">
          <p className="text-[#009CD9] text-xs font-bold tracking-[2.5px] uppercase mb-4">
            PERGUNTAS FREQUENTES
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#EEE6E4] mb-4">
            Já antecipamos o que você está pensando.
          </h2>
          <p className="text-gray-400 text-lg">Respostas diretas para as dúvidas mais comuns.</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {objections.map((item, i) => (
            <ScrollReveal key={i} delay={i * 80} direction="up">
              <div className="glass-card p-6 h-full">
                <p className="text-[#009CD9] font-semibold text-sm mb-3 leading-snug">
                  {item.question}
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">{item.answer}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
