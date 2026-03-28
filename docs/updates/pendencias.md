# Pendências do Projeto — Detailer'HUB
> Atualizado em: 2026-03-28

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
| **15** | **Ferramentas e Downloads (Proposta de Valor Concreta)** | ✅ Código completo / ⚠️ Conteúdo editorial pendente (fundador) |
| **16** | **Onboarding em 7 Dias (Ativação de Membros)** | ✅ Completo |
| **17** | **Landing Page Completa (Conversão)** | ✅ Completo |
| **18** | **Dashboard do Influenciador Completo** | ✅ Completo |
| **19** | **Certificado Verificável por QR Code** | ✅ Completo |
| **20** | **Página /para-criadores e Onboarding de Influenciadores** | ✅ Completo |
| **21** | **Migração Stripe → Asaas** | ✅ Código completo / ⚠️ Configurar credenciais Asaas (fundador) |
| **22** | **Redesign UX — Experiência do Membro (Home + Comunidades)** | ✅ Completo (2026-03-28) |

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

---

## 🔴 SPRINT 22 — Redesign UX — Experiência do Membro (Home + Comunidades)
> Planejado em: 2026-03-28 | Status: Não iniciado
> **Prioridade máxima** — o produto está visualmente inadequado para o posicionamento premium da marca. Toda a experiência do membro (home, descoberta de comunidades, interior de comunidade, trilhas, lives, navegação) foi diagnosticada como abaixo do padrão exigido.

### Diagnóstico do problema (por que fazer agora)

**`/inicio` (MemberDashboard.tsx):**
- `HeroBanner` genérico sem CTA contextual — desperdício de espaço nobre
- `CommunitiesRow` = scroll horizontal de logos minúsculos — comunidade tratada como afterthought
- `TrackInProgress` = card simples sem urgência ou progresso visual
- `TrendingFeed` + `NextLiveCard` + `RankingBlock` no mesmo grid sem hierarquia — membro não sabe onde olhar

**Interior da comunidade (`/community/[slug]/feed`):**
- Lista de spaces como cards com ícone Hash + nome = zero identidade da comunidade
- O influencer (dono da comunidade) é completamente invisível
- Cada sub-rota (feed, trilhas, members, leaderboard) tem visual diferente — membro sente que "sai" da comunidade
- Nenhuma tab de Lives por comunidade
- Trilhas listadas linearmente sem experiência visual

**Sidebar do membro:**
- Comunidades não aparecem na nav — 2 cliques + scroll pra acessar qualquer comunidade
- Viola o princípio de "Ação" do Hooked (Nir Eyal): esforço desnecessário para retornar ao conteúdo

**Impacto nos livros de referência:**
- **Hooked**: Trigger → Action fraca (muitos cliques), Reward inconsistente (sem novidade visível), Investment não reforçado (progresso invisível)
- **Superfãs**: Jornada casual → fã não está sendo nutrida — o membro não sabe o que fazer a seguir
- **Wiki Brands**: Sem senso de pertencimento — comunidades não têm personalidade visual
- **Estratégia de Plataforma**: Efeitos de rede não visíveis — membro não vê quanto a plataforma está ativa

---

### PARTE 1 — Redesign do `/inicio` (MemberDashboard)

#### 1.1 Novo Layout — Wireframe por Bloco

```
┌────────────────────────────────────────────────────────┐
│ A. GREETING BAR                                        │
│    "Olá, Rafael!" + Streak pill + XP pill + Nível      │
├────────────────────────────────────────────────────────┤
│ B. ACTIVITY PULSE                                      │
│    "Desde sua última visita:"                          │
│    [3 novas aulas] [Live em 2h ●] [2 notificações]     │
│    (some se nada novo)                                 │
├────────────────────────────────────────────────────────┤
│ C. HERO: CONTINUAR ASSISTINDO — full width             │
│    Thumbnail grande (ratio 16:5 desktop, 16:9 mobile)  │
│    Overlay escuro com gradiente                        │
│    "Continuar assistindo · [Nome da Comunidade]"       │
│    Título da trilha + nome da aula atual               │
│    Barra de progresso + "▶ Continuar"                  │
│    (se sem trilha: banner com CTA "Explorar trilhas") │
│    (se sem assinatura: banner de upgrade)              │
├──────────────────────┬─────────────────────────────────┤
│ D. MINHAS COMUNIDADES│ E. PRÓXIMA LIVE + MINI RANKING  │
│    (lg:col-span-2)   │    (lg:col-span-1)              │
│    Grid 2 colunas    │                                 │
│    max 4 cards       │    NextLiveCard redesenhado      │
│    "Ver todas →"     │    MiniRankingCard compacto      │
│                      │                                 │
├──────────────────────┴─────────────────────────────────┤
│ F. EM ALTA NAS COMUNIDADES — scroll horizontal         │
│    Cards 280px snap-x (community chip + título + stats)│
├────────────────────────────────────────────────────────┤
│ G. ONBOARDING (hasPlatform && !dismissed apenas)       │
└────────────────────────────────────────────────────────┘
```

