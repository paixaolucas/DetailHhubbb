"use client";

export default function ContatoPage() {
  return (
    <div className="text-[#EEE6E4]">
      {/* Hero */}
      <div className="bg-[#006079]/10 border-b border-white/10 py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Entre em contato</h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Tem dúvidas, sugestões ou quer fechar uma parceria? Adoramos conversar.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-5">Envie uma mensagem</h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 focus:border-[#009CD9] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 focus:border-[#009CD9] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Assunto</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 focus:border-[#009CD9] transition-all">
                  <option value="">Selecione um assunto</option>
                  <option value="suporte">Suporte técnico</option>
                  <option value="parceria">Parceria</option>
                  <option value="imprensa">Imprensa</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Mensagem</label>
                <textarea
                  rows={4}
                  placeholder="Escreva sua mensagem..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 focus:border-[#009CD9] transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#006079] hover:bg-[#007A99] text-white py-3 rounded-xl font-semibold transition-all"
              >
                Enviar mensagem
              </button>
            </form>
          </div>

          {/* Informações */}
          <div className="space-y-4">
            {[
              { emoji: "📧", label: "E-mail geral", value: "contato@detailhub.com.br" },
              { emoji: "🤝", label: "Parcerias", value: "parcerias@detailhub.com.br" },
              { emoji: "📰", label: "Imprensa", value: "imprensa@detailhub.com.br" },
              { emoji: "🛠️", label: "Suporte", value: "suporte@detailhub.com.br" },
            ].map(({ emoji, label, value }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                <span className="text-2xl">{emoji}</span>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-medium text-[#EEE6E4]">{value}</p>
                </div>
              </div>
            ))}
            <div className="bg-[#007A99]/5 border border-[#007A99]/20 rounded-2xl p-5">
              <p className="text-sm text-gray-400 leading-relaxed">
                Respondemos todos os e-mails em até <strong className="text-[#EEE6E4]">2 dias úteis</strong>. Para suporte urgente, acesse o chat dentro da plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
