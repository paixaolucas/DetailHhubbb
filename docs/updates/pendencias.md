# Pendências do Projeto — Detailer'HUB
> Atualizado em: 2026-03-25

---

## 📊 Status Geral dos Sprints

| Sprint | Título | Status |
|--------|--------|--------|
| 1 | Fundação | ✅ Completo |
| 2 | Comunidades & Conteúdo | ✅ Completo |
| 3 | Engajamento | ✅ Completo |
| 4 | Pagamentos | ✅ Completo |
| 5 | Dashboards & Admin | ✅ Completo |
| 6 | Infraestrutura para Produção | ✅ Completo |
| 7 | Segurança & UX Essencial | ✅ Completo |
| 8 | Polimento Pré-lançamento | ✅ Completo |
| 9 | Estabilidade de Longo Prazo (Time Bombs) | ✅ Completo |
| 10 | Qualidade de Código | ✅ Completo |
| 11 | Correção de Bugs Críticos (IA + ViewAs) | ✅ Completo |
| **12** | **Alinhamento Documental — Inconsistências Críticas** | ✅ Completo |
| **13** | **Sistema de Referral e Modelo Dono-do-Membro** | ✅ Completo |
| **14** | **Conteúdo: 7 Módulos Estruturados** | ✅ Completo |
| **15** | **Ferramentas e Downloads (Proposta de Valor Concreta)** | 🟡 Infra completa / Conteúdo pendente |
| **16** | **Onboarding em 7 Dias (Ativação de Membros)** | ✅ Completo |
| **17** | **Landing Page Completa (Conversão)** | 🟡 Pendente |
| **18** | **Dashboard do Influenciador Completo** | 🟡 Pendente |
| **19** | **Certificado Verificável por QR Code** | 🟢 Pendente |
| **20** | **Página /para-criadores e Onboarding de Influenciadores** | 🟢 Pendente |
| **21** | **Migração Stripe → Asaas** | 🟢 Pendente |

---

## ✅ SPRINTS 1–5 — Concluídos (histórico resumido)

**Sprint 1 — Fundação:** Setup Next.js 14, schema Prisma, Auth JWT + Google OAuth, middleware withAuth/withRole, design system teal, logo SVG, rate limiting, seed, rebrand ~130 arquivos.

**Sprint 2 — Comunidades & Conteúdo:** CRUD comunidades + spaces, feed (PostComposer, PostCard, reações, comentários), PlatformMembership, Stripe Checkout + Webhook, módulos/trilhas/progresso, UploadThing, emails Resend, marketplace, dashboard por role.

**Sprint 3 — Engajamento:** Sistema de pontos (post +15 / comentário +8 / reação +3 + caps diários), threshold 70pts para postar, leaderboard global + por comunidade, badges, certificados, notificações in-app, denúncias + gestão admin, níveis nomeados, penalidade de inatividade, opt-in de comunidade.

**Sprint 4 — Pagamentos:** Stripe platform-checkout + webhook, billing portal, `/dashboard/assinar`, admin financeiro com filtro de período, pontos automáticos para influenciador, Caixa de Performance (fórmula 5 métricas, 0–100), dashboard de PP com radar chart.

**Sprint 5 — Dashboards & Admin:** Dashboard por role (4 roles), gestão de usuários (ban/unban/role), admin comunidades, admin analytics reativo, eliminação de waterfalls, índices DB, crons agendados no `vercel.json` (5 crons), distribuição automática de PP dia 15.

---

## ✅ SPRINT 6 — Infraestrutura para Produção — COMPLETO

Connection pooling Neon + pgbouncer, rate limiting Upstash Redis, monitoramento Sentry.

---

## ✅ SPRINT 7 — Segurança & UX Essencial — COMPLETO

Verificação de email obrigatória, revisão de polling de chat, política de upload (tamanho + tipo MIME).

---

## ✅ SPRINT 8 — Polimento Pré-lançamento — COMPLETO

Sitemap dinâmico, termos de uso atualizados, retry/idempotência webhook Stripe, meta tags SEO, página /privacidade com conteúdo LGPD.

---

## ✅ SPRINT 9 — Estabilidade de Longo Prazo (Time Bombs) — COMPLETO

Limpeza de RefreshTokens expirados (cron diário), correção de auth fraco no cron de inatividade, limpeza de AnalyticsEvent e Notification antigas, correção do `start` script e `serverActions.allowedOrigins`, paginação em crons pesados para plano Hobby.

---

## ✅ SPRINT 10 — Qualidade de Código — COMPLETO

Versões travadas em dependências críticas, eliminação de 51 catch blocks vazios, remoção de `any` explícitos em rotas críticas.

