# Pendências do Projeto — Detailer'HUB
> Atualizado em: 2026-03-19

---

## 📊 Status Geral dos Sprints

| Sprint | Título | Status |
|--------|--------|--------|
| 1 | Fundação | ✅ Completo |
| 2 | Comunidades & Conteúdo | ✅ Completo |
| 3 | Engajamento | ✅ Completo |
| 4 | Pagamentos | ✅ Completo |
| 5 | Dashboards & Admin | ✅ Completo |
| **6** | **Infraestrutura para Produção** | 🔴 Pendente |
| **7** | **Segurança & UX Essencial** | 🔴 Pendente |
| **8** | **Polimento Pré-lançamento** | 🟡 Pendente |
| **9** | **Estabilidade de Longo Prazo (Time Bombs)** | 🔴 Pendente |
| **10** | **Qualidade de Código** | 🟡 Pendente |

---

## ✅ SPRINTS 1–5 — Concluídos (histórico resumido)

**Sprint 1 — Fundação:** Setup Next.js 14, schema Prisma, Auth JWT + Google OAuth, middleware withAuth/withRole, design system teal, logo SVG, rate limiting, seed, rebrand ~130 arquivos.

**Sprint 2 — Comunidades & Conteúdo:** CRUD comunidades + spaces, feed (PostComposer, PostCard, reações, comentários), PlatformMembership, Stripe Checkout + Webhook, módulos/trilhas/progresso, UploadThing, emails Resend, marketplace, dashboard por role.

**Sprint 3 — Engajamento:** Sistema de pontos (post +15 / comentário +8 / reação +3 + caps diários), threshold 70pts para postar, leaderboard global + por comunidade, badges, certificados, notificações in-app, denúncias + gestão admin, níveis nomeados, penalidade de inatividade, opt-in de comunidade.

**Sprint 4 — Pagamentos:** Stripe platform-checkout + webhook, billing portal, `/dashboard/assinar`, admin financeiro com filtro de período, pontos automáticos para influenciador, Caixa de Performance (fórmula 5 métricas, 0–100), dashboard de PP com radar chart.

**Sprint 5 — Dashboards & Admin:** Dashboard por role (4 roles), gestão de usuários (ban/unban/role), admin comunidades, admin analytics reativo, eliminação de waterfalls, índices DB, crons agendados no `vercel.json` (5 crons), distribuição automática de PP dia 15.

---

## 🔴 SPRINT 6 — Infraestrutura para Produção
> Bloqueante para qualquer lançamento com volume real. Resolver antes de divulgar para mais de 100 pessoas.

### 6.1 — Connection pooling no banco (Neon + Prisma)
**Problema:** Prisma serverless abre uma conexão nova por invocação. Com 1k usuários simultâneos o banco trava por limite de conexões.
**Solução:** Ativar o pooler do Neon e adicionar `?pgbouncer=true&connection_limit=1` na `DATABASE_URL`.
- [ ] Ativar connection pooler no painel do Neon (modo `Transaction`)
- [ ] Criar `DIRECT_URL` com a URL direta (sem pooler) — usada só pelo Prisma migrate
- [ ] Atualizar `.env.local` e variáveis de ambiente no Vercel
- [ ] Testar com `npx prisma db push` usando `DIRECT_URL`
- **Esforço:** ~30 min

### 6.2 — Rate limiting com Redis (Upstash)
**Problema:** O rate limiter atual usa `Map` em memória in-process. No Vercel serverless cada função é uma instância isolada — o limite nunca é respeitado em produção.
**Solução:** Substituir por Upstash Redis (plano gratuito cobre até 10k req/dia).
- [ ] Criar conta Upstash + database Redis
- [ ] Instalar `@upstash/redis` + `@upstash/ratelimit`
- [ ] Reescrever `src/lib/rate-limit.ts` usando `Ratelimit.slidingWindow` do Upstash
- [ ] Adicionar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` no `.env` e Vercel
- [ ] Testar rate limit em `/api/auth/login` (limite: 10/min por IP)
- **Esforço:** ~2–3h

### 6.3 — Monitoramento de erros com Sentry
**Problema:** Zero visibilidade de erros em produção. Se travar com 1k pessoas não há como saber onde.
**Solução:** Sentry com Next.js SDK (plano gratuito: 5k erros/mês).
- [ ] Criar projeto no Sentry
- [ ] Instalar `@sentry/nextjs` e rodar `npx @sentry/wizard@latest -i nextjs`
- [ ] Configurar `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- [ ] Adicionar `SENTRY_DSN` no `.env` e Vercel
- [ ] Testar captura de erro manual (`Sentry.captureException`)
- **Esforço:** ~1h

---

