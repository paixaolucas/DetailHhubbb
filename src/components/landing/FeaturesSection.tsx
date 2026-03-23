import { Users, BookOpen, Video, ShoppingBag, Bot, BarChart2, Gauge } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const features = [
  {
    icon: Users,
    title: "Comunidades Exclusivas",
    desc: "Acesse comunidades automotivas premium com total isolamento de membros, conteúdo e pagamentos.",
    color: "text-[#009CD9]",
    bg: "bg-[#006079]/10",
  },
  {
    icon: BookOpen,
    title: "Conteúdo em Módulos",
    desc: "Cursos, aulas e tutoriais organizados em módulos com progresso rastreável e suporte a vídeo e PDF.",
    color: "text-[#009CD9]",
    bg: "bg-[#009CD9]/10",
  },
  {
    icon: Video,
    title: "Lives & Streaming",
    desc: "Transmissões ao vivo integradas para sua comunidade assistir em tempo real com chat interativo.",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    desc: "Venda e compre produtos, templates, ferramentas e serviços automotivos em um marketplace curado.",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    icon: Bot,
    title: "IA Mecânica",
    desc: "Assistente de inteligência artificial especializado em automóveis para diagnosticar, orientar e criar conteúdo.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: BarChart2,
    title: "Analytics Avançado",
    desc: "Dashboard completo com MRR, churn, crescimento de membros e receita em tempo real.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[#1A1A1A] py-24">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#006079]/10 border border-[#006079]/20 rounded-full px-3 py-1 text-xs text-[#009CD9] mb-4">
            <Gauge className="w-3 h-3" />
            Funcionalidades
          </div>
          <h2 className="text-4xl font-bold text-[#EEE6E4] mb-4">
            Tudo que sua comunidade precisa
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Uma plataforma completa construída especificamente para o universo automotivo.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <ScrollReveal key={title} delay={i * 70} direction="up">
              <div className="glass-card p-8 hover:border-[#006079]/20 transition-all duration-300 group h-full">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="text-xl font-semibold text-[#EEE6E4] mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
