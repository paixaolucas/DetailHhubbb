# Detailer'HUB — Instruções do Projeto para Claude Code

> Este arquivo é lido automaticamente pelo Claude Code a cada sessão.
> Ele contém TODO o contexto necessário para continuar o desenvolvimento sem perder informações.

---

## Visão Geral

**Detailer'HUB** é uma plataforma de comunidades automotivas premium.
- Influencers criam comunidades
- Membros assinam a **plataforma** (assinatura única R$708/ano = R$59/mês, ou R$79/mês mensal) e acessam TUDO
- Inspirado no modelo Circle (uma assinatura, acesso a todas as comunidades)

### Base intelectual do projeto
Toda decisão de produto, UX, comunidade e modelo de negócio deve ser alinhada com estes livros:

| Livro | Autor(es) | Aplicação principal |
|-------|-----------|---------------------|
| **Wiki Brands** | Sean Moffitt e Mike Dover | Marca colaborativa, comunidade de marca, co-criação com audiência |
| **Superfãs** | Pat Flynn | Transformar seguidores em fãs ativos — modelo influenciador + membro |
| **Continuous Discovery Habits** | Teresa Torres | Discovery contínuo, entrevistas, árvore de oportunidades, testes rápidos |
| **Hooked** | Nir Eyal | Modelo de hábito (trigger→action→reward→investment) — gamificação e retenção |
| **Estratégia de Plataforma** | Tero Ojanpera e Timo Vuori | Modelo de dois lados, efeitos de rede, monetização e governança |
| **Gestão de Produtos** | Joaquim Torres | Roadmap, priorização, métricas e backlog no contexto brasileiro |

**Stack**: Next.js 14 App Router, TypeScript, Prisma, PostgreSQL (Supabase), Stripe, OpenAI, Resend, UploadThing
**Deploy**: Vercel (previsto)

---

## Setup Inicial

```bash
npm install
cp .env.example .env.local   # preencher todas as variáveis
npx prisma db push            # Supabase: usar db push (não migrate dev — shadow DB incompatível)
npx prisma db seed
npm run dev
```

