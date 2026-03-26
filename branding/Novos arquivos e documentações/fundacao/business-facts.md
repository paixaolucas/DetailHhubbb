# DetailerHUB — Fonte de Verdade

> Extraído dos documentos fundadores. Referência para todos os agentes.

---

## O Negócio

**Produto**: Plataforma de membros fechada e paga para a comunidade de estética automotiva do Brasil.
**Modelo central**: Influenciadores de detailing trazem seus seguidores do Instagram/TikTok para dentro da plataforma, convertendo audiência gratuita em renda recorrente.
**Pitch central**: "Seu YouTube é sua vitrine. Seu WhatsApp é sua praça. A DetailerHub é a sua casa."

**Problema que resolve para influenciadores**:
- Renda dependente de algoritmos, marcas e plataformas de terceiros
- Audiência alugada — pode sumir com uma mudança de algoritmo
- Sem renda previsível ou recorrente
- DetailerHub dá renda direta, recorrente e previsível da própria audiência

---

## Modelo Financeiro

| Item | Valor |
|------|-------|
| Mensalidade base | R$79/mês (lançamento) |
| Taxa gateway (Asaas) | ~R$3/transação |
| Simples Nacional | ~6% |
| Receita líquida estimada | ~R$71/membro/mês |

### Split da receita líquida
- **50%** → Plataforma (operação + produto)
- **35%** → Influenciador "dono do membro" (perpétuo — imutável enquanto membro ativo)
- **15%** → Caixa de Performance (distribuído mensalmente entre todos os influenciadores por score)

### Caixa de Performance — Critérios de Score
| Critério | Peso |
|----------|------|
| Visualizações qualificadas (≥60% do vídeo) | 30% |
| Engajamento da comunidade (comentários + reações) | 25% |
| Novos membros ativos (sobreviveram 30 dias) | 20% |
| Taxa de retenção dos membros | 15% |
| Cumprimento de entregas contratuais | 10% |

*Somente atividade DENTRO da plataforma conta.*

### Projeções
| Milestone | Membros | Receita plataforma/mês |
|-----------|---------|----------------------|
| Break-even | 150 | ~R$5.391 |
| Salários dos fundadores | 500 | ~R$17.972 |
| Horizon 1 | 5.000 | ~R$179.725 |

### Custos fixos (sem salários)
- Contador: R$400–600/mês
- Supabase: R$125–500/mês
- Vimeo Pro: R$150–200/mês
- Vercel: R$0–100/mês
- Ferramentas (email, domínio, GitHub): R$100–200/mês
- **Total: R$775–1.600/mês**

### Custos únicos de abertura
- CNPJ: R$300–600
- Registro INPI: R$2.000–4.000
- Contratos jurídicos com influenciadores: R$1.500–3.000
- **Total: R$4.000–8.000**

---

## Produto

### Dois produtos na arquitetura

**Produto 1 (atual): DetailerHub**
- Plataforma fechada de membros para estética automotiva
- Feed exclusivo e fórum por influenciador
- Trilhas educacionais (módulos + vídeos + progresso + badges)
- Vídeos via Vimeo embed
- Lives via Zoom (links na plataforma — Fase 1)
- Marketplace integrado (futuro)
- Dashboard de desempenho para influenciadores

**Produto 2 (futuro — Horizon 3): CrewHouse / Pitcrew**
- Plataforma gratuita para toda a cultura automotiva brasileira
- DetailerHub vive dentro como oferta principal
- Monetização via anunciantes, eventos, marketplace

### Regras de Conteúdo (importantes para o modelo)
- Vídeos são aulas/cursos — NOT pitches de venda, reviews com CTA, conteúdo motivacional
- **Sem CTAs externos** dentro da plataforma (não redirecionar para Instagram, links externos)
- Membro já pagou — entregue o conteúdo

### Sistema de Saúde dos Membros
- Score de engajamento — threshold em 70 pontos para permissão de postagem
- Membros com score < 70 ficam em modo leitura

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| Backend/DB | Supabase (Auth + PostgreSQL + Storage + Realtime + RLS) |
| Pagamentos | Asaas (PIX R$0,99/transação, boleto, parcelado, sem mensalidade) |
| Vídeo | Vimeo (embed, privacidade por domínio) |
| Email | Resend (grátis até 3.000 emails/mês) |
| Deploy | Vercel + GitHub |
| Lives | Zoom (links externos na Fase 1) |

### Banco de Dados — 10 tabelas (Fase 1)
1. `profiles` — membros/influenciadores/admin
2. `influencers` — referral_code, commission_rate (padrão 35%), health_score
3. `communities` — 1 por influenciador na Fase 1
4. `subscriptions` — referral_influencer_id é **IMUTÁVEL**
5. `community_memberships` — opt-in por comunidade
6. `content` — vídeo ou post, vimeo_id
7. `comments` — com parent_id (respostas aninhadas)
8. `reactions` — único por membro por conteúdo
9. `member_health` — score de engajamento, threshold 70
10. `influencer_monthly_reports` — tracking de pagamentos mensais

---

## Time e Estrutura

- 2 co-fundadores (trabalham sem salário fixo até break-even de 150 membros)
- Desenvolvimento: solo founder com vibe coding (IA-assisted)
- Fundador tem **6 anos de relacionamento** com a rede de influenciadores
- Contabilidade e jurídico terceirizados

### Crescimento planejado
- **Horizon 1**: Provar o modelo — 5.000 membros, churn < 7%/mês, NPS > 50 dos influenciadores
- **Horizon 2**: Estruturar expansão — DetailerHub financia Produto 2, 2+ novos nichos automotivos
- **Horizon 3**: Lançar CrewHouse — plataforma gratuita mãe, 3+ comunidades pagas além da DetailerHub
