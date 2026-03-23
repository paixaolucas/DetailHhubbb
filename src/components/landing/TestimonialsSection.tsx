import { Star, BadgeCheck } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const testimonials = [
  {
    name: "Rafael Costa",
    role: "Criador de Conteúdo Automotivo",
    text: "O Detailer'HUB transformou minha comunidade de seguidores em uma fonte de renda recorrente. Nunca foi tão fácil monetizar.",
    stars: 5,
    avatarColor: "from-[#006079] to-[#009CD9]",
    initials: "RC",
  },
  {
    name: "Ana Lima",
    role: "Entusiasta de Tuning",
    text: "Finalmente uma plataforma que entende a cultura automotiva. O conteúdo e a IA mecânica são incríveis.",
    stars: 5,
    avatarColor: "from-[#006079] to-[#009CD9]",
    initials: "AL",
  },
  {
    name: "Carlos Mendes",
    role: "Mecânico Profissional",
    text: "Uso o marketplace para vender meus cursos de manutenção. Em 3 meses recuperei o investimento 10x.",
    stars: 5,
    avatarColor: "from-orange-500 to-red-500",
    initials: "CM",
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-[#222222] py-24">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#EEE6E4] mb-4">
            O que dizem nossos usuários
          </h2>
          <p className="text-gray-400 text-lg">Milhares de criadores e membros satisfeitos.</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map(({ name, role, text, stars, avatarColor, initials }, i) => (
            <ScrollReveal key={name} delay={i * 100} direction="up">
              <div className="glass-card p-7 flex flex-col gap-5 h-full">
                <div className="flex gap-1">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-400 text-sm leading-relaxed flex-1">&quot;{text}&quot;</p>

                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[#EEE6E4] font-semibold text-sm">{name}</p>
                      <BadgeCheck className="w-4 h-4 text-[#009CD9] flex-shrink-0" />
                    </div>
                    <p className="text-gray-400 text-xs">{role}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