### Variáveis obrigatórias no `.env.local`
```
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
UPLOADTHING_TOKEN=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Contas de Teste (após seed)

| Conta | Email | Senha |
|-------|-------|-------|
| Super Admin | admin@comunidadehub.com | Admin@123456! |
| Influencer | joao@comunidade.com | C |
| Membro | membro1@email.com | Membro@123! |

---

## Comandos Úteis

```bash
npm run dev                            # servidor de desenvolvimento
npx prisma studio                      # interface visual do banco
npx prisma db push                     # aplicar schema ao banco (Supabase — não usar migrate dev)
npx prisma db seed                     # popular banco com dados de teste
npx tsc --noEmit                       # checar erros TypeScript (deve retornar 0)
```

---

## Modelo de Negócio

### Atual (implementado)
- **Assinatura da plataforma**: R$948/ano via `PlatformPlan` → dá acesso a TODAS as comunidades
- Stripe Checkout em `/api/stripe/platform-checkout`
- Membros sem assinatura são redirecionados para `/dashboard/assinar`

### Legado (ainda no schema, compatível)
- `CommunityMembership` + `SubscriptionPlan` — membros por comunidade individual
- Preservado para dados históricos, não é mais o fluxo principal

### Valores de referência (source of truth)
> Agentes: ao mencionar preços ou splits, referenciar esta seção — não hardcodar valores.

| Item | Valor |
|---|---|
| Assinatura | R$948/ano = R$79/mês |
| Receita líquida por membro | ~R$71 (após gateway ~R$3 + Simples ~R$4,74) |
| Split influenciador (dono do membro) | 35% (~R$24,85) |
| Caixa de performance coletiva | 15% (~R$10,65) |
| Plataforma | 50% (~R$35,50) |
| Break-even | 150 membros ativos |

**Infra atual:**
- Gateway: Stripe (migração planejada → Asaas)
- Deploy: Vercel
- DB: Supabase (PostgreSQL, host apenas)
- VPS auxiliar: Hostinger KVM1
- Email: Resend
- Upload: UploadThing

---

## Arquitetura

### Roles
```
SUPER_ADMIN        → acesso total à plataforma
INFLUENCER_ADMIN   → gerencia suas comunidades
COMMUNITY_MEMBER   → assina a plataforma, acessa tudo
MARKETPLACE_PARTNER → vende produtos no marketplace (Phase 1: dormente — tratar como COMMUNITY_MEMBER na UI)
```

### Dois grupos de influenciadores (mesmo role, perfis diferentes)
O role `INFLUENCER_ADMIN` abrange dois perfis operacionais distintos — **não criar sub-roles**, apenas documentar para decisões de produto:

| Grupo | Perfil | Exemplos | Responsabilidade principal |
|-------|--------|----------|---------------------------|
| **Parceiros de Negócio** | Donos de audiência consolidada, co-fundadores do ecossistema, têm participação nos resultados da plataforma | Gimenez, Neto, Barba, Corujão, Geovane | Trazer membros (dono do membro = comissão 35%), gerar conteúdo técnico, representar a marca |
| **Produtores de Conteúdo** | Especialistas convidados, produzem módulos pontuais, não necessariamente têm comunidade própria na plataforma | Tarcísio Vaglieri (Veneto), Gilberto Stockler, Igor Ao Raboni, Widnei | Gravar aulas para os 7 módulos estruturados da plataforma |

**Regras de produto decorrentes:**
- `referredByInfluencerId` — define o "dono do membro" e é **imutável** após criação da assinatura
- Parceiros de Negócio recebem 35% de comissão recorrente sobre cada membro referido
- Produtores de Conteúdo são remunerados por entrega de módulo (contrato separado, fora do split 35/15/50)
- A distinção é operacional — na UI ambos usam o mesmo dashboard `INFLUENCER_ADMIN`

### Auth
- JWT em localStorage com chaves **namespaced**:
  - `detailhub_access_token`
  - `detailhub_refresh_token`
  - `detailhub_user_role`
  - `detailhub_user_name`
  - `detailhub_user_email`
  - `detailhub_user_id`
- **SEMPRE** usar `STORAGE_KEYS` de `src/lib/constants.ts` — nunca strings literais

### Google OAuth
- Fluxo: `/api/auth/google` → Google consent → `/api/auth/google/callback` → `/api/auth/google/complete` (hydra localStorage) → redirect
- `User.googleId` (unique, optional) — vincula conta ao Google
- `User.passwordHash` agora é opcional — contas Google-only não têm senha
- Se usuário Google tenta login com senha, retorna erro `GOOGLE_ONLY_ACCOUNT`
- Se usuário email/senha faz login com Google, vincula o `googleId` automaticamente
- CSRF via cookie `google_oauth_state` + state param
- Variáveis: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### Middleware de API
```ts
// Proteger rota por autenticação
export const GET = withAuth(async (req, { session }) => { ... });

// Proteger por role mínimo
export const POST = withRole(UserRole.SUPER_ADMIN)(async (req, { session, params }) => { ... });
// session.userId = ID do usuário logado | params?.id = parâmetro da rota

// Verificar membership de plataforma
const ok = await verifyPlatformMembership(session.userId);

