---
title: "DetailerHub — Plano Técnico e Financeiro"
source: "plano-tecnico-detailerhub.html"
date: "2025"
---

# DetailerHub

Plano técnico, financeiro e de implementação para apresentação entre fundadores.

> Documento Interno · Confidencial · 2025

| | |
|---|---|
| **Versão** | 1.0 |
| **Fase atual** | Phase 1 — MVP |
| **Prazo estimado** | 10 semanas |
| **Break-even** | ~150 membros |

---

## Índice

1. Visão do Produto
2. Modelo de Negócio
3. Financeiro Revisado
4. Stack Tecnológica
5. Banco de Dados
6. Sprints de Implementação
7. Riscos e Mitigações
8. Horizontes de Crescimento

---

## 01 — Visão

## Arquitetura de dois produtos

O DetailerHub conquista uma praia específica com profundidade antes de atacar o oceano. O aprendizado do primeiro produto financia e informa a construção do segundo.

### DetailerHub — Produto 1

Plataforma fechada e paga para a comunidade de estética automotiva. Influenciadores trazem sua audiência. Uma assinatura dá acesso a todos os criadores da plataforma.

**Lançar agora**

### CrewHouse / Pitcrew — Produto 2

Plataforma mãe gratuita para toda a cultura automotiva brasileira. O DetailerHub vive dentro dela como produto principal. Monetização por anunciantes, eventos e marketplace.

**Aguarda Horizonte 1**

> **Lógica central:** "O YouTube é sua vitrine. O WhatsApp é sua praça. O DetailerHub é a sua casa." — O membro pertence ao influenciador que o trouxe. A comissão é perpétua enquanto ele permanecer ativo. O influenciador não paga nada para estar na plataforma.

---

## 02 — Modelo de Negócio

## O "dono do membro" e a caixa de performance

Dois mecanismos que criam alinhamento total entre a plataforma e os influenciadores.

| Critério | YouTube / Instagram | WhatsApp / Grupo | DetailerHub |
|---|---|---|---|
| Receita | CPM variável + publis | Nenhuma | 35% fixo por membro + caixa mensal |
| Previsibilidade | Zero — depende do algoritmo | Zero | Alta — base recorrente |
| Propriedade da audiência | Plataforma é dona | Parcial | Total — dados e contato direto |
| Custo para o criador | Zero | Zero | Zero |

### Caixa de Performance — Composição da Pontuação (PP)

| Métrica | Peso | Como é medida |
|---|---|---|
| **Views qualificados** | 30% | Vídeos assistidos ≥60% dentro da plataforma |
| **Engajamento na comunidade** | 25% | Comentários + reações gerados pelos membros na plataforma |
| **Novos membros ativos** | 20% | Membros novos que completaram 30 dias sem cancelar |
| **Retenção de membros** | 15% | Taxa de renovação mensal dos membros do influenciador |
| **Entregas contratuais** | 10% | % das entregas mínimas cumpridas (verificadas na plataforma) |

> **⚠ Regra fundamental:** Somente ações realizadas **dentro da plataforma** contam para o cálculo da PP. Engajamento no WhatsApp, Instagram, YouTube ou qualquer canal externo **não é contabilizado**. Isso cria alinhamento natural — o influenciador tem motivação financeira para puxar sua audiência para dentro da plataforma.

---

## 03 — Financeiro

## Modelo financeiro revisado

O split original calculava sobre receita bruta, ignorando pass-throughs. O modelo abaixo é mais honesto e protege a plataforma nos primeiros meses.

### Fluxo por membro — R$79/mês (preço de lançamento)

| | |
|---|---|
| Receita bruta | R$79,00 (baseado no preço de lançamento) |
| (-) Gateway Asaas — PIX R$0,99 · Cartão ~2,49% | ~−R$3,00 |
| (-) Simples Nacional — faixa inicial ~6% | ~−R$4,74 |
| **Receita líquida real** | **~R$71,00** |

### Distribuição da receita líquida

| Destino | % | Valor estimado |
|---|---|---|
| Influenciador — dono do membro | 35% | ~R$24,85 |
| Caixa de Performance | 15% | ~R$10,65 |
| Plataforma (operação + produto) | 50% | ~R$35,50 |

> **Por que 50% para a plataforma no Phase 1?** Nos primeiros 12 meses, 100% da aquisição vem dos influenciadores. O budget de marketing se torna investimento em produto. Após atingir o Horizonte 1, o split é revisado com os influenciadores com dados reais em mãos. Os fundadores trabalham sem salário fixo até o break-even.

### Projeção de sustentabilidade

