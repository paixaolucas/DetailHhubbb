import Link from "next/link";
import { ArrowRight, AlertTriangle, Zap, TrendingUp, CheckCircle, Star } from "lucide-react";
import { GainsSimulator } from "./GainsSimulator";
import { ContactForm } from "./ContactForm";

export const metadata = {
  title: "Para Criadores — Detailer'HUB",
  description:
    "Monetize sua audiência automotiva com 35% de comissão direta e 15% de caixa de performance. Conheça o modelo de parceria do Detailer'HUB.",
};

// ── Subcomponents ──────────────────────────────────────────────────────────────

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#009CD9] text-xs font-bold tracking-[2.5px] uppercase mb-3">
      {children}
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ParaCriadoresPage() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] pt-24 pb-32">
        {/* Background grid */}
        <div className="absolute inset-0 grid-pattern opacity-40" />

        {/* Glow orbs */}
        <div className="pointer-events-none absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full bg-[#006079]/20 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-64 h-64 bg-[#009CD9]/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 text-center relative">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-[#006079]/10 border border-[#007A99]/30 rounded-full px-4 py-1.5 text-xs font-bold tracking-[2.5px] uppercase text-[#009CD9] mb-8">
            Para Criadores
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight max-w-5xl mx-auto">
            <span className="text-[#EEE6E4]">Seu conteúdo é sua vitrine.</span>
            <br />
            <span className="bg-gradient-to-r from-[#009CD9] via-[#007A99] to-[#006079] bg-clip-text text-transparent">
              O Detailer&apos;HUB é a sua casa.
            </span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Uma assinatura única dá acesso a todas as comunidades — e cada membro que você trouxer
            gera renda recorrente para você.
          </p>

          {/* CTA */}
          <a
            href="#contato"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-[#006079]/30 active:scale-95"
          >
            Quero saber mais <ArrowRight className="w-5 h-5" />
          </a>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 mt-16">
            {[
              { value: "35%", label: "de comissão direta" },
              { value: "+15%", label: "caixa de performance" },
              { value: "Vitalício", label: "por membro" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-[#009CD9]">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEMA ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <SectionEyebrow>O problema</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold text-[#EEE6E4]">
              Sua renda depende de terceiros.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: AlertTriangle,
                title: "Algoritmo não é seu",
                desc: "O alcance que você construiu pode mudar amanhã — uma atualização de plataforma e tudo muda.",
              },
              {
                icon: AlertTriangle,
                title: "Parceiro cancela",
                desc: "Um contrato termina e parte da receita vai junto. Você começa do zero a cada ciclo.",
              },
              {
                icon: AlertTriangle,
                title: "Audiência alugada",
                desc: "Seus seguidores não são seus fora das plataformas. Se a rede cair, você perde o contato.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="glass-card p-6 border-l-2 border-l-[#007A99]/50"
              >
                <card.icon className="w-6 h-6 text-[#007A99] mb-4" />
                <h3 className="font-semibold text-[#EEE6E4] mb-2">{card.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── A VIRADA ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#111111]">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="relative rounded-2xl border border-[#009CD9]/30 bg-[#006079]/10 p-10 md:p-14">
            {/* Glow */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#009CD9]/5 to-transparent" />
            <p className="text-2xl md:text-3xl font-bold text-[#EEE6E4] leading-snug relative">
              E se a sua audiência pagasse{" "}
              <span className="text-[#009CD9]">diretamente pra você</span>, todo mês,
              de forma previsível?
            </p>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <SectionEyebrow>Como funciona</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold text-[#EEE6E4]">
              Simples. Em 3 passos.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Você convida",
                desc: "Seu link único de convite. Seu fã clica, assina e entra como seu membro — vinculado a você para sempre.",
              },
              {
                step: "02",
                title: "Ele assina",
                desc: "Uma assinatura dá acesso a todas as comunidades. Conteúdo exclusivo, profundo, permanente.",
              },
              {
                step: "03",
                title: "Você recebe",
                desc: "35% de cada mensalidade do membro que você trouxe. Todo mês que ele renovar, você recebe.",
              },
            ].map((item) => (
              <div key={item.step} className="glass-card p-6 md:p-8 text-center">
                <div className="text-5xl font-bold text-[#006079]/40 mb-4 font-mono">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-[#EEE6E4] mb-3">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REMUNERAÇÃO ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#111111]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <SectionEyebrow>Remuneração</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold text-[#EEE6E4]">
              Duas fontes. Todo mês.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Card 1 */}
            <div className="glass-card p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-[#006079]/20 border border-[#007A99]/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#009CD9]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#009CD9]">35%</p>
                  <p className="text-sm font-semibold text-[#EEE6E4]">Comissão direta — seus membros</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                De cada mensalidade paga pelo membro que você trouxe. Permanente enquanto ele estiver ativo.
                Não depende de você produzir mais — é o resultado de quem você já trouxe.
              </p>
              <div className="bg-[#006079]/10 border border-[#007A99]/20 rounded-xl p-4">
                <p className="text-xs text-[#009CD9] font-semibold mb-1">Exemplo</p>
                <p className="text-sm text-gray-300">
                  300 membros seus × mensalidade × 35% = muito dinheiro
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-card p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-[#006079]/20 border border-[#007A99]/30 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-[#009CD9]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#009CD9]">+15%</p>
                  <p className="text-sm font-semibold text-[#EEE6E4]">Caixa de performance — bônus mensal</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                15% de toda a receita da plataforma vai para um pool distribuído mensalmente entre todos —
                proporcional ao engajamento, conteúdo e retenção que cada criador gerou.
              </p>
              <div className="bg-[#006079]/10 border border-[#007A99]/20 rounded-xl p-4">
                <p className="text-xs text-[#009CD9] font-semibold mb-1">Exemplo</p>
                <p className="text-sm text-gray-300">
                  Pool de R$8.000, você gerou 22% do engajamento → +R$1.760 extras
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SIMULADOR ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#1A1A1A]">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <SectionEyebrow>Simulador</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold text-[#EEE6E4]">
              Quanto você pode ganhar?
            </h2>
          </div>
          <GainsSimulator />
        </div>
      </section>

      {/* ── O QUE PEDIMOS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#111111]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <SectionEyebrow>Contrapartida</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold text-[#EEE6E4]">
              Pouco. Direto. Justo.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {[
              {
                title: "Trilhas de conteúdo técnico",
                desc: "Módulos organizados e de profundidade — o conteúdo que sua audiência quer pagar para acessar.",
              },
              {
                title: "Live ou Q&A mensal",
                desc: "1× por mês, mínimo 60 minutos. Presença, não perfeição.",
              },
              {
                title: "Presença ativa",
                desc: "Responder membros, abrir discussões, estar no espaço. Você não precisa criar todo dia — só aparecer.",
              },
              {
                title: "Link permanente nas redes",
                desc: "Seu link de convite fixado no perfil das redes ativas. Trabalha por você enquanto você dorme.",
              },
            ].map((item) => (
              <div key={item.title} className="glass-card p-5 flex gap-4">
                <CheckCircle className="w-5 h-5 text-[#009CD9] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[#EEE6E4] mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POR QUE ENTRAR AGORA ──────────────────────────────────────────── */}
      <section className="py-24 bg-[#1A1A1A]">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <SectionEyebrow>Urgência</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold text-[#EEE6E4]">
              Quem entra primeiro ganha mais.
            </h2>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-6 flex gap-4">
              <Zap className="w-5 h-5 text-[#009CD9] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#EEE6E4] mb-1">Meta coletiva</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Se chegarmos à meta juntos até final de 2026, celebramos juntos. Os que ajudaram a
                  construir a base têm vantagem permanente sobre os que entram depois.
                </p>
              </div>
            </div>
            <div className="glass-card p-6 flex gap-4">
              <TrendingUp className="w-5 h-5 text-[#009CD9] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#EEE6E4] mb-1">Receita composta desde o dia 1</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Quem entra agora e traz 100 membros recebe comissão desses membros para sempre.
                  Cada mês que passa é mais receita acumulada que quem entra depois nunca vai ter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA + FORMULÁRIO ──────────────────────────────────────────────── */}
      <section id="contato" className="py-24 bg-[#111111]">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-12">
            <SectionEyebrow>Contato</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold text-[#EEE6E4] mb-4">
              Quero fazer parte
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Preencha abaixo e entraremos em contato para conversar sobre os próximos passos.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* ── BACK TO LANDING ───────────────────────────────────────────────── */}
      <div className="bg-[#1A1A1A] py-6 border-t border-white/10">
        <div className="container mx-auto px-4 flex justify-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Voltar para a página principal
          </Link>
        </div>
      </div>
    </>
  );
}