// Verificar membership de comunidade (aceita plataforma OU comunidade)
const ok = await verifyMembership(session.userId, communityId);
```

Todos em `src/middleware/auth.middleware.ts`.

### Infraestrutura Role-Based (UI)
- **Navegação centralizada**: `src/lib/navigation.ts` — `NAV_ITEMS`, `getNavItems(role)`, `getNavGroups(role)`, `GROUP_LABELS`
  - Single source of truth para itens do sidebar. Para adicionar/remover itens de menu, editar apenas este arquivo.
  - Grupos: `principal` (ALL), `conteudo` (membros), `gestao` (influencers), `admin` (super admin)
- **Hook de role**: `src/hooks/useRole.ts` — `useRole()` retorna `{ role, isAdmin, isInfluencer, isMember, isPartner, can(permission) }`
  - Permissions: `view:analytics`, `view:admin`, `view:all_communities`, `view:own_communities`, `manage:users`, `manage:own_community`, `create:live`, `create:content`, `view:member_content`
- **Renderização condicional**: `src/components/ui/ShowFor.tsx`
  - `<ShowFor roles={[UserRole.SUPER_ADMIN]}>` — mostra por role
  - `<Can do="view:analytics">` — mostra por permission
- **Sidebar**: `src/components/layout/DashboardSidebar.tsx` — sidebar colapsável com "Visualizar Como" (SUPER_ADMIN only)

---

## Design System

- **Background**: `#1A1A1A` — dark por padrão, definido no `:root`
- **Cores brand**: `#006079` (teal escuro), `#007A99` (teal médio), `#009CD9` (teal claro)
- **Texto principal**: `#EEE6E4` | secundário: `text-gray-300` | muted: `text-gray-400`
- **Glass cards**: `.glass-card` = `bg-white/5 backdrop-blur-md border border-white/10 rounded-xl`
- **Botão primário**: `.btn-premium` = `bg-gradient-to-r from-[#006079] to-[#009CD9]`
- **Logo**: `<Logo size="sm|md|lg|xl" />` em `src/components/ui/logo.tsx` — SVG dois personagens em fundo teal (NÃO é steering wheel, NÃO tem Zap!)
- **Fonte**: Titillium Web (via `next/font/google`, variável CSS `--font-titillium`)
- **Skeletons**: `animate-pulse` com blocos `bg-white/10 rounded` (NÃO use spinners em loading de página)
- **Spinner inline**: `border-[3px] border-[#009CD9] border-t-transparent rounded-full animate-spin`
- **Toasts**: `useToast()` de `src/components/ui/toast-provider.tsx`
- **Tailwind cores custom**: `detailhub` (teal scale), `chrome` (dark neutrals)
- **Animações**: `.animate-slide-up`, `.animate-fade-in`, `.delay-75/150/225/300/450` em `globals.css`
- **Inputs dark**: `bg-white/5 border border-white/10` — NUNCA `bg-white` ou `border-gray-200` em páginas dark
- **NUNCA usar**: `text-gray-900`, `text-gray-800`, `bg-gray-50`, `violet-*`, `purple-*` — usar teal equivalente
- **Cores violet → teal**: `violet-600`→`[#006079]`, `violet-500`→`[#007A99]`, `violet-400`→`[#009CD9]`

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/              # login, register, forgot-password, reset-password
│   ├── api/
│   │   ├── auth/            # login, register, logout, refresh
│   │   ├── communities/     # CRUD comunidades + spaces, plans, members
│   │   ├── platform/        # spaces, plan (modelo de assinatura único)
│   │   ├── platform-membership/me/
│   │   ├── stripe/          # checkout, platform-checkout, webhook, billing-portal
│   │   ├── users/           # perfil, badges, certificates, role, status
│   │   ├── posts/           # feed posts
│   │   ├── comments/        # comentários
│   │   ├── notifications/   # notificações
│   │   ├── search/          # busca global
│   │   ├── ai/              # Auto AI (OpenAI)
│   │   ├── analytics/       # eventos de analytics
│   │   ├── reports/         # denúncias de usuários
│   │   ├── admin/reports/   # gestão de denúncias (SUPER_ADMIN)
│   │   └── ...
│   ├── community/[slug]/    # páginas públicas e feed da comunidade
│   └── dashboard/
│       ├── layout.tsx       # sidebar com SpacesNav para membros
│       ├── page.tsx         # dashboard por role
│       ├── assinar/         # upgrade para PlatformMembership
│       ├── analytics/       # analytics (INFLUENCER_ADMIN)
│       ├── communities/     # gerenciar comunidades
│       ├── content/         # conteúdo em módulos
│       ├── live/            # criar live (INFLUENCER_ADMIN)
│       ├── lives/           # ver lives (COMMUNITY_MEMBER)
│       ├── marketplace/     # marketplace
│       ├── messages/        # mensagens
│       ├── notifications/   # notificações
│       ├── settings/        # configurações de conta
│       ├── usuarios/        # gestão de usuários (SUPER_ADMIN)
│       └── admin/           # páginas admin (SUPER_ADMIN)
├── components/
│   ├── feed/                # PostCard, PostComposer, PostDetail, CommentItem
│   ├── layout/              # navbar.tsx, footer.tsx, DashboardSidebar.tsx
│   ├── community/           # membership-section, plan-checkout-button, OnboardingChecklist
│   ├── marketplace/         # buy-button, sell-button
│   ├── notifications/       # NotificationBell
│   ├── search/              # SearchBar
│   └── ui/                  # badge, logo, toast-provider, confirm-modal, loading-spinner, ShowFor.tsx, Can, etc.
├── emails/                  # React Email templates (Resend)
│   ├── WelcomeEmail.tsx
│   ├── PasswordResetEmail.tsx
│   ├── EmailVerificationEmail.tsx
│   ├── PaymentConfirmationEmail.tsx
│   └── LiveSessionReminderEmail.tsx
├── hooks/
│   ├── useAuth.ts           # hook de autenticação
│   ├── useNotifications.ts
│   └── useRole.ts           # role + permissions do usuário logado
├── lib/
│   ├── auth/                # jwt.ts, rbac.ts
│   ├── api-client.ts        # fetch wrapper (30s timeout, auto-refresh)
│   ├── api-helpers.ts       # parseBody, getClientIp
│   ├── api-error-handler.ts
│   ├── constants.ts         # STORAGE_KEYS, PAGE_SIZES, etc.
│   ├── db.ts                # Prisma singleton
│   ├── email/               # send.ts, resend.ts
│   ├── logger.ts
│   ├── messages.ts          # mensagens PT-BR padronizadas
│   ├── rate-limit.ts        # sliding window (10/min auth, 20/min AI, 30/min search)
│   ├── navigation.ts        # NAV_ITEMS, getNavItems, getNavGroups, GROUP_LABELS
│   └── stripe/stripe.ts
├── middleware/
│   └── auth.middleware.ts   # withAuth, withRole, withPermission, verifyMembership, verifyPlatformMembership
├── middleware.ts             # Next.js middleware (cookie handling)
├── services/
│   ├── community/community.service.ts
│   ├── commission/
│   └── payment/payment.service.ts  # Stripe + webhooks
├── types/index.ts
└── utils/api.ts
```

---

## Convenções

### Respostas de API
```ts
// Sucesso
return NextResponse.json({ success: true, data: result });
// Erro
return NextResponse.json({ success: false, error: "mensagem" }, { status: 400 });
```

### Campos do modelo Community (Prisma)
- `logoUrl` e `bannerUrl` (NÃO `coverUrl`, NÃO `category`)
- `isPublished` (NÃO `isActive`)
- Soft-delete de membership: status `"CANCELED"` (enum `CommunityMembershipStatus`)

### Stripe Webhook
- Checkout com `metadata.platformPlanId` → cria/atualiza `PlatformMembership`
- Checkout com `metadata.communityId + planId` → cria/atualiza `CommunityMembership`

### Validações (src/lib/validations/)
- `community.ts` — exporta `createCommunitySchema`, `updateCommunitySchema` (inclui `logoUrl`, `bannerUrl`), `createPlanRouteSchema`, `updatePlanRouteSchema`
- `post.ts` — `createPostSchema` (tipos: TEXT, IMAGE, LINK, POLL — sem VIDEO)

### Segurança implementada
- JWT sem fallback secrets — lança erro se `JWT_SECRET` / `JWT_REFRESH_SECRET` não estiver definido
- Rate limiting por IP em auth, AI e search
- Webhook Stripe aborta com 500 se `STRIPE_WEBHOOK_SECRET` não estiver definido
- Checkout URL validada contra `NEXT_PUBLIC_APP_URL` (previne open-redirect)
- Reações usam `db.$transaction` para evitar race conditions
- Search não expõe email/role nos resultados

---

## Estado Atual — O que já está implementado

### Dashboards (todos com dark theme)
- `dashboard/page.tsx` — Role-based (4 roles diferentes)
- `dashboard/analytics/page.tsx` — Analytics para INFLUENCER_ADMIN
- `dashboard/ai/page.tsx` — Auto AI (chat com OpenAI)
- `dashboard/settings/page.tsx` — 4 abas (Perfil, Senha, Notificações, Privacidade)
- `dashboard/communities/page.tsx` — listagem de comunidades
- `dashboard/communities/new/page.tsx` — criar comunidade
- `dashboard/communities/[id]/settings/page.tsx` — 5 abas (General, Appearance, Plans, Members, Danger)
- `dashboard/marketplace/page.tsx`
- `dashboard/tools/page.tsx`
- `dashboard/live/page.tsx` — criar live (INFLUENCER_ADMIN)
- `dashboard/lives/page.tsx` — ver lives (COMMUNITY_MEMBER)
- `dashboard/content/page.tsx`
- `dashboard/meu-aprendizado/page.tsx`
- `dashboard/meus-produtos/page.tsx`
- `dashboard/usuarios/page.tsx` — gestão de usuários (SUPER_ADMIN)
- `dashboard/admin/comunidades/` — admin de comunidades (SUPER_ADMIN)

### APIs implementadas
- `GET /api/communities/[id]/members` — lista membros paginada
- `DELETE /api/communities/[id]/members/[membershipId]` — soft delete (CANCELED)
- `GET|POST /api/communities/[id]/plans` — planos da comunidade
- `DELETE /api/communities/[id]/plans/[planId]` — remover plano
- `GET /api/users` — lista usuários (SUPER_ADMIN)
- `PUT /api/users/[id]/status` — ban/unban/activate/deactivate
- `PATCH /api/users/[id]/role` — trocar role (SUPER_ADMIN, sem auto-modificação)
- `POST /api/reports` — denunciar conteúdo
- `GET /api/admin/reports` — listar denúncias (SUPER_ADMIN)
- `PATCH /api/admin/reports/[id]` — resolver denúncia

### Componentes UI criados
- `ShowFor` / `Can` — renderização condicional por role/permission (`src/components/ui/ShowFor.tsx`)
- `DashboardSidebar` — sidebar colapsável role-aware com "Visualizar Como" (`src/components/layout/DashboardSidebar.tsx`)
- `ConfirmModal` — modal de confirmação genérico
- `ToastProvider` / `useToast` — sistema de notificações in-app
- `SkeletonTable` — skeleton para tabelas
- `Breadcrumb` — navegação por migalhas
- `PasswordStrength` — indicador de força de senha
- `Logo` — SVG dois personagens em fundo teal gradient (NÃO é steering wheel)
- `NavBar` — com hamburger mobile
- `Footer`

### Schema Prisma — modelos relevantes
- `User`, `Community`, `Space`, `Post`, `Comment`, `Reaction`
- `CommunityMembership` (legado), `SubscriptionPlan` (legado)
- `PlatformPlan`, `PlatformMembership` (modelo atual)
- `Payment`, `MarketplaceProduct`, `LiveSession`
- `Module`, `Lesson`, `ContentProgress`
- `Badge`, `UserBadge`, `Certificate`
- `Notification`, `Conversation`, `Message`
- `Report` (com `ReportTargetType`, `ReportStatus`)
- `AnalyticsEvent` (com `AnalyticsEventType`)

---

## Padrões a Seguir

### Nunca fazer
- Usar strings literais para localStorage — sempre usar `STORAGE_KEYS` de `src/lib/constants.ts`
- Usar `coverUrl` ou `isActive` no model Community
- Usar `category` no model Community
- Criar spinner de loading para páginas inteiras — usar skeleton animate-pulse
- Escrever o nome como "DetailHub" — o nome correto é **Detailer'HUB**
- Usar cores `violet-*` ou `purple-*` — usar teal: `[#006079]`, `[#007A99]`, `[#009CD9]`
- Usar `text-gray-900` ou `bg-white` (sem opacidade) em páginas dark
- Usar `bg-gray-50`, `border-gray-200` em contexto dark — usar `bg-white/5`, `border-white/10`

### Sempre fazer
- Usar `withAuth` ou `withRole` em todas as rotas de API protegidas
- Retornar `{ success: true, data: ... }` ou `{ success: false, error: "..." }`
- Usar `useToast()` para feedback ao usuário
- Verificar `npx tsc --noEmit` após mudanças (deve retornar 0 erros)
- Usar `db.$transaction` em operações com múltiplas escritas
- Inputs em dark: `bg-white/5 border border-white/10 text-[#EEE6E4] placeholder-gray-500`
- Usar `<ShowFor>`/`<Can>` para condicionar UI por role — não usar `if (role === ...)` inline
- Usar `getNavItems()`/`getNavGroups()` de `src/lib/navigation.ts` para itens de menu — não hardcodar listas de nav
- Seguir o feature-pipeline (`.claude/agents/pipelines/feature-pipeline.md`) antes de criar novas telas de dashboard

---

## Agentes e Pipelines

### Agentes especializados (`.claude/agents/`)
13 agentes + 5 pipelines em `.claude/agents/`. Cada agente tem frontmatter `name`, `description` e `tools`.

#### Engineering
| Agente | Arquivo | Descrição |
|--------|---------|-----------|
| `backend-architect` | `engineering/backend-architect.md` | Implementa rotas de API, lógica de negócio, queries Prisma, middleware de auth e decisões de arquitetura server-side |
| `frontend-developer` | `engineering/frontend-developer.md` | Implementa componentes React/Next.js, páginas, layouts e UI seguindo o design system da plataforma |
| `devops-infra` | `engineering/devops-infra.md` | Deploy, configuração de servidor, variáveis de ambiente, CI/CD, custos operacionais e monitoramento |

#### Design
| Agente | Arquivo | Descrição |
|--------|---------|-----------|
| `brand-guardian` | `design/brand-guardian.md` | Revisão de textos, validação de tom de voz, criação de copy e consistência visual/editorial da marca |
| `ui-ux-designer` | `design/ui-ux-designer.md` | Wireframes, fluxos de UX, revisão de interfaces e novos componentes seguindo o design system |

#### Security
| Agente | Arquivo | Descrição |
|--------|---------|-----------|
| `code-reviewer` | `security/code-reviewer.md` | Revisão de PRs/código em busca de bugs, vulnerabilidades de segurança e inconsistências com regras de negócio |
| `data-security` | `security/data-security.md` | Auditoria de proteção de dados pessoais, conformidade com LGPD, autenticação e controle de acesso |
| `payment-security` | `security/payment-security.md` | Revisão de lógica de split de receita, webhooks de pagamento, idempotência de transações e cenários financeiros |

#### Product
| Agente | Arquivo | Descrição |
|--------|---------|-----------|
| `product-rules` | `product/product-rules.md` | Valida se uma feature faz sentido no Phase 1, verifica consistência com o modelo de negócio e classifica itens por horizonte |
| `sprint-prioritizer` | `product/sprint-prioritizer.md` | Organiza sprints e prioriza features por impacto no Horizonte 1, identifica dependências e estima esforço |

#### Growth
| Agente | Arquivo | Descrição |
|--------|---------|-----------|
| `influencer-strategist` | `growth/influencer-strategist.md` | Materiais de abordagem, argumentos de entrada, estruturação de onboarding de criadores e antecipação de objeções |
| `retention-analyst` | `growth/retention-analyst.md` | Calcula e projeta churn, identifica sinais de risco, propõe intervenções de retenção e analisa coortes de membros |

#### Community
| Agente | Arquivo | Descrição |
|--------|---------|-----------|
| `community-manager` | `community/community-manager.md` | Analisa saúde de comunidades, identifica padrões de churn, cria scripts de comunicação para influenciadores e propõe ações de retenção |

#### Conselho Estratégico (personas de referência)
| Agente | Arquivo | Descrição |
|--------|---------|-----------|
| `conselho` | `conselho/conselho.md` | Meta-agente: guia qual dos 5 conselheiros acionar por tipo de decisão, hierarquia de veto e formato de sessão |
| `cagan` | `conselho/cagan.md` | Marty Cagan — estratégia de produto, roadmap, retenção e experiência do membro |
| `hormozi` | `conselho/hormozi.md` | Alex Hormozi — oferta, precificação, copy de venda, conversão e matemática de receita |
| `kotler` | `conselho/kotler.md` | Philip Kotler — inteligência de mercado, segmentação, posicionamento e concorrência |
| `munger` | `conselho/munger.md` | Charlie Munger — inversão de problemas, riscos, modelos mentais e incentivos |
| `ogilvy` | `conselho/ogilvy.md` | David Ogilvy — comunicação, copy, voz da marca e titulares |

#### Pipelines (orquestram múltiplos agentes)
| Pipeline | Arquivo | Descrição |
|----------|---------|-----------|
| `orchestrator` | `pipelines/orchestrator.md` | Analisa o escopo e aciona os subagentes corretos na ordem correta, consolidando o resultado final |
| `organizador` | `pipelines/organizador.md` | Mantém a estrutura documental do projeto organizada, consistente e navegável |
| `feature-pipeline` | `pipelines/feature-pipeline.md` | Ciclo completo de entrega: validação de produto → backend → frontend → code review → security |
| `bug-fix-pipeline` | `pipelines/bug-fix-pipeline.md` | Diagnóstico (classifica severidade) → correção mínima → verificação sem coordenação manual |
| `sprint-planning-pipeline` | `pipelines/sprint-planning-pipeline.md` | Diagnóstico H1 → classificação do backlog → sprint organizado com foco nos gatilhos do Horizonte 1 |
| `security-review-pipeline` | `pipelines/security-review-pipeline.md` | Auditoria em 3 camadas: autenticação/autorização → dados/privacidade → pagamentos |

### Protocolo obrigatório para novas telas de dashboard
Antes de implementar qualquer nova tela de dashboard, seguir `.claude/agents/pipelines/feature-pipeline.md`:
1. **Product Validation** — verificar se é Phase 1, não viola regras imutáveis de negócio
2. **Backend Architecture** — definir models Prisma, rotas, services, middleware
3. **Frontend Implementation** — componentes/páginas seguindo design system
4. **Code Review** — TypeScript limpo, sem `any`, convenções seguidas, segurança OK
5. **Final Checklist** — pass/fail antes de entregar