| Membros | MRR Bruto | Líquido (~91%) | Plataforma (50%) | Situação |
|---|---|---|---|---|
| **100** | R$7.900 | R$7.189 | R$3.594 | Cobre custos fixos no limite |
| **150** | R$11.850 | R$10.783 | R$5.391 | Break-even operacional |
| **250** | R$19.750 | R$17.972 | R$8.986 | Confortável, folga para produto |
| **500** | R$39.500 | R$35.945 | R$17.972 | Pró-labore para fundadores |
| **5.000 (H1)** | R$395.000 | R$359.450 | R$179.725 | Horizonte 1 atingido |

### Custos fixos mínimos (sem salários)

| Item | Custo mensal | Observação |
|---|---|---|
| Contador | R$400–600 | Obrigatório desde a abertura do CNPJ |
| Supabase | R$125–500 | Grátis no início, escala com uso |
| Vimeo Pro | R$150–200 | Já utilizado pelos influenciadores |
| Vercel | R$0–100 | Grátis no início |
| Ferramentas (email, domínio, etc.) | R$100–200 | Resend, domínio, GitHub Pro |
| **Total estimado** | **R$775–1.600/mês** | Sem salários |

### Custos únicos de abertura

| Item | Valor estimado |
|---|---|
| Abertura de CNPJ | R$300–600 |
| Registro de marca INPI (classes 38 + 41) | R$2.000–4.000 |
| Contratos com influenciadores (advogado) | R$1.500–3.000 |
| **Total para começar** | **R$4.000–8.000** |

---

## 04 — Tecnologia

## Stack tecnológica

Escolhida para maximizar velocidade de desenvolvimento com vibe coding, minimizar custos iniciais e garantir escalabilidade futura.

| Camada | Ferramenta | Justificativa |
|---|---|---|
| Frontend | **Next.js 14 (App Router)** | O framework que a IA mais conhece. SSR nativo, roteamento simples, deploy automático no Vercel com push no GitHub. |
| UI | **shadcn/ui + Tailwind CSS** | Componentes prontos, copy-paste, identidade visual customizável. A IA gera código correto para esse stack na maioria das vezes. |
| Backend / DB | **Supabase** | Auth + banco PostgreSQL + storage + realtime em um lugar. Row Level Security garante isolamento de dados entre comunidades. |
| Pagamentos | **Asaas** | Brasileiro. PIX (R$0,99/transação) + boleto + cartão parcelado. API simples, webhooks confiáveis, sem mensalidade fixa. |
| Vídeo | **Vimeo (embed)** | Já utilizado. Controle de privacidade por domínio. Zero código adicional — influenciador cola o ID, plataforma renderiza. |
| Email | **Resend** | Integração nativa com Next.js. Gratuito até 3.000 emails/mês. Transacional simples. |
| Deploy | **Vercel + GitHub** | Push no repositório = deploy automático. Preview por branch. Zero configuração de servidor. |
| Lives | **Zoom (link externo)** | Nenhum código necessário. Link da live divulgado na plataforma. Solução funcional para o Phase 1. |

---

## 05 — Banco de Dados

## Estrutura de dados — Phase 1

10 tabelas. Cada uma com responsabilidade única. Projetado para ser compreensível por vibe coding e seguro com Row Level Security do Supabase.

