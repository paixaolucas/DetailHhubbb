"use client";

// =============================================================================
// FERRAMENTAS & DOWNLOADS — Detailer'HUB
// Recursos práticos para uso imediato: planilhas, templates, argumentos, etc.
// Página estática com accordion inline para "40 Argumentos de Venda".
// =============================================================================

import { useState } from "react";
import {
  FileSpreadsheet,
  Map,
  FileText,
  MessageSquare,
  Zap,
  Package,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  CheckCircle,
  Lock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = "teal" | "blue" | "purple" | "orange" | "green";
type ToolStatus = "available" | "soon";

interface ArgumentGroup {
  category: string;
  items: { objection: string; response: string }[];
}

interface Tool {
  id: string;
  icon: React.ElementType;
  badge: string;
  badgeVariant: BadgeVariant;
  isBonus?: boolean;
  bonusLabel?: string;
  name: string;
  description: string;
  buttonLabel: string;
  href?: string;
  status: ToolStatus;
  hasInlineContent?: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BADGE_STYLES: Record<BadgeVariant, string> = {
  teal:   "text-[#009CD9] bg-[#007A99]/15 border border-[#007A99]/30",
  blue:   "text-blue-300 bg-blue-500/10 border border-blue-500/20",
  purple: "text-purple-300 bg-[#5E35B1]/15 border border-[#5E35B1]/30",
  orange: "text-orange-300 bg-[#E65100]/15 border border-[#E65100]/30",
  green:  "text-emerald-300 bg-emerald-500/10 border border-emerald-500/20",
};

const TOOLS: Tool[] = [
  {
    id: "pricing-sheet",
    icon: FileSpreadsheet,
    badge: "Precificação",
    badgeVariant: "teal",
    name: "Planilha de Precificação Dinâmica",
    description:
      "Calcule o preço mínimo, de mercado e de referência para cada serviço. Polimento, coating, PPF, higienização e wrapping.",
    buttonLabel: "Abrir planilha",
    href: "#",
    status: "soon",
  },
  {
    id: "regional-table",
    icon: Map,
    badge: "Referência",
    badgeVariant: "blue",
    name: "Tabela de Referência por Região",
    description:
      "Preços praticados nos principais centros de SP, RJ, BH, Curitiba, Porto Alegre e Fortaleza. Atualizada semestralmente.",
    buttonLabel: "Ver tabela",
    href: "#",
    status: "soon",
  },
  {
    id: "quote-template",
    icon: FileText,
    badge: "Templates",
    badgeVariant: "purple",
    name: "Template de Orçamento Profissional",
    description:
      "Modelo de orçamento com prazo de validade, forma de pagamento e termos básicos. Editável. Mencionado na Aula 5.3.",
    buttonLabel: "Fazer uma cópia",
    href: "#",
    status: "soon",
  },
  {
    id: "whatsapp-kit",
    icon: MessageSquare,
    badge: "Bônus",
    badgeVariant: "orange",
    isBonus: true,
    bonusLabel: "Bônus 1",
    name: "Kit Proposta WhatsApp/Email",
    description:
      "3 templates de proposta (básico, intermediário, VIP) prontos para enviar no WhatsApp ou por e-mail.",
    buttonLabel: "Baixar kit",
    href: "#",
    status: "soon",
  },
  {
    id: "sales-arguments",
    icon: Zap,
    badge: "Comunicação",
    badgeVariant: "green",
    name: "40 Argumentos de Venda",
    description:
      "Respostas prontas para as 40 objeções mais comuns: 'tá caro', 'vou pensar', 'tem mais barato'…",
    buttonLabel: "Ver argumentos",
    status: "available",
    hasInlineContent: true,
  },
  {
    id: "suppliers",
    icon: Package,
    badge: "Bônus",
    badgeVariant: "orange",
    isBonus: true,
    bonusLabel: "Bônus 3",
    name: "Diretório de Fornecedores",
    description:
      "Fornecedores premium (Gtechniq, Carpro, Koch Chemie e outros) com descontos negociados para membros Detailer'HUB (8–18%).",
    buttonLabel: "Ver fornecedores",
    status: "soon",
  },
];

const ARGUMENT_PREVIEW: ArgumentGroup[] = [
  {
    category: "Objeções de Preço",
    items: [
      {
        objection: "Tá caro",
        response:
          "O preço do meu serviço cobre custo real + margem + meu tempo. Deixa eu te mostrar o que está incluído…",
      },
      {
        objection: "Outro faz mais barato",
        response:
          "Talvez sim. Mas você está comparando o quê com o quê? Posso detalhar cada etapa do que faço…",
      },
      {
        objection: "Pode dar um desconto?",
        response:
          "Meu preço já é o justo pelo que entrego. O que posso fazer é ajustar o escopo se precisar reduzir…",
      },
    ],
  },
  {
    category: "Objeções de Tempo",
    items: [
      {
        objection: "Vou pensar",
        response:
          "Claro! O que você precisa avaliar para tomar a decisão? Posso ajudar com alguma informação?",
      },
      {
        objection: "Não tenho tempo agora",
        response:
          "Entendo. Quando seria um bom momento? Posso reservar sua vaga para a semana que vem…",
      },
    ],
  },
  {
    category: "Objeções de Confiança",
    items: [
      {
        objection: "Nunca fiz esse serviço",
        response:
          "Aqui estão 3 trabalhos recentes meus com o mesmo tipo de carro que o seu…",
      },
      {
        objection: "Como sei que vai durar?",
        response:
          "Ótima pergunta. Deixa eu explicar a cura e o que você precisa fazer para garantir a durabilidade…",
      },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ToolStatus }) {
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
        <CheckCircle className="w-3 h-3" />
        Disponível
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
      <Clock className="w-3 h-3" />
      Em breve
    </span>
  );
}

function ArgumentsInline() {
  return (
    <div className="mt-4 border-t border-white/10 pt-4 space-y-4 animate-fade-in">
      {ARGUMENT_PREVIEW.map((group) => (
        <div key={group.category}>
          <p className="text-xs font-semibold text-[#009CD9] uppercase tracking-wider mb-2">
            {group.category}
          </p>
          <div className="space-y-2">
            {group.items.map((item) => (
              <div
                key={item.objection}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5"
              >
                <p className="text-xs text-gray-400 mb-1">
                  Cliente diz:{" "}
                  <span className="text-[#EEE6E4] font-medium">
                    &ldquo;{item.objection}&rdquo;
                  </span>
                </p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {item.response}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Ver todos */}
      <div className="flex items-center gap-2 pt-1">
        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <p className="text-xs text-gray-400">
          Ver todos os 40 argumentos —{" "}
          <span className="text-amber-300">em breve</span>
        </p>
      </div>
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = tool.icon;
  const isDisabled = tool.status === "soon";

  function handleAction() {
    if (isDisabled) return;
    if (tool.hasInlineContent) {
      setExpanded((v) => !v);
    } else if (tool.href && tool.href !== "#") {
      window.open(tool.href, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col gap-4 hover:border-white/20 transition-colors duration-200">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Icon container */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category badge */}
            <span
              className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${BADGE_STYLES[tool.badgeVariant]}`}
            >
              {tool.badge}
            </span>

            {/* Bonus label */}
            {tool.isBonus && tool.bonusLabel && (
              <span className="text-xs font-bold text-orange-300 bg-[#E65100]/10 border border-[#E65100]/20 rounded-full px-2.5 py-0.5">
                {tool.bonusLabel}
              </span>
            )}
          </div>
        </div>

        <StatusBadge status={tool.status} />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1.5">
        <h3 className="text-sm font-semibold text-[#EEE6E4] leading-snug">
          {tool.name}
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          {tool.description}
        </p>
      </div>

      {/* Action button */}
      <button
        onClick={handleAction}
        disabled={isDisabled}
        aria-label={
          isDisabled
            ? `${tool.name} — em breve`
            : tool.hasInlineContent
            ? expanded
              ? `Recolher ${tool.name}`
              : tool.buttonLabel
            : tool.buttonLabel
        }
        className={[
          "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
          isDisabled
            ? "bg-white/5 border border-white/10 text-gray-500 opacity-50 cursor-not-allowed"
            : "bg-gradient-to-r from-[#006079] to-[#009CD9] text-white hover:opacity-90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#009CD9]/50",
        ].join(" ")}
      >
        {isDisabled ? (
          <>
            <Clock className="w-3.5 h-3.5" />
            {tool.buttonLabel}
          </>
        ) : tool.hasInlineContent ? (
          <>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            {expanded ? "Recolher" : tool.buttonLabel}
          </>
        ) : (
          <>
            <ExternalLink className="w-3.5 h-3.5" />
            {tool.buttonLabel}
          </>
        )}
      </button>

      {/* Inline content for arguments */}
      {tool.hasInlineContent && expanded && <ArgumentsInline />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FerramentasPage() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-[#EEE6E4]">
            Ferramentas &amp; Downloads
          </h1>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Exclusivo para assinantes
          </span>
        </div>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl">
          Recursos práticos para usar no seu negócio.{" "}
          <span className="text-gray-300">Use amanhã mesmo.</span>
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Tools grid */}
      <section aria-label="Ferramentas disponíveis">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* Footer note */}
      <p className="text-center text-xs text-gray-500 pb-4">
        Novas ferramentas são adicionadas mensalmente. Sugestões?{" "}
        <a
          href="/dashboard/messages"
          className="text-[#009CD9] hover:underline focus:outline-none focus:underline"
        >
          Fale com a gente
        </a>
        .
      </p>
    </div>
  );
}