#### 1.2 Nova composição do `MemberDashboard.tsx`

```tsx
<div className="space-y-5">
  <GreetingBar />
  <ActivityPulse />
  <HeroContinueWatching />
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
    <div className="lg:col-span-2">
      <MemberCommunitiesGrid hasPlatform={hasPlatform} />
    </div>
    <div className="lg:col-span-1 space-y-4">
      <NextLiveCard />
      <MiniRankingCard userId={userId} />
    </div>
  </div>
  <TrendingHorizontal />
  {hasPlatform && <MemberOnboarding />}
</div>
```

#### 1.3 Componentes novos a criar

**`src/components/dashboard/GreetingBar.tsx`**
- Props: nenhuma (lê de `useDashboardContext`)
- Layout: saudação com nome à esquerda + pills à direita
- `StreakPill`: `bg-orange-500/10 text-orange-400 border-orange-500/20` com ícone Flame — se streak >= 7 adiciona `animate-pulse`
- `XpPill`: XP atual / próximo nível em `bg-[#006079]/10 text-[#009CD9]`
- `LevelBadge`: nível com nome (ex: "Nível 3 — Profissional")
- `contextualSubtitle` gerado por lógica:
  - streak >= 3: "Continue assim, você está em sequência!"
  - absentDays >= 3: "Sentimos sua falta. Veja o que aconteceu."
  - newContentSinceLogin > 0: "[Influencer] publicou X aulas novas."

**`src/components/dashboard/ActivityPulse.tsx`**
- Props: nenhuma (lê de `useDashboardContext`)
- Mostra: "Desde ontem:" + pills clicáveis com links diretos
- Dados: `newContentSinceLogin`, `unreadNotifications`, `nextLive`
- Se nada novo: `return null` (não ocupa espaço)

**`src/components/dashboard/HeroContinueWatching.tsx`**
- Substitui `HeroBanner.tsx` e `TrackInProgress.tsx`
- Estado com trilha ativa: thumbnail grande + overlay gradiente + progresso + "▶ Continuar"
- Barra de progresso com animação `growWidth` na entrada (via `useEffect` + CSS var)
- Estado sem trilha: banner visual com CTA "Explorar trilhas →"
- Estado `hasPlatform=false`: banner upgrade teal/dark com CTA

**`src/components/dashboard/MemberCommunitiesGrid.tsx`**
- Substitui `CommunitiesRow.tsx`
- Separa `myComms` (isMember=true) de `discover` (isMember=false, máx 2)
- Grid 2 colunas
- `CommunityGridCard` — card horizontal compacto:
  - Logo 44x44 + nome + subtítulo (influencer) à esquerda
  - Badge de atividade recente à direita: "3 novas aulas", "Live hoje", "Ativo"
  - Seta → de navegação
  - `hover:border-[#006079]/40 hover:bg-white/8 transition-all`
- Link "Ver todas →" aponta para `/explorar`

**`src/components/dashboard/TrendingHorizontal.tsx`**
- Substitui `TrendingFeed.tsx` (lista vertical)
- `flex gap-3 overflow-x-auto pb-2 snap-x`
- `TrendingPostCard`: `flex-shrink-0 w-[280px] snap-start` com community chip + título (2 linhas) + engajamento

**`src/components/dashboard/MiniRankingCard.tsx`**
- Versão compacta do `RankingBlock.tsx`
- Mostra: minha posição + top 3 avatars + "Ver ranking →"
- Consome `/api/leaderboard?limit=3&period=month`

**`src/hooks/useDashboardContext.ts`**
- Hook compartilhado para evitar fetch duplo entre GreetingBar e ActivityPulse
- Consome `GET /api/dashboard/context`
- Retorna `{ data, loading }`

#### 1.4 APIs que precisam ser modificadas

**`GET /api/dashboard/context/route.ts`** — adicionar ao retorno:
```ts
const nextLive = await db.liveSession.findFirst({
  where: { status: { in: ["SCHEDULED", "LIVE"] }, scheduledAt: { gte: now } },
  orderBy: { scheduledAt: "asc" },
  select: { title: true, scheduledAt: true, status: true },
});
// Adicionar `nextLive` ao objeto `baseContext`
```

