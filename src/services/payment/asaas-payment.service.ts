// =============================================================================
// ASAAS PAYMENT SERVICE
// Lógica de negócio de pagamentos via Asaas (substitui Stripe).
// O payment.service.ts (Stripe) permanece intacto — migração gradual.
// =============================================================================

import { db } from "@/lib/db";
import { AppError, NotFoundError } from "@/types";
import { commissionService } from "@/services/commission/commission.service";
import { sendPlatformMembershipEmail } from "@/lib/email/send";
import {
  findOrCreateCustomer,
  createSubscription,
  cancelSubscription,
} from "@/lib/asaas/client";
import type { AsaasWebhookPayload, AsaasPayment, AsaasSubscription } from "@/lib/asaas/types";

// =============================================================================
// CREATE PLATFORM CHECKOUT (Asaas)
// Retorna invoiceUrl para redirecionar o usuário ao ambiente de pagamento Asaas.
// O CPF é obrigatório pois o Asaas exige cpfCnpj para criar o cliente.
// =============================================================================

export async function createAsaasPlatformCheckout(params: {
  userId: string;
  platformPlanId: string;
  cpf: string; // 11 dígitos sem formatação
}): Promise<{ invoiceUrl: string; subscriptionId: string }> {
  // 1. Busca o plano
  const plan = await db.platformPlan.findUnique({
    where: { id: params.platformPlanId, isActive: true },
  });
  if (!plan) throw new NotFoundError("Platform plan not found");

  // 2. Verifica membership ativa existente
  const existing = await db.platformMembership.findUnique({
    where: { userId: params.userId },
    select: { status: true },
  });
  if (existing?.status === "ACTIVE") {
    throw new AppError(
      "Usuário já possui uma assinatura ativa",
      409,
      "ALREADY_MEMBER"
    );
  }

  // 3. Busca dados do usuário
  const user = await db.user.findUnique({
    where: { id: params.userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      asaasCustomerId: true,
      referredById: true,
    },
  });
  if (!user) throw new NotFoundError("User not found");

  // 4. Resolve referral: referredById → userId do influenciador → influencer.id
  let referredByInfluencerId: string | undefined;
  if (user.referredById) {
    const influencer = await db.influencer.findUnique({
      where: { userId: user.referredById },
      select: { id: true },
    });
    if (influencer) referredByInfluencerId = influencer.id;
  }

  // 5. Cria ou recupera cliente no Asaas
  const customer = await findOrCreateCustomer({
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    cpfCnpj: params.cpf,
    externalReference: params.userId,
    notificationDisabled: false,
  });

  // Persiste asaasCustomerId se for novo
  if (!user.asaasCustomerId) {
    await db.user.update({
      where: { id: params.userId },
      data: { asaasCustomerId: customer.id },
    });
  }

  // 6. Determina ciclo de cobrança a partir do interval do plano
  // plan.interval: "month" → MONTHLY | "year" → YEARLY
  const cycle = plan.interval === "year" ? "YEARLY" : ("MONTHLY" as const);

  // 7. Valor em BRL (plan.price é armazenado em centavos como Decimal)
  const valueInBRL = Number(plan.price) / 100;

  // 8. Data de vencimento = hoje
  const nextDueDate = new Date().toISOString().slice(0, 10);

  // 9. externalReference (max ~255 chars) — resolvido no webhook para ativar membership
  const externalReference = JSON.stringify({
    userId: params.userId,
    platformPlanId: plan.id,
    ...(referredByInfluencerId ? { referredByInfluencerId } : {}),
  });

  // 10. Cria assinatura no Asaas (billingType UNDEFINED = exibe todos os métodos)
  const subscription = await createSubscription({
    customer: customer.id,
    billingType: "UNDEFINED",
    cycle,
    value: valueInBRL,
    nextDueDate,
    description: `Detailer'HUB — ${plan.name}`,
    externalReference,
  });

  // Asaas retorna invoiceUrl ou paymentLink na assinatura com billingType=UNDEFINED
  const invoiceUrl = subscription.invoiceUrl ?? subscription.paymentLink ?? "";

  if (!invoiceUrl) {
    throw new AppError(
      "Asaas não retornou uma URL de pagamento",
      500,
      "ASAAS_NO_URL"
    );
  }

  return { invoiceUrl, subscriptionId: subscription.id };
}

// =============================================================================
// HANDLE ASAAS WEBHOOK EVENT
// Entry point chamado pela rota /api/webhooks/asaas
// =============================================================================

export async function handleAsaasWebhookEvent(
  payload: AsaasWebhookPayload
): Promise<void> {
  const { event, payment, subscription } = payload;

  switch (event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
      if (payment) await handlePaymentConfirmed(payment);
      break;

    case "PAYMENT_OVERDUE":
      if (payment) await handlePaymentOverdue(payment);
      break;

    case "SUBSCRIPTION_INACTIVATED":
      if (subscription) await handleSubscriptionInactivated(subscription);
      break;

    default:
      // Eventos desconhecidos são ignorados silenciosamente
      break;
  }
}

// =============================================================================
// PAYMENT_CONFIRMED / PAYMENT_RECEIVED → ativa membership
// =============================================================================