## 🔴 SPRINT 7 — Segurança & UX Essencial
> Necessário antes de divulgar publicamente. Impacta moderação e experiência real de uso.

### 7.1 — Verificação de email obrigatória
**Problema:** Qualquer pessoa cria conta com email falso e acessa a plataforma. Com 1k usuários vira caos de moderação.
**Solução:** Enviar email de verificação no registro e bloquear acesso até confirmar.
- [ ] Adicionar campo `emailVerified: Boolean @default(false)` e `emailVerifyToken: String?` no model `User`
- [ ] Migration: `npx prisma migrate dev --name add-email-verify`
- [ ] No `POST /api/auth/register`: gerar token, salvar no user, enviar `EmailVerificationEmail`
- [ ] Criar `GET /api/auth/verify-email?token=xxx`: marcar `emailVerified = true`, limpar token
- [ ] No `POST /api/auth/login`: se `!emailVerified` retornar erro `EMAIL_NOT_VERIFIED` com status 403
- [ ] Criar página `/verificar-email` com instrução + botão "reenviar email"
- [ ] Adicionar rota `POST /api/auth/resend-verification`
- [ ] Isentar login Google (já verifica email automaticamente — definir `emailVerified: true` no callback)
- **Esforço:** ~3–4h

### 7.2 — Revisão do polling de mensagens/chat
**Problema:** Se o chat usa `setInterval` + fetch, 1k usuários = centenas de requests/segundo só de polling, saturando a API.
**Solução:** Auditar e otimizar — mínimo: aumentar intervalo e adicionar cache de 304. Ideal: migrar para Server-Sent Events (SSE).
- [ ] Auditar `src/app/dashboard/messages/page.tsx` e `ChatWidget.tsx` — identificar intervalo atual
- [ ] Se polling: aumentar intervalo para mínimo 10s + adicionar header `If-None-Match` (ETag)
- [ ] Avaliar migração para SSE (`ReadableStream` no Next.js route handler)
- [ ] Adicionar índice no Prisma em `Message.createdAt` + `Message.conversationId` se não existir
- **Esforço:** ~2–3h

### 7.3 — Política de upload (tamanho e tipo)
**Problema:** Sem limite claro de tamanho/tipo de arquivo em produção, usuários podem subir arquivos pesados e estourar bandwidth do plano Vercel.
**Solução:** Configurar limites explícitos no UploadThing.
- [ ] Revisar `src/app/api/uploadthing/route.ts`
- [ ] Definir limites: imagens máx. 4MB, vídeos máx. 256MB (ou desabilitar vídeo se não for usar)
- [ ] Adicionar validação de tipo MIME explícita
- [ ] Testar upload de arquivo acima do limite
- **Esforço:** ~1h

---

## 🟡 SPRINT 8 — Polimento Pré-lançamento
> Não bloqueante, mas impacta qualidade percebida e SEO. Fazer antes do primeiro post de divulgação.

### 8.1 — Sitemap dinâmico
**Problema:** O sitemap atual (`/sitemap.xml`) é estático/vazio. Comunidades publicadas não são indexadas pelo Google.
- [ ] Criar `src/app/sitemap.ts` (Next.js App Router)
- [ ] Incluir rotas estáticas (`/`, `/login`, `/register`, `/termos`, `/privacidade`)
- [ ] Query de comunidades `isPublished = true` e adicionar `/community/[slug]`
- **Esforço:** ~1h

### 8.2 — Atualizar data dos Termos de Uso
**Problema:** `/termos` exibe "Última atualização: março de 2025" — defasado 1 ano.
- [ ] Atualizar para "março de 2026" em `src/app/(marketing)/termos/page.tsx`
- [ ] Revisar valores/cláusulas se necessário
- **Esforço:** ~15 min

### 8.3 — Retry e idempotência no webhook Stripe
**Problema:** Stripe retentar o webhook pode criar pagamentos duplicados se o handler não for idempotente.
**Solução:** Verificar se já existe `PlatformMembership` ativa antes de criar/atualizar.
- [ ] Auditar `src/app/api/webhooks/stripe/route.ts` — verificar `upsert` vs `create`
- [ ] Garantir que `handleCheckoutCompleted` use `upsert` com `where: { stripeSessionId }` ou similar
- [ ] Testar reenvio manual de evento no Stripe Dashboard
- **Esforço:** ~1–2h

### 8.4 — Meta tags de SEO nas páginas principais
**Problema:** Páginas de dashboard e comunidade não têm `og:image`, `og:description` ou `twitter:card`.
- [ ] Adicionar `metadata` com `openGraph` no `layout.tsx` raiz (fallback global)
- [ ] Adicionar `metadata` específico em `/community/[slug]/page.tsx` com nome + descrição da comunidade
- [ ] Criar imagem og padrão `public/og-default.png` (1200×630)
- **Esforço:** ~1–2h

