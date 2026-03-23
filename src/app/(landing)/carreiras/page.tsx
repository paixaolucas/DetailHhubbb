export const metadata = { title: "Carreiras — Detailer'HUB" };

export default function CarreirasPage() {
  return (
    <div className="text-[#EEE6E4]">
      {/* Hero */}
      <div className="bg-[#006079]/10 border-b border-white/10 py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Trabalhe conosco</h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Junte-se ao time que está construindo a maior plataforma automotiva do Brasil.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-12">
        {/* Por que trabalhar aqui */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Por que o Detailer&apos;HUB?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { emoji: "🚀", label: "Startup em crescimento", desc: "Faça parte de algo que está escalando rapidamente." },
              { emoji: "🏠", label: "Remoto first", desc: "Trabalhe de onde você quiser, com autonomia e confiança." },
              { emoji: "🚗", label: "Paixão em comum", desc: "Todo o time é apaixonado por carros e comunidades." },
            ].map(({ emoji, label, desc }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <span className="text-3xl">{emoji}</span>
                <p className="font-semibold mt-3 mb-1 text-sm text-[#EEE6E4]">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sem vagas */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Vagas abertas</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold text-[#EEE6E4] mb-2">Nenhuma vaga aberta no momento</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Não temos posições disponíveis agora, mas adoramos conhecer pessoas talentosas. Mande seu currículo e entraremos em contato quando surgir uma oportunidade.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Envie seu currículo</h3>
          <p className="text-gray-400 text-sm mb-5">
            Ficamos com seu contato e avisamos quando surgir uma vaga que combine com você.
          </p>
          <a
            href="mailto:carreiras@detailhub.com.br"
            className="inline-block bg-[#006079] hover:bg-[#007A99] text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Enviar currículo
          </a>
        </section>
      </div>
    </div>
  );
}
