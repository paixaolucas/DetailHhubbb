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

const stats = [
  { value: "500+", label: "Comunidades ativas", growth: "+240% em 12 meses" },
  { value: "50k+", label: "Membros apaixonados", growth: "95% retenção" },
  { value: "R$2M+", label: "Receita processada", growth: "+180% YoY" },
  { value: "99.9%", label: "Uptime garantido", growth: "SLA enterprise" },
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

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#1A1A1A] pt-24 pb-32">
      {/* Background grid */}
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Gradient orbs — no animate-pulse to avoid paint storm */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#006079]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 text-center relative">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#006079]/10 border border-[#007A99]/30 rounded-full px-4 py-1.5 text-sm text-[#009CD9] mb-8">
          <Car className="w-4 h-4" />
          O maior ecossistema de estética automotiva do Brasil
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
          <span className="text-[#EEE6E4]">As melhores comunidades </span>
          <br />
          <span className="bg-gradient-to-r from-[#009CD9] via-[#007A99] to-[#006079] bg-clip-text text-transparent">
            automotivas do Brasil
          </span>
          <span className="text-[#EEE6E4]"> — em um só lugar.</span>
        </h1>

        <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          O YouTube é sua vitrine. O Detailer&apos;HUB é a sua casa.
          Cursos, lives, marketplace e IA mecânica — tudo incluso com uma única assinatura.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-[#006079]/30 active:scale-95 w-full sm:w-auto justify-center"
          >
            Começar agora <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="#preco"
            className="flex items-center gap-2 border border-white/10 hover:border-white/20 text-gray-400 hover:text-[#EEE6E4] px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:bg-white/5 w-full sm:w-auto justify-center"
          >
            Ver planos
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mt-12 flex-wrap">
          {["R$79/mês. Acesso a tudo.", "Setup em 5 minutos", "Cancele quando quiser"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-gray-500 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {item}
            </div>
          ))}
        </div>

        {/* Dashboard mockup */}
        <div className="relative mt-16 max-w-3xl mx-auto">
          <div style={{ perspective: "1200px" }}>
            <div
              className="rounded-2xl overflow-hidden shadow-2xl shadow-[#006079]/20 border border-white/10"
              style={{ transform: "rotateX(8deg) rotateY(-1deg)" }}
            >
              {/* Window chrome */}
              <div className="bg-white/5 px-4 py-2.5 flex items-center gap-2 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-3 bg-white/5 rounded-full h-5 text-[10px] text-gray-400 flex items-center px-3">
                  detailerhub.com/dashboard
                </div>
              </div>
              {/* Content */}
              <div className="bg-[#1A1A1A] p-4 grid grid-cols-3 gap-3">
                {featuredCommunities.map((c) => (
                  <div key={c.slug} className="bg-white/5 rounded-xl overflow-hidden shadow-sm border border-white/10">
                    <CommunityThumbnail
                      bannerUrl={c.bannerUrl}
                      primaryColor={c.primaryColor}
                      name={c.name}
                      className="!aspect-auto h-20 w-full"
                    />
                    <div className="p-2 space-y-1.5">
                      <div className="h-2 bg-white/10 rounded w-3/4" />
                      <div className="h-2 bg-white/10 rounded w-1/2" />
                      <div className="h-5 rounded-lg mt-2" style={{ backgroundColor: `${c.primaryColor}22` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow below */}
          <div className="absolute inset-x-16 bottom-0 h-12 bg-[#006079]/20 blur-3xl -z-10" />
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="bg-[#222222] border-y border-white/10 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {stats.map(({ value, label, growth }) => (
            <div key={label} className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#EEE6E4] mb-1">{value}</div>
              <div className="text-gray-500 text-sm">{label}</div>
              <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                {growth}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCommunitiesSection() {
  return (
    <section id="comunidades" className="bg-[#1A1A1A] py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
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
        </div>

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
        <div className="text-center mb-16">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="glass-card p-8 hover:border-[#006079]/20 transition-all duration-300 group"
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

function HowItWorksSection() {
  return (
    <section id="como-funciona" className="bg-[#222222] py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#EEE6E4] mb-4">Como funciona</h2>
          <p className="text-gray-400 text-lg">Simples, direto e sem fricção.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {steps.map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="text-center">
              <div className="w-14 h-14 bg-[#006079]/10 border border-[#006079]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-[#009CD9]" />
              </div>
              <div className="text-[#009CD9] text-xs font-bold mb-2 tracking-widest">{step}</div>
              <h4 className="text-[#EEE6E4] font-semibold mb-2">{title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
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

        <div className="max-w-md mx-auto">
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
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="bg-[#222222] py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#EEE6E4] mb-4">
            O que dizem nossos usuários
          </h2>
          <p className="text-gray-400 text-lg">Milhares de criadores e membros satisfeitos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map(({ name, role, text, stars, avatarColor, initials }) => (
            <div key={name} className="glass-card p-7 flex flex-col gap-5">
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

          <div className="relative p-6 sm:p-12 md:p-20 text-center">
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
          </div>
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
      <StatsBar />
      <FeaturedCommunitiesSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
