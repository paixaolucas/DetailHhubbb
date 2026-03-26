import { Users, BookOpen, Video, ShoppingBag, Bot, BarChart2, Gauge } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Comunidades dos Influenciadores",
    desc: "Participe das comunidades de Barba, Corujão, Gimenez e outros. Conteúdo exclusivo, discussões técnicas e network com quem faz de verdade.",
    color: "text-[#009CD9]",
    bg: "bg-[#006079]/10",
  },
  {
    icon: BookOpen,
    title: "Conteúdo em Módulos",
    desc: "7 módulos estruturados: técnica, precificação, comunicação com cliente, portfólio e muito mais — com progresso rastreável.",
    color: "text-[#009CD9]",
    bg: "bg-[#009CD9]/10",
  },
  {
    icon: Video,
    title: "Lives Mensais",
    desc: "Encontros ao vivo com os influenciadores e especialistas. Tire dúvidas em tempo real e acesse as gravações quando quiser.",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    desc: "Acesse templates, planilhas, ferramentas e serviços curados para o seu negócio de estética automotiva.",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    icon: Bot,
    title: "IA Mecânica",
    desc: "Assistente de inteligência artificial especializado em automóveis — diagnósticos, orientações técnicas e criação de conteúdo.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: BarChart2,
    title: "Ferramentas de Negócio",
    desc: "Planilha de Precificação Dinâmica, mapeamento de preços por região e calculadora de custo real por serviço.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[#1A1A1A] py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-[#006079]/10 border border-[#006079]/20 rounded-full px-3 py-1 text-xs text-[#009CD9] mb-4">
            <Gauge className="w-3 h-3" />
            O que está incluído
          </div>
          <h2 className="text-4xl font-bold text-[#EEE6E4] mb-4">
            Tudo que você precisa para crescer
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Uma plataforma completa construída especificamente para detailers profissionais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <div
              key={title}
              className="glass-card p-8 hover:border-[#006079]/20 transition-all duration-300 group h-full animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <h3 className="text-xl font-semibold text-[#EEE6E4] mb-3">{title}</h3>
              <p className="text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