**`GET /api/communities/route.ts`** — para `view=dashboard`, adicionar campos:
```ts
newContentCount: // count de ContentLesson com createdAt >= 7daysAgo para essa comunidade
hasLiveToday:    // boolean — tem LiveSession com scheduledAt em today
```

#### 1.5 Estados completos do MemberDashboard

| Estado | `hasPlatform` | `trail` | Resultado |
|--------|---------------|---------|-----------|
| Carregando | `null` | — | Skeleton completo animate-pulse |
| Novo sem assinatura | `false` | — | Hero de upgrade + comunidades locked |
| Assinante, sem trilha | `true` | `null` | Hero com CTA "Começar trilha" |
| Assinante com trilha | `true` | objeto | HeroContinueWatching com thumbnail |
| Retornou após 3+ dias | `true` | qualquer | ActivityPulse em destaque |

#### 1.6 Animações e micro-interações

- Delays escalonados em cada bloco: GreetingBar sem delay, ActivityPulse 100ms, Hero 150ms, Grid 250ms, Trending 350ms
- Barra de progresso do hero: `@keyframes growWidth { from { width: 0 } to { width: var(--progress-width) } }` executado em 800ms ease-out via `useEffect` após mount
- StreakPill com `animate-pulse` se streak >= 7

---

### PARTE 2 — Página "Explorar Comunidades" (`/explorar`)

#### 2.1 Rota nova: `src/app/explorar/page.tsx` + `src/app/explorar/layout.tsx`

- Dentro do layout autenticado (sidebar, dark theme, header com notificações)
- Item "Explorar" adicionado à sidebar via `navigation.ts` (grupo `principal`)
- Ícone: `Compass`

#### 2.2 Layout completo

```
┌────────────────────────────────────────────────────────┐
│ Header: "Explorar Comunidades"  [Busca inline]         │
├────────────────────────────────────────────────────────┤
│ Filtros: [Todas] [Detailing] [Tuning] [Mecânica]       │
│          [+ ativas] [Novas] [Só as minhas]             │
├────────────────────────────────────────────────────────┤
│ MINHAS COMUNIDADES (scroll horizontal compacto)        │
│ (cards horizontais compactos das comunidades do membro)│
├────────────────────────────────────────────────────────┤
│ GRID PRINCIPAL                                         │
│ grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5       │
│ (ExploreCommunityCommunityCard — card rico)            │
└────────────────────────────────────────────────────────┘
```

#### 2.3 `ExploreCommunityCommunityCard` — anatomia completa

```
┌────────────────────────────────┐
│ BANNER h-40 com overlay        │
│ [Badge NOVA] [Badge AO VIVO ●] │
│ [member count top-right]       │
│       [Logo 56px bordado]      │  ← posicionado sobre o banner
├────────────────────────────────┤
│ pt-8 px-5 pb-5                 │
│                                │
│ [avatar 20px] por [nome infl.] │
│ **Nome da Comunidade**         │
│ Descrição (2 linhas max)       │
│                                │
│ [👥 247] [📚 3 trilhas] [🎬 2] │
│ #detailing  #ppf               │
│ ─────────────────────────────  │
│ R$ 79/mês  [Acessar →]        │
└────────────────────────────────┘
```

**Estados por membership:**
- `hasPlatform=true && isMember=true` → "Acessar →" teal, sem lock
- `hasPlatform=true && isMember=false` → "Participar →" com price
- `hasPlatform=false` → card `opacity-70` + lock + "Assinar para acessar"
- `hasPlatform=null` → skeleton

#### 2.4 Filtros e ordenação

```typescript
type SortOption = 'active' | 'new' | 'members';
type CategoryFilter = '' | 'detailing' | 'tuning' | 'mecanica' | 'eletrico' | 'offroad';
```

- Filtro "Só as minhas" → client-side (`isMember === true`)
- Ordenação `sort=active/new/members` → server-side via query param na API
- Adicionar `sort` e campos `moduleCount`, `liveFrequency` ao `GET /api/communities/route.ts` para `view=explore`

#### 2.5 API necessária: `GET /api/communities?view=explore&sort=active&tag=detailing`

Nova view da API existente. Adicionar ao `route.ts`:
- `moduleCount`: count de espaços tipo COURSE da comunidade
- `liveFrequency`: count de liveSession dos últimos 30 dias
- `sort`: `active` → orderBy engajamento, `new` → orderBy createdAt desc, `members` → orderBy memberCount desc
- `tag`: filtro por tag da comunidade (campo `tags` ou `category`)

---

### PARTE 3 — Redesign do Interior da Comunidade