```
-- 1. Perfis (estende o auth.users do Supabase)
profiles
  id          uuid PRIMARY KEY   -- mesmo id do auth.users
  name        text
  avatar_url  text
  bio         text               -- máx 160 chars
  city        text
  type        text               -- 'member' | 'influencer' | 'admin'
  created_at  timestamptz

-- 2. Influenciadores
influencers
  user_id          uuid PRIMARY KEY FK profiles
  slug             text UNIQUE        -- ex: "leo-detailing"
  referral_code    text UNIQUE        -- código do link /join/[code]
  commission_rate  decimal DEFAULT 0.35
  health_score     int DEFAULT 100
  status           text DEFAULT 'active'

-- 3. Comunidades (1 por influenciador no Phase 1)
communities
  id              uuid PRIMARY KEY
  influencer_id   uuid FK influencers
  name            text
  slug            text UNIQUE
  description     text
  cover_image_url text
  created_at      timestamptz

-- 4. Assinaturas — coração do modelo financeiro
subscriptions
  id                       uuid PRIMARY KEY
  member_id                uuid FK profiles
  referral_influencer_id   uuid FK influencers   -- DONO DO MEMBRO (imutável)
  gateway_subscription_id  text UNIQUE           -- id no Asaas
  status                   text                  -- 'active' | 'past_due' | 'cancelled'
  amount                   decimal
  started_at               timestamptz
  next_billing_at          timestamptz
  cancelled_at             timestamptz

-- 5. Opt-in em comunidades
community_memberships
  id             uuid PRIMARY KEY
  member_id      uuid FK profiles
  community_id   uuid FK communities
  joined_at      timestamptz

-- 6. Conteúdo
content
  id             uuid PRIMARY KEY
  community_id   uuid FK communities
  title          text
  type           text        -- 'video' | 'post'
  vimeo_id       text        -- só para vídeos
  body           text        -- só para posts
  is_published   bool DEFAULT false
  published_at   timestamptz
  created_at     timestamptz

-- 7. Comentários
comments
  id          uuid PRIMARY KEY
  content_id  uuid FK content
  author_id   uuid FK profiles
  body        text
  parent_id   uuid FK comments   -- para respostas (nullable)
  created_at  timestamptz

-- 8. Reações (única por membro por conteúdo)
reactions
  content_id  uuid FK content
  member_id   uuid FK profiles
  PRIMARY KEY (content_id, member_id)

-- 9. Score de saúde do membro (calculado automaticamente)
member_health
  member_id   uuid PRIMARY KEY FK profiles
  score       int DEFAULT 0
  can_post    bool DEFAULT false    -- true quando score >= 70
  updated_at  timestamptz

-- 10. Relatório mensal de pagamentos aos influenciadores
influencer_monthly_reports
  id                    uuid PRIMARY KEY
  influencer_id         uuid FK influencers
  month                 date              -- primeiro dia: 2025-03-01
  active_members        int
  direct_commission     decimal           -- 35% das assinaturas dos seus membros
  performance_amount    decimal           -- fatia da caixa de performance
  total_payout          decimal
  is_paid               bool DEFAULT false
  paid_at               timestamptz
```

---

## 06 — Implementação

## 5 Sprints · ~10 semanas

Cada sprint tem um checkpoint claro. Não avance para o próximo sem validar o anterior com um cenário real.

---

### Sprint 1 — Fundação

**Duração:** 2 semanas

Setup completo do zero ao primeiro deploy

- [ ] Setup: Next.js + Supabase + Vercel conectados e repositório no GitHub
- [ ] Auth: cadastro, login e recuperação de senha via Supabase Auth
- [ ] Perfil: criar e editar (nome, bio, cidade, foto)
- [ ] Roteamento básico: home, `/comunidade/[slug]`, `/conteudo/[id]`
- [ ] Layout base com shadcn/ui aplicando identidade visual do DetailerHub

**Checkpoint:** URL pública no ar. Consegue criar conta, logar e editar perfil.

---

### Sprint 2 — Comunidades e Conteúdo

**Duração:** 2 semanas

Influenciador publica · Membro consome

- [ ] Painel do influenciador: criar e editar comunidade
- [ ] Post de texto no feed da comunidade
- [ ] Embed de vídeo Vimeo: influenciador cola o ID, plataforma renderiza o player
- [ ] Feed da comunidade com ordenação por recência
- [ ] Controle de acesso: conteúdo visível apenas para assinantes ativos (status manual no banco por ora)

**Checkpoint:** Influenciador posta vídeo e texto. Membro (com acesso liberado manualmente no banco) consegue ver e navegar.

---

### Sprint 3 — Engajamento

**Duração:** 2 semanas

Membros interagem · Score começa a funcionar

- [ ] Comentários em conteúdo + sistema de respostas
- [ ] Reações (único por membro por conteúdo)
- [ ] Opt-in em comunidades: botão "Entrar nesta comunidade"
- [ ] Cálculo de score de saúde do membro (função SQL, roda via cron do Supabase)
- [ ] Botão "Criar post" aparece/some baseado no score ≥70 (sem aviso visível ao membro)
- [ ] Notificação positiva ao atingir threshold: "Você já faz parte desta comunidade!"

**Checkpoint:** Membro comenta, reage, score sobe. Após engajamento suficiente, botão de post aparece automaticamente.

---

### ⚠ Sprint 4 — Crítico — Pagamentos e Atribuição

**Duração:** 2 semanas

O coração do modelo financeiro — cada função deve ser verificada manualmente antes de automatizar

- [ ] Link de referral: `/join/[referral_code]` salva o código em cookie/sessão
- [ ] No cadastro via link: `referral_influencer_id` associado à subscription — **imutável após criação**
- [ ] Integração Asaas: criar assinatura recorrente via API
- [ ] Página de checkout: membro revisa plano, clica e vai para o hosted checkout do Asaas
- [ ] Webhook do Asaas: pagamento confirmado → ativa membro; cancelamento → revoga acesso
- [ ] Página admin de comissões: lista influenciadores + membros ativos + valor estimado do mês (verificação manual antes de pagar)

