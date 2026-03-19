# Pendências do Projeto — Detailer'HUB
> Gerado em: 2026-03-18
> Baseado na leitura do documento fundacional v8 + ID Visual (pasta /branding)

---

## ✅ JÁ IMPLEMENTADO (não mexer)

- Paleta de cores oficial (`#006079`, `#009CD9`, `#007A99`, `#1A1A1A`, `#EEE6E4`)
- Tipografia Titillium Web
- Logo SVG (duas figuras humanas em fundo teal)
- Dark theme como padrão em toda a plataforma
- Preço R$79/mês em todas as páginas de marketing
- Slogans oficiais ("YouTube é vitrine, HUB é a casa", "maior ecossistema", etc.)
- Pontos automáticos: post +15 (máx 2/dia), comentário +8 (máx 5/dia), resposta +6 (máx 8/dia), reação +3 (máx 10/dia)
- Threshold 70 pts para criar post — verificação no client (PostComposer) + server (API)
- Notificação ao cruzar 70 pts ("Você desbloqueou a criação de posts!")
- Score card no dashboard do membro (barra de progresso até 70 pts)
- Leaderboard global + por comunidade
- Sistema de notificações básico
- Marketplace básico
- Trilhas com módulos e progresso
- Google OAuth
- Sistema de denúncias (reports)
- Dashboard por role (admin, influencer, membro, parceiro)

---

## 🔴 ALTA PRIORIDADE — Implementar logo

### 1. Penalidade de inatividade (-3 pts/dia a partir do 3º dia)
**Doc diz:** Tanto membro quanto influenciador perdem 3 pts/dia a partir do 3º dia consecutivo sem nenhuma ação.
**Como implementar:**
- Criar um cron job (ou verificação lazy no login) que checa `PointTransaction` mais recente
- Se última ação > 2 dias atrás → deduzir 3 pts por dia faltando (sem ultrapassar 0)
- Registrar como `PointTransaction` com `amount: -3`, `reason: "INACTIVITY:inatividade"`
- Aplicar para membros E influenciadores
- Arquivo sugerido: `src/lib/points.ts` — adicionar função `applyInactivityPenalty(userId, communityId)`
- Trigger: pode ser um endpoint `POST /api/cron/inactivity` chamado diariamente, ou verificação no `withAuth` (lazy)

---

### 2. Completar módulo → +25 pts
**Doc diz:** Completar um módulo de trilha = +25 pts (por módulo único, sem limite diário — mas só uma vez por módulo).
**Como implementar:**
- Localizar a API onde o progresso de módulo/lição é marcado como completo
- Arquivo provável: `src/app/api/users/me/learning/route.ts` ou similar
- Após marcar módulo como completo, chamar `awardPoints({ amount: 25, eventType: "MODULE_COMPLETE", dailyLimit: 999 })`
- Garantir idempotência: só pontuar UMA VEZ por módulo (checar se já existe transação com aquele moduleId no metadata)

---

### 3. Níveis nomeados no UI (Novo / Ativo / Participante / Superfã)
**Doc diz:**
| Nível | Score | Pode Postar? |
|-------|-------|-------------|
| Novo | < 40 pts | Não |
| Ativo | 40–69 pts | Não |
| Participante | ≥ 70 pts | Sim |
| Superfã | ≥ 85 pts por 60 dias contínuos | Sim |

**Como implementar:**
- Criar função utilitária `getMemberLevel(points: number): string` em `src/lib/points.ts`
- Atualizar `src/app/dashboard/page.tsx` → `MemberDashboardInner` → score card: mostrar nome do nível além do número
- Atualizar `PostComposer.tsx` → card motivador: mostrar nível atual ("Você é Ativo — faltam X pts para Participante")
- Superfã requer 60 dias contínuos ≥85 pts → pode ser simplificado para: score atual ≥ 85 na v1

---

### 4. Opt-in de pertencimento à comunidade
**Doc diz:** Acesso (assinatura = pode ver tudo) ≠ Pertencimento (clica "Entrar nesta comunidade" = declaração de vínculo). O opt-in conta membros para PP do influenciador.
**Como implementar:**
- Nova tabela no schema: `CommunityOptIn` (userId, communityId, createdAt) — ou reusar `CommunityMembership` com status separado
- Na página da comunidade (`/community/[slug]`) e no feed: botão "Entrar nesta comunidade" se ainda não fez opt-in
- API: `POST /api/communities/[id]/join` e `DELETE /api/communities/[id]/leave`
- Contagem de membros "pertencentes" separada de "assinantes com acesso"
- Notificação para o influenciador quando novo membro faz opt-in

---

### 5. Pontos automáticos para o influenciador
**Doc diz:**
| Evento | Pontos |
|--------|--------|
| Postar vídeo exclusivo na plataforma | +30 pts |
| Fazer live | +25 pts |
| Criar post/thread no feed | +10 pts |
| Responder comentário de membro | +8 pts (cap 20 pts/mês) |
| Novo membro ativo (30 dias) | +5 pts |
| Inatividade | -3 pts/dia a partir do 3º dia |

**Como implementar:**
- Reusar `awardPoints()` de `src/lib/points.ts` nas APIs correspondentes
- `POST /api/spaces/[spaceId]/posts` — já tem +15 para membro; adicionar +10 para influenciador (checar role)
- `POST /api/communities/[id]/videos` (ou similar) — +30 pts ao criar vídeo
- `POST /api/lives` — +25 pts ao criar/iniciar live
- Comentários: verificar se autor é INFLUENCER_ADMIN → +8 pts (cap mensal diferente)
- Novo membro ativo: verificar após 30 dias de opt-in sem cancelamento

