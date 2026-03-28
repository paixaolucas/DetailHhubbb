export const metadata = { title: "Sobre nós — Detailer'HUB" };

const TEAM = [
  {
    name: "Matheus Gouvea",
    role: "Co-Fundador & CEO",
    initials: "MG",
    bio: "Apaixonado por automóveis e tecnologia, Matheus lidera a visão e estratégia da plataforma para conectar os melhores entusiastas do Brasil.",
  },
  {
    name: "Lucas Paixão",
    role: "Co-Fundador & CTO",
    initials: "LP",
    bio: "Especializado em plataformas de comunidade, Lucas é responsável pela arquitetura e desenvolvimento do Detailer'HUB.",
  },
];

const VALUES = [
  { title: "Paixão automotiva", description: "Somos apaixonados por carros e construímos a plataforma que gostaríamos de ter." },
  { title: "Comunidade em primeiro lugar", description: "Cada decisão que tomamos considera o impacto na comunidade de criadores e membros." },
  { title: "Transparência total", description: "Acreditamos em comunicação aberta com nossos criadores, membros e parceiros." },
];

export default function SobrePage() {
  return (
    <div className="text-[#EEE6E4]">
      {/* Hero */}
      <div className="bg-[#006079]/10 border-b border-white/10 py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Sobre o Detailer&apos;HUB</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Nascemos da paixão automotiva e do desejo de conectar entusiastas, criadores e a indústria em um só lugar.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-16">
        {/* Missão */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Nossa missão</h2>
          <p className="text-gray-400 leading-relaxed">
            O Detailer&apos;HUB é o maior ecossistema de estética automotiva do Brasil. Nascemos para dar aos criadores de conteúdo
            um lugar de verdade — não apenas uma vitrine, mas uma casa. O YouTube é a vitrine. O Detailer&apos;HUB é a casa.
          </p>
          <p className="text-gray-400 leading-relaxed mt-4">
            Para os influenciadores, a missão é clara: <em>&quot;Sua audiência merece uma casa. O Detailer&apos;HUB é essa casa.&quot;</em>{" "}
            Queremos dar poder a criadores automotivos para monetizar seu conhecimento, construir comunidades engajadas e
            impactar positivamente a cultura de estética no país.
          </p>
          <p className="text-gray-400 leading-relaxed mt-4">
            Para os membros, uma única assinatura dá acesso a todas as comunidades da plataforma — sem barreiras,
            sem fragmentação. As melhores comunidades de estética automotiva do Brasil, em um só lugar.
          </p>
        </section>

        {/* Valores */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Nossos valores</h2>
          <div className="grid gap-4">
            {VALUES.map(({ title, description }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold text-[#EEE6E4] mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Time */}
        <section>
          <h2 className="text-2xl font-bold mb-6">O time</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TEAM.map(({ name, role, initials, bio }) => (
              <div key={name} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#006079] to-[#009CD9] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  {initials}
                </div>
                <p className="font-semibold text-[#EEE6E4]">{name}</p>
                <p className="text-sm text-[#009CD9] mt-0.5 mb-3">{role}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