#### 3.1 Problema de arquitetura atual

Cada sub-rota tem visual e layout diferentes:
- `/community/[slug]/feed` — layout próprio com sidebar de spaces
- `/community/[slug]/trilhas` — `min-h-screen` sem sidebar
- `/community/[slug]/members` — sticky header próprio
- `/community/[slug]/leaderboard` — sticky header próprio

Resultado: membro sente que sai e volta da comunidade a cada tab. O influencer é invisível.

#### 3.2 Solução: Layout Unificado com Tabs Persistentes

**Criar: `src/app/community/[communitySlug]/layout.tsx`**

Este novo layout envolve todas as sub-rotas. O `feed/layout.tsx` existente passa a ser um wrapper simples (ou é eliminado e o conteúdo migra para cá).

O layout tem duas zonas:
1. **CommunityHeader** (sempre visível, acima dos tabs)
2. **CommunityTabs** (sticky ao scrollar, below do header do dashboard)

**Criar: `src/contexts/community-context.tsx`**
- Provê os dados da comunidade (overview) para todos os filhos via Context
- Evita fetch duplicado no `feed/page.tsx` que hoje também faz fetch do overview
- O `ChatWidget` (que está no `feed/layout.tsx` atual) deve ler desse contexto

#### 3.3 CommunityHeader — `src/components/community/CommunityHeader.tsx`

```typescript
interface CommunityHeaderProps {
  community: {
    id: string;
    name: string;
    slug: string;
    bannerUrl: string | null;
    logoUrl: string | null;
    primaryColor: string;
    memberCount: number;
    shortDescription: string | null;
    influencer: {
      displayName: string;
      user: { avatarUrl: string | null; firstName: string; lastName: string }
    } | null;
  };
  optedIn: boolean | null;
  onOptIn: () => void;
  optInLoading: boolean;
}
```

**Layout visual:**
```
┌──────────────────────────────────────────────────────┐
│ BANNER (h-32 sm:h-40) com primaryColor da comunidade │
│ Gradiente sobre o banner para legibilidade           │
│                                                      │
│  [Logo 64px, borda branca 3px, shadow]              │
│  NOME DA COMUNIDADE (text-2xl font-black)            │
│  por [avatar 24px] Nome do Influencer               │
│  [247 membros]  ·  [✓ Seguindo] ou [+ Participar]   │
└──────────────────────────────────────────────────────┘
```

**APIs que precisam ser atualizadas:**
- `GET /api/communities/[id]/overview/route.ts` → adicionar `influencer.user.avatarUrl`, `influencer.displayName`, `memberCount` ao retorno (verificar se já existe)

#### 3.4 CommunityTabs — `src/components/community/CommunityTabs.tsx`

```typescript
const TABS = [
  { id: 'feed',     label: 'Feed',    href: (slug) => `/community/${slug}/feed` },
  { id: 'trilhas',  label: 'Trilhas', href: (slug) => `/community/${slug}/trilhas` },
  { id: 'lives',    label: 'Lives',   href: (slug) => `/community/${slug}/lives` },
  { id: 'membros',  label: 'Membros', href: (slug) => `/community/${slug}/members` },
  { id: 'ranking',  label: 'Ranking', href: (slug) => `/community/${slug}/leaderboard` },
];
```

- Tab ativa derivada de `usePathname()`
- Sticky: `position: sticky; top: 56px; z-index: 20` (abaixo do header do dashboard que tem h-14)
- `bg-[#1A1A1A]/95 backdrop-blur-md border-b border-white/10`
- Overflow scroll horizontal sem scrollbar visível (`hide-scrollbar`)
- Indicador ativo usa `primaryColor` da comunidade (via `style` prop — Tailwind não suporta cor dinâmica)
- Tab Lives: ponto vermelho pulsante `bg-red-500 animate-pulse` se há live ativa

```tsx
// Cor dinâmica: não usar className com valor dinâmico (Tailwind purge)
// Usar style prop:
style={{ borderBottomColor: isActive ? community.primaryColor : 'transparent' }}
```

#### 3.5 Feed com Two-Panel Layout

**Modificar: `src/app/community/[communitySlug]/feed/page.tsx`**

Com o layout unificado, a página de feed passa a mostrar apenas o conteúdo do painel direito. O painel esquerdo (lista de spaces) permanece na sidebar lateral da comunidade.

**O grid de cards de spaces que existe hoje SOME** — os spaces ficam no painel esquerdo da sidebar, não mais como cards na área central.

**Novo estado padrão da área de conteúdo:** Feed Agregado da comunidade — posts recentes de todos os spaces ordenados por `createdAt desc`.

