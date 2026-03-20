# Detailer'HUB — Instruções do Projeto para Claude Code

> Este arquivo é lido automaticamente pelo Claude Code a cada sessão.
> Ele contém TODO o contexto necessário para continuar o desenvolvimento sem perder informações.

---

## Visão Geral

**Detailer'HUB** é uma plataforma de comunidades automotivas premium.
- Influencers criam comunidades
- Membros assinam a **plataforma** (assinatura única R$948/ano = R$79/mês) e acessam TUDO
- Inspirado no modelo Circle (uma assinatura, acesso a todas as comunidades)

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

---

## Arquitetura

### Roles
```
SUPER_ADMIN        → acesso total à plataforma
INFLUENCER_ADMIN   → gerencia suas comunidades
COMMUNITY_MEMBER   → assina a plataforma, acessa tudo
MARKETPLACE_PARTNER → vende produtos no marketplace
```

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
│   ├── layout/              # navbar.tsx, footer.tsx
│   ├── community/           # membership-section, plan-checkout-button, OnboardingChecklist
│   ├── marketplace/         # buy-button, sell-button
│   ├── notifications/       # NotificationBell
│   ├── search/              # SearchBar
│   └── ui/                  # badge, logo, toast-provider, confirm-modal, loading-spinner, etc.
├── emails/                  # React Email templates (Resend)
│   ├── WelcomeEmail.tsx
│   ├── PasswordResetEmail.tsx
│   ├── EmailVerificationEmail.tsx
│   ├── PaymentConfirmationEmail.tsx
│   └── LiveSessionReminderEmail.tsx
├── hooks/
│   ├── useAuth.ts           # hook de autenticação
│   └── useNotifications.ts
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