### 8.5 — Página `/privacidade` com conteúdo real
**Problema:** `/privacidade` retorna `164 B` no build — provavelmente página vazia/placeholder.
- [ ] Verificar `src/app/(marketing)/privacidade/page.tsx`
- [ ] Escrever Política de Privacidade básica (LGPD) com: dados coletados, finalidade, retenção, direitos do titular
- **Esforço:** ~1h

---

## 🔴 SPRINT 9 — Estabilidade de Longo Prazo (Time Bombs)
> Esses itens não quebram hoje, mas vão quebrar em 6–12 meses com uso real. Resolver antes de atingir 500 usuários ativos.

### 9.1 — Limpeza de RefreshTokens expirados (💣 time bomb)
**Problema:** A cada login/register/refresh um novo `RefreshToken` é criado no banco. Tokens expirados/revogados são NUNCA deletados — só marcados `isRevoked: true`. Com 1k usuários logando diariamente: ~365k linhas/ano. Queries de auth ficam progressivamente lentas.
**Solução:** Adicionar cron diário que deleta tokens expirados ou revogados há mais de 30 dias.
- [ ] Criar `POST /api/cron/cleanup-tokens`
  ```ts
  await db.refreshToken.deleteMany({
    where: { OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }] }
  });
  ```
- [ ] Adicionar ao `vercel.json`: `{ "path": "/api/cron/cleanup-tokens", "schedule": "0 2 * * *" }` (todo dia 02:00 UTC)
- [ ] Proteger com CRON_SECRET (mesmo padrão dos outros crons)
- [ ] Adicionar índice no Prisma: `@@index([expiresAt, isRevoked])` no model `RefreshToken`
- **Esforço:** ~1h

### 9.2 — Corrigir auth fraco no cron de inatividade (💣 segurança)
**Problema:** `src/app/api/cron/inactivity/route.ts` linha 16: `if (secret !== CRON_SECRET && CRON_SECRET)` — se `CRON_SECRET` não estiver definida no env, o check é pulado e qualquer pessoa pode chamar o endpoint e aplicar penalidade em todos os usuários.
**Solução:** Unificar para o mesmo padrão dos outros crons (`if (!CRON_SECRET || secret !== CRON_SECRET)`).
- [ ] Corrigir a condição em `src/app/api/cron/inactivity/route.ts`
- [ ] Auditar `src/app/api/cron/influencer-performance/route.ts` — verificar mesmo padrão
- **Esforço:** ~15 min

### 9.3 — Limpeza de AnalyticsEvent e Notification antigas (💣 crescimento infinito)
**Problema:** `AnalyticsEvent` e `Notification` nunca são deletados. Em uso real, `AnalyticsEvent` pode acumular milhões de linhas em 12 meses, tornando o dashboard de analytics lento.
**Solução:** Cron mensal que arquiva/deleta registros com mais de 90 dias.
- [ ] Adicionar ao cron de `monthly-reset` (já existe, roda dia 1):
  ```ts
  // Deletar AnalyticsEvents com mais de 90 dias
  await db.analyticsEvent.deleteMany({ where: { createdAt: { lt: subDays(now, 90) } } });
  // Deletar Notifications lidas com mais de 60 dias
  await db.notification.deleteMany({ where: { isRead: true, createdAt: { lt: subDays(now, 60) } } });
  ```
- [ ] Adicionar índices: `@@index([createdAt])` em `AnalyticsEvent` e `Notification` se não existirem
- **Esforço:** ~1h

### 9.4 — Corrigir `start` script e `serverActions.allowedOrigins`
**Problema 1:** `package.json` tem `"start": "next dev"` — deveria ser `next start`. Vercel não usa, mas confunde devs.
**Problema 2:** `next.config.js` tem `serverActions.allowedOrigins: ["localhost:3000"]` — produção não está na lista. Se qualquer página usar Server Actions em produção, falha silenciosamente.
- [ ] Corrigir `package.json`: `"start": "next start"`
- [ ] Adicionar domínio de produção em `serverActions.allowedOrigins` no `next.config.js`:
  ```js
  allowedOrigins: ["localhost:3000", process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "") ?? ""]
  ```
- **Esforço:** ~15 min