---

## ✅ SPRINT 11 — Correção de Bugs Críticos (IA + ViewAs) — COMPLETO

Modelo gpt-4o → gpt-4o-mini, validação de conteúdo URL, fake success em JSON inválido, thumbnail imagem, toast status correto, ViewAs middleware role/hasPlatform, ViewAs frontend hasPlatform.

---

## ✅ SPRINT 12 — Alinhamento Documental — Inconsistências Críticas — COMPLETO

### 12.1 — Preço do plano anual ✅
Decisão do fundador: R$708/ano (R$59/mês no plano anual). Atualizado em: `assinar/page.tsx`, `PricingSection.tsx`, `boas-vindas/page.tsx`, `membership-section.tsx`, `Footer.tsx`, `admin/financeiro/page.tsx`, `analytics/page.tsx`, `api/influencers/me/financeiro/route.ts`, `payment.service.ts`, `termos/page.tsx`, `prisma/seed.ts`, `CLAUDE.md`.

### 12.2 — Dois grupos de influenciadores ✅
Decisão do fundador: são papéis distintos dentro do mesmo role `INFLUENCER_ADMIN`:
- **Parceiros de Negócio** (Gimenez, Neto, Barba, Corujão, Geovane) — donos de audiência, comissão 35%, referral
- **Produtores de Conteúdo** (Veneto/Vaglieri, Gilberto Stockler, Igor Ao Raboni, Widnei) — gravam módulos, remunerados por entrega
Documentado em `CLAUDE.md` seção Roles.

### 12.3 — Split de receita ✅
Split correto 50/35/15 verificado no codebase (COMMISSION_RATE = 0.35, PP_RATE = 0.15). Nenhuma correção necessária.

### 12.4 — Migração Stripe → Asaas ✅
Decisão do fundador: migrar para Asaas. Sprint 21 criado com a implementação completa.

---

## ✅ SPRINT 13 — Sistema de Referral e Modelo Dono-do-Membro — COMPLETO

**O que estava implementado:** `/convite/[code]`, cookie `detailhub_ref`, register lê referralCode, auth.service resolve referrer, checkout passa referredByInfluencerId no metadata Stripe, webhook cria membership com referredByInfluencerId, API invite-link com stats, settings page com link copiável.

**O que foi feito neste sprint:**
- `referredByInfluencerId` agora é verdadeiramente imutável (removido do bloco `update` do upsert)
- `GET /api/admin/members` criado com filtros (status, influenciador, search, paginação)
- `dashboard/admin/membros/page.tsx` criado com tabela, badges de status, filtros e paginação
- Item de menu "Membros" adicionado ao grupo `admin` em `src/lib/navigation.ts`
- POST_THRESHOLD (70 pts) agora é enforçado na API `POST /api/spaces/[spaceId]/posts` para COMMUNITY_MEMBER

> O sistema de referral anterior já estava completo. Sprint focou em fortalecer imutabilidade e adicionar relatório admin.

---

## ✅ SPRINT 14 — Conteúdo: 7 Módulos Estruturados — COMPLETO

**O que foi feito:**
- Criado influenciador "DetailerHUB Academy" + comunidade "Academy" no seed
- 7 módulos seedados com aulas estruturadas conforme `pautas-de-conteudo.md`
- Módulos 6 e 7 marcados como `isPublished: false` (mês 2 e 3)
- Aulas 5.1 têm attachments (planilha e template) no JSON
- Rastreamento de progresso já implementado (`/api/content/lessons/[id]/progress`)
- Destravamento progressivo por módulo já implementado (módulo N só abre se N-1 ≥80% concluído)
- Certificado automático ao concluir todos os módulos da comunidade — já implementado
- **Pendente (fase 2):** badges individuais por módulo concluído (14.4) — o certificado geral já serve como validação

---

## 🟡 SPRINT 15 — Ferramentas e Downloads (Proposta de Valor Concreta)

**Infra implementada:** `dashboard/ferramentas/page.tsx` criado com 6 cards (Planilha, Tabela Regional, Template Orçamento, Kit Proposta, 40 Argumentos com accordion, Diretório Fornecedores). Navegação adicionada ao sidebar.

**Pendente (editorial — não requer código):**
- Criar Planilha de Precificação no Google Sheets (custos, horas, porte do carro) e vincular no card
- Criar Tabela de Referência de Mercado (6 regiões × serviços) — PDF ou página
- Criar Template de Orçamento editável (Google Docs / Canva)
- Criar Kit Proposta com 3 modelos de pacote (básico / intermediário / VIP)
- Escrever os 40 Argumentos de Venda agrupados por objeção
- Negociar com ≥3 fornecedores e publicar Diretório de Fornecedores

