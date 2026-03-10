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
  ChevronRight,
  Wrench,
  Car,
  Trophy,
  Gauge,
  BadgeCheck,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { NavBar } from "@/components/layout/navbar";

// ─── Static data ─────────────────────────────────────────────────────────────

const features = [
  {
    icon: Users,
    title: "Comunidades Exclusivas",
    desc: "Acesse comunidades automotivas premium com total isolamento de membros, conteúdo e pagamentos.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: BookOpen,
    title: "Conteúdo em Módulos",
    desc: "Cursos, aulas e tutoriais organizados em módulos com progresso rastreável e suporte a vídeo e PDF.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
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
  { step: "02", title: "Assine o plano", desc: "R$600/ano — acesso imediato a todas as comunidades da plataforma.", icon: CheckCircle },
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
    company: "Tuner desde 2019, 12k seguidores",
    avatarUrl: "https://i.pravatar.cc/96?u=rafael-costa",
    text: "O DetailHub transformou minha comunidade de seguidores em uma fonte de renda recorrente. Nunca foi tão fácil monetizar.",
    stars: 5,
  },
  {
    name: "Ana Lima",
    role: "Entusiasta de Tuning",
    company: "Proprietária do Clube Turbo SP",
    avatarUrl: "https://i.pravatar.cc/96?u=ana-lima",
    text: "Finalmente uma plataforma que entende a cultura automotiva. O conteúdo e a IA mecânica são incríveis.",
    stars: 5,
  },
  {
    name: "Carlos Mendes",
    role: "Mecânico Profissional",
    company: "AutoCenter Mendes — RJ",
    avatarUrl: "https://i.pravatar.cc/96?u=carlos-mendes",
    text: "Uso o marketplace para vender meus cursos de manutenção. Em 3 meses recuperei o investimento 10x.",
    stars: 5,
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
    <section className="relative overflow-hidden bg-[#F8F7FF] pt-24 pb-32">
      {/* Background grid */}
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Gradient orbs — no animate-pulse to avoid paint storm */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 text-center relative">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 text-sm text-violet-600 mb-8">
          <Car className="w-4 h-4" />
          A plataforma premium para comunidades automotivas
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
          <span className="text-gray-900">Sua comunidade </span>
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-violet-300 to-purple-300 bg-clip-text text-transparent">
            automotiva
          </span>
          <span className="text-gray-900">, premium.</span>
        </h1>

        <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          Acesse todas as comunidades automotivas premium em um único lugar.
          Cursos, lives, marketplace e IA mecânica — tudo incluso.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-violet-500/30 active:scale-95 w-full sm:w-auto justify-center"
          >
            Começar agora <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="#preco"
            className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:bg-violet-50 w-full sm:w-auto justify-center"
          >
            Ver planos
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mt-12 flex-wrap">
          {["R$600/ano. Acesso a tudo.", "Setup em 5 minutos", "Cancele quando quiser"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-gray-500 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="bg-[#F0EEFF] border-y border-gray-200 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {stats.map(({ value, label, growth }) => (
            <div key={label} className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">{value}</div>
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

function FeaturesSection() {
  return (
    <section id="features" className="bg-[#F8F7FF] py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-400 mb-4">
            <Gauge className="w-3 h-3" />
            Funcionalidades
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
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
              className="glass-card p-8 hover:border-violet-200 transition-all duration-300 group"
            >
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
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
    <section id="como-funciona" className="bg-[#F0EEFF] py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Como funciona</h2>
          <p className="text-gray-400 text-lg">Simples, direto e sem fricção.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {steps.map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="text-center">
              <div className="w-14 h-14 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-violet-400" />
              </div>
              <div className="text-violet-400 text-xs font-bold mb-2 tracking-widest">{step}</div>
              <h4 className="text-gray-900 font-semibold mb-2">{title}</h4>
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
    <section id="preco" className="bg-[#F8F7FF] py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Um plano. Acesso a tudo.</h2>
          <p className="text-gray-400 text-lg">Sem tiers confusos. Sem surpresas.</p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="glass-card p-8 border-violet-500/30 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-violet-600/5 to-transparent pointer-events-none" />

            <div className="relative">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-400 mb-4">
                  <Car className="w-3 h-3" />
                  DetailHub Anual
                </div>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-gray-400 text-xl">R$</span>
                  <span className="text-6xl font-bold text-gray-900">600</span>
                  <span className="text-gray-400 text-xl mb-2">/ano</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">Menos de R$50 por mês</p>
              </div>

              <ul className="space-y-3 mb-8">
                {pricingFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-gray-600">
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
              <p className="text-center text-xs text-gray-600 mt-4">
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
    <section className="bg-[#F0EEFF] py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            O que dizem nossos usuários
          </h2>
          <p className="text-gray-400 text-lg">Milhares de criadores e membros satisfeitos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map(({ name, role, company, avatarUrl, text, stars }) => (
            <div key={name} className="glass-card p-6">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-6">"{text}"</p>

              <div className="flex items-center gap-3">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-200"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-gray-900 font-semibold text-sm">{name}</p>
                    <BadgeCheck className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  </div>
                  <p className="text-gray-400 text-xs">{role}</p>
                  <p className="text-gray-600 text-xs">{company}</p>
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
    <section className="bg-[#F8F7FF] py-24">
      <div className="container mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600" />
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative p-6 sm:p-12 md:p-20 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm text-white mb-6">
              <Wrench className="w-4 h-4" />
              Pronto para começar?
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 max-w-2xl mx-auto">
              R$600/ano. Acesso a tudo. Cancele quando quiser.
            </h2>

            <p className="text-violet-100 text-lg mb-10 max-w-xl mx-auto">
              Junte-se a milhares de apaixonados por automóveis que já fazem parte da plataforma.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="flex items-center gap-2 bg-white text-violet-600 hover:bg-violet-50 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:shadow-xl active:scale-95 w-full sm:w-auto justify-center"
              >
                Começar agora <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <p className="text-violet-200 text-sm mt-6">
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
    <div className="min-h-screen bg-[#F8F7FF]">
      <NavBar />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
