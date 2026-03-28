import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";

export function CreatorCalloutSection() {
  return (
    <section className="bg-[#161616] border-t border-white/5 py-16">
      <div className="container mx-auto px-4">
        <div className="glass-card max-w-3xl mx-auto p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Ícone */}
            <div className="rounded-2xl bg-[#006079]/10 border border-[#006079]/30 p-4 flex-shrink-0">
              <TrendingUp className="w-7 h-7 text-[#009CD9]" />
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#009CD9] font-bold tracking-[2px] uppercase mb-2">
                Para criadores de conteúdo
              </p>
              <h3 className="text-xl font-bold text-[#EEE6E4] mb-2">
                Você tem audiência. Nós temos a infraestrutura.
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Traga sua comunidade para o Detailer&apos;HUB e receba{" "}
                <strong className="text-[#EEE6E4]">35% de comissão recorrente</strong> por
                cada membro que você indicar — para sempre, enquanto a assinatura estiver ativa.
              </p>
            </div>

            {/* CTA */}
            <Link
              href="/para-criadores"
              className="inline-flex items-center justify-center gap-2 bg-[#006079]/10 border border-[#006079]/30 hover:bg-[#006079]/20 text-[#009CD9] px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-colors w-full md:w-auto"
            >
              Saber mais <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