---

## ✅ SPRINT 16 — Onboarding em 7 Dias (Ativação de Membros) — COMPLETO

**O que foi feito:**
- `MemberOnboarding.tsx` criado com 5 passos (localStorage, progressão sequencial, celebração ao completar)
- Integrado no `MemberDashboard.tsx` logo após o bloco de saudação/score (visível apenas com assinatura ativa)
- `PlatformWelcomeEmail.tsx` atualizado com os 5 passos do onboarding em destaque
- **Pendente (editorial):** email de lembrete no dia 3 e email de celebração no dia 7 (dependem de cron + template novo)

---

## ✅ SPRINT 17 — Landing Page Completa (Conversão) — COMPLETO

**O que foi feito:**
- `PainSection.tsx` — grid 2×3 com 6 pain points + box diagnóstico (R$75.600/ano na mesa)
- `PillarsSection.tsx` — 4 pilares em grid 2×2 + tabela de entregáveis com valores avulsos (R$3.000+)
- `ObjectionsSection.tsx` — 6 objeções respondidas expandidas por padrão (estilo Hormozi)
- `GuaranteeSection.tsx` — box cancele quando quiser, sem multa
- `UrgencySection.tsx` — urgência de vagas fundador + custo de esperar + CTA principal
- `PricingSection.tsx` atualizado com âncora de preço, strike-through R$197, opção anual R$59/mês = R$708, badge "500 vagas"
- `src/app/(landing)/page.tsx` atualizado com sequência completa
- **Pendente (fase 2):** contador de vagas em tempo real (17.2) e página `/obrigado` pós-checkout (17.3)

### Sprint 17 — Overhaul de UX/Animações (Sessão 2026-03-26) ✅
- **ScrollReveal removido de todas as seções** — causava conteúdo invisível no SSR do Next.js (opacity:0 persistia sem hidratação JS). Substituído por CSS `animate-slide-up` / `animate-fade-in` (sempre visível)
- `globals.css` — adicionadas classes `.animate-marquee`, `.animate-float`, `.animate-gradient-x`, `.animate-pulse-glow`, `.animate-breathe` + keyframes completos. `@keyframes slide-up` sem opacity (nunca invisível)
- `InfluencerStripSection` — marquee infinito corrigido (4× duplication + `mr-14` por item em vez de `gap`)
- `TestimonialsSection` removida da landing (sem depoimentos reais)
- `HeroSection` — mockup mostra 5 comunidades (Barba, Corujão, No Mel, Gimenez, Sala do Gigi); orbs de background com mouse-tracking
- `FeaturedCommunitiesSection` — bannerUrls reais para Barba, Corujão, No Mel; imagens responsivas (`h-40 md:h-44`)
- `Footer` — apenas Instagram + TikTok @detailerhub (removidos GitHub, Twitter, YouTube)
- `CTASection` — "Stripe" substituído por "Asaas"
- `InfluencerStripSection` — Widnei (@widnei_detail) e Tarcísio (@tarcisio_veneto) removidos (não são parceiros da plataforma)
- **Login/Register fix crítico:** canvas `LoginBackground` não renderizava porque `h-full` num filho de `flex-1` sem `height` explícito retorna `clientHeight=0`. Fix: container com `relative overflow-hidden` + canvas `absolute inset-0`
- `ScrollReveal.tsx` — threshold 0, rootMargin 100px, fallback timeout 1.5s (mantido como componente mas não mais usado nas seções principais)

---

## ✅ SPRINT 18 — Dashboard do Influenciador Completo — COMPLETO

**O que foi feito:**
- `PerformanceBox`: 5 barras individuais por métrica (views, engajamento, novos membros, retenção, entregas) com pesos, score total e delta vs mês anterior
- `CommissionReport`: "Minha Receita" com comissão direta (35%), caixa estimada, total + histórico 6 meses
- `GrowthSimulator`: slider 50–2000 membros, cálculo em tempo real de comissão direta + caixa
- `RecordingChecklist`: 9 itens do guia de gravação, interativo, barra de progresso, links para content/entregas

---

## ✅ SPRINT 19 — Certificado Verificável por QR Code — COMPLETO

**O que foi feito (já estava ou foi implementado agora):**
- Trigger automático: ao concluir todos os módulos de uma comunidade → certificado emitido + notificação in-app (já existia no progress route)
- `GET /api/certificates/verify/[code]` — API pública de verificação (já existia)
- `/certificates/[code]` — página pública completa com design teal, nome do membro, comunidade, data, code (já existia)
- QR Code adicionado à página de certificado (`qrcode` package, geração server-side, data URL com teal)
- `/dashboard/meu-aprendizado/certificados` — página do membro listando certificados com `CertificateCard`
- **Pendente (fase 2):** PDF download (19.3) — campo `pdfUrl` existe no schema, aguarda `@react-pdf/renderer`

