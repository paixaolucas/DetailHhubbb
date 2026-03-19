# Pendências do Projeto — Detailer'HUB
> Atualizado em: 2026-03-19 — **TODOS OS 5 SPRINTS CONCLUÍDOS** ✅

---

## 📊 Status dos Sprints

| Sprint | Título | Período | Status | Progresso |
|--------|--------|---------|--------|-----------|
| 1 | Fundação | 20 Jan → 02 Fev 2026 | ✅ Completo | 100% |
| 2 | Comunidades & Conteúdo | 03 Fev → 16 Fev 2026 | ✅ Completo | 100% |
| 3 | Engajamento | 17 Fev → 02 Mar 2026 | ✅ Completo | 100% |
| 4 | Pagamentos | 03 Mar → 16 Mar 2026 | ✅ Completo | 100% |
| 5 | Dashboards & Admin | 17 Mar → 19 Mar 2026 | ✅ Completo | 100% |

---

## ✅ TODOS OS SPRINTS CONCLUÍDOS

Toda a funcionalidade planejada nos 5 sprints está implementada. O backlog abaixo lista oportunidades de Fase 2.

---

## ✅ SPRINTS 1 E 2 — Concluídos

Tudo implementado. Não há pendências.

**Sprint 1 inclui:** Setup Next.js 14, schema Prisma completo, Auth JWT, Google OAuth, middleware withAuth/withRole, design system teal, logo SVG, rate limiting, seed com contas de teste, rebrand ~130 arquivos.

**Sprint 2 inclui:** CRUD comunidades + spaces, feed (PostComposer, PostCard, reações, comentários), assinatura de plataforma (PlatformMembership), Stripe Checkout + Webhook, módulos/trilhas/progresso, UploadThing, emails com Resend, marketplace básico, dashboard por role.

---

## ✅ SPRINT 3 — Engajamento (100% concluído)

- Sistema de pontos automáticos (post +15, comentário +8, resposta +6, reação +3 — com caps diários)
- Threshold 70 pts para criar post (client + server)
- Score card no dashboard do membro com barra de progresso
- Leaderboard global + por comunidade
- Notificação ao cruzar 70 pts
- Sistema de badges + certificados
- Sistema de notificações in-app
- Sistema de denúncias (reports) + gestão admin
- Níveis nomeados no UI (Novo < 40 / Ativo 40–69 / Participante ≥ 70 / Superfã ≥ 85)
- Penalidade de inatividade — `POST /api/cron/inactivity` + `applyInactivityPenalty()` em `src/lib/points.ts`
- Opt-in de pertencimento — `POST/DELETE /api/communities/[id]/join` + modelo `CommunityOptIn` + botão na página da comunidade

---

## ✅ SPRINT 4 — Pagamentos (100% concluído)

- Stripe Checkout plataforma (`/api/stripe/platform-checkout`)
- Stripe Webhook com `metadata.platformPlanId`
- Billing portal (`/api/stripe/billing-portal`)
- Página `/dashboard/assinar` (upgrade CTA)
- Página admin financeiro com filtro de período (7d/15d/30d/1M–5M + calendar)
- Modelos `Payment`, `PlatformPlan`, `PlatformMembership`
- Pontos automáticos influenciador — `awardInfluencerPoints()` em `src/lib/points.ts` integrado em live-sessions, posts, comentários
- Cálculo da Caixa de Performance — `src/services/performance/performance.service.ts` (fórmula 5 métricas, 0–100)
- Dashboard de visualização de PP — `src/app/dashboard/performance/page.tsx` com radar chart, barras e histórico

---

## ✅ SPRINT 5 — Dashboards & Admin (100% concluído)

- Dashboard SUPER_ADMIN com métricas globais
- Dashboard INFLUENCER_ADMIN com analytics
- Dashboard COMMUNITY_MEMBER com score + comunidades
- Gestão de usuários (ban/unban, trocar role)
- Admin de comunidades (SUPER_ADMIN)
- Admin financeiro com período customizável
- Admin analytics reativo por período
- Performance: eliminação de waterfalls, hasPlatform cache, índices DB, paralelização de queries
- Automação distribuição PP dia 15 — `POST /api/cron/pp-distribution` (salva scores, calcula pool, atualiza pendingPayout, notifica influenciadores)
- **vercel.json** criado com todos os 5 crons agendados

---

## 🟢 BACKLOG — Fase 2 (baixa prioridade, após validação)

- **Feed recomendado** — posts engajados de todas as comunidades (algoritmo engajamento × recência)
- **Chat ao vivo geral** — visível apenas com ≥10 membros online
- **Carrossel de banners** — anunciantes, eventos, lançamentos (máx. 5)
- **Ranking mensal com reset** — além do all-time, reseta dia 1/mês
- **Certificação profissional PDF** — trilhas concluídas
- **Grupos de estudo temáticos** — criados por demanda orgânica
- **Salas de chat por comunidade** — Fase 2
- **Moderação por Superfãs** — ≥85 pts por 60 dias como candidato a moderador
- **Notificações motivacionais de performance** — "Você está no top 3 esta semana!"
- **Badge de saúde do influenciador** — 🟢/🟡/🔴 visível na página da comunidade
- **Badge "pode postar" no perfil público** — quando score ≥ 70
- **Desbloqueio sequencial de módulos** — cadeado até completar módulo anterior

---

## 📁 ARQUIVOS-CHAVE

| Arquivo | Função |
|---------|--------|
| `src/lib/points.ts` | Utilitário central de pontos — expandir aqui |
| `src/app/api/spaces/[spaceId]/posts/route.ts` | Criação de post (score gate + pontos) |
| `src/app/api/posts/[postId]/comments/route.ts` | Comentários (pontos automáticos) |
| `src/app/api/posts/[postId]/reactions/route.ts` | Reações de post (pontos) |
| `src/app/api/comments/[commentId]/reactions/route.ts` | Reações de comentário (pontos) |
| `src/app/api/users/[id]/score/route.ts` | Score agregado do usuário |
| `src/app/api/communities/[id]/leaderboard/route.ts` | Leaderboard + score individual |
| `src/components/feed/PostComposer.tsx` | Card motivador + threshold 70 pts |
| `src/app/dashboard/page.tsx` | Dashboard membro com score card |
| `src/app/community/[communitySlug]/page.tsx` | Página pública da comunidade |
| `src/app/members/[userId]/page.tsx` | Perfil público do membro |
| `prisma/schema.prisma` | Schema do banco — UserPoints, PointTransaction |

---

## 🗒️ CONTEXTO DO MODELO DE NEGÓCIO

- **Ticket:** R$79/mês por membro
- **Split de receita:** 35% influenciador + 15% caixa de performance + 35% estrutural + 15% marketing
- **Caixa de performance:** pool coletivo distribuído mensalmente por PP entre influenciadores ativos
- **Mínimo viável:** 300 membros (R$23.700 MRR)
- **Meta H1:** 5.000 membros, churn <7%, NPS influenciadores >50
- **H2 (futuro):** Plataforma mãe CrewHouse/Pitcrew gratuita, DetailerHub como clube premium
