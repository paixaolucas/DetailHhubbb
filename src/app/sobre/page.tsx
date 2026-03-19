import { Metadata } from "next";
import Link from "next/link";
import { NavBar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Sobre nós | Detailer'HUB",
  description: "Conheça a equipe por trás da maior plataforma de comunidades automotivas do Brasil.",
};

const team = [
  {
    name: "Matheus Gouvea",
    role: "Co-Fundador & CEO",
    bio: "Apaixonado por automóveis e tecnologia, Matheus lidera a visão e estratégia da plataforma para conectar os melhores entusiastas do Brasil.",
    initials: "MG",
  },
  {
    name: "Lucas Paixão",
    role: "Co-Fundador & CTO",
    bio: "Engenheiro de software especializado em plataformas de comunidade, Lucas é responsável pela arquitetura e desenvolvimento do Detailer'HUB.",
    initials: "LP",
  },
];

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#EEE6E4]">
      <NavBar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <span className="inline-block text-[#009CD9] text-sm font-semibold tracking-widest uppercase mb-4">
            Nossa Equipe
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Quem está por trás do{" "}
            <span className="bg-gradient-to-r from-[#007A99] to-[#009CD9] bg-clip-text text-transparent">
              Detailer&apos;HUB
            </span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Somos uma equipe de entusiastas automotivos e desenvolvedores apaixonados,
            unidos pela missão de criar a maior e melhor plataforma de comunidades
            automotivas do Brasil.
          </p>
        </div>
      </section>

      {/* Team Cards */}
      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center hover:border-white/20 transition-all duration-300"
              >
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white text-2xl font-bold mb-6 ring-4 ring-white/10">
                  {member.initials}
                </div>

                <h2 className="text-white text-xl font-bold mb-1">{member.name}</h2>
                <span className="text-[#009CD9] text-sm font-medium mb-4">{member.role}</span>
                <p className="text-gray-400 text-sm leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Nossa Missão</h2>
          <p className="text-gray-400 leading-relaxed">
            Construir o maior ecossistema de comunidades automotivas do Brasil, conectando
            entusiastas, profissionais e criadores de conteúdo em uma única plataforma
            premium. Acreditamos que a paixão por automóveis une pessoas — e queremos
            potencializar essa conexão.
          </p>
          <div className="mt-10">
            <Link
              href="/register"
              className="inline-block bg-gradient-to-r from-[#006079] to-[#009CD9] text-white font-semibold px-8 py-3 rounded-xl transition-all hover:opacity-90"
            >
              Fazer parte da comunidade
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
