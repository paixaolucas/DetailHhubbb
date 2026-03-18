// =============================================================================
// SAAS TOOLS PAGE — Detailer'HUB Dark Theme
// =============================================================================

import Image from "next/image";
import { db } from "@/lib/db";
import { ExternalLink, Star, Wrench } from "lucide-react";

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
  PRODUCTIVITY: { label: "Produtividade", color: "text-[#009CD9] bg-[#007A99]/10 border-[#007A99]/20" },
  MARKETING: { label: "Marketing", color: "text-[#009CD9] bg-[#009CD9]/10 border-[#009CD9]/20" },
  ANALYTICS: { label: "Analytics", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  DESIGN: { label: "Design", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  DEVELOPMENT: { label: "Desenvolvimento", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  FINANCE: { label: "Financeiro", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  COMMUNICATION: { label: "Comunicação", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  DIAGNOSTIC: { label: "Diagnóstico", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  AUTOMOTIVE: { label: "Automotivo", color: "text-[#009CD9] bg-[#007A99]/10 border-[#007A99]/20" },
};

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#EEE6E4]">Ferramentas</h1>
        <p className="text-gray-400 text-sm mt-1">
          Ferramentas automotivas e de gestão para alavancar seu negócio
        </p>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Em destaque
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {featured.map((tool) => (
              <ToolCard key={tool.id} tool={tool} featured />
            ))}
          </div>
        </div>
      )}

      {/* By category */}
      {Object.entries(byCategory).map(([category, catTools]) => {
        const catInfo = CATEGORY_LABELS[category] ?? { label: category, color: "text-gray-400 bg-white/50/10 border-gray-500/20" };
        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${catInfo.color}`}>
                {catInfo.label}
              </span>
              <span className="text-gray-400 text-xs">{catTools.length} ferramentas</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {catTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        );
      })}

      {tools.length === 0 && (
        <div className="glass-card p-16 text-center">
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

function ToolCard({ tool, featured = false }: { tool: any; featured?: boolean }) {
  const catInfo = CATEGORY_LABELS[tool.category] ?? { label: tool.category, color: "text-gray-400 bg-white/50/10 border-gray-500/20" };

  return (
    <div
      className={`glass-card p-5 hover:border-[#009CD9]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#007A99]/10 group ${
        featured ? "border-[#007A99]/30" : ""
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
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#006079]/20 hover:bg-[#006079]/30 text-[#009CD9] hover:text-[#009CD9] border border-[#007A99]/20 rounded-xl text-xs font-semibold transition-all"
      >
        Acessar ferramenta <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
