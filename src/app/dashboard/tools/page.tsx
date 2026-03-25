// =============================================================================
// FERRAMENTAS — Detailer'HUB
// Seção 1: Ferramentas da plataforma (internas)
// Seção 2: Ferramentas parceiras (do banco)
// =============================================================================

import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  ExternalLink, Star, Wrench, Globe, User, ImageIcon,
  Film, DollarSign, Car, Bot, ArrowRight, Clock,
} from "lucide-react";

async function getTools() {
  try {
    return await db.saasTool.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    });
  } catch {
    return [];
  }
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  PRODUCTIVITY:   { label: "Produtividade", color: "text-[#009CD9] bg-[#007A99]/10 border-[#007A99]/20" },
  MARKETING:      { label: "Marketing",     color: "text-[#009CD9] bg-[#009CD9]/10 border-[#009CD9]/20" },
  ANALYTICS:      { label: "Analytics",     color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  DESIGN:         { label: "Design",        color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  DEVELOPMENT:    { label: "Desenvolvimento", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  FINANCE:        { label: "Financeiro",    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  COMMUNICATION:  { label: "Comunicação",   color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  DIAGNOSTIC:     { label: "Diagnóstico",   color: "text-red-400 bg-red-500/10 border-red-500/20" },
  AUTOMOTIVE:     { label: "Automotivo",    color: "text-[#009CD9] bg-[#007A99]/10 border-[#007A99]/20" },
};

// ─── Ferramentas internas da plataforma ──────────────────────────────────────

const PLATFORM_TOOLS = [
  {
    icon: Globe,
    label: "Análise de Sites",
    description: "Analise qualquer site com IA — SEO, performance, UX e oportunidades de melhoria.",
    href: "/dashboard/analise?tipo=site",
    badge: null,
    color: "#009CD9",
  },
  {
    icon: User,
    label: "Análise de Perfil",
    description: "Auditoria completa de perfis no Instagram, YouTube ou qualquer rede social.",
    href: "/dashboard/analise?tipo=perfil",
    badge: null,
    color: "#009CD9",
  },
  {
    icon: ImageIcon,
    label: "Análise de Imagem",
    description: "Avalie criativos, artes e fotos com IA — feedback técnico e de impacto visual.",
    href: "/dashboard/analise?tipo=imagem",
    badge: null,
    color: "#009CD9",
  },
  {
    icon: Film,
    label: "Análise de Vídeo",
    description: "Analise vídeos de marketing, reels e shorts — roteiro, engajamento e qualidade.",
    href: "/dashboard/analise?tipo=video",
    badge: null,
    color: "#009CD9",
  },
  {
    icon: DollarSign,
    label: "Gestão Financeira",
    description: "Acompanhe sua comissão, membros ativos, receita recorrente e projeções.",
    href: "/dashboard/financeiro",
    badge: null,
    color: "#22c55e",
  },
  {
    icon: Car,
    label: "Minha Garagem",
    description: "Documente seu veículo, registre modificações e compartilhe com a comunidade.",
    href: "/dashboard/garage",
    badge: "Em breve",
    color: "#f59e0b",
  },
  {
    icon: Bot,
    label: "Auto AI",
    description: "Chat com IA especialista em estética automotiva — tire dúvidas técnicas em segundos.",
    href: "/dashboard/ai",
    badge: null,
    color: "#009CD9",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ToolsPage() {
  const tools = await getTools();

  const byCategory = tools.reduce(
    (acc, tool) => {
      const cat = tool.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(tool);
      return acc;
    },
    {} as Record<string, typeof tools>
  );

  const featured = tools.filter((t) => t.isFeatured);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#EEE6E4] flex items-center gap-2">
          <Wrench className="w-6 h-6 text-[#009CD9]" />
          Ferramentas
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Ferramentas da plataforma e parceiros para alavancar seu negócio automotivo
        </p>
      </div>

      {/* ── Seção 1: Ferramentas da plataforma ── */}
      <div>
        <h2 className="text-base font-bold text-[#EEE6E4] mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-[#009CD9] rounded-full" />
          Ferramentas da plataforma
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PLATFORM_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isComingSoon = tool.badge === "Em breve";
            const Card = (
              <div
                className={`relative bg-[#111] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3 group transition-all duration-200 ${
                  isComingSoon
                    ? "opacity-60 cursor-default"
                    : "hover:border-[#009CD9]/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#007A99]/10 cursor-pointer"
                }`}
              >
                {/* Badge */}
                {tool.badge && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    <Clock className="w-2.5 h-2.5" />
                    {tool.badge}
                  </span>
                )}

                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${tool.color}15`, border: `1px solid ${tool.color}25` }}
                >
                  <Icon className="w-5 h-5" style={{ color: tool.color }} />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#EEE6E4] group-hover:text-[#009CD9] transition-colors leading-tight mb-1">
                    {tool.label}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                {/* CTA */}
                {!isComingSoon && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#009CD9] mt-auto">
                    Acessar <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            );

            return isComingSoon ? (
              <div key={tool.label}>{Card}</div>
            ) : (
              <Link key={tool.label} href={tool.href}>
                {Card}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Seção 2: Ferramentas parceiras ── */}
      {tools.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-[#EEE6E4] mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#007A99] rounded-full" />
            Ferramentas parceiras
          </h2>

          {featured.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Em destaque</p>
              <div className="grid md:grid-cols-3 gap-4">
                {featured.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} featured />
                ))}
              </div>
            </div>
          )}

          {Object.entries(byCategory).map(([category, catTools]) => {
            const catInfo = CATEGORY_LABELS[category] ?? { label: category, color: "text-gray-400 bg-white/5 border-gray-500/20" };
            return (
              <div key={category} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${catInfo.color}`}>
                    {catInfo.label}
                  </span>
                  <span className="text-gray-600 text-xs">{catTools.length} ferramentas</span>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {catTools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state se nao há nada */}
      {PLATFORM_TOOLS.length === 0 && tools.length === 0 && (
        <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-16 text-center">
          <div className="w-20 h-20 bg-[#007A99]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-10 h-10 text-[#009CD9]" />
          </div>
          <h3 className="text-xl font-semibold text-[#EEE6E4] mb-2">Nenhuma ferramenta disponível</h3>
          <p className="text-gray-400 text-sm">As ferramentas serão adicionadas em breve.</p>
        </div>
      )}
    </div>
  );
}

// ─── Tool Card (parceiros externos) ──────────────────────────────────────────

function ToolCard({ tool, featured = false }: { tool: any; featured?: boolean }) {
  const catInfo = CATEGORY_LABELS[tool.category] ?? { label: tool.category, color: "text-gray-400 bg-white/5 border-gray-500/20" };

  return (
    <div
      className={`bg-[#111] border border-white/[0.07] rounded-2xl p-5 hover:border-[#009CD9]/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#007A99]/10 group ${
        featured ? "border-[#007A99]/25" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {tool.logoUrl ? (
            <Image
              src={tool.logoUrl}
              alt={tool.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-[#007A99]/10 rounded-xl flex items-center justify-center text-[#009CD9] font-bold text-lg">
              {tool.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-[#EEE6E4] text-sm group-hover:text-[#009CD9] transition-colors">
              {tool.name}
            </h3>
            <span className={`text-xs border px-1.5 py-0.5 rounded-full ${catInfo.color}`}>
              {catInfo.label}
            </span>
          </div>
        </div>
        {tool.rating && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            {tool.rating}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-4 line-clamp-3 leading-relaxed">
        {tool.shortDesc ?? tool.description}
      </p>

      <a
        href={tool.affiliateUrl ?? tool.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#006079]/20 hover:bg-[#006079]/30 text-[#009CD9] border border-[#007A99]/20 rounded-xl text-xs font-semibold transition-all"
      >
        Acessar ferramenta <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