### 9.5 — Vercel Hobby: timeout de 10s em crons pesados
**Problema:** Plano Hobby tem timeout de 10s por serverless function. Crons que iteram sobre muitos usuários (`email-sequences`, `pp-distribution`) vão estourar esse limite silenciosamente quando houver >500 usuários.
**Solução curto prazo:** Adicionar paginação nos crons (processar em batches de 50 por vez). Solução longo prazo: migrar para Vercel Pro (60s) ou usar Inngest/Trigger.dev para jobs de background.
- [ ] Auditar `src/app/api/cron/email-sequences/route.ts` — verificar se processa todos de uma vez
- [ ] Auditar `src/app/api/cron/pp-distribution/route.ts` — verificar se itera todos os influenciadores
- [ ] Adicionar `take: 50` + cursor pagination em crons que iteram usuários
- [ ] Avaliar upgrade para Vercel Pro quando chegar em 300+ usuários
- **Esforço:** ~2–3h

---

## 🟡 SPRINT 10 — Qualidade de Código
> Não quebra imediatamente, mas reduz confiabilidade e dificulta manutenção. Resolver antes de contratar devs ou abrir o repositório.

### 10.1 — Travar versões de dependências críticas
**Problema:** `lucide-react: "^0.323.0"` e outras libs com `^` podem atualizar automaticamente em `npm install`. Lucide renomeia ícones entre minor versions — pode quebrar ícones silenciosamente em produção.
- [ ] Rodar `npm shrinkwrap` ou mudar deps críticas de `^` para versão exata
- [ ] Em especial: `lucide-react`, `recharts`, `@radix-ui/*`, `stripe`, `openai`
- [ ] Commitar `package-lock.json` e garantir que Vercel usa `npm ci` (já é o padrão)
- **Esforço:** ~30 min

### 10.2 — Corrigir 51 catch blocks vazios em rotas de API
**Problema:** `grep` encontrou 51 blocos `catch {}` vazios em `src/app/api`. Erros reais são engolidos silenciosamente — sem log, sem alerta, sem rastro.
- [ ] Auditar e substituir `catch {}` por `catch (error) { logger.error(...) }` nas rotas críticas (auth, stripe, crons)
- [ ] Prioridade: `src/app/api/auth/`, `src/app/api/stripe/`, `src/app/api/cron/`
- [ ] Usar o `src/lib/logger.ts` existente
- **Esforço:** ~2–3h

### 10.3 — Eliminar `any` explícitos em rotas críticas
**Problema:** Múltiplas rotas usam `any` em parâmetros e respostas, perdendo type-safety. Pode mascarar bugs em runtime que TypeScript teria pego.
- [ ] Priorizar rotas de pagamento e auth: substituir `any` por tipos específicos
- [ ] Rodar `npx tsc --noEmit --strict` para identificar todos os `any` implícitos
- **Esforço:** ~2–3h

---

## 🟢 BACKLOG — Fase 2 (após validação com primeiros usuários)

- **Feed recomendado** — posts engajados de todas as comunidades (algoritmo engajamento × recência)
- **Chat ao vivo geral** — visível apenas com ≥10 membros online
- **Ranking mensal com reset** — além do all-time, reseta dia 1/mês
- **Certificação profissional PDF** — trilhas concluídas
- **Grupos de estudo temáticos** — criados por demanda orgânica
- **Moderação por Superfãs** — ≥85 pts por 60 dias como candidato
- **Notificações motivacionais de performance** — "Você está no top 3 esta semana!"
- **Badge de saúde do influenciador** — 🟢/🟡/🔴 visível na página da comunidade
- **Desbloqueio sequencial de módulos** — cadeado até completar módulo anterior
- **Carrossel de banners** — anunciantes, eventos, lançamentos (máx. 5)

---

## 📁 ARQUIVOS-CHAVE

| Arquivo | Função |
|---------|--------|
| `src/lib/rate-limit.ts` | Rate limiter — **substituir por Upstash no Sprint 6** |
| `src/lib/points.ts` | Utilitário central de pontos |
| `src/middleware/auth.middleware.ts` | withAuth, withRole, verifyMembership |
| `src/app/api/uploadthing/route.ts` | Config de upload — **revisar limites no Sprint 7** |
| `src/app/api/webhooks/stripe/route.ts` | Webhook Stripe — **revisar idempotência no Sprint 8** |
| `src/app/api/auth/register/route.ts` | Registro — **adicionar verificação de email no Sprint 7** |
| `prisma/schema.prisma` | Schema do banco |
| `vercel.json` | Crons agendados (5 crons) |

---

## 🗒️ CONTEXTO DO MODELO DE NEGÓCIO

- **Preço:** R$948/ano = R$79/mês por membro
- **Split de receita:** 35% influenciador + 15% caixa de performance + 35% estrutural + 15% marketing
- **Mínimo viável:** 300 membros (~R$23.700 MRR)
- **Meta H1:** 5.000 membros, churn <7%, NPS influenciadores >50
