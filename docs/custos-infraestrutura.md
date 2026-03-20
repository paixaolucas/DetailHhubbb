# Detailer'HUB — Custos de Infraestrutura

> Documento criado em março de 2026.
> Atualizar conforme a plataforma crescer.

---

## Visão Geral

A plataforma foi construída para crescer em fases, começando com custo quase zero e escalando conforme a receita aumenta. O custo fixo mensal inicial é de apenas **R$4/mês** (só o domínio), com todos os outros serviços no plano gratuito.

---

## Fase 1 — Lançamento (Vercel gratuito)

> Ideal para: 0 a ~500 membros cadastrados / até 80 usuários simultâneos

| Serviço | Função | Plano | Custo/mês |
|---------|--------|-------|-----------|
| Hostinger | Domínio (.com.br) | Basic | ~R$4 |
| Vercel | Hospedagem do site | Hobby (gratuito) | R$0 |
| Supabase | Banco de dados | Free | R$0 |
| Resend | Envio de e-mails (até 100/dia) | Free | R$0 |
| UploadThing | Upload de arquivos (2GB) | Free | R$0 |
| Sentry | Monitoramento de erros | Free | R$0 |
| Stripe | Processamento de pagamentos | — | R$0 fixo* |
| OpenAI | Chat com IA (Auto AI) | Pay per use | ~R$30** |
| **Total fixo** | | | **~R$34/mês** |

---

## Fase 2 — Crescendo (Hostinger KVM 1)

> Ideal para: 500 a ~15.000 membros cadastrados / até 500 usuários simultâneos
> **Nesta fase o Hostinger substitui o Vercel como servidor principal**

| Serviço | Função | Plano | Custo/mês |
|---------|--------|-------|-----------|
| Hostinger | Domínio + VPS KVM 1 (4GB RAM, 1 vCPU) | KVM 1 | ~R$39 |
| Supabase | Banco de dados | Free | R$0 |
| Resend | Envio de e-mails (até 100/dia) | Free | R$0 |
| UploadThing | Upload de arquivos (2GB) | Free | R$0 |
| Sentry | Monitoramento de erros | Free | R$0 |
| Stripe | Processamento de pagamentos | — | R$0 fixo* |
| OpenAI | Chat com IA (Auto AI) | Pay per use | ~R$50-100** |
| **Total fixo** | | | **~R$89-139/mês** |

### Por que migrar pro Hostinger VPS?
- Vercel gratuito aguenta ~80 usuários simultâneos
- Hostinger KVM 1 aguenta ~500 usuários simultâneos
- Chat em tempo real passa a funcionar de verdade
- Banco de dados deixa de ser desperdiçado
- **Mesmo Supabase gratuito — não precisa pagar nada a mais no banco**

---

## Fase 3 — Escalando (KVM 2 + Supabase Pro)

> Ideal para: 15.000+ membros cadastrados / até 1.000 usuários simultâneos

| Serviço | Função | Plano | Custo/mês |
|---------|--------|-------|-----------|
| Hostinger | Domínio + VPS KVM 2 (8GB RAM, 2 vCPU) | KVM 2 | ~R$54 |
| Supabase | Banco de dados sem limites | Pro | ~R$140 |
| Resend | E-mails em volume | Pro | ~R$110 |
| UploadThing | Mais armazenamento | Pro | ~R$55 |
| Sentry | Monitoramento | Free | R$0 |
| Stripe | Processamento de pagamentos | — | R$0 fixo* |
| OpenAI | Chat com IA (Auto AI) | Pay per use | ~R$100** |
| **Total fixo** | | | **~R$459/mês** |

---

## Custos Variáveis (todas as fases)

### Stripe — Processamento de pagamentos
- **~3,5% + R$0,39 por transação**
- Exemplo: assinatura de R$948/ano → Stripe desconta ~R$33 → você recebe ~R$915

### OpenAI — Chat com IA
| Fase | Uso estimado | Custo |
|------|-------------|-------|
| Lançamento | Poucos usuários usando o chat | ~R$30/mês |
| Crescendo | Uso moderado | ~R$50-100/mês |
| Escalando | Uso intenso | ~R$100+/mês |

---

## Resumo Executivo

| Fase | Membros | Simultâneos | Custo fixo/mês |
|------|---------|-------------|----------------|
| Lançamento | 0 – 500 | até 80 | ~R$34 |
| Crescendo | 500 – 15.000 | até 500 | ~R$89-139 |
| Escalando | 15.000+ | até 1.000 | ~R$459 |

---

## Ponto de Equilíbrio

Com assinatura de **R$948/ano (R$79/mês)**:

| Fase | Custo/mês | Membros para cobrir o custo |
|------|-----------|----------------------------|
| Lançamento | ~R$34 | **1 membro paga tudo** |
| Crescendo | ~R$139 | **2 membros pagam tudo** |
| Escalando | ~R$459 | **6 membros pagam tudo** |

> A plataforma se paga com pouquíssimos membros. Qualquer receita acima disso é lucro.

---

## Observações

- Todos os valores em reais são aproximados com câmbio de R$5,70/dólar
- Os planos gratuitos (Supabase, Resend, UploadThing) têm limites generosos para a fase inicial
- A migração do Vercel para o Hostinger VPS **não exige reescrever nenhum código**
- O Supabase gratuito aguenta até ~15.000-20.000 membros cadastrados com uso médio