---

## ✅ SPRINT 20 — Página /para-criadores e Onboarding de Influenciadores — COMPLETO

**O que foi feito:**
- `src/app/(landing)/para-criadores/page.tsx` — 9 seções (Hero, Problema, Virada, Como Funciona, Remuneração, Simulador, O que pedimos, Por que entrar, CTA+Formulário)
- `GainsSimulator.tsx` — slider 100–2000 membros, cálculo em tempo real, tabela referência
- `ContactForm.tsx` — formulário nome/Instagram/seguidores/mensagem + estado de sucesso
- `src/app/dashboard/onboarding-influenciador/page.tsx` — 5 etapas com barra de progresso, checklist de lançamento
- `navigation.ts` — link "Guia de início" → `/dashboard/onboarding-influenciador` para `INFLUENCER_ADMIN`
- **Pendente (fase 2):** redirecionamento automático na 1ª vez que influenciador loga; envio real do formulário de contato

---

## 🟢 SPRINT 21 — Migração Stripe → Asaas
> Gateway brasileiro com PIX nativo, R$0,99/transação (vs Stripe ~3,5%), sem mensalidade fixa, API robusta para recorrência em BRL. Reduz custo operacional e elimina conversão USD → BRL.

**Contexto:** Decisão do fundador (Sprint 12) — migrar Stripe para Asaas. Impacta checkout, webhook, billing portal e crons de cobrança.

### 21.1 — Setup Asaas e credenciais
- [ ] Criar conta Asaas e obter API key (sandbox e produção)
- [ ] Adicionar variáveis de ambiente: `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `NEXT_PUBLIC_ASAAS_ENV` (sandbox|production)
- [ ] Instalar SDK ou configurar cliente HTTP para `https://api.asaas.com/v3`
- **Esforço:** ~1h

### 21.2 — Mapeamento de entidades (Stripe → Asaas)
| Stripe | Asaas |
|--------|-------|
| `Customer` | `Customer` (`/customers`) |
| `Subscription` | `Subscription` (`/subscriptions`) |
| `PaymentIntent` / `Checkout Session` | `Payment` (`/payments`) com `billingType: PIX\|CREDIT_CARD` |
| `Invoice` | `Payment` parcelado |
| `Webhook` | Webhook com `X-Asaas-Webhook-Token` |
| `billing-portal` | Redirecionar para email de cancelamento (Asaas não tem portal) |

- [ ] Mapear todos os `metadata` usados nos webhooks Stripe para equivalentes Asaas
- [ ] Documentar campos obrigatórios: `customer.cpfCnpj`, `payment.dueDate`, `subscription.nextDueDate`
- **Esforço:** ~2h

### 21.3 — Criar `src/lib/asaas/` — cliente e tipos
- [ ] `src/lib/asaas/client.ts` — wrapper fetch com auth header e base URL
- [ ] `src/lib/asaas/types.ts` — interfaces para Customer, Subscription, Payment, Webhook
- [ ] `src/lib/asaas/asaas.ts` — funções: `createCustomer`, `createSubscription`, `getPayment`, `cancelSubscription`
- **Esforço:** ~3h

### 21.4 — Migrar checkout: `/api/stripe/platform-checkout` → `/api/asaas/platform-checkout`
- [ ] Criar `src/app/api/asaas/platform-checkout/route.ts`
  - Criar/buscar Customer no Asaas (cpfCnpj obrigatório → coletar no formulário)
  - Criar Subscription com `billingType: CREDIT_CARD` (anual) ou `PIX` (mensal)
  - Retornar `paymentLink` ou QR code PIX para o frontend
- [ ] Atualizar `src/components/community/plan-checkout-button.tsx` para usar nova rota
- [ ] Atualizar `src/app/dashboard/assinar/page.tsx` para Asaas checkout
- [ ] Coletar CPF/CNPJ no formulário de checkout (obrigatório pelo Asaas)
- **Esforço:** ~5h

### 21.5 — Migrar webhook: `/api/webhooks/stripe` → `/api/webhooks/asaas`
- [ ] Criar `src/app/api/webhooks/asaas/route.ts`
  - Verificar `X-Asaas-Webhook-Token` (equivalente ao webhook secret do Stripe)
  - Mapear eventos: `PAYMENT_CONFIRMED` → ativar membership, `PAYMENT_OVERDUE` → suspender, `SUBSCRIPTION_INACTIVATED` → cancelar
  - Reusar lógica de `payment.service.ts` (adaptar para estrutura Asaas)
