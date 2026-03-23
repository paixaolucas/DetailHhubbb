// =============================================================================
// CONTEXTUAL MESSAGES — Single source of truth for dashboard message logic
// Used by ContextualMessage component
// Rules: no emojis, no dashes (—), tone is conversational and direct
// =============================================================================

export interface MessageContext {
  // Member context
  streak: number;
  absentDays: number;
  newContentSinceLogin: number;
  lastInfluencerWithContent: string | null;
  lastTrack: { moduleTitle: string; lessonTitle: string; lessonId: string; moduleId: string } | null;
  recentlyCompleted: { moduleTitle: string } | null;
  nearestAchievement: { name: string; progressPct: number } | null;
  isNewMember: boolean;
  daysSinceJoin: number;
  unreadNotifications: number;
  pendingLessons: number;
  optedCommunities: number;
  role: string;
  // Influencer context
  newFollowers?: number;
  pendingComments?: number;
  nextLiveInDays?: number | null;
  contentDraftCount?: number;
  communityCount?: number;
  contentPublishedCount?: number;
}

export interface ContextualMessage {
  text: string;
  cta?: { label: string; href: string };
}

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// =============================================================================
// MEMBER MESSAGE SELECTOR — exact priority order from product spec
// =============================================================================

export function pickMemberMessage(ctx: MessageContext, firstName: string): ContextualMessage {
  const name = firstName || "você";

  // 1. Streak 30 dias
  if (ctx.streak === 30) {
    return {
      text: "30 dias seguidos. Você faz parte de um grupo bem seleto aqui dentro.",
      cta: { label: "Ver ranking", href: "/dashboard/leaderboard" },
    };
  }

  // 2. Streak 7 dias (semana completa)
  if (ctx.streak === 7) {
    return {
      text: `Semana completa, ${name}. Isso é consistência de verdade.`,
      cta: { label: "Ver meu progresso", href: "/dashboard/meu-aprendizado" },
    };
  }

  // 3. Trilha concluída recentemente (últimos 7 dias)
  if (ctx.recentlyCompleted) {
    return {
      text: `Ei! Você concluiu ${ctx.recentlyCompleted.moduleTitle} recentemente. Está conseguindo colocar em prática?`,
      cta: { label: "Ver próxima trilha", href: "/dashboard/meu-aprendizado" },
    };
  }

  // 4. Próxima conquista a 10% ou menos de distância
  if (ctx.nearestAchievement && ctx.nearestAchievement.progressPct >= 90) {
    return {
      text: `${ctx.nearestAchievement.name} pode ser sua hoje. É questão de pouco.`,
      cta: { label: "Ver conquistas", href: "/dashboard/settings" },
    };
  }

  // 5. Streak >= 3 dias
  if (ctx.streak >= 3) {
    return {
      text: `${name}, que bom ter você mais um dia seguido! ${ctx.streak} dias de presença.`,
      cta: { label: "Continuar aprendendo", href: "/dashboard/meu-aprendizado" },
    };
  }

  // 6. Ausente por 3+ dias
  if (ctx.absentDays >= 3) {
    return {
      text: `Ei, ${name}! Faz ${ctx.absentDays} dias que você não aparecia. Tem bastante coisa te esperando.`,
      cta: { label: "Ver novidades", href: "/dashboard" },
    };
  }

  // 7. Novo conteúdo desde o último login
  if (ctx.newContentSinceLogin > 0 && ctx.lastInfluencerWithContent) {
    return {
      text: `Ei, ${name}! O ${ctx.lastInfluencerWithContent} postou coisa nova desde a última vez.`,
      cta: { label: "Ver conteúdo", href: "/dashboard/meu-aprendizado" },
    };
  }

  // 8. Próxima conquista a 20% ou menos de distância
  if (ctx.nearestAchievement && ctx.nearestAchievement.progressPct >= 80) {
    return {
      text: `Faltam poucos pontos para você alcançar ${ctx.nearestAchievement.name}. Tá pertinho!`,
      cta: { label: "Ver conquistas", href: "/dashboard/settings" },
    };
  }

  // 9. Trilha em andamento
  if (ctx.lastTrack) {
    return {
      text: `Você parou em ${ctx.lastTrack.moduleTitle}. Quer continuar de onde parou?`,
      cta: { label: "Continuar", href: "/dashboard/meu-aprendizado" },
    };
  }

  // 10. Novo membro
  if (ctx.isNewMember) {
    return {
      text: "Seja bem-vindo! Fique à vontade para começar por onde quiser.",
      cta: { label: "Explorar comunidades", href: "/dashboard" },
    };
  }

  // 11. Fallback A/B
  return pickRandom<ContextualMessage>([
    { text: "Ei, tudo bem?" },
    { text: "Olá! Que bom ver você por aqui." },
  ]);
}

// =============================================================================
// INFLUENCER MESSAGE SELECTOR
// =============================================================================

export function pickInfluencerMessage(ctx: MessageContext, firstName: string): ContextualMessage {
  const name = firstName || "você";

  if ((ctx.communityCount ?? 0) === 0) {
    return {
      text: `${name}, crie sua primeira comunidade e comece a reunir sua audiência.`,
      cta: { label: "Criar comunidade", href: "/dashboard/communities/new" },
    };
  }

  if ((ctx.newFollowers ?? 0) > 0) {
    return {
      text: `Mais ${ctx.newFollowers} ${(ctx.newFollowers ?? 0) === 1 ? "membro entrou" : "membros entraram"} esta semana. Sua comunidade está crescendo.`,
      cta: { label: "Ver membros", href: "/dashboard/communities" },
    };
  }

  if ((ctx.pendingComments ?? 0) > 0) {
    return {
      text: `${ctx.pendingComments} ${(ctx.pendingComments ?? 0) === 1 ? "comentário aguarda" : "comentários aguardam"} resposta. Engajamento constrói comunidade.`,
      cta: { label: "Ver comunidade", href: "/dashboard/communities" },
    };
  }

  if (ctx.nextLiveInDays !== null && ctx.nextLiveInDays !== undefined && ctx.nextLiveInDays <= 3) {
    const label =
      ctx.nextLiveInDays === 0
        ? "Sua live é hoje. Tudo pronto?"
        : `Live em ${ctx.nextLiveInDays} ${ctx.nextLiveInDays === 1 ? "dia" : "dias"}. Lembre sua audiência.`;
    return {
      text: label,
      cta: { label: "Gerenciar live", href: "/dashboard/live" },
    };
  }

  if ((ctx.contentDraftCount ?? 0) > 0) {
    return {
      text: `Você tem ${ctx.contentDraftCount} ${(ctx.contentDraftCount ?? 0) === 1 ? "rascunho" : "rascunhos"} aguardando publicação.`,
      cta: { label: "Publicar conteúdo", href: "/dashboard/content" },
    };
  }

  if ((ctx.contentPublishedCount ?? 0) === 0) {
    return {
      text: "Membros que recebem conteúdo na primeira semana têm muito mais retenção.",
      cta: { label: "Criar conteúdo", href: "/dashboard/content" },
    };
  }

  if (ctx.streak >= 3) {
    return {
      text: `${ctx.streak} dias criando. Consistência é o que diferencia os melhores.`,
      cta: { label: "Ver analytics", href: "/dashboard/analytics" },
    };
  }

  return pickRandom<ContextualMessage>([
    { text: "Sua comunidade continua crescendo. Continue criando.", cta: { label: "Ver analytics", href: "/dashboard/analytics" } },
    { text: "Publique com regularidade. Membros ativos esperam conteúdo.", cta: { label: "Criar conteúdo", href: "/dashboard/content" } },
  ]);
}