**Checkpoint obrigatório:** Membro real paga R$1,00 de teste no Asaas. Acesso é liberado automaticamente. Influenciador aparece como dono no relatório admin. Só depois disso subir para produção.

---

### Sprint 5 — Dashboards e Admin

**Duração:** 2 semanas

Influenciador se auto-gerencia · Admin opera sem intervenção manual

- [ ] Dashboard do influenciador: membros ativos, receita estimada do mês, origem dos membros
- [ ] Cálculo de Performance (PP): função SQL com as 5 métricas gerando `influencer_monthly_reports`
- [ ] Painel admin: membros, assinaturas, cancelamentos, relatório mensal para pagamento
- [ ] Email automático: novo membro entrou, pagamento falhou, renovação confirmada
- [ ] Dashboard do membro: score atual, progresso, próxima conquista

**Checkpoint:** Influenciador abre o dashboard e vê dados reais do mês sem precisar perguntar nada ao admin.

---

> **Nota sobre o Sprint 4:** É o ponto de maior risco técnico para vibe coding. A lógica de webhooks e rastreamento financeiro é crítica — um bug significa pagar errado. Reserve o colega dev para revisar *especificamente* essa parte antes de ir ao ar, mesmo que ele não construa o resto.

---

## 07 — Riscos

## Riscos e mitigações

Ranqueados por impacto real no negócio, não por probabilidade.

### 🔴 Alto — Bug financeiro no Sprint 4

**Descrição:** Pagamento errado para influenciador destrói confiança no momento em que ela é mais necessária.

**Mitigação:** Comissão manual (página admin de aprovação) antes de qualquer automação. Revisão por dev experiente antes de ir ao ar.

---

### 🔴 Alto — Influenciador sai e reivindica "seus" membros

**Descrição:** Se não houver contrato claro, a saída de um influenciador pode gerar disputa sobre os membros que ele trouxe.

**Mitigação:** Contrato define: comissão é ativa enquanto o influenciador está na plataforma. Saída encerra o direito a comissões futuras. Esse ponto é inegociável no contrato.

---

### 🟡 Médio — Membro se sente "dono" do influenciador que o trouxe, não da plataforma

**Descrição:** Se A sai, seus membros podem cancelar junto. Concentração de membros em 1-2 influenciadores cria fragilidade.

**Mitigação:** Dashboard mostra ao influenciador A que ele ganha mesmo quando seus membros consomem conteúdo de B. Isso reposiciona o modelo como "você ganhou por trazer, a plataforma retém por você".

---

### 🟡 Médio — Vibe coding travar em lógica complexa

**Descrição:** Webhooks, RLS no Supabase e cálculo de caixa de performance têm curva de aprendizado real.

**Mitigação:** Sprint plan isola cada responsabilidade. Lógica financeira é simples e verificável antes de automatizar. Colega dev entra pontualmente no Sprint 4.

---

### 🟢 Baixo — Break-even financeiro antes de ter produto

**Descrição:** Sem runway, o tempo entre zero e 150 membros é o período de maior pressão.

**Mitigação:** O modelo foi validado em projeto anterior. Com 3 influenciadores de nicho e 6 anos de relacionamento do fundador, 150 membros em 60 dias pós-lançamento é o cenário conservador.

---

## 08 — Crescimento

## Horizontes estratégicos

Cada horizonte só começa quando o anterior for completamente atingido — expansão construída sobre evidências reais, não suposições.

### Horizonte 1 — Em curso: Provar o Modelo

**Status:** Em andamento

Gatilhos de conclusão:
- 5.000 membros ativos
- Churn mensal < 7%
- NPS dos influenciadores > 50
- ≥80% influenciadores saudáveis por 6 meses
- 3+ contratos de anunciantes ativos

---

### Horizonte 2 — Aguarda H1: Estruturar a Expansão

**Status:** Aguarda H1

Gatilhos de conclusão:
- DetailerHub financiando o Produto 2
- 2+ novos nichos automotivos prontos
- Equipe operando com autonomia
- Arquitetura escalável validada

---

### Horizonte 3 — Aguarda H2: Lançar CrewHouse

**Status:** Aguarda H2

Gatilhos de conclusão:
- Plataforma mãe gratuita ao ar
- 3+ comunidades pagas além do DetailerHub
- 5+ contratos com marcas de médio/grande porte
- DetailerHub como produto âncora

---

*Documento interno · Confidencial · Uso restrito aos fundadores*

*Versão 1.0 · 2025*