- [ ] Registrar URL do webhook no painel Asaas (`/api/webhooks/asaas`)
- [ ] Remover dependência de `stripe.webhooks.constructEvent` (não existe no Asaas)
- **Esforço:** ~5h

### 21.6 — Billing portal alternativo
- [ ] Asaas não tem portal de assinante — criar página interna `/dashboard/assinatura`
  - Exibir: plano atual, próximo vencimento, valor, status
  - Botão "Cancelar assinatura" → chama `DELETE /api/asaas/subscription/me` → cancela no Asaas
  - Botão "Atualizar cartão" → gera novo link de pagamento Asaas
- [ ] Remover dependência do Stripe billing portal de `src/app/api/stripe/billing-portal`
- **Esforço:** ~3h

### 21.7 — Cleanup Stripe
- [ ] Remover (ou deprecar) rotas Stripe: `platform-checkout`, `billing-portal`, `premium-upgrade`
- [ ] Remover variáveis `STRIPE_*` do `.env.local` e `.env.example` (ou manter como comentário durante transição)
- [ ] Remover dependência `stripe` do `package.json` (após validar que Asaas está 100%)
- [ ] Atualizar CLAUDE.md: gateway = Asaas
- **Esforço:** ~2h

---

## 🟢 BACKLOG — Fase 2 (após validação com primeiros usuários)

- **Feed recomendado** — posts engajados de todas as comunidades (algoritmo engajamento × recência)
- **Chat ao vivo geral** — visível apenas com ≥10 membros online
- **Ranking mensal com reset** — além do all-time, reseta dia 1/mês
- **Moderação por Superfãs** — ≥85 pts por 60 dias como candidato
- **Notificações motivacionais de performance** — "Você está no top 3 esta semana!"
- **Badge de saúde do influenciador** — 🟢/🟡/🔴 visível na página da comunidade
- **Carrossel de banners** — anunciantes, eventos, lançamentos (máx. 5)
- **CrewHouse / Pitcrew** — plataforma mãe gratuita (aguarda Horizonte 1)
- **Widget "Meu Ticket Médio"** — membro declara ticket atual no onboarding e atualiza mensalmente

---

## 📁 ARQUIVOS-CHAVE

| Arquivo | Função |
|---------|--------|
| `src/lib/rate-limit.ts` | Rate limiter (Upstash — já migrado no Sprint 6) |
| `src/lib/points.ts` | Utilitário central de pontos |
| `src/middleware/auth.middleware.ts` | withAuth, withRole, verifyMembership |
| `src/app/api/uploadthing/route.ts` | Config de upload |
| `src/app/api/webhooks/stripe/route.ts` | Webhook Stripe |
| `src/app/api/auth/register/route.ts` | Registro (verificação de email) |
| `src/app/api/cron/pp-distribution/route.ts` | Distribuição Caixa de Performance — dia 15 |
| `prisma/schema.prisma` | Schema do banco |
| `vercel.json` | Crons agendados (5 crons) |
| `branding/novos arquivos e documentações/` | Documentos estratégicos fundacionais |

---

## 🗒️ CONTEXTO DO MODELO DE NEGÓCIO

- **Preço de lançamento:** R$79/mês (mensal) | R$?/ano — definir no Sprint 12 (divergência documental)
- **Split de receita:** 50% plataforma / 35% influenciador (dono do membro, imutável) / 15% caixa de performance
- **Dono do membro:** imutável após criação — influenciador que trouxe o membro via referral recebe 35% enquanto o membro estiver ativo
- **Break-even:** 150 membros (~R$5.391/mês para a plataforma)
- **Meta H1:** 5.000 membros, churn <7%/mês, NPS influenciadores >50
- **Gateway de pagamento:** Stripe (atual) | Asaas (planejado nos documentos) — decidir no Sprint 12
- **PIC:** Detailer autônomo, 25–38 anos, faturando R$3.000–8.000/mês — sabe executar, não sabe cobrar
- **Promessa central:** "Domine as técnicas que pagam mais — e aprenda a cobrar por elas"
- **ROI da assinatura:** 45x–60x (R$948/ano contra R$43.000–57.000 de receita incremental potencial)
- **Horizonte 1 completo quando:** 5.000 membros + churn <7% + NPS >50 + 3 contratos de anunciantes
- **Horizon 2:** Expansão para novos nichos automotivos (aguarda H1)
- **Horizon 3:** CrewHouse/Pitcrew — plataforma mãe gratuita (aguarda H2)
