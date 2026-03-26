import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";

export function CTASection() {
  return (
    <section className="bg-[#1A1A1A] py-24">
      <div className="container mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#006079] via-[#007A99] to-[#009CD9] animate-gradient-x" />
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative p-6 sm:p-12 md:p-20 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm text-white mb-6">
              <TrendingUp className="w-4 h-4" />
              Para detailers que fazem bem feito
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 max-w-2xl mx-auto">
              Você já sabe executar. Aprenda a cobrar o que merece.
            </h2>

            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
              Junte-se a detailers de todo o Brasil que pararam de deixar dinheiro na mesa.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="flex items-center gap-2 bg-white text-[#006079] hover:bg-white/90 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:shadow-xl active:scale-95 w-full sm:w-auto justify-center"
              >
                Começar agora <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <p className="text-white/60 text-sm mt-6">
              Pagamento seguro via Asaas. Sem cartão para testar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