---

## 🟡 MÉDIA PRIORIDADE

### 6. Sistema de saúde do influenciador (badge público na comunidade)
**Doc diz:** Badge visível no perfil da comunidade → 🟢 Saudável (≥70 pts) / 🟡 Atenção (40–69) / 🔴 Crítico (<40)
- Dashboard privado do influenciador mostra score atual, tendência e próximas ações
- Membros veem apenas o badge de status (sem número) — cria confiança na assinatura
**Arquivo:** `src/app/community/[communitySlug]/page.tsx` — adicionar badge no header da comunidade

---

### 7. Badge "pode postar" no perfil público do membro
**Doc diz:** Quando membro atinge ≥70 pts, aparece indicador discreto no perfil público que outros membros reconhecem como "membro ativo que contribui".
**Arquivo:** `src/app/members/[userId]/page.tsx` — adicionar badge quando score ≥ 70

---

### 8. Desbloqueio sequencial de módulos
**Doc diz:** Módulos seguintes ficam bloqueados até completar o anterior. Exemplo: "Módulo 3 🔒 (completar módulo 2 para desbloquear)"
**Como implementar:**
- Na página de trilha/módulo, verificar se o módulo anterior está 100% completo antes de liberar o atual
- UI: módulo bloqueado com ícone de cadeado e texto "Complete o módulo anterior para desbloquear"
- API: ao buscar trilha, retornar `isLocked: boolean` por módulo baseado no progresso do usuário

---

### 9. Caixa de Performance — Dashboard do influenciador
**Doc diz:** PP calculada por 5 métricas (views qualificados 30%, engajamento 25%, novos membros 20%, retenção 15%, entregas 10%). Rateio mensal. Pagamento dia 15 do mês seguinte.
**Fórmula:**
```
PP = (views × 0.30) + (engajamento × 0.25) + (novos_membros × 0.20) + (retencao × 0.15) + (entregas × 0.10)
Participação % = PP_influenciador / Σ PP_todos
Valor = Participação % × Total da Caixa
```
**Composição da caixa:** 15% das assinaturas + % anunciantes + % marketplace + lucro eventos
**Holdback:** 20% retido por 30 dias (proteção contra chargeback)
**Nota:** Feature complexa — requer trabalho conjunto com modelo financeiro. Criar pelo menos o dashboard de visualização da PP antes da distribuição automática.

---

## 🟢 BAIXA PRIORIDADE (Fase 2 pelo próprio documento)

### 10. Feed de posts recomendados na home
**Doc diz:** Posts mais engajados de TODAS as comunidades, priorizando as do membro. Algoritmo: engajamento × recência × relevância.

### 11. Chat ao vivo geral
**Doc diz:** Sala de conversa em tempo real. Aparece visualmente ATIVA apenas quando ≥10 membros online. Abaixo disso, mostra histórico recente sem indicador "ao vivo".

### 12. Carrossel de banners de anunciantes
**Doc diz:** Topo da home — banners rotativos de anunciantes, eventos, lançamentos. Máx. 5 banners com rotação automática. Principal espaço comercial premium.

### 13. Ranking mensal com reset (além do all-time)
**Doc diz:** Ranking histórico (all-time) + ranking mensal que reseta no dia 1 de cada mês.

### 14. Certificação profissional nas trilhas
**Doc diz:** Trilhas concluídas geram certificado digital (PDF) — Fase 2 quando produto estiver validado.

### 15. Grupos de estudo temáticos
**Doc diz:** Criados organicamente a partir de demanda identificada no fórum. Fase 2.

### 16. Salas temáticas de chat por comunidade
**Doc diz:** Chat privado por comunidade e entre membros. Fase 2.

### 17. Sistema de moderação por Superfãs
**Doc diz:** Membros com ≥85 pts por 60 dias se tornam candidatos a moderador. Fase 2.

### 18. Notificações motivacionais de performance (influenciador)
**Doc diz:** Mensagens como "Você está no top 3 de engajamento esta semana. Continue assim!" — tom de encorajamento, nunca ameaça.

---

## 📋 ORDEM SUGERIDA DE EXECUÇÃO

1. **Penalidade de inatividade** — fecha o loop do sistema de pontos
2. **Módulo completo +25 pts** — complementa o sistema de pontos já implementado
3. **Níveis nomeados no UI** — impacto visual imediato, baixo esforço
4. **Opt-in de pertencimento** — core do modelo de negócio (conta para PP)
5. **Pontos do influenciador** — ativa o sistema de incentivos do lado creator
6. **Badge de saúde do influenciador** — visibilidade para membros, confiança na assinatura
7. **Badge "pode postar" no perfil** — fechamento da gamificação de membro
8. **Módulos sequenciais (lock)** — melhora UX das trilhas
9. **Dashboard de Caixa de Performance** — financeiro, mais complexo

---

## 📁 ARQUIVOS-CHAVE PARA REFERÊNCIA

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

## 🗒️ CONTEXTO DO MODELO DE NEGÓCIO (para referência)

- **Ticket:** R$79/mês por membro
- **Split de receita:** 35% influenciador dono do membro + 15% caixa de performance + 35% estrutural + 15% marketing
- **Caixa de performance:** pool coletivo distribuído mensalmente por PP entre influenciadores ativos
- **Mínimo viável:** 300 membros (R$23.700 MRR)
- **Meta H1:** 5.000 membros, churn <7%, NPS influenciadores >50
- **H2 (futuro):** Plataforma mãe CrewHouse/Pitcrew gratuita, DetailerHub como clube premium dentro dela
