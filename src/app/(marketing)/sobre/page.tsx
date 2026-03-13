export const metadata = { title: "Sobre nós — DetailHub" };

const TEAM = [
  { name: "Rafael Mendes", role: "CEO & Co-fundador", initials: "RM" },
  { name: "Ana Costa", role: "CTO & Co-fundadora", initials: "AC" },
  { name: "Bruno Oliveira", role: "Head de Produto", initials: "BO" },
  { name: "Carla Souza", role: "Head de Comunidades", initials: "CS" },
];

const VALUES = [
  { title: "Paixão automotiva", description: "Somos apaixonados por carros e construímos a plataforma que gostaríamos de ter." },
  { title: "Comunidade em primeiro lugar", description: "Cada decisão que tomamos considera o impacto na comunidade de criadores e membros." },
  { title: "Transparência total", description: "Acreditamos em comunicação aberta com nossos criadores, membros e parceiros." },
];

export default function SobrePage() {
  return (
    <div className="text-gray-900">
      {/* Hero */}
      <div className="bg-[#F0EEFF] border-b border-gray-200 py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Sobre o DetailHub</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Nascemos da paixão automotiva e do desejo de conectar entusiastas, criadores e a indústria em um só lugar.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-16">
        {/* Missão */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Nossa missão</h2>
          <p className="text-gray-600 leading-relaxed">
            O DetailHub nasceu com uma missão simples: ser a maior e melhor plataforma para comunidades automotivas do Brasil.
            Queremos dar poder aos criadores de conteúdo automotivo para monetizar seu conhecimento, construir audiências engajadas e
            impactar positivamente a cultura de carros no país.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            Com uma assinatura única de R$837/ano, membros têm acesso a todas as comunidades da plataforma — sem barreiras,
            sem fragmentação. Acreditamos que o conhecimento automotivo deve ser acessível e que criadores merecem ser remunerados pelo que produzem.
          </p>
        </section>

        {/* Valores */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Nossos valores</h2>
          <div className="grid gap-4">
            {VALUES.map(({ title, description }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Time */}
        <section>
          <h2 className="text-2xl font-bold mb-6">O time</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TEAM.map(({ name, role, initials }) => (
              <div key={name} className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
                <div className="w-14 h-14 bg-violet-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                  {initials}
                </div>
                <p className="font-semibold text-gray-900 text-sm">{name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{role}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