```
DESKTOP: Two-panel layout
┌──────────────┬────────────────────────────────────────┐
│ SPACES (w-56)│ FEED AGREGADO / SPACE ATIVO             │
│ fixo         │                                        │
│              │ PostCard redesenhado:                  │
│ # geral      │ [avatar 36px] Nome · #canal · 2h      │
│ 📢 avisos    │ **Título do post**                     │
│ ❓ perguntas │ Prévia texto (3 linhas)                │
│ 🏆 showcase  │ [♥ 12] [💬 5]  Ver post →             │
│              │                                        │
│ ── Trilhas   │ (scroll infinito via intersection obs) │
│ ── Lives     │                                        │
└──────────────┴────────────────────────────────────────┘

MOBILE: painel esquerdo = drawer com hamburguer
```

**Nova API necessária: `GET /api/communities/[id]/feed`**

Criar `src/app/api/communities/[id]/feed/route.ts`:
```ts
// Query: posts de todos os spaces da comunidade
const posts = await db.post.findMany({
  where: { space: { communityId: id } },
  orderBy: { createdAt: 'desc' },
  take: limit ?? 20,
  include: {
    author: { select: { firstName: true, lastName: true, avatarUrl: true } },
    space: { select: { name: true, slug: true } },
    _count: { select: { reactions: true, comments: true } },
  },
});
```

#### 3.6 Tab Trilhas — Experiência Netflix

**Redesenhar: `src/app/community/[communitySlug]/trilhas/page.tsx`**

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ HERO DA TRILHA (ratio 21:9)                         │
│ Thumbnail da trilha em progresso + overlay           │
│ "Continuar: [Módulo X — Aula Y]" + "▶ Continuar"   │
│ (se sem progresso: primeira trilha disponível)       │
├──────────────────────────────────────────────────────┤
│ CONTINUAR ASSISTINDO (se há progresso parcial)       │
│ ← scroll horizontal de módulos em progresso →        │
│ [card 200px: thumbnail + % + próxima aula]           │
├──────────────────────────────────────────────────────┤
│ POR TRILHA (cada space COURSE):                      │
│                                                      │
│ "Detailing Profissional"  [4 módulos · 28 aulas]     │
│ ← [Módulo 1 ✓] [Módulo 2 ●50%] [Módulo 3 🔒] →    │
│                                                      │
│ "PPF e Vinil"  [3 módulos · 21 aulas]               │
│ ← [Módulo 1] [Módulo 2] [Módulo 3] →               │
└──────────────────────────────────────────────────────┘
```

**`ModuleCard` redesenhado** (criar ou modificar `src/components/content/ModuleCard.tsx`):
```
className="flex-shrink-0 w-[220px] rounded-xl overflow-hidden border border-white/10 bg-[#111]
           hover:border-[primaryColor]/40 transition-all cursor-pointer"

Thumbnail (16:9):
  - Estado completed: overlay com check verde no canto
  - Estado in-progress: barra de progresso na borda inferior (primaryColor)
  - Estado locked: overlay escuro 70% + ícone cadeado

Rodapé (px-3 py-2.5):
  - Nome do módulo (1 linha, truncate)
  - "X aulas" em text-gray-400 text-xs
  - Badge: "✓ Completo" verde | "X%" teal | "Bloqueado" cinza
```

**Nova API necessária: `GET /api/communities/[id]/active-trail`**

Variante contextual da rota `/api/dashboard/active-trail` já existente, mas filtrada pela comunidade específica.

#### 3.7 Tab Lives — Rota Nova

**Criar: `src/app/community/[communitySlug]/lives/page.tsx`**

```
┌──────────────────────────────────────────────────────┐
│ AO VIVO AGORA (se houver — condicional)              │
│ Card full-width com gradiente animado + "Entrar"     │
│ (pulsação na borda para chamar atenção)              │
├──────────────────────────────────────────────────────┤
│ PRÓXIMAS LIVES                                       │
│ Lista com data/hora + título + [📅 Lembrar]          │
├──────────────────────────────────────────────────────┤
│ GRAVAÇÕES ANTERIORES                                 │
│ grid-cols-2 sm:grid-cols-3 gap-4                    │
│ Thumbnail + título + data + duração                  │
└──────────────────────────────────────────────────────┘
```

**Nova API necessária: `GET /api/communities/[id]/lives`**

Criar `src/app/api/communities/[id]/lives/route.ts`:
```ts
// Retorna objeto agrupado em uma chamada:
const [live, upcoming, recordings] = await Promise.all([
  db.liveSession.findFirst({ where: { communityId: id, status: "LIVE" } }),
  db.liveSession.findMany({ where: { communityId: id, status: "SCHEDULED", scheduledAt: { gte: now } }, take: 5 }),
  db.liveSession.findMany({ where: { communityId: id, status: "ENDED" }, take: 12, orderBy: { scheduledAt: 'desc' } }),
]);
return { live, upcoming, recordings };
```

#### 3.8 Tab Membros — Grid Visual

**Redesenhar: `src/app/community/[communitySlug]/members/page.tsx`**

Duas sub-views com tabs internas: `[Diretório] [Ranking]`
- O Ranking já existe em `/leaderboard/page.tsx` — integrar como sub-tab aqui
- `/leaderboard` vira redirect para `/members?tab=ranking`

**Grid do Diretório:**
```
grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4

