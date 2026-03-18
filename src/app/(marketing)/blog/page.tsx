export const metadata = { title: "Blog — Detailer'HUB" };

export default function BlogPage() {
  return (
    <div className="text-gray-900">
      {/* Hero */}
      <div className="bg-[#F0EEFF] border-b border-gray-200 py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog Detailer'HUB</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Dicas, novidades e histórias do universo automotivo e das comunidades.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-[#007A99]/10 border border-[#007A99]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">✍️</span>
        </div>
        <h2 className="text-2xl font-bold mb-3">Em breve</h2>
        <p className="text-gray-500 leading-relaxed max-w-md mx-auto">
          Nosso blog está sendo preparado com muito cuidado. Em breve você encontrará aqui conteúdos exclusivos sobre
          comunidades automotivas, dicas de criadores e novidades da plataforma.
        </p>
        <p className="text-sm text-gray-400 mt-6">
          Quer ser notificado quando publicarmos? Entre na plataforma e ative as notificações.
        </p>
        <a
          href="/register"
          className="inline-block mt-6 bg-[#006079] hover:bg-[#007A99] text-white px-6 py-3 rounded-xl font-semibold transition-all"
        >
          Criar conta grátis
        </a>
      </div>
    </div>
  );
}