async function handlePaymentConfirmed(payment: AsaasPayment): Promise<void> {
  if (!payment.externalReference) return;

  let ref: {
    userId?: string;
    platformPlanId?: string;
    referredByInfluencerId?: string;
  };
  try {
    ref = JSON.parse(payment.externalReference) as typeof ref;
  } catch {
    return;
  }

  const { userId, platformPlanId, referredByInfluencerId } = ref;
  if (!userId || !platformPlanId) return;

  // Idempotência — ignora se este pagamento já foi processado
  if (payment.id) {
    const alreadyProcessed = await db.payment.findFirst({
      where: { asaasPaymentId: payment.id },
      select: { id: true },
    });
    if (alreadyProcessed) return;
  }

  const userRecord = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, asaasCustomerId: true },
  });
  if (!userRecord) return;

  // Persiste asaasCustomerId se não estiver salvo
  if (!userRecord.asaasCustomerId && payment.customer) {
    await db.user.update({
      where: { id: userId },
      data: { asaasCustomerId: payment.customer },
    });
  }

  // Verifica se é primeira ativação (para enviar email de boas-vindas)
  const existingMembership = await db.platformMembership.findUnique({
    where: { userId },
    select: { id: true },
  });

  // Calcula período de vigência
  // Default: +1 ano (plano anual). Pode ser refinado por plan.interval no futuro.
  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  // Upsert da membership dentro de uma transação para atomicidade
  await db.$transaction(async (tx) => {
    await tx.platformMembership.upsert({
      where: { userId },
      create: {
        userId,
        planId: platformPlanId,
        status: "ACTIVE",
        asaasSubscriptionId: payment.subscription ?? null,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        ...(referredByInfluencerId ? { referredByInfluencerId } : {}),
      },
      update: {
        status: "ACTIVE",
        planId: platformPlanId,
        asaasSubscriptionId: payment.subscription ?? undefined,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        // referredByInfluencerId é imutável — nunca sobrescrever em reativações
      },
    });

    // Registra o pagamento
    await tx.payment.create({
      data: {
        userId,
        platformMembershipId: (
          await tx.platformMembership.findUnique({
            where: { userId },
            select: { id: true },
          })
        )!.id,
        amount: payment.value,
        currency: "brl",
        status: "SUCCEEDED",
        type: "SUBSCRIPTION",
        asaasPaymentId: payment.id,
      },
    });
  });

  // Processa comissão de indicação fora da transaction principal (operação separada e idempotente)
  const membershipRecord = await db.platformMembership.findUnique({
    where: { userId },
    select: { id: true, referredByInfluencerId: true },
  });

  if (membershipRecord?.referredByInfluencerId) {
    const dbPayment = await db.payment.findFirst({
      where: { asaasPaymentId: payment.id },
      select: { id: true },
    });
    if (dbPayment) {
      await commissionService.processPlatformReferralCommission(
        dbPayment.id,
        membershipRecord.referredByInfluencerId,
        payment.value
      );
    }
  }

  // Email de boas-vindas apenas na primeira ativação
  if (!existingMembership && userRecord.email && userRecord.firstName) {
    const plan = await db.platformPlan.findUnique({
      where: { id: platformPlanId },
      select: { name: true, price: true },
    });
    const amount = plan
      ? `R$${(Number(plan.price) / 100).toFixed(2).replace(".", ",")}`
      : "R$708,00";
    await sendPlatformMembershipEmail(
      { email: userRecord.email, firstName: userRecord.firstName },
      { planName: plan?.name ?? "Assinatura Anual", amount }
    ).catch((err) =>
      console.error("[Email] Asaas welcome email failed:", err)
    );
  }
}

// =============================================================================
// PAYMENT_OVERDUE → suspende membership
// =============================================================================

async function handlePaymentOverdue(payment: AsaasPayment): Promise<void> {
  if (!payment.subscription) return;

  await db.platformMembership.updateMany({
    where: { asaasSubscriptionId: payment.subscription },
    data: { status: "PAST_DUE" },
  });
}

// =============================================================================
// SUBSCRIPTION_INACTIVATED → cancela membership
// =============================================================================

async function handleSubscriptionInactivated(
  subscription: AsaasSubscription
): Promise<void> {
  await db.platformMembership.updateMany({
    where: { asaasSubscriptionId: subscription.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
      cancelAtPeriodEnd: false,
    },
  });
}

// =============================================================================
// CANCEL ASAAS SUBSCRIPTION (chamado pela rota DELETE /api/asaas/subscription/me)
// =============================================================================

export async function cancelAsaasSubscription(userId: string): Promise<void> {
  const membership = await db.platformMembership.findUnique({
    where: { userId },
    select: { id: true, status: true, asaasSubscriptionId: true },
  });

  if (!membership) throw new NotFoundError("Membership not found");
  if (membership.status !== "ACTIVE") {
    throw new AppError("Membership is not active", 400, "NOT_ACTIVE");
  }
  if (!membership.asaasSubscriptionId) {
    throw new AppError(
      "No Asaas subscription linked to this membership",
      400,
      "NO_ASAAS_SUBSCRIPTION"
    );
  }

  // Tenta cancelar no Asaas — se falhar, ainda atualiza localmente
  try {
    await cancelSubscription(membership.asaasSubscriptionId);
  } catch (err) {
    console.error("[Asaas] Cancel subscription failed:", err);
  }

  await db.platformMembership.update({
    where: { id: membership.id },
    data: { status: "CANCELED", canceledAt: new Date(), cancelAtPeriodEnd: false },
  });
}