MemberCard (vertical):
┌──────────────────┐
│   [Avatar 56px]  │
│   Nome           │
│   Nível X · Y pts│
│   🏅 badge       │
│   Bio (2 linhas) │
│   Membro há 45d  │
└──────────────────┘
```

---

### PARTE 4 — Redesign da Sidebar (Navegação)

#### 4.1 Princípio

Membro deve enxergar comunidades na sidebar como acesso de 1 clique (Hooked: reduzir esforço da "Action"). Senso de pertencimento: "essas comunidades são minhas" (Wiki Brands).

#### 4.2 Nova estrutura de navegação para COMMUNITY_MEMBER

```
PRINCIPAL
  🏠 Início          → /inicio
  🧭 Explorar        → /explorar          (NOVO)
  📅 Calendário      → /dashboard/calendar
  💬 Mensagens       → /dashboard/messages

MINHAS COMUNIDADES                         (NOVO — dinâmico)
  [logo] Gimenez Detailing → /community/gimenez/feed
  [logo] Barba Clube       → /community/barba/feed
  [logo] Neto Motors       → /community/neto/feed
  + Explorar comunidades

CONTEÚDO
  📚 Meu Aprendizado  → /dashboard/meu-aprendizado
  🔧 Ferramentas      → /dashboard/ferramentas
```

#### 4.3 Mudanças em `src/lib/navigation.ts`

```typescript
// Adicionar item Explorar
{ label: 'Explorar', href: '/explorar', icon: 'Compass', roles: [UserRole.COMMUNITY_MEMBER, UserRole.MARKETPLACE_PARTNER], group: 'principal' },

// Novo grupo (para labels apenas — comunidades são dinâmicas, não ficam em NAV_ITEMS)
export type NavGroup = 'principal' | 'comunidades' | 'gestao' | 'conteudo' | 'admin';
export const GROUP_LABELS = {
  ...existentes,
  comunidades: 'Minhas Comunidades',
};
```

#### 4.4 Mudanças em `src/components/layout/DashboardSidebar.tsx`

**Adicionar estado:**
```typescript
const [memberCommunities, setMemberCommunities] = useState<MemberCommunity[]>([]);

