"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, AlertTriangle, Kanban } from "lucide-react";

// ─── Sprint data ──────────────────────────────────────────────────────────────

interface Task {
  label: string;
  done: boolean;
}

interface Sprint {
  id: number;
  title: string;
  start: string;
  end: string;
  status: "completo" | "andamento" | "pendente";
  progress: number; // 0–100
  tasks: Task[];
}

const SPRINTS: Sprint[] = [
  {
    id: 1,
    title: "Sprint 1 — Fundação",
    start: "2026-01-20",
    end: "2026-02-02",
    status: "completo",
    progress: 100,
    tasks: [
      { label: "Setup Next.js 14 + TypeScript + Prisma", done: true },
      { label: "Schema PostgreSQL completo (User, Community, Space, Post…)", done: true },
      { label: "Auth JWT (login, register, refresh, logout)", done: true },
      { label: "Google OAuth com CSRF", done: true },
      { label: "Middleware withAuth / withRole / verifyMembership", done: true },
      { label: "Design System: dark theme, teal palette, Titillium Web", done: true },
      { label: "Logo SVG (duas figuras humanas) + LogoType", done: true },
      { label: "Rate limiting (auth 10/min, AI 20/min, search 30/min)", done: true },
      { label: "Seed com contas de teste (admin, influencer, membro)", done: true },
      { label: "Rebrand completo: DetailHub → Detailer'HUB (~130 arquivos)", done: true },
    ],
  },
  {
    id: 2,
    title: "Sprint 2 — Comunidades & Conteúdo",
    start: "2026-02-03",
    end: "2026-02-16",
    status: "completo",
    progress: 100,
    tasks: [
      { label: "CRUD de comunidades (criar, editar, deletar)", done: true },
      { label: "Spaces dentro de comunidades", done: true },
      { label: "Feed: PostComposer, PostCard, reações, comentários", done: true },
      { label: "Sistema de assinatura de plataforma (PlatformMembership)", done: true },
      { label: "Stripe Checkout + Webhook", done: true },
      { label: "Módulos e trilhas de aprendizado (Module, Lesson, ContentProgress)", done: true },
      { label: "UploadThing para imagens (logo, banner)", done: true },
      { label: "Email com Resend (boas-vindas, reset, verificação, pagamento)", done: true },
      { label: "Marketplace básico (MarketplaceProduct)", done: true },
      { label: "Dashboard por role (4 roles)", done: true },
    ],
  },
  {
    id: 3,
    title: "Sprint 3 — Engajamento",
    start: "2026-02-17",
    end: "2026-03-02",
    status: "completo",
    progress: 100,
    tasks: [
      { label: "Sistema de pontos automáticos (post, comentário, reação, resposta)", done: true },
      { label: "Threshold 70 pts para criar post (client + server)", done: true },
      { label: "Score card no dashboard do membro", done: true },
      { label: "Leaderboard global + por comunidade", done: true },
      { label: "Notificação ao cruzar 70 pts", done: true },
      { label: "Sistema de badges + certificados", done: true },
      { label: "Sistema de notificações in-app", done: true },
      { label: "Sistema de denúncias (reports) + gestão admin", done: true },
      { label: "Níveis nomeados no UI (Novo/Ativo/Participante/Superfã)", done: true },
      { label: "Penalidade de inatividade cron (-3 pts/dia após 3 dias)", done: true },
      { label: "UI de opt-in explícito de pertencimento à comunidade", done: true },
    ],
  },
  {
    id: 4,
    title: "Sprint 4 — Pagamentos",
    start: "2026-03-03",
    end: "2026-03-16",
    status: "completo",
    progress: 100,
    tasks: [
      { label: "Stripe Checkout plataforma (/api/stripe/platform-checkout)", done: true },
      { label: "Stripe Webhook com metadata.platformPlanId", done: true },
      { label: "Billing portal (/api/stripe/billing-portal)", done: true },
      { label: "Página /dashboard/assinar (upgrade CTA)", done: true },
      { label: "Página admin financeiro com filtro de período", done: true },
      { label: "Modelos Payment, PlatformPlan, PlatformMembership", done: true },
      { label: "Pontos automáticos para o influenciador (live, vídeo, post, reply)", done: true },
      { label: "Cálculo da Caixa de Performance (PP) — fórmula 5 métricas", done: true },
      { label: "Dashboard de visualização de PP para influenciador", done: true },
    ],
  },
  {
    id: 5,
    title: "Sprint 5 — Dashboards & Admin",
    start: "2026-03-17",
    end: "2026-03-19",
    status: "completo",
    progress: 100,
    tasks: [
      { label: "Dashboard SUPER_ADMIN com métricas globais", done: true },
      { label: "Dashboard INFLUENCER_ADMIN com analytics", done: true },
      { label: "Dashboard COMMUNITY_MEMBER com score + comunidades", done: true },
      { label: "Gestão de usuários (ban/unban, trocar role)", done: true },
      { label: "Admin de comunidades (SUPER_ADMIN)", done: true },
      { label: "Admin financeiro com período customizável", done: true },
      { label: "Admin analytics reativo por período", done: true },
      { label: "Performance: eliminação de waterfalls + cache headers", done: true },
      { label: "Performance: índices DB + paralelização de queries", done: true },
      { label: "Automação distribuição PP dia 15 (cron mensal)", done: true },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Sprint["status"] }) {
  if (status === "completo") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Completo
      </span>
    );
  }
  if (status === "andamento") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#006079]/20 text-[#009CD9] border border-[#006079]/35">
        <Clock className="w-3.5 h-3.5" />
        Em andamento
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 text-gray-400 border border-white/10">
      <AlertTriangle className="w-3.5 h-3.5" />
      Pendente
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${value}%`,
          background:
            value === 100
              ? "linear-gradient(to right, #059669, #10b981)"
              : "linear-gradient(to right, #006079, #009CD9)",
        }}
      />
    </div>
  );
}

// ─── SprintCard ───────────────────────────────────────────────────────────────

function SprintCard({ sprint }: { sprint: Sprint }) {
  const storageKey = `projeto_obs_sprint_${sprint.id}`;
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setObs(localStorage.getItem(storageKey) ?? "");
    }
  }, [storageKey]);

  function handleObsChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setObs(val);
    localStorage.setItem(storageKey, val);
  }

  const doneTasks = sprint.tasks.filter((t) => t.done).length;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-[#EEE6E4] font-semibold text-base">{sprint.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {sprint.start} → {sprint.end}
          </p>
        </div>
        <StatusBadge status={sprint.status} />
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{doneTasks}/{sprint.tasks.length} tarefas</span>
          <span>{sprint.progress}%</span>
        </div>
        <ProgressBar value={sprint.progress} />
      </div>

      {/* Task list */}
      <ul className="space-y-1.5">
        {sprint.tasks.map((task, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            {task.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400/70 flex-shrink-0 mt-0.5" />
            )}
            <span className={task.done ? "text-gray-300" : "text-gray-500"}>{task.label}</span>
          </li>
        ))}
      </ul>

      {/* Observação */}
      <div className="space-y-1.5 pt-1 border-t border-white/10">
        <label className="text-xs text-gray-500 font-medium">Observações</label>
        <textarea
          value={obs}
          onChange={handleObsChange}
          placeholder="Digite observações sobre este sprint..."
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[#EEE6E4] placeholder-gray-600 resize-none focus:outline-none focus:border-[#006079] transition-colors"
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjetoPage() {
  const totalTasks = SPRINTS.reduce((acc, s) => acc + s.tasks.length, 0);
  const doneTasks = SPRINTS.reduce((acc, s) => acc + s.tasks.filter((t) => t.done).length, 0);
  const overallProgress = Math.round((doneTasks / totalTasks) * 100);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#006079] to-[#009CD9] rounded-xl flex items-center justify-center flex-shrink-0">
          <Kanban className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#EEE6E4]">Gestão do Projeto</h1>
          <p className="text-sm text-gray-500">Acompanhamento dos 5 sprints do Detailer&apos;HUB</p>
        </div>
      </div>

      {/* Overall summary */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Progresso Geral</p>
            <p className="text-3xl font-bold text-[#EEE6E4] mt-1">{overallProgress}%</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#009CD9]">{doneTasks}</p>
            <p className="text-xs text-gray-500">de {totalTasks} tarefas concluídas</p>
          </div>
        </div>
        <ProgressBar value={overallProgress} />
        <div className="flex gap-4 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            {SPRINTS.filter((s) => s.status === "completo").length} sprints completos
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-[#009CD9]" />
            {SPRINTS.filter((s) => s.status === "andamento").length} em andamento
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            {SPRINTS.filter((s) => s.status === "pendente").length} pendentes
          </div>
        </div>
      </div>

      {/* Sprint cards */}
      <div className="grid gap-4">
        {SPRINTS.map((sprint) => (
          <SprintCard key={sprint.id} sprint={sprint} />
        ))}
      </div>

      <p className="text-xs text-gray-600 text-center pb-2">
        As observações são salvas localmente no navegador. Esta aba é temporária e acessível apenas para SUPER_ADMIN.
      </p>
    </div>
  );
}
