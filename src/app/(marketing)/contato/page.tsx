"use client";

export default function ContatoPage() {
  return (
    <div className="text-gray-900">
      {/* Hero */}
      <div className="bg-[#F0EEFF] border-b border-gray-200 py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Entre em contato</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Tem dúvidas, sugestões ou quer fechar uma parceria? Adoramos conversar.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-5">Envie uma mensagem</h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 focus:border-[#009CD9] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 focus:border-[#009CD9] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 focus:border-[#009CD9] transition-all bg-white">
                  <option value="">Selecione um assunto</option>
                  <option value="suporte">Suporte técnico</option>
                  <option value="parceria">Parceria</option>
                  <option value="imprensa">Imprensa</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                <textarea
                  rows={4}
                  placeholder="Escreva sua mensagem..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 focus:border-[#009CD9] transition-all resize-none"
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
              <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
                <span className="text-2xl">{emoji}</span>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-medium text-gray-900">{value}</p>
                </div>
              </div>
            ))}
            <div className="bg-[#007A99]/5 border border-[#99D3DF] rounded-2xl p-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                Respondemos todos os e-mails em até <strong>2 dias úteis</strong>. Para suporte urgente, acesse o chat dentro da plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
