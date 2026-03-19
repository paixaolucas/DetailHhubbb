import Link from "next/link";
import {
  ArrowRight,
  Users,
  BookOpen,
  Video,
  ShoppingBag,
  Bot,
  BarChart2,
  Star,
  CheckCircle,
  Wrench,
  Car,
  Trophy,
  Gauge,
  BadgeCheck,
  ChevronRight,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { NavBar } from "@/components/layout/navbar";
import { CommunityThumbnail } from "@/components/community/CommunityThumbnail";
import { HeroSection } from "@/components/landing/HeroSection";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

// ─── Static data ─────────────────────────────────────────────────────────────

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

const steps = [
  { step: "01", title: "Crie sua conta", desc: "Registre-se e configure seu perfil em menos de 5 minutos.", icon: Users },
  { step: "02", title: "Assine o plano", desc: "R$79/mês — acesso imediato a todas as comunidades da plataforma.", icon: CheckCircle },
  { step: "03", title: "Explore e evolua", desc: "Acesse cursos, lives, marketplace e a IA mecânica sem limites.", icon: Trophy },
];

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

const featuredCommunities = [
  {
    name: "Barba",
    slug: "barba",
    primaryColor: "#FA4616",
    bannerUrl: "/photos/barba-thumb.png",
    members: "2.4k",
    description: "Estética automotiva sem enrolação. Queimando mitos.",
  },
  {
    name: "Corujão",
    slug: "corujao",
    primaryColor: "#F7941D",
    bannerUrl: "/photos/corujao-thumb.png",
    members: "1.8k",
    description: "Não é estúdio, não é detail. É zika! @corujaozk",
  },
  {
    name: "Comunidade no Mel",
    slug: "no-mel",
    primaryColor: "#FCB749",
    bannerUrl: "/photos/neto-thumb.png",
    members: "3.1k",
    description: "Educação em estética automotiva do zero ao avançado.",
  },
  {
    name: "Garagem do Gimenez",
    slug: "garagem-do-gimenez",
    primaryColor: "#C0392B",
    bannerUrl: null,
    members: "nova",
    description: "A garagem do Gimenez — onde a paixão por carros vira conteúdo.",
  },
  {
    name: "Sala do Gigi",
    slug: "sala-do-gigi",
    primaryColor: "#8E44AD",
    bannerUrl: null,
    members: "nova",
    description: "A sala do Gigi — estética automotiva com estilo e precisão.",
  },
];

const pricingFeatures = [
  "Acesso a todas as comunidades automotivas",
  "Conteúdo em módulos com progresso rastreável",
  "Lives & streaming com todos os criadores",
  "Marketplace completo",
  "Auto AI — assistente mecânico",
  "Leaderboard e badges",
  "Cancele quando quiser",
];

// ─── Sections ────────────────────────────────────────────────────────────────

function FeaturedCommunitiesSection() {
  return (
    <section id="comunidades" className="bg-[#1A1A1A] py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#006079]/10 border border-[#006079]/20 rounded-full px-3 py-1 text-xs text-[#009CD9] mb-4">
            <Trophy className="w-3 h-3" />
            Comunidades em destaque
          </div>
          <h2 className="text-4xl font-bold text-[#EEE6E4] mb-4">
            Explore comunidades premium
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Dezenas de comunidades automotivas esperando por você. Uma assinatura, acesso a todas.
          </p>
        </ScrollReveal>

        {/* Horizontal scroll mobile / 3-col grid desktop */}
        <div className="flex gap-5 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0 snap-x snap-mandatory md:snap-none">
          {featuredCommunities.map((community, i) => (
            <div
              key={community.slug}
              className="flex-shrink-0 w-72 md:w-auto glass-card overflow-hidden card-hover snap-start animate-slide-up"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <CommunityThumbnail
                bannerUrl={community.bannerUrl}
                primaryColor={community.primaryColor}
                name={community.name}
                className="!aspect-auto h-52"
              />
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-[#EEE6E4]">{community.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                    <Users className="w-3 h-3" />
                    {community.members}
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{community.description}</p>
                <Link
                  href="/register"
                  className="block w-full text-center text-sm font-semibold py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: community.primaryColor }}
                >
                  Ver comunidade <ChevronRight className="inline w-4 h-4 -mt-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-[#009CD9] hover:text-[#007A99] font-medium text-sm border border-[#006079]/20 hover:border-[#006079]/30 px-5 py-2.5 rounded-xl transition-all hover:bg-[#006079]/10"
          >
            Ver todas as comunidades <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
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

function HowItWorksSection() {
  return (
    <section id="como-funciona" className="bg-[#222222] py-24">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#EEE6E4] mb-4">Como funciona</h2>
          <p className="text-gray-400 text-lg">Simples, direto e sem fricção.</p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {steps.map(({ step, title, desc, icon: Icon }, i) => (
            <ScrollReveal key={step} delay={i * 120} direction="up" className="text-center">
              <div className="w-14 h-14 bg-[#006079]/10 border border-[#006079]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-[#009CD9]" />
              </div>
              <div className="text-[#009CD9] text-xs font-bold mb-2 tracking-widest">{step}</div>
              <h4 className="text-[#EEE6E4] font-semibold mb-2">{title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="preco" className="bg-[#1A1A1A] py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#EEE6E4] mb-4">Um plano. Acesso a tudo.</h2>
          <p className="text-gray-400 text-lg">Sem tiers confusos. Sem surpresas.</p>
        </div>

        <ScrollReveal className="max-w-md mx-auto">
          <div className="glass-card p-8 border-[#006079]/30 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#006079]/5 to-transparent pointer-events-none" />

            <div className="relative">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-[#006079]/10 border border-[#006079]/20 rounded-full px-3 py-1 text-xs text-[#009CD9] mb-4">
                  <Car className="w-3 h-3" />
                  Detailer&apos;HUB — Acesso Completo
                </div>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-gray-400 text-xl">R$</span>
                  <span className="text-6xl font-bold text-[#EEE6E4]">79</span>
                  <span className="text-gray-400 text-xl mb-2">/mês</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">ou R$948/ano — cancele quando quiser</p>
              </div>

              <ul className="space-y-3 mb-8">
                {pricingFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="btn-premium w-full flex items-center justify-center gap-2"
              >
                Começar agora <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-xs text-gray-400 mt-4">
                Pagamento seguro via Stripe. Cancele quando quiser.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function TestimonialsSection() {
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

function CTASection() {
  return (
    <section className="bg-[#1A1A1A] py-24">
      <div className="container mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#006079] to-[#009CD9]" />
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <ScrollReveal className="relative p-6 sm:p-12 md:p-20 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm text-white mb-6">
              <Wrench className="w-4 h-4" />
              Pronto para começar?
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 max-w-2xl mx-auto">
              Sua audiência merece uma casa. O Detailer&apos;HUB é essa casa.
            </h2>

            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
              Junte-se a milhares de apaixonados por automóveis que já fazem parte da plataforma.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="flex items-center gap-2 bg-white text-[#006079] hover:bg-white/90 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:shadow-xl active:scale-95 w-full sm:w-auto justify-center"
              >
                Começar agora <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <p className="text-white/60 text-sm mt-6">
              Pagamento seguro via Stripe. Sem cartão para testar.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <FeaturedCommunitiesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