interface MemberCommunity {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  hasUnread?: boolean;
}
```

**Fetch na inicialização (só para COMMUNITY_MEMBER):**
```typescript
useEffect(() => {
  if (navRole !== UserRole.COMMUNITY_MEMBER) return;
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  fetch('/api/communities?view=sidebar', {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
    .then(r => r.json())
    .then(d => { if (d.success) setMemberCommunities(d.communities ?? []); })
    .catch(() => {});
}, [navRole]);
```

**Seção na nav (inserir após "Principal", antes de "Conteúdo"):**
- Label "MINHAS COMUNIDADES" em uppercase tracking-widest (esconde no collapsed)
- Cada comunidade: logo/initial (18px) + nome (esconde no collapsed) + link direto
- Indicador ativo: barra de 2px na esquerda com `primaryColor` da comunidade (não a cor global)
- Link "+ Explorar comunidades" no rodapé da seção

**Comportamento collapsed:**
- Comunidades aparecem como logos/initials empilhados (18x18px) com tooltip no `title`
- Inspirado no Discord com servers na sidebar

**Nova API necessária: `GET /api/communities?view=sidebar`**

Adicionar ao `route.ts` existente. Retorna apenas comunidades onde o usuário é membro, com campos mínimos:
```ts
{ id, name, slug, logoUrl, primaryColor }
```
Header: `Cache-Control: private, max-age=60` — não muda a cada segundo.

---

### PARTE 5 — Mapa de Arquivos Completo

#### Criar (16 arquivos novos)

| Arquivo | Descrição |
|---------|-----------|
| `src/components/dashboard/GreetingBar.tsx` | Saudação + streak/XP/nível pills |
| `src/components/dashboard/ActivityPulse.tsx` | "Desde sua última visita:" com pills |
| `src/components/dashboard/HeroContinueWatching.tsx` | Hero full-width com trilha em progresso |
| `src/components/dashboard/MemberCommunitiesGrid.tsx` | Grid 2col de comunidades com activity badges |
| `src/components/dashboard/TrendingHorizontal.tsx` | Scroll horizontal de posts em alta |
| `src/components/dashboard/MiniRankingCard.tsx` | Ranking compacto para sidebar direita da home |
| `src/components/community/CommunityHeader.tsx` | Header com banner, logo, influencer, stats |
| `src/components/community/CommunityTabs.tsx` | Tabs sticky (Feed/Trilhas/Lives/Membros/Ranking) |
| `src/hooks/useDashboardContext.ts` | Hook compartilhado para /api/dashboard/context |
| `src/contexts/community-context.tsx` | Contexto da comunidade para sub-rotas |
| `src/app/explorar/layout.tsx` | Re-exporta dashboard layout |
| `src/app/explorar/page.tsx` | Página de descoberta de comunidades |
| `src/app/community/[communitySlug]/layout.tsx` | Layout unificado com Header + Tabs |
| `src/app/community/[communitySlug]/lives/page.tsx` | Tab de lives por comunidade |
| `src/app/api/communities/[id]/feed/route.ts` | Posts agregados de todos os spaces |
| `src/app/api/communities/[id]/lives/route.ts` | Lives agrupadas (live/upcoming/recordings) |

#### Modificar (11 arquivos existentes)

| Arquivo | O que muda |
|---------|------------|
| `src/components/dashboard/MemberDashboard.tsx` | Nova composição completa dos blocos |
| `src/components/layout/DashboardSidebar.tsx` | Adicionar fetch + seção de comunidades + Explorar |
| `src/lib/navigation.ts` | Adicionar "Explorar" + grupo `comunidades` + GROUP_LABELS |
| `src/app/api/communities/route.ts` | Views: `sidebar`, `explore`; campos: `sort`, `newContentCount`, `hasLiveToday`, `moduleCount`, `liveFrequency` |
| `src/app/api/dashboard/context/route.ts` | Adicionar `nextLive` ao `baseContext` |
| `src/app/api/communities/[id]/overview/route.ts` | Incluir `influencer.user.avatarUrl`, `influencer.displayName`, `memberCount` |
| `src/app/community/[communitySlug]/feed/layout.tsx` | Transformar em wrapper simples (mover lógica para `[communitySlug]/layout.tsx`) |
| `src/app/community/[communitySlug]/feed/page.tsx` | Feed agregado no painel direito (remover grid de spaces) |
| `src/app/community/[communitySlug]/trilhas/page.tsx` | Experiência Netflix com scroll horizontal por trilha |
| `src/app/community/[communitySlug]/members/page.tsx` | Grid vertical + sub-tabs Diretório/Ranking |
| `src/components/content/ModuleCard.tsx` | Redesenho para formato de card Netflix |

---

### PARTE 6 — Sequência de Implementação (ordem por impacto)

#### ✅ Fase 1 — Concluída em 2026-03-28 (0 erros TypeScript)

**1.1 — Sidebar com comunidades** ✅
- `GET /api/communities?view=sidebar` → retorna comunidades do membro (campos mínimos), `Cache-Control: private, max-age=60`
- `DashboardSidebar.tsx` → seção "Minhas Comunidades" dinâmica com logo/initial + `primaryColor` no indicador ativo
- Modo collapsed → comunidades como ícones empilhados (max 6), com `title` tooltip
- Item "Explorar" adicionado a `navigation.ts` (Compass icon, grupo principal, só membros)
- `buildSections()` atualizado para incluir "Explorar" e "Ferramentas" no sidebar

**1.2 — GreetingBar + ActivityPulse** ✅
- `src/hooks/useDashboardContext.ts` → cache module-level 60s, evita fetch duplo
- `GET /api/dashboard/context` → adicionado `nextLive` ao `Promise.all` e ao `baseContext`
- `src/components/dashboard/GreetingBar.tsx` → saudação + subtitle contextual + streak pill (animate-pulse se >= 7d) + level badge + XP bar compacta
- `src/components/dashboard/ActivityPulse.tsx` → pills clicáveis para new content, live, notificações — some se nada novo

**1.3 — HeroContinueWatching** ✅
- `src/components/dashboard/HeroContinueWatching.tsx` → 3 estados: upgrade (hasPlatform=false) / sem trilha / hero com thumbnail + overlay + progress bar animada
- Substitui `HeroBanner` + `TrackInProgress` no `MemberDashboard.tsx`
- `MemberDashboard.tsx` → nova composição: GreetingBar → ActivityPulse → HeroContinueWatching → grid(CommunitiesRow 2/3 + Live+Ranking 1/3) → TrendingFeed → Onboarding

#### Fase 2 — Interior da comunidade (3–4 dias)

**2.1 — CommunityHeader + Tabs + Layout unificado** (Grande)
1. Atualizar `GET /api/communities/[id]/overview/route.ts` com dados do influencer
2. Criar `CommunityHeader.tsx`
3. Criar `CommunityTabs.tsx` com indicador primário dinâmico
4. Criar `src/contexts/community-context.tsx`
5. Criar `src/app/community/[communitySlug]/layout.tsx` unificado
6. Simplificar `feed/layout.tsx` existente

**2.2 — Feed com Two-Panel** (Grande)
1. Criar `GET /api/communities/[id]/feed/route.ts`
2. Redesenhar `feed/page.tsx` — remover grid de spaces, adicionar feed agregado
3. Refinar painel esquerdo de spaces

**2.3 — Tab Trilhas Netflix** (Grande)
1. Criar `GET /api/communities/[id]/active-trail/route.ts`
2. Redesenhar `trilhas/page.tsx` — hero + scroll horizontal por trilha
3. Redesenhar `ModuleCard.tsx` — formato Netflix com estados visuais

#### Fase 3 — Explorar + Lives + Membros (3–4 dias)

**3.1 — Tab Lives** (Médio)
1. Criar `GET /api/communities/[id]/lives/route.ts`
2. Criar `src/app/community/[communitySlug]/lives/page.tsx`
3. Dot pulsante na tab "Lives" quando ao vivo

**3.2 — Membros grid** (Pequeno)
1. Redesenhar `members/page.tsx` com grid vertical
2. Integrar leaderboard como sub-tab interna
3. `/leaderboard` → redirect para `/members?tab=ranking`

**3.3 — Página Explorar** (Médio)
1. Criar `src/app/explorar/layout.tsx`
2. Criar `src/app/explorar/page.tsx`
3. Criar `ExploreCommunityCommunityCard` com card rico
4. Adicionar `view=explore`, `sort`, `moduleCount`, `liveFrequency` à API

#### Fase 4 — Home: polimento final (2 dias)

**4.1 — MemberCommunitiesGrid** (Médio)
1. Adicionar `newContentCount` e `hasLiveToday` à API `view=dashboard`
2. Criar `MemberCommunitiesGrid.tsx` com `CommunityGridCard`
3. Substituir `CommunitiesRow` no `MemberDashboard.tsx`

**4.2 — TrendingHorizontal + MiniRankingCard** (Pequeno)
1. Criar `TrendingHorizontal.tsx` com scroll snap horizontal
2. Criar `MiniRankingCard.tsx` com top 3
3. Integrar no grid direito do `MemberDashboard.tsx`

---

### PARTE 7 — Notas Críticas de Implementação

1. **Hydration**: Todos os novos componentes são `"use client"` — dados lidos via `useEffect` + API, nunca via SSR de localStorage

2. **Race condition no layout**: O `feed/layout.tsx` atual faz fetch do overview. Com o novo `[communitySlug]/layout.tsx`, o fetch fica no contexto. O `feed/page.tsx` deve ler do `CommunityContext` — não duplicar fetch

3. **ChatWidget**: Atualmente no `feed/layout.tsx`. Com a migração para layout unificado, deve continuar aparecendo. Mover para o `[communitySlug]/layout.tsx` ou manter como import no novo layout

4. **primaryColor dinâmico em Tailwind**: Tailwind não suporta `border-[${community.primaryColor}]` em produção (purge). Usar `style={{ borderColor: community.primaryColor }}` para indicadores ativos. Nunca construir className dinamicamente com cor hex

5. **Backward compatibility**: `/community/[slug]/leaderboard` deve permanecer funcional — fazer redirect para `/members?tab=ranking`. Não quebrar links existentes

6. **API `view=sidebar` — cache**: Header `Cache-Control: private, max-age=60`. Lista de comunidades do membro não muda a cada segundo

7. **Animação de progresso**: Barra do `HeroContinueWatching` não pode animar via `width: X%` no className (Tailwind não gera larguras arbitrárias via className dinâmico). Usar `style={{ width: `${percent}%` }}` + keyframe CSS `growWidth` via `animate-trail-progress` em `globals.css`

8. **Ordem de commits**: Implementar Fase 1 antes de tudo — tem maior impacto perceptível (sidebar mostrando comunidades) com menor risco de regressão nas rotas existentes

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
